import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Store, Product } from "@/types/store";
import ProductDetailView from "../../ProductDetailView";

// Service role varsa RLS'yi atlar — koleksiyon sayfasıyla aynı erişim kalıbı
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

interface Props {
  params: Promise<{ domain: string; id: string }>;
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

function findProduct(store: Store, id: string): Product | null {
  return (store.products ?? []).find((p) => p.id === id) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, id } = await params;
  const store = await getStore(domain);
  const product = store ? findProduct(store, id) : null;
  if (!store || !product) return { title: domain };
  return {
    title: `${product.name} — ${store.store_name}`,
    description: product.description ?? `${product.name} · ${store.store_name}`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { domain, id } = await params;
  const store = await getStore(domain);
  if (!store) notFound();

  const product = findProduct(store, id);
  if (!product) notFound();

  // Framer estetiğinde iki sütunlu premium detay: solda galeri, sağda satın alma paneli
  return <ProductDetailView store={store} product={product} />;
}

export const dynamic = "force-dynamic";
