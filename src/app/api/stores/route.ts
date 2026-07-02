/**
 * GET  /api/stores        — kullanıcının tüm mağazalarını döner (RLS bypass)
 * POST /api/stores        — yeni mağaza/ürün oluşturur
 * PATCH /api/stores       — mevcut mağazayı günceller (body: { id, ...patch })
 * DELETE /api/stores?id=  — mağazayı siler
 *
 * Service role key → RLS'yi atlar. SUPABASE_SERVICE_ROLE_KEY .env.local + Vercel'de tanımlı olmalı.
 * Yoksa anon key + explicit user_id filter'a düşer (RLS'ye bağlı).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { THEME_FONT_NAMES } from "@/types/theme";

// ── Auth: server-side cookie okuma ───────────────────────────────────────────
async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Admin client: RLS'yi bypass eder ─────────────────────────────────────────
function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const SELECT_COLS =
  "id, created_at, store_name, product_price, currency, selected_plan, status, seo_title, description, features, image_urls, custom_domain, theme, theme_settings";

// theme_settings jsonb — yalnızca bilinen anahtarlar yazılır (Canlı Tema Editörü payload'ı)
function sanitizeThemeSettings(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof src.announcement_text === "string") out.announcement_text = src.announcement_text.slice(0, 200);
  if (typeof src.primary_color === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(src.primary_color)) out.primary_color = src.primary_color;
  if (typeof src.button_radius === "number" && Number.isFinite(src.button_radius)) out.button_radius = Math.min(Math.max(Math.round(src.button_radius), 0), 40);
  if (typeof src.font_heading === "string" && THEME_FONT_NAMES.includes(src.font_heading)) out.font_heading = src.font_heading;
  if (typeof src.font_body === "string" && THEME_FONT_NAMES.includes(src.font_body)) out.font_body = src.font_body;
  if (typeof src.hero_title === "string" && src.hero_title.trim()) out.hero_title = src.hero_title.slice(0, 140);
  if (typeof src.hero_subtitle === "string" && src.hero_subtitle.trim()) out.hero_subtitle = src.hero_subtitle.slice(0, 300);
  if (typeof src.hero_overlay === "number" && Number.isFinite(src.hero_overlay)) out.hero_overlay = Math.min(Math.max(Math.round(src.hero_overlay), 0), 90);
  if (
    typeof src.logo_url === "string" &&
    (/^https?:\/\//.test(src.logo_url) || src.logo_url.startsWith("data:image/")) &&
    src.logo_url.length <= 1_500_000
  ) out.logo_url = src.logo_url;

  // Aciliyet sayacı + para birimi seçici görünürlüğü
  if (typeof src.show_countdown === "boolean")         out.show_countdown = src.show_countdown;
  if (typeof src.show_currency_selector === "boolean") out.show_currency_selector = src.show_currency_selector;

  // Sosyal medya linkleri — yalnızca http(s) URL kabul edilir
  const isHttpUrl = (v: unknown): v is string =>
    typeof v === "string" && /^https?:\/\//.test(v) && v.length <= 300;
  if (isHttpUrl(src.social_instagram)) out.social_instagram = src.social_instagram;
  if (isHttpUrl(src.social_twitter))   out.social_twitter   = src.social_twitter;
  if (isHttpUrl(src.social_facebook))  out.social_facebook  = src.social_facebook;

  // Navigasyon menüsü — iki kademeli hiyerarşi (max 1 derinlik). Ana ve alt
  // elemanlarda max 6 kayıt; url yalnızca site-içi path ("/") veya anchor ("#").
  const cleanNavItem = (raw: unknown): { label: string; url: string } | null => {
    if (typeof raw !== "object" || raw === null) return null;
    const o = raw as Record<string, unknown>;
    if (typeof o.label !== "string" || !o.label.trim()) return null;
    const url = typeof o.url === "string" && (o.url.startsWith("/") || o.url.startsWith("#"))
      ? o.url.slice(0, 100)
      : "#";
    return { label: o.label.trim().slice(0, 30), url };
  };

  if (Array.isArray(src.nav_links)) {
    const links = (src.nav_links as unknown[]).slice(0, 6).flatMap((l) => {
      const base = cleanNavItem(l);
      if (!base) return [];
      const rawChildren = (l as Record<string, unknown>).children;
      const children = Array.isArray(rawChildren)
        ? rawChildren.slice(0, 6)
            .map(cleanNavItem)
            .filter((c): c is { label: string; url: string } => c !== null)
        : [];
      return [{ ...base, ...(children.length > 0 ? { children } : {}) }];
    });
    if (links.length > 0) out.nav_links = links;
  }

  // Hero arka plan görseli + gece modu
  if (
    typeof src.hero_image_url === "string" &&
    (/^https?:\/\//.test(src.hero_image_url) || src.hero_image_url.startsWith("data:image/")) &&
    src.hero_image_url.length <= 3_000_000
  ) out.hero_image_url = src.hero_image_url;
  if (typeof src.dark_mode === "boolean") out.dark_mode = src.dark_mode;

  return out;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await admin()
    .from("stores")
    .select(SELECT_COLS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;

  const payload = {
    user_id:       user.id,
    store_name:    String(body.store_name ?? "Yeni Ürün").trim(),
    seo_title:     body.seo_title ? String(body.seo_title).trim() : null,
    product_price: parseFloat(String(body.product_price ?? "0")) || 0,
    currency:      String(body.currency ?? "TRY"),
    description:   body.description ? String(body.description).trim() : null,
    features:      Array.isArray(body.features) ? (body.features as string[]).filter(Boolean) : null,
    theme:         String(body.theme ?? "artisan"),
    status:        String(body.status ?? "pending"),
    selected_plan: "monthly" as const,
    image_urls:    Array.isArray(body.image_urls) ? body.image_urls : null,
  };

  const { data, error } = await admin()
    .from("stores")
    .insert(payload)
    .select(SELECT_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { id, ...patch } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Yalnızca belirli alanlar güncellenir
  const allowed = ["seo_title", "product_price", "currency", "description", "features", "status", "theme", "store_name", "shipping_fee", "free_shipping_threshold", "theme_settings"];
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));

  if ("theme_settings" in safe) {
    const clean = sanitizeThemeSettings(safe.theme_settings);
    if (clean === null) delete safe.theme_settings;
    else safe.theme_settings = clean;
  }

  const { error } = await admin()
    .from("stores")
    .update(safe)
    .eq("id", String(id))
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
// Mağazayı ve TÜM bağlı verisini kalıcı olarak siler: analitik olayları,
// sipariş kalemleri, siparişler, ürünler ve stores satırı (theme_settings dahil).
// FK kuralları "set null" olduğundan bağımlılar açıkça temizlenir — orphan kalmaz.
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = admin();

  // Sahiplik doğrulaması — kullanıcı yalnızca kendi mağazasını silebilir
  const { data: store } = await db
    .from("stores")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!store) return NextResponse.json({ error: "store not found" }, { status: 404 });

  // Bağımlı kayıtlar sırayla: analitik → sipariş kalemleri → siparişler → ürünler
  // (tablo bazı ortamlarda yoksa hata yutulur, mağaza silme akışı kesilmez)
  await db.from("page_views").delete().eq("store_id", id);

  const { data: orderRows } = await db.from("orders").select("id").eq("store_id", id);
  const orderIds = (orderRows ?? []).map((o: { id: string }) => o.id);
  if (orderIds.length > 0) {
    await db.from("order_items").delete().in("order_id", orderIds);
  }
  await db.from("orders").delete().eq("store_id", id);
  await db.from("products").delete().eq("store_id", id);

  const { error } = await db
    .from("stores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
