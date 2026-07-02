import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Öksüz (orphaned) ürün görsellerini Storage'dan temizleme yardımcıları.
 * Ürün silindiğinde veya görselleri değiştirildiğinde çağrılır — best-effort:
 * temizlik hatası asıl işlemi (ürün silme/güncelleme) asla bloklamaz.
 */

const BUCKET = "store-images";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

/** Public bucket URL'ini storage path'ine çevirir; bucket dışı URL'lerde null. */
export function urlToStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const idx = url.indexOf(PUBLIC_MARKER);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(url.slice(idx + PUBLIC_MARKER.length));
  } catch {
    return null;
  }
}

/**
 * Verilen görsel URL'lerinden bu mağazanın products/ klasörüne ait olanları
 * Storage'dan fiziksel olarak siler. Harici URL'ler ve başka mağazaların
 * dosyaları (yanlış veri gelse bile) dokunulmadan atlanır.
 */
export async function removeProductImagesFromStorage(
  supabase: SupabaseClient,
  storeId: string,
  urls: (string | null | undefined)[],
): Promise<void> {
  const prefix = `products/${storeId}/`;
  const paths = [...new Set(
    urls
      .map(urlToStoragePath)
      .filter((p): p is string => !!p && p.startsWith(prefix)),
  )];
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.warn(`[storage-cleanup] ${paths.length} dosya silinemedi:`, error.message);
  }
}

/**
 * Görsel listesi güncellenirken artık referans edilmeyen eski dosyaları bulur.
 * (Eski liste ∪ eski cover) − yeni liste
 */
export function findOrphanedImages(
  oldUrls: (string | null | undefined)[],
  newUrls: (string | null | undefined)[],
): string[] {
  const keep = new Set(newUrls.filter(Boolean) as string[]);
  return [...new Set(oldUrls.filter((u): u is string => !!u && !keep.has(u)))];
}
