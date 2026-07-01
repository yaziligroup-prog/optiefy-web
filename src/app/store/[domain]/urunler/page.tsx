import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Store } from "@/types/store";
import CollectionView from "../CollectionView";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ domain: string }>;
}

// Panelde ürün eklendiğinde/silindiğinde force-dynamic sayesinde her istekte
// güncel katalog Supabase'den çekilir (stores → products ilişkisi store_id ile).
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params;
  const store = await getStore(domain);
  const name = store?.store_name ?? domain;
  return {
    title: `Tüm Ürünler — ${name}`,
    description: `${name} koleksiyonundaki el yapımı ürünleri keşfedin.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { domain } = await params;
  const store = await getStore(domain);
  if (!store) notFound();

  return <CollectionView store={store} />;
}

export const dynamic = "force-dynamic";
