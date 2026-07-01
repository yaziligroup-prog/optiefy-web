/**
 * POST /api/track
 * Anonim vitrin ziyareti kaydeder. Body: { storeId: string }
 *
 * IP ve user-agent server-side yakalanır. page_views tablosuna anon key ile
 * yazılır (RLS insert politikası anon/authenticated'a izin verir).
 * Hatalar sessizce yutulur — takip asla vitrini bozmamalı.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { storeId } = (await req.json()) as { storeId?: string };
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
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Sessiz — takip hatası ziyaretçiyi etkilemez
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
