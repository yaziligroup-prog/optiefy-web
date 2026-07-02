/**
 * Dinamik kategori / koleksiyon yakalayıcı.
 *
 * Nav editöründe oluşturulan herhangi bir rota (/urunler/yeni-urunler,
 * /kampanya, /koleksiyon/kis vb.) otomatik olarak bir kategori sayfası sayılır:
 * URL'in SON segmenti kategori slug'ıdır ve products.category ile eşleşen
 * ürünler filtrelenerek listelenir. Spesifik rotalar (/urunler, /urun/[id],
 * /legal/[slug]) Next.js önceliğiyle bu catch-all'dan önce çözülür.
 */
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Store } from "@/types/store";
import CollectionView from "../CollectionView";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

interface Props {
  params: Promise<{ domain: string; rest: string[] }>;
}

const getStore = cache(async (domain: string) => {
  const { data } = await supabase
    .from("stores")
    .select("*, products(*)")
    .eq("custom_domain", domain)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data as Store | null;
});

// Nav ağacında bu slug'la biten rotayı ara — etiketini sayfa başlığı yap
function findNavLabel(store: Store, slug: string): string | null {
  for (const link of store.theme_settings?.nav_links ?? []) {
    if (link.url.split("/").filter(Boolean).pop() === slug) return link.label;
    for (const child of link.children ?? []) {
      if (child.url.split("/").filter(Boolean).pop() === slug) return child.label;
    }
  }
  return null;
}

function resolveCategory(store: Store, rest: string[]) {
  const slug = rest[rest.length - 1] ?? "";
  const navLabel = findNavLabel(store, slug);
  const hasProducts = (store.products ?? []).some((p) => p.category === slug);
  return { slug, navLabel, hasProducts };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, rest } = await params;
  const store = await getStore(domain);
  if (!store) return { title: domain };
  const { slug, navLabel } = resolveCategory(store, rest);
  return { title: `${navLabel ?? slug} — ${store.store_name}` };
}

export default async function CategoryPage({ params }: Props) {
  const { domain, rest } = await params;
  const store = await getStore(domain);
  if (!store) notFound();

  const { slug, navLabel, hasProducts } = resolveCategory(store, rest);

  // Ne nav menüsünde tanımlı ne de ürün bağlanmış — gerçek 404
  if (!navLabel && !hasProducts) notFound();

  return <CollectionView store={store} categorySlug={slug} categoryLabel={navLabel ?? slug} />;
}

export const dynamic = "force-dynamic";
