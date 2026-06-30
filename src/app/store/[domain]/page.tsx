import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import type { Store } from "@/types/store";
import StoreView from "./StoreView";
import StoreNotFound from "./StoreNotFound";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ domain: string }>;
}

// React.cache → generateMetadata ve StorePage aynı request'te tek sorgu yapar
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

// ── Dinamik SEO metadata — her mağaza kendi başlık/açıklamasını taşır ──────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params;
  const store = await getStore(domain);

  if (!store) {
    return {
      title: domain,
      description: `${domain} mağazası`,
    };
  }

  const title       = store.seo_title ?? store.store_name;
  const description = store.description ?? `${store.store_name} — El yapımı ürünler`;

  // Base64 data URI'leri OG image olarak gönderme — sadece gerçek HTTPS URL kullan
  const ogImage = store.image_urls?.find((u) => u?.startsWith("https://")) ?? null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1024, height: 1024, alt: title }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function StorePage({ params }: Props) {
  const { domain } = await params;
  const store = await getStore(domain);

  if (!store) {
    return <StoreNotFound domain={domain} />;
  }

  return <StoreView store={store} />;
}

// Her zaman dinamik render — domain başına farklı içerik
export const dynamic = "force-dynamic";
