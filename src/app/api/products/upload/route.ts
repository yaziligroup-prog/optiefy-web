/**
 * POST   /api/products/upload — ürün görselini Supabase Storage'a yükler, public URL döner
 *        FormData: file (image/*, max 8MB), storeId
 * DELETE /api/products/upload — bucket'taki görseli siler
 *        Body: { url: string, storeId: string }
 *
 * Ön koşul: Supabase Dashboard → Storage → "store-images" adında PUBLIC bucket.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const BUCKET = "store-images";
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

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

async function verifyStoreOwnership(storeId: string, userId: string) {
  const { data, error } = await admin()
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("user_id", userId)
    .single();
  return !error && !!data;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const storeId = form?.get("storeId");

  if (!(file instanceof File) || typeof storeId !== "string" || !storeId) {
    return NextResponse.json(
      { error: "file ve storeId zorunludur" },
      { status: 400 }
    );
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Yalnızca JPG, PNG, WebP, GIF veya AVIF yükleyebilirsiniz." },
      { status: 415 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Görsel en fazla 8MB olabilir." },
      { status: 413 }
    );
  }

  if (!(await verifyStoreOwnership(storeId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `products/${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supa = admin();
  const { error } = await supa.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    const bucketMissing = /bucket/i.test(error.message);
    return NextResponse.json(
      {
        error: bucketMissing
          ? `Supabase Dashboard'da "${BUCKET}" adında PUBLIC bir Storage bucket oluşturun.`
          : error.message,
      },
      { status: 500 }
    );
  }

  const { data } = supa.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { url?: string; storeId?: string }
    | null;

  if (!body?.url || !body?.storeId) {
    return NextResponse.json(
      { error: "url ve storeId zorunludur" },
      { status: 400 }
    );
  }

  if (!(await verifyStoreOwnership(body.storeId, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = body.url.indexOf(marker);
  if (idx === -1) {
    // Bucket dışı URL (ör. harici görsel) — storage'da silinecek bir şey yok
    return NextResponse.json({ ok: true, skipped: true });
  }

  const path = decodeURIComponent(body.url.slice(idx + marker.length));
  if (!path.startsWith(`products/${body.storeId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin().storage.from(BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
