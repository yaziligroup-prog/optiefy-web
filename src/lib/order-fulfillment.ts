import { createClient as createAnonClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/utils/supabase/service";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email";

// Ödeme işleme için en yetkili client'ı döndürür.
// Service role varsa onu (RLS bypass), yoksa anon client kullanır.
// Callback gibi oturumsuz, sunucudan-sunucuya çağrılar için service role gereklidir.
export function getPaymentClient(): SupabaseClient {
  const service = createServiceClient();
  if (service) return service;
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type PreloadedOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  store_id: string;
  status: string;
};

// Başarılı ödeme sonrası siparişi tamamlar:
//  1. orders → preparing / paid
//  2. payment_transactions → success
//  3. Müşteri onay + satıcı bildirim e-postaları
// Hem mock modda (token route) hem de gerçek PayTR callback'inde kullanılır.
//
// preloadedOrder: mock modda, sipariş zaten insert edilirken elde ettiğimiz
// satırı doğrudan geçebiliriz. Bu, anon client + eksik RLS SELECT izni
// (service role henüz tanımlı değilse) durumunda burada yapılacak ayrı bir
// SELECT'in sessizce boş dönüp durumu hiç güncellemeden fonksiyonun no-op
// olmasını engeller — store_id/payment_status paneldeki sorguyla eşleşmeye
// devam eder.
export async function finalizeSuccessfulOrder(
  client: SupabaseClient,
  orderId: string,
  opts?: {
    paymentType?: string | null;
    installmentCount?: number;
    rawCallback?: Record<string, unknown>;
    preloadedOrder?: PreloadedOrder;
    // Mock modda sipariş zaten "preparing"/"paid" olarak insert edildiği için
    // burada tekrar bir UPDATE denenmez (anon client'ta orders UPDATE RLS'i
    // "authenticated" gerektirir ve sessizce 0 satır etkiler — store_id ve
    // payment_status panelin beklediğiyle uyuşmadan kalırdı). Sadece e-posta
    // adımı çalışır.
    skipUpdate?: boolean;
  }
): Promise<void> {
  // ── 1. Siparişi getir ──────────────────────────────────────────────────────
  const order = opts?.preloadedOrder ?? (await client
    .from("orders")
    .select("id, order_number, customer_name, customer_email, customer_phone, shipping_address, city, subtotal, shipping_cost, total, store_id, status")
    .eq("id", orderId)
    .single()).data;

  if (!order) return;

  if (!opts?.skipUpdate) {
    // Tekrar işlemeyi engelle
    if (order.status !== "pending") return;

    // ── 2. Sipariş durumunu güncelle ───────────────────────────────────────────
    await client
      .from("orders")
      .update({ status: "preparing", payment_status: "paid" })
      .eq("id", order.id);

    // ── 3. Payment transaction güncelle ────────────────────────────────────────
    await client
      .from("payment_transactions")
      .update({
        status:            "success",
        payment_type:      opts?.paymentType ?? null,
        installment_count: opts?.installmentCount ?? 0,
        raw_callback:      opts?.rawCallback ?? null,
        updated_at:        new Date().toISOString(),
      })
      .eq("order_id", order.id);
  }

  // ── 4. Sipariş kalemleri + mağaza ──────────────────────────────────────────
  const { data: orderItems } = await client
    .from("order_items")
    .select("id, order_id, product_id, product_name, unit_price, quantity, image, line_total")
    .eq("order_id", order.id);

  const { data: store } = await client
    .from("stores")
    .select("store_name, user_id, currency")
    .eq("id", order.store_id)
    .single();

  const storeName = (store?.store_name as string | undefined) ?? "Mağaza";
  const currency  = store?.currency as string | null | undefined;
  const items     = (orderItems ?? []).map((i) => ({
    id:           i.id as string,
    order_id:     i.order_id as string,
    product_id:   i.product_id as string | null,
    product_name: i.product_name as string,
    unit_price:   Number(i.unit_price),
    quantity:     Number(i.quantity),
    image:        i.image as string | null,
    line_total:   Number(i.line_total),
  }));

  // ── 5. E-posta bildirimleri (hata akışı durdurmaz) ─────────────────────────
  try {
    await sendOrderConfirmation({
      orderNumber:     order.order_number as string,
      customerName:    order.customer_name as string,
      customerEmail:   order.customer_email as string,
      storeName,
      items,
      subtotal:        Number(order.subtotal),
      shippingCost:    Number(order.shipping_cost),
      total:           Number(order.total),
      shippingAddress: order.shipping_address as string,
      city:            order.city as string,
      createdAt:       new Date().toISOString(),
      currency,
    });

    if (store?.user_id) {
      const service = createServiceClient();
      if (service) {
        const { data: ud } = await service.auth.admin.getUserById(store.user_id as string);
        const sellerEmail = ud?.user?.email;
        if (sellerEmail) {
          await sendNewOrderAlert({
            orderNumber:     order.order_number as string,
            sellerEmail,
            storeName,
            customerName:    order.customer_name as string,
            customerEmail:   order.customer_email as string,
            customerPhone:   order.customer_phone as string,
            shippingAddress: order.shipping_address as string,
            city:            order.city as string,
            items,
            total:           Number(order.total),
            createdAt:       new Date().toISOString(),
            currency,
          });
        }
      }
    }
  } catch {
    // e-posta hatası sipariş tamamlamayı engellemez
  }
}

// Başarısız ödeme sonrası siparişi iptal eder.
export async function failOrder(
  client: SupabaseClient,
  orderId: string,
  rawCallback?: Record<string, unknown>
): Promise<void> {
  await client
    .from("orders")
    .update({ status: "cancelled", payment_status: "failed" })
    .eq("id", orderId);

  await client
    .from("payment_transactions")
    .update({
      status:       "failed",
      raw_callback: rawCallback ?? null,
      updated_at:   new Date().toISOString(),
    })
    .eq("order_id", orderId);
}
