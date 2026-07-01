import { NextRequest, NextResponse } from "next/server";
import { generateIframeToken, PAYTR_ENABLED } from "@/lib/paytr";
import { getPaymentClient, finalizeSuccessfulOrder, type PreloadedOrder } from "@/lib/order-fulfillment";

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

    // ── 2. Siparişi oluştur ──────────────────────────────────────────────────────
    // Mock modda (PAYTR_ENABLED=false) nihai durumu ("preparing"/"paid") doğrudan
    // insert anında yazıyoruz. Önceden "pending" yazıp ardından ayrı bir UPDATE ile
    // düzeltmeye çalışmak, anon (oturumsuz) checkout akışında orders UPDATE RLS'i
    // "authenticated" gerektirdiği için sessizce hiçbir satırı etkilemeden
    // başarısız olabiliyordu — sipariş kalıcı olarak "pending" ile panelde
    // "Bekliyor" durumunda takılı kalıyordu. INSERT ise anon için açık, bu yüzden
    // nihai değerleri en baştan doğru yazmak güvenilir.
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
        status:           PAYTR_ENABLED ? "pending" : "preparing",
        payment_status:   PAYTR_ENABLED ? "pending" : "paid",
      })
      .select("id, order_number, customer_name, customer_email, customer_phone, shipping_address, city, subtotal, shipping_cost, total, store_id, status")
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
      status:       PAYTR_ENABLED ? "pending" : "success",
      currency:     store?.currency === "USD" ? "USD" : "TL",
    });

    // ── 5. Mock mod (PayTR yapılandırılmamışsa) ──────────────────────────────────
    // Sipariş zaten "preparing"/"paid" olarak yazıldı — burada sadece onay/bildirim
    // e-postalarını gönderiyoruz (preloadedOrder + skipUpdate: tekrar UPDATE denenmez).
    if (!PAYTR_ENABLED) {
      await finalizeSuccessfulOrder(db, order.id as string, {
        paymentType:    "mock",
        rawCallback:    { mock: true },
        preloadedOrder: order as PreloadedOrder,
        skipUpdate:     true,
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
