import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dns from "dns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const ALL_TLDS = [".com", ".net", ".org", ".co", ".ai", ".io"];

// DNS çözümleniyorsa true (dolu), ENOTFOUND/ENODATA ise false (boş)
async function isDomainRegistered(domain: string): Promise<boolean> {
  try {
    await dns.promises.resolveNs(domain);
    return true;
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "ESERVFAIL") return false;
    throw new Error("DNS sorgusu başarısız oldu. Lütfen tekrar deneyin.");
  }
}

// Hata veya timeout durumunda 'dolu' varsay (güvenli taraf)
async function safeDomainCheck(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), 4000);
    isDomainRegistered(domain)
      .then((r) => { clearTimeout(timer); resolve(r); })
      .catch(() => { clearTimeout(timer); resolve(true); });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { domain } = (await req.json()) as { domain: string };

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain adı gereklidir." }, { status: 400 });
    }

    // Temizle: protokol, www ve trailing slash
    const cleaned = domain
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/$/, "");

    // Nokta yoksa otomatik .com ekle
    const mainDomain = cleaned.includes(".") ? cleaned : cleaned + ".com";

    if (!VALID_DOMAIN_RE.test(mainDomain)) {
      return NextResponse.json({
        available: false,
        domain: mainDomain,
        status: "invalid",
        message: 'Geçersiz format. Örnek: "magazaniz" veya "magazaniz.com"',
        alternatives: [],
      });
    }

    // Base name ve ana TLD
    const lastDot = mainDomain.lastIndexOf(".");
    const baseName = mainDomain.substring(0, lastDot);   // "vivinth"
    const mainTld  = mainDomain.substring(lastDot);       // ".com"

    // Alternatif TLD'ler (ana TLD hariç)
    const altTlds = ALL_TLDS.filter((t) => t !== mainTld);

    // ── Paralel kontrol: ana domain + tüm alternatifler ──
    const allDomains = [mainDomain, ...altTlds.map((t) => baseName + t)];
    const results = await Promise.allSettled(
      allDomains.map((d) => safeDomainCheck(d))
    );

    const registeredMap: Record<string, boolean> = {};
    allDomains.forEach((d, i) => {
      const r = results[i];
      registeredMap[d] = r.status === "fulfilled" ? r.value : true;
    });

    const mainRegistered = registeredMap[mainDomain];

    // Ana domain boştaysa Supabase'de de kontrol et
    if (!mainRegistered) {
      const { data, error } = await supabase
        .from("stores")
        .select("id")
        .eq("custom_domain", mainDomain)
        .limit(1);

      if (error) throw new Error(error.message);

      if (data && data.length > 0) {
        // Sistemimizde başkası kullanıyor
        const alternatives = altTlds
          .map((t) => baseName + t)
          .filter((d) => !registeredMap[d]);

        return NextResponse.json({
          available: false,
          domain: mainDomain,
          status: "taken",
          message: `"${mainDomain}" başka bir mağaza tarafından kullanılıyor.`,
          alternatives,
        });
      }

      return NextResponse.json({
        available: true,
        domain: mainDomain,
        status: "available",
        message: `Tebrikler! "${mainDomain}" boşta ve planınıza dahil olarak ücretsiz kaydedilecek.`,
        alternatives: [],
      });
    }

    // Ana domain dolu → müsait alternatifleri derle
    const alternatives = altTlds
      .map((t) => baseName + t)
      .filter((d) => !registeredMap[d]);

    return NextResponse.json({
      available: false,
      domain: mainDomain,
      status: "taken",
      message: `"${mainDomain}" dünya genelinde zaten tescilli.`,
      alternatives,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bir hata oluştu";
    return NextResponse.json({ error: msg, status: "error", alternatives: [] }, { status: 500 });
  }
}
