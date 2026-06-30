/**
 * POST /api/migrate-images
 *
 * Giriş yapmış kullanıcının kendi mağazalarındaki base64 image_urls ve
 * product_image_base64 alanlarını Supabase Storage'a taşır.
 *
 * Body: { storeId?: string }  — belirli bir mağaza için; yoksa hepsini tarar
 *
 * Ön koşul: Supabase Dashboard → Storage → "store-images" adında PUBLIC bucket oluşturulmuş olmalı.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { migrateStoreImages } from "@/utils/supabase/upload-images";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()  { return cookieStore.getAll(); },
        setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { storeId?: string };

  // Kullanıcının mağazalarını çek (tümü veya belirli bir ID)
  let query = supabase
    .from("stores")
    .select("id, store_name, image_urls, product_image_base64")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (body.storeId) query = query.eq("id", body.storeId);

  const { data: stores, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!stores?.length) return NextResponse.json({ message: "Mağaza bulunamadı.", migrated: 0 });

  let totalMigrated = 0;
  const results: Array<{ id: string; name: string; status: string; imageCount?: number }> = [];

  for (const store of stores) {
    // image_urls'de base64 var mı?
    const hasBase64Urls = store.image_urls?.some((u: string) => u?.startsWith("data:"));
    const hasBase64Main = store.product_image_base64?.startsWith("data:");

    if (!hasBase64Urls && !hasBase64Main) {
      results.push({ id: store.id, name: store.store_name, status: "already_clean" });
      continue;
    }

    // Kaynak: önce image_urls, sonra product_image_base64
    const sourceUrls: string[] = store.image_urls?.length
      ? store.image_urls
      : store.product_image_base64
      ? [store.product_image_base64]
      : [];

    if (!sourceUrls.length) {
      results.push({ id: store.id, name: store.store_name, status: "no_images" });
      continue;
    }

    const { urls, changed } = await migrateStoreImages(supabase, store.id, sourceUrls);

    if (changed) {
      await supabase
        .from("stores")
        .update({ image_urls: urls, product_image_base64: null })
        .eq("id", store.id);
      totalMigrated++;
      results.push({ id: store.id, name: store.store_name, status: "migrated", imageCount: urls.length });
    } else {
      results.push({ id: store.id, name: store.store_name, status: "upload_failed" });
    }
  }

  return NextResponse.json({
    success: true,
    totalMigrated,
    results,
    note: totalMigrated === 0
      ? "Yükleme başarısız olduysa Supabase Dashboard'da 'store-images' adında PUBLIC bir bucket oluşturduğunuzdan emin olun."
      : undefined,
  });
}
