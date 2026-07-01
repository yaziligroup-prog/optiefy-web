import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Store } from "@/types/store";
import { getLegalDoc } from "@/lib/legalTemplates";
import LegalView from "./LegalView";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ domain: string; slug: string }>;
}

const getStore = cache(async (domain: string) => {
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("custom_domain", domain)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data as Store | null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, slug } = await params;
  const store = await getStore(domain);
  const doc = getLegalDoc(slug, store?.store_name ?? domain, domain);
  return {
    title: doc ? `${doc.title} — ${store?.store_name ?? domain}` : domain,
    robots: { index: false },
  };
}

export default async function LegalPage({ params }: Props) {
  const { domain, slug } = await params;
  const store = await getStore(domain);
  if (!store) notFound();

  // Şablon, mağaza adını metindeki boşluklara otomatik giydirir
  const doc = getLegalDoc(slug, store.store_name, domain);
  if (!doc) notFound();

  return <LegalView store={store} doc={doc} />;
}

export const dynamic = "force-dynamic";
