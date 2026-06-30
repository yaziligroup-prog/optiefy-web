import { NextRequest, NextResponse } from "next/server";
import { verifyCallbackHash, PAYTR_ENABLED } from "@/lib/paytr";
import type { CallbackPayload } from "@/lib/paytr";
import {
  getPaymentClient,
  finalizeSuccessfulOrder,
  failOrder,
} from "@/lib/order-fulfillment";

// PayTR ödeme sonucunu sunucudan-sunucuya bildirir.
// RLS bypass gerektiği için service role (getPaymentClient) kullanılır.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const get  = (k: string) => form.get(k)?.toString() ?? "";

  const payload: CallbackPayload = {
    merchant_oid:      get("merchant_oid"),
    status:            get("status") as "success" | "failed",
    total_amount:      get("total_amount"),
    hash:              get("hash"),
    payment_type:      get("payment_type") || undefined,
    installment_count: get("installment_count") || undefined,
    currency:          get("currency") || undefined,
  };

  // ── Hash doğrulama ───────────────────────────────────────────────────────────
  if (PAYTR_ENABLED && !verifyCallbackHash(payload)) {
    return new NextResponse("INVALID_HASH", { status: 400 });
  }

  const client = getPaymentClient();

  // ── Siparişi bul ─────────────────────────────────────────────────────────────
  const { data: order } = await client
    .from("orders")
    .select("id, status")
    .eq("order_number", payload.merchant_oid)
    .single();

  // PayTR her durumda "OK" bekler — aksi halde tekrar dener
  if (!order) return new NextResponse("OK");
  if (order.status !== "pending") return new NextResponse("OK");

  const rawCallback = Object.fromEntries(form.entries());

  if (payload.status === "success") {
    await finalizeSuccessfulOrder(client, order.id as string, {
      paymentType:      payload.payment_type ?? null,
      installmentCount: Number(payload.installment_count ?? 0),
      rawCallback,
    });
  } else {
    await failOrder(client, order.id as string, rawCallback);
  }

  return new NextResponse("OK");
}
