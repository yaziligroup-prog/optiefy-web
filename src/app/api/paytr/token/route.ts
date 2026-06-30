import { NextRequest, NextResponse } from "next/server";
import { generateIframeToken, PAYTR_ENABLED } from "@/lib/paytr";
import { getPaymentClient, finalizeSuccessfulOrder } from "@/lib/order-fulfillment";

// Service role varsa onu, yoksa anon client (RLS: anon insert izinli)
const db = getPaymentClient();

function generateOrderNumber(): string {
  const ts  = Date.now().toString().slice(-4);
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `YRF-${ts}${rnd}`;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      storeId:      string;
      customer: {
        firstName: string; lastName: string; email: string;
        phone: string; address: string; city: string; postalCode: string;
      };
      items: {
        productId: string; name: string; unitPrice: number; quantity: number; image: string | null;
      }[];
      subtotal:     number;
      shippingCost: number;
      totalDesi:    number;
      isOversized:  boolean;
    };

    const { storeId, customer: c, items, subtotal, shippingCost, totalDesi, isOversized } = body;

    if (!storeId || !c.email || !items.length) {
      return NextResponse.json({ error: "Eksik parametreler." }, { status: 400 });
    }

    const subtotalRounded     = Math.round(subtotal * 100) / 100;
    const shippingCostRounded = Math.round(shippingCost * 100) / 100;
    const total               = Math.round((subtotalRounded + shippingCostRounded) * 100) / 100;
    const orderNumber         = generateOrderNumber();
    const customerName        = `${c.firstName} ${c.lastName}`.trim();

    // ── 1. Mağaza bilgileri ──────────────────────────────────────────────────────
    const { data: store } = await db
      .from("stores")
      .select("store_name, currency, paytr_sub_merchant_key, paytr_sub_merchant_salt")
      .eq("id", storeId)
      .single();

    // ── 2. Siparişi "pending" olarak oluştur ────────────────────────────────────
    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        order_number:     orderNumber,
        store_id:         storeId,
        customer_name:    customerName,
        customer_email:   c.email,
        customer_phone:   c.phone,
        shipping_address: c.address,
        city:             c.city,
        postal_code:      c.postalCode || null,
        subtotal:         subtotalRounded,
        shipping_cost:    shippingCostRounded,
        total,
        total_desi:       totalDesi,
        is_oversized:     isOversized,
        status:           "pending",
        payment_status:   "pending",
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: orderErr?.message ?? "Sipariş oluşturulamadı." }, { status: 500 });
    }

    // ── 3. Sipariş kalemleri ─────────────────────────────────────────────────────
    const rows = items.map((it) => ({
      order_id:     order.id,
      product_id:   it.productId,
      product_name: it.name,
      unit_price:   it.unitPrice,
      quantity:     it.quantity,
      image:        it.image,
      line_total:   Math.round(it.unitPrice * it.quantity * 100) / 100,
    }));

    await db.from("order_items").insert(rows);

    // ── 4. Payment transaction kaydı ──────────────────────────────────────────────
    await db.from("payment_transactions").insert({
      order_id:     order.id,
      merchant_oid: orderNumber,
      amount_kurus: Math.round(total * 100),
      status:       "pending",
      currency:     store?.currency === "USD" ? "USD" : "TL",
    });

    // ── 5. Mock mod (PayTR yapılandırılmamışsa) ──────────────────────────────────
    // Gerçek ödeme olmadan tüm akışı test edebilmek için siparişi başarılı say:
    // durumu "preparing"e çek + onay/bildirim e-postalarını gönder.
    if (!PAYTR_ENABLED) {
      await finalizeSuccessfulOrder(db, order.id as string, {
        paymentType: "mock",
        rawCallback: { mock: true },
      });
      return NextResponse.json({
        mock:        true,
        orderId:     order.id,
        orderNumber: order.order_number,
      });
    }

    // ── 6. Gerçek PayTR token ────────────────────────────────────────────────────
    const tokenResult = await generateIframeToken({
      merchantOid:      orderNumber,
      email:            c.email,
      customerName,
      userPhone:        c.phone,
      userAddress:      `${c.address} ${c.city}`,
      userIp:           getClientIp(req),
      amountTL:         total,
      items:            items.map((it) => ({
        name:      it.name,
        unitPrice: it.unitPrice,
        quantity:  it.quantity,
      })),
      currency:         store?.currency === "USD" ? "USD" : "TL",
      subMerchantKey:   (store?.paytr_sub_merchant_key as string | null) ?? null,
      subMerchantSalt:  (store?.paytr_sub_merchant_salt as string | null) ?? null,
    });

    if (!tokenResult.success) {
      // Token alınamadıysa siparişi iptal et
      await db
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", order.id);
      return NextResponse.json({ error: tokenResult.error }, { status: 502 });
    }

    return NextResponse.json({
      iframeUrl:   tokenResult.iframeUrl,
      orderId:     order.id,
      orderNumber: order.order_number,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sunucu hatası." },
      { status: 500 }
    );
  }
}
