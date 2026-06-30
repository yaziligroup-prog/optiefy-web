"use server";

import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { sendShippingUpdate } from "@/lib/email";
import type { CreateOrderInput, OrderStatus } from "@/types/order";

// Anon client — vitrin (anon) tarafından çağrılan createOrder için
const anonSupabase = createAnonClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-4);
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `YRF-${ts}${rnd}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ success: boolean; orderNumber?: string; orderId?: string; error?: string }> {
  try {
    if (!input.items.length) {
      return { success: false, error: "Sepet boş." };
    }

    const orderNumber = generateOrderNumber();
    const subtotal = Math.round(input.subtotal * 100) / 100;
    const shippingCost = Math.round(input.shippingCost * 100) / 100;
    const total = Math.round((subtotal + shippingCost) * 100) / 100;
    const c = input.customer;

    const { data: order, error: orderErr } = await anonSupabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        store_id: input.storeId,
        customer_name: `${c.firstName} ${c.lastName}`.trim(),
        customer_email: c.email,
        customer_phone: c.phone,
        shipping_address: c.address,
        city: c.city,
        postal_code: c.postalCode || null,
        subtotal,
        shipping_cost: shippingCost,
        total,
        total_desi: input.totalDesi,
        is_oversized: input.isOversized,
        status: "preparing",
        payment_status: "paid",
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr?.message ?? "Sipariş oluşturulamadı.");
    }

    const rows = input.items.map((it) => ({
      order_id: order.id,
      product_id: it.productId,
      product_name: it.name,
      unit_price: it.unitPrice,
      quantity: it.quantity,
      image: it.image,
      line_total: Math.round(it.unitPrice * it.quantity * 100) / 100,
    }));

    const { error: itemsErr } = await anonSupabase.from("order_items").insert(rows);
    if (itemsErr) throw new Error(itemsErr.message);

    // E-postalar artık PayTR callback (/api/paytr/callback) tarafından gönderilir.

    return { success: true, orderNumber: order.order_number, orderId: order.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu." };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum açmanız gerekiyor." };

  const updateData: Record<string, unknown> = { status };
  if (trackingNumber !== undefined) {
    updateData.tracking_number = trackingNumber.trim() || null;
  }

  const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
  if (error) return { success: false, error: error.message };

  // Kargo e-postası — sadece "shipped" statüsüne geçişte
  if (status === "shipped") {
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("order_number, customer_name, customer_email, shipping_address, city, store_id, tracking_number")
        .eq("id", orderId)
        .single();

      if (order) {
        const { data: store } = await supabase
          .from("stores")
          .select("store_name, currency")
          .eq("id", order.store_id)
          .single();

        await sendShippingUpdate({
          orderNumber:     order.order_number as string,
          customerName:    order.customer_name as string,
          customerEmail:   order.customer_email as string,
          storeName:       (store?.store_name as string | undefined) ?? "Mağaza",
          trackingNumber:  (trackingNumber?.trim() || (order.tracking_number as string | null)) ?? null,
          shippingAddress: order.shipping_address as string,
          city:            order.city as string,
          currency:        store?.currency as string | null | undefined,
        });
      }
    } catch {
      // e-posta hatası statü güncellemesini geri almaz
    }
  }

  return { success: true };
}
