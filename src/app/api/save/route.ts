import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Oturum açmış kullanıcı (cookies) — mağaza sahibi olarak user_id atanır
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Mağaza oluşturmak için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    const {
      imageBase64,
      storeName,
      price,
      selectedPlan,
      seo_title,
      description,
      features,
      image_urls,
      theme,
      custom_domain,
    } = (await req.json()) as {
      imageBase64: string;
      storeName: string;
      price: string;
      selectedPlan: "monthly" | "yearly";
      seo_title: string | null;
      description: string | null;
      features: string[] | null;
      image_urls: string[];
      theme?: string;
      custom_domain?: string | null;
    };

    if (!storeName || !price) {
      return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from("stores")
      .insert({
        store_name: storeName,
        product_price: parseFloat(price.replace(",", ".")),
        product_image_base64: imageBase64 ?? null,
        selected_plan: selectedPlan ?? "yearly",
        seo_title: seo_title ?? null,
        description: description ?? null,
        features: features ?? null,
        image_urls: image_urls?.length > 0 ? image_urls : null,
        theme: theme ?? "modern",
        custom_domain: custom_domain ?? null,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error) throw new Error(`Supabase: ${error.message} (kod: ${error.code})`);

    return NextResponse.json({ success: true, storeId: inserted.id });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as Record<string, unknown>).message)
        : JSON.stringify(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
