/**
 * GET /api/analytics?from=ISO&to=ISO
 * Tarih aralığına göre filtrelenmiş analitik + dönüşüm hunisi verir.
 *
 * Yanıt:
 *   {
 *     hasData, days, totalViews, totalVisitors, liveVisitors,
 *     funnel: { views, addToCart, checkout, purchases }
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()  { return cookieStore.getAll(); },
        setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam   = searchParams.get("to");

  const now   = Date.now();
  const since = fromParam ? new Date(fromParam).getTime() : now - 14 * 86_400_000;
  const until = toParam   ? new Date(toParam).getTime()   : now;

  const sinceISO = new Date(since).toISOString();
  const untilISO = new Date(until).toISOString();

  // Tarih aralığındaki tüm etkinlikler
  const { data: rows, error } = await supabase
    .from("page_views")
    .select("created_at, ip_address, event_type")
    .gte("created_at", sinceISO)
    .lte("created_at", untilISO)
    .order("created_at", { ascending: false })
    .limit(50_000);

  if (error || !rows) {
    return NextResponse.json({
      hasData: false, days: [], totalViews: 0, totalVisitors: 0, liveVisitors: 0,
      funnel: { views: 0, addToCart: 0, checkout: 0, purchases: 0 },
    });
  }

  // Günlük kova aralığı
  const rangeDays = Math.max(1, Math.ceil((until - since) / 86_400_000));
  const days: { key: string; views: number; ips: Set<string> }[] = [];
  const idx = new Map<string, number>();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(until - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    idx.set(key, days.length);
    days.push({ key, views: 0, ips: new Set() });
  }

  const globalIps  = new Set<string>();
  const liveIps    = new Set<string>();
  const liveSince  = now - 5 * 60_000;
  let funnelViews = 0, funnelCart = 0, funnelCheckout = 0;

  for (const r of rows) {
    const t         = new Date(r.created_at as string).getTime();
    const ip        = (r.ip_address as string) ?? "unknown";
    const eventType = (r.event_type as string) ?? "view";
    const key       = new Date(t).toISOString().slice(0, 10);

    if (eventType === "view") {
      const i = idx.get(key);
      if (i !== undefined) { days[i].views += 1; days[i].ips.add(ip); }
      globalIps.add(ip);
      funnelViews++;
    } else if (eventType === "add_to_cart") {
      funnelCart++;
    } else if (eventType === "checkout") {
      funnelCheckout++;
    }

    if (t >= liveSince && eventType === "view") liveIps.add(ip);
  }

  // Dönem içindeki tamamlanan sipariş sayısı (iptal edilenler hariç)
  const { count: purchasesCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceISO)
    .lte("created_at", untilISO)
    .neq("status", "cancelled");

  return NextResponse.json({
    hasData:       rows.length > 0,
    days:          days.map((d) => ({ key: d.key, views: d.views, visitors: d.ips.size })),
    totalViews:    funnelViews,
    totalVisitors: globalIps.size,
    liveVisitors:  liveIps.size,
    funnel: {
      views:      funnelViews,
      addToCart:  funnelCart,
      checkout:   funnelCheckout,
      purchases:  purchasesCount ?? 0,
    },
  });
}

export const dynamic = "force-dynamic";
