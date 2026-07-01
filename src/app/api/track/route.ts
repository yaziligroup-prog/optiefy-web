/**
 * POST /api/track
 * Vitrin etkinliği kaydeder. Body: { storeId, eventType? }
 *
 * eventType: 'view' (varsayılan) | 'add_to_cart' | 'checkout'
 * IP ve user-agent server-side yakalanır. Hatalar sessizce yutulur.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { storeId?: string; eventType?: string };
    const { storeId, eventType = "view" } = body;
    if (!storeId) return NextResponse.json({ ok: false }, { status: 400 });

    const fwd = req.headers.get("x-forwarded-for") ?? "";
    const ip =
      fwd.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = (req.headers.get("user-agent") ?? "unknown").slice(0, 400);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );

    await supabase.from("page_views").insert({
      store_id:   storeId,
      ip_address: ip,
      user_agent: ua,
      event_type: eventType,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
