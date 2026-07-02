/*
 * -- Gerekli migration'lar (Supabase SQL Editor'de bir kez çalıştırın):
 * --   db/product_category_migration.sql
 * --   db/product_advanced_fields_migration.sql  (SKU, stok, varyant, SEO, çoklu görsel + indeks)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function admin() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Migration henüz çalıştırılmadıysa (kolon yok) PostgREST bu hataları döner —
// gelişmiş alanları düşürüp legacy alanlarla yeniden dener, panel çalışmaya devam eder.
function isMissingColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /column/i.test(error.message ?? "")
  );
}

const LEGACY_FIELDS = [
  "name",
  "price",
  "currency",
  "description",
  "image_url",
  "status",
  "size_variants",
  "category",
] as const;

const ADVANCED_FIELDS = [
  "image_urls",
  "sku",
  "stock_quantity",
  "sell_when_out_of_stock",
  "variants",
  "seo_title",
  "seo_description",
  "slug",
] as const;

const ALLOWED_FIELDS: readonly string[] = [...LEGACY_FIELDS, ...ADVANCED_FIELDS];

// GET /api/products?storeId=uuid
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  // Sahiplik doğrulaması ve ürün listesi paralel çekilir — ürünler ancak
  // sahiplik doğrulanırsa döndürülür (tek round-trip gecikmesi).
  const supa = admin();
  const [storeRes, productsRes] = await Promise.all([
    supa
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .single(),
    supa
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false }),
  ]);

  if (storeRes.error || !storeRes.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (productsRes.error) {
    return NextResponse.json({ error: productsRes.error.message }, { status: 500 });
  }

  return NextResponse.json(productsRes.data);
}

// POST /api/products
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { store_id, name, price } = body;

  if (!store_id || !name || price === undefined) {
    return NextResponse.json(
      { error: "store_id, name, and price are required" },
      { status: 400 }
    );
  }

  // Verify the store belongs to the user
  const { data: store, error: storeError } = await admin()
    .from("stores")
    .select("id")
    .eq("id", store_id)
    .eq("user_id", user.id)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const legacyRow: Record<string, unknown> = {
    store_id,
    user_id: user.id,
    name,
    price,
    currency: body.currency ?? "TRY",
    description: body.description ?? null,
    image_url: body.image_url ?? null,
    status: body.status ?? "active",
    category:
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim().slice(0, 60)
        : null,
  };

  const fullRow: Record<string, unknown> = { ...legacyRow };
  for (const key of ADVANCED_FIELDS) {
    if (key in body) fullRow[key] = body[key];
  }

  let { data: product, error } = await admin()
    .from("products")
    .insert(fullRow)
    .select()
    .single();

  // Gelişmiş kolonlar henüz yoksa legacy alanlarla yeniden dene
  if (error && isMissingColumn(error)) {
    ({ data: product, error } = await admin()
      .from("products")
      .insert(legacyRow)
      .select()
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(product, { status: 201 });
}

// PATCH /api/products
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Verify the product belongs to the user
  const { data: product, error: productError } = await admin()
    .from("products")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in fields) {
      updates[key] = fields[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  let { error } = await admin().from("products").update(updates).eq("id", id);

  // Gelişmiş kolonlar henüz yoksa legacy alanlarla yeniden dene
  if (error && isMissingColumn(error)) {
    const legacyUpdates: Record<string, unknown> = {};
    for (const key of LEGACY_FIELDS) {
      if (key in updates) legacyUpdates[key] = updates[key];
    }
    if (Object.keys(legacyUpdates).length > 0) {
      ({ error } = await admin().from("products").update(legacyUpdates).eq("id", id));
    } else {
      error = null;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/products?id=uuid
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Verify the product belongs to the user
  const { data: product, error: productError } = await admin()
    .from("products")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin().from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
