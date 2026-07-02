/*
 * -- Run once in Supabase SQL Editor:
 * -- ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
 * -- ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
 * -- ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY';
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

  // Verify the store belongs to the user
  const { data: store, error: storeError } = await admin()
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: products, error } = await admin()
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(products);
}

// POST /api/products
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { store_id, name, price, currency, description, image_url, status, category } =
    body;

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

  const { data: product, error } = await admin()
    .from("products")
    .insert({
      store_id,
      user_id: user.id,
      name,
      price,
      currency: currency ?? "TRY",
      description: description ?? null,
      image_url: image_url ?? null,
      status: status ?? "active",
      category: typeof category === "string" && category.trim() ? category.trim().slice(0, 60) : null,
    })
    .select()
    .single();

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

  const ALLOWED_FIELDS = [
    "name",
    "price",
    "currency",
    "description",
    "image_url",
    "status",
    "size_variants",
    "category",
  ];

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

  const { error } = await admin()
    .from("products")
    .update(updates)
    .eq("id", id);

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
