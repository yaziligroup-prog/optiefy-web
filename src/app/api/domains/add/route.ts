import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── Vercel REST API helpers ──────────────────────────────────────────────────

const VERCEL_TOKEN      = process.env.VERCEL_AUTH_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const VERCEL_API        = "https://api.vercel.com";

interface VercelDomainResponse {
  name:         string;
  apexName:     string;
  projectId:    string;
  redirect?:    string | null;
  verified:     boolean;
  verification?: VercelVerification[];
  error?: { code: string; message: string };
}

interface VercelVerification {
  type:   string;  // "TXT" | "CNAME"
  domain: string;
  value:  string;
  reason: string;
}

interface VercelDomainConfig {
  configuredBy:    string | null;
  acceptedChallenges: string[];
  misconfigured:   boolean;
  cname?:          string;
}

async function vercelFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

// POST /v10/projects/{id}/domains — projeye domain ekle
async function addDomainToVercel(domain: string): Promise<VercelDomainResponse> {
  const { data } = await vercelFetch<VercelDomainResponse>(
    `/v10/projects/${VERCEL_PROJECT_ID}/domains`,
    { method: "POST", body: JSON.stringify({ name: domain }) },
  );
  return data;
}

// GET /v6/domains/{domain}/config — domainin DNS durumunu sorgula
async function getDomainConfig(domain: string): Promise<VercelDomainConfig | null> {
  const { ok, data } = await vercelFetch<VercelDomainConfig>(
    `/v6/domains/${domain}/config`,
  );
  return ok ? data : null;
}

// ─── Input validation ─────────────────────────────────────────────────────────

const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function cleanDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .replace(/\/$/, "");
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/domains/add
 *
 * Body: { domain: string; storeId: string }
 *
 * 1. Supabase auth guard — sadece oturum açık kullanıcı
 * 2. storeId'nin o kullanıcıya ait olduğunu doğrula
 * 3. Vercel'e domain ekle
 * 4. stores.custom_domain güncelle
 * 5. DNS yönlendirme talimatlarını döndür
 */
export async function POST(req: NextRequest) {
  // ── 1. Auth ──
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  // ── 2. Input ──
  let domain: string;
  let storeId: string;
  try {
    const body = (await req.json()) as { domain?: string; storeId?: string };
    domain  = cleanDomain(body.domain  ?? "");
    storeId = (body.storeId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json(
      { error: `"${domain}" geçerli bir domain değil. Örnek: magazaniz.com` },
      { status: 400 },
    );
  }
  if (!storeId) {
    return NextResponse.json({ error: "storeId gereklidir." }, { status: 400 });
  }

  // ── 3. Store sahiplik kontrolü ──
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("id, custom_domain, user_id")
    .eq("id", storeId)
    .single();

  if (storeErr || !store) {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 404 });
  }
  if (store.user_id !== user.id) {
    return NextResponse.json({ error: "Bu mağaza size ait değil." }, { status: 403 });
  }

  // ── 4. Domain zaten başka bir mağazada kullanılıyor mu? ──
  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("custom_domain", domain)
    .neq("id", storeId)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: `"${domain}" zaten başka bir mağazaya bağlı.` },
      { status: 409 },
    );
  }

  // ── 5. Vercel'e domain ekle ──
  let vercelResult: VercelDomainResponse;
  try {
    vercelResult = await addDomainToVercel(domain);
  } catch (e) {
    console.error("[domains/add] Vercel API hatası:", e);
    return NextResponse.json(
      { error: "Vercel bağlantısı sırasında bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 502 },
    );
  }

  // Vercel domain zaten projede kayıtlı olabilir (409) — bu kabul edilebilir
  if (vercelResult.error && vercelResult.error.code !== "domain_already_in_use") {
    return NextResponse.json(
      { error: `Vercel hatası: ${vercelResult.error.message}` },
      { status: 400 },
    );
  }

  // ── 6. DNS yapılandırma durumunu al ──
  const dnsConfig = await getDomainConfig(domain);

  // ── 7. Supabase'i güncelle ──
  await supabase
    .from("stores")
    .update({ custom_domain: domain })
    .eq("id", storeId);

  // ── 8. Başarı yanıtı + DNS talimatları ──
  const verified = vercelResult.verified ?? false;

  // Domainin apex mi subdomain mi olduğuna göre farklı DNS kaydı
  const isApex = domain === vercelResult.apexName;

  const dnsInstructions = verified
    ? null
    : isApex
    ? {
        type:  "A",
        name:  "@",
        value: "76.76.21.21",
        note:  "Apex domain için A kaydı. Bazı sağlayıcılar ALIAS/ANAME kullanır.",
      }
    : {
        type:  "CNAME",
        name:  domain.replace(`.${vercelResult.apexName}`, ""),
        value: "cname.vercel-dns.com",
        note:  "Subdomain için CNAME kaydı.",
      };

  return NextResponse.json({
    success:   true,
    domain,
    verified,
    dnsConfig,
    dnsInstructions,
    // Vercel doğrulama kaydı gerekiyorsa (TXT)
    verificationRecords: vercelResult.verification ?? [],
    message: verified
      ? `"${domain}" başarıyla bağlandı ve aktif!`
      : `"${domain}" Vercel'e eklendi. DNS kaydını güncelleyin, ardından 24–48 saat içinde aktif olur.`,
  });
}
