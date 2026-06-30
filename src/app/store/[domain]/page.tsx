import { createClient } from "@supabase/supabase-js";
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

export default async function StorePage({ params }: Props) {
  const { domain } = await params;

  const { data, error } = await supabase
    .from("stores")
    .select("*, products(*)")
    .eq("custom_domain", domain)
    .eq("status", "active")
    .limit(1)
    .single();

  if (error || !data) {
    return <StoreNotFound domain={domain} />;
  }

  return <StoreView store={data as Store} />;
}

// Her zaman dinamik render — domain başına farklı içerik
export const dynamic = "force-dynamic";
