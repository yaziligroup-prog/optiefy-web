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
  "id, created_at, store_name, product_price, currency, selected_plan, status, seo_title, description, features, image_urls, custom_domain, theme";

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
  const allowed = ["seo_title", "product_price", "currency", "description", "features", "status", "theme", "store_name", "shipping_fee", "free_shipping_threshold"];
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));

  const { error } = await admin()
    .from("stores")
    .update(safe)
    .eq("id", String(id))
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin()
    .from("stores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
