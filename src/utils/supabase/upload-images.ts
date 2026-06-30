import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "store-images";

/**
 * Tek bir base64 data URI'yi Supabase Storage'a yükler ve public URL döndürür.
 * Yükleme başarısız olursa null döner (caller orijinal base64'ü kullanabilir).
 */
export async function uploadBase64(
  supabase: SupabaseClient,
  base64Data: string,
  path: string,
): Promise<string | null> {
  if (!base64Data?.startsWith("data:")) return null;

  try {
    const mime   = base64Data.match(/^data:([^;]+)/)?.[1] ?? "image/png";
    const rawB64 = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(rawB64, "base64");

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: true });

    if (error) {
      console.warn(`[storage] upload failed (${path}):`, error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn(`[storage] upload error (${path}):`, err);
    return null;
  }
}

/**
 * Bir store'un image_urls dizisindeki base64 data URI'leri Storage'a taşır.
 * Her base64 için gerçek URL döner; başarısız olanlar orijinal değerle kalır.
 * Tüm URL'ler zaten https:// ise hiçbir şey yapmaz.
 */
export async function migrateStoreImages(
  supabase: SupabaseClient,
  storeId: string,
  imageUrls: string[],
): Promise<{ urls: string[]; changed: boolean }> {
  let changed = false;
  const urls  = await Promise.all(
    imageUrls.map(async (url, i) => {
      if (!url?.startsWith("data:")) return url; // zaten HTTPS URL
      const path      = `stores/${storeId}/${i}.png`;
      const uploaded  = await uploadBase64(supabase, url, path);
      if (uploaded) { changed = true; return uploaded; }
      return url; // fallback — orijinal base64 kalır
    }),
  );
  return { urls, changed };
}
