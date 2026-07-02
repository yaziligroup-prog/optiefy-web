/**
 * GET /api/panel/stats?storeId=&start=ISO&end=ISO
 *
 * Ana panel metrik kartlarının tek doğruluk kaynağı. Seçili tarih aralığı VE
 * bir önceki eş uzunluktaki dönem tek sorguda çekilir; trend yüzdeleri burada
 * hesaplanır. Tüm sorgular store_id ile izole edilir.
 *
 * - revenue / orderCount : aralıktaki, iptal-başarısız olmayan siparişler
 * - pendingCount         : tarihten BAĞIMSIZ güncel bekleyen/hazırlanan siparişler
 * - visitors             : aralıktaki tekil ziyaretçi (ip_address oturum anahtarıdır —
 *                          şemada session_id kolonu yok, IP bazlı tekilleştirme yapılır)
 * - conversion           : (başarılı sipariş / tekil ziyaretçi) × 100, sıfır guard'lı
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Başarısız sayılan sipariş durumları — ciro ve dönüşüm dışında tutulur
const EXCLUDED_STATUSES = ["cancelled", "failed"];

type OrderRow = { total: number | string | null; status: string | null; created_at: string };

function aggregateOrders(rows: OrderRow[]) {
  let revenue = 0, count = 0, delivered = 0;
  for (const r of rows) {
    if (EXCLUDED_STATUSES.includes(r.status ?? "")) continue;
    revenue += Number(r.total ?? 0);
    count += 1;
    if (r.status === "delivered") delivered += 1;
  }
  return { revenue, count, delivered };
}

// Önceki dönem 0 ise trend hesaplanamaz (null) — UI "—" gösterir
const pctChange = (cur: number, prev: number): number | null =>
  prev > 0 ? ((cur - prev) / prev) * 100 : null;

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()   { return cookieStore.getAll(); },
        setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

  const now   = Date.now();
  const end   = searchParams.get("end")   ? new Date(searchParams.get("end")!).getTime()   : now;
  const start = searchParams.get("start") ? new Date(searchParams.get("start")!).getTime() : end - 14 * 86_400_000;
  const spanMs    = Math.max(end - start, 60_000);
  const prevStart = start - spanMs; // önceki eş dönem: [prevStart, start)

  const endISO       = new Date(end).toISOString();
  const prevStartISO = new Date(prevStart).toISOString();

  // ── Siparişler: mevcut + önceki dönem tek sorguda ──────────────────────────
  const ordersQ = supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("store_id", storeId)
    .gte("created_at", prevStartISO)
    .lte("created_at", endISO)
    .limit(10_000);

  // ── Bekleyen siparişler: tarihten bağımsız güncel durum ────────────────────
  const pendingQ = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .in("status", ["pending", "preparing"]);

  // ── Ziyaretçiler: iki dönemin page_views kayıtları ─────────────────────────
  const viewsQ = supabase
    .from("page_views")
    .select("ip_address, created_at")
    .eq("store_id", storeId)
    .eq("event_type", "view")
    .gte("created_at", prevStartISO)
    .lte("created_at", endISO)
    .limit(50_000);

  const [ordersRes, pendingRes, viewsRes] = await Promise.all([ordersQ, pendingQ, viewsQ]);

  if (ordersRes.error) {
    return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  }

  const allOrders = (ordersRes.data ?? []) as OrderRow[];
  const curOrders  = allOrders.filter((o) => new Date(o.created_at).getTime() >= start);
  const prevOrders = allOrders.filter((o) => new Date(o.created_at).getTime() <  start);

  const cur  = aggregateOrders(curOrders);
  const prev = aggregateOrders(prevOrders);

  // Tekil ziyaretçi kümeleri — dönem bazında ayrıştır
  const curIps = new Set<string>();
  const prevIps = new Set<string>();
  for (const r of viewsRes.data ?? []) {
    const ip = (r.ip_address as string) ?? "unknown";
    if (new Date(r.created_at as string).getTime() >= start) curIps.add(ip);
    else prevIps.add(ip);
  }
  const visitors     = curIps.size;
  const prevVisitors = prevIps.size;

  // Dönüşüm oranı — ziyaretçi 0 ise güvenli %0.0
  const conversion     = visitors     > 0 ? (cur.count  / visitors)     * 100 : 0;
  const prevConversion = prevVisitors > 0 ? (prev.count / prevVisitors) * 100 : 0;

  return NextResponse.json({
    revenue:        cur.revenue,
    orderCount:     cur.count,
    deliveredCount: cur.delivered,
    pendingCount:   pendingRes.count ?? 0,
    visitors,
    conversion,
    trends: {
      revenue:    pctChange(cur.revenue, prev.revenue),
      orders:     pctChange(cur.count, prev.count),
      delivered:  pctChange(cur.delivered, prev.delivered),
      visitors:   pctChange(visitors, prevVisitors),
      conversion: pctChange(conversion, prevConversion),
    },
  });
}

export const dynamic = "force-dynamic";
