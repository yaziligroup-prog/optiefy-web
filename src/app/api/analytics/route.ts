/**
 * GET /api/analytics
 * Oturum açmış kullanıcının mağazalarına ait gerçek trafik analitiği döndürür.
 *
 * RLS select politikası yalnızca mağaza sahibinin satırlarını döndürür — bu
 * yüzden ek store filtresine gerek yoktur. Aggregation JS tarafında yapılır.
 *
 * Yanıt:
 *   {
 *     hasData: boolean,
 *     days: [{ key, views, visitors }] (son 14 gün),
 *     totalViews, totalVisitors, liveVisitors
 *   }
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
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

  const now = Date.now();
  const since14 = new Date(now - 14 * 86_400_000).toISOString();

  const { data: rows, error } = await supabase
    .from("page_views")
    .select("created_at, ip_address")
    .gte("created_at", since14)
    .order("created_at", { ascending: false })
    .limit(50_000);

  // Tablo yoksa veya hata varsa → hasData:false (dashboard simülasyona düşer)
  if (error || !rows) {
    return NextResponse.json({ hasData: false, days: [], totalViews: 0, totalVisitors: 0, liveVisitors: 0 });
  }

  // 14 günlük kovalar
  const days: { key: string; views: number; ips: Set<string> }[] = [];
  const idx = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    idx.set(key, days.length);
    days.push({ key, views: 0, ips: new Set() });
  }

  const globalIps = new Set<string>();
  const liveIps   = new Set<string>();
  const liveSince = now - 5 * 60_000; // son 5 dakika

  for (const r of rows) {
    const t = new Date(r.created_at as string).getTime();
    const ip = (r.ip_address as string) ?? "unknown";
    const key = new Date(t).toISOString().slice(0, 10);
    const i = idx.get(key);
    if (i !== undefined) { days[i].views += 1; days[i].ips.add(ip); }
    globalIps.add(ip);
    if (t >= liveSince) liveIps.add(ip);
  }

  return NextResponse.json({
    hasData:       rows.length > 0,
    days:          days.map((d) => ({ key: d.key, views: d.views, visitors: d.ips.size })),
    totalViews:    rows.length,
    totalVisitors: globalIps.size,
    liveVisitors:  liveIps.size,
  });
}

export const dynamic = "force-dynamic";
