import { createClient } from "@supabase/supabase-js";
import type { Store } from "@/types/store";
import type { ThemeId } from "@/types/theme";
import StoreView from "@/app/store/[domain]/StoreView";
import StoreNotFound from "@/app/store/[domain]/StoreNotFound";

interface Props {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ theme?: string }>;
}

export default async function StorePreviewPage({ params, searchParams }: Props) {
  const { storeId } = await params;
  const { theme } = await searchParams;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  );

  const { data, error } = await supabase
    .from("stores")
    .select("*, products(*)")
    .eq("id", storeId)
    .single();

  if (error || !data) {
    return <StoreNotFound domain={storeId} />;
  }

  return (
    <StoreView
      store={data as Store}
      overrideTheme={theme as ThemeId | undefined}
      previewMode={true}
    />
  );
}
