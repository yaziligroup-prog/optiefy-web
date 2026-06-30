import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { registerSubMerchant, PAYTR_ENABLED } from "@/lib/paytr";

// Panel API: bir mağazayı PayTR'a alt satıcı olarak kaydeder.
// Çağrı: panel/urunler veya store oluşturma akışından yapılır.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const body = await req.json() as {
    storeId: string;
    name:    string;
    email:   string;
    phone:   string;
    iban?:   string;
  };

  // Sahiplik doğrulama
  const { data: store } = await supabase
    .from("stores")
    .select("id, user_id, paytr_sub_merchant_id")
    .eq("id", body.storeId)
    .single();

  if (!store || store.user_id !== user.id) {
    return NextResponse.json({ error: "Mağaza bulunamadı." }, { status: 403 });
  }

  if (store.paytr_sub_merchant_id) {
    return NextResponse.json({ message: "Bu mağaza zaten kayıtlı.", alreadyRegistered: true });
  }

  if (!PAYTR_ENABLED) {
    return NextResponse.json({ error: "PayTR henüz yapılandırılmamış." }, { status: 503 });
  }

  const result = await registerSubMerchant({
    name:  body.name,
    email: body.email,
    phone: body.phone,
    iban:  body.iban,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Mağazaya sub-merchant bilgilerini kaydet
  await supabase
    .from("stores")
    .update({
      paytr_sub_merchant_id:   result.subMerchantId,
      paytr_sub_merchant_key:  result.subMerchantKey,
      paytr_sub_merchant_salt: result.subMerchantSalt,
    })
    .eq("id", body.storeId);

  return NextResponse.json({ success: true, subMerchantId: result.subMerchantId });
}
