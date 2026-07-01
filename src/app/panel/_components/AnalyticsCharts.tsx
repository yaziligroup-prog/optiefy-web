"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  Users, TrendingUp, Radio, ShoppingBag, ArrowUpRight, ArrowDownRight,
  TrendingDown,
} from "lucide-react";
import type { OrderWithItems } from "@/types/order";
import { PANEL_BODY_FONT, type PanelPalette } from "../_lib/theme";

// ─── Deterministik simüle ziyaretçi ────────────────────────────────────────────
function seededVisitors(d: Date): number {
  const day = d.getDay();
  const dow = day === 0 || day === 6 ? 1.32 : day === 5 ? 1.18 : 1;
  const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 50 + d.getDate();
  const rand = Math.abs(Math.sin(seed));
  const base = 150 + Math.round(rand * 130);
  return Math.round(base * dow);
}

export type RealAnalytics = {
  hasData:       boolean;
  days:          { key: string; views: number; visitors: number }[];
  totalViews:    number;
  totalVisitors: number;
  liveVisitors:  number;
  funnel: {
    views:     number;
    addToCart: number;
    checkout:  number;
    purchases: number;
  };
};

type DayPoint = {
  key: string; label: string; short: string;
  orders: number; revenue: number; visitors: number;
};

function buildSeries(
  orders: OrderWithItems[],
  real?: RealAnalytics | null,
  fromDate?: string,
  toDate?: string,
): DayPoint[] {
  const useReal  = !!real?.hasData;
  const realByKey = new Map((real?.days ?? []).map((d) => [d.key, d.views]));
  const days: DayPoint[] = [];

  const until = toDate   ? new Date(toDate).getTime()   : Date.now();
  const start = fromDate ? new Date(fromDate).getTime() : until - 14 * 86_400_000;
  const rangeDays = Math.max(1, Math.ceil((until - start) / 86_400_000));

  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(until - i * 86_400_000);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      label: d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
      short: d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      orders: 0, revenue: 0,
      visitors: useReal ? (realByKey.get(key) ?? 0) : seededVisitors(d),
    });
  }

  const idx = new Map(days.map((p, i) => [p.key, i]));
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const t = new Date(o.created_at).getTime();
    if (t < start || t > until) continue;
    const k = new Date(o.created_at).toISOString().slice(0, 10);
    const i = idx.get(k);
    if (i !== undefined) { days[i].orders += 1; days[i].revenue += Number(o.total ?? 0); }
  }
  return days;
}

const fmtNum = (n: number) => n.toLocaleString("tr-TR");
const fmtTRY = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";

// ─── Premium metrik kartı ────────────────────────────────────────────────────────
function MetricCard({
  label, value, trend, trendUp, icon: Icon, color, index, c, live,
}: {
  label: string; value: string; trend?: string; trendUp?: boolean;
  icon: typeof Users; color: string; index: number; c: PanelPalette; live?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}18 0%, transparent 70%)` }} />
      <div className="flex items-center justify-between mb-4 relative">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
        {live ? (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <motion.span animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />
            <span className="text-[10px] font-bold" style={{ color: "#16A34A" }}>CANLI</span>
          </span>
        ) : trend ? (
          <span className="flex items-center gap-0.5 text-[11px] font-bold"
            style={{ color: trendUp ? "#16A34A" : "#DC2626" }}>
            {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend}
          </span>
        ) : null}
      </div>
      <p className="text-xs font-medium mb-1.5 relative" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{label}</p>
      <p className="text-2xl font-bold tracking-tight relative" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{value}</p>
    </motion.div>
  );
}

// ─── Özel tooltip ────────────────────────────────────────────────────────────────
interface TipEntry { name?: string; value?: number | string; color?: string; }
function ChartTooltip({ active, payload, label, c, suffix }: {
  active?: boolean; payload?: TipEntry[]; label?: string; c: PanelPalette; suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadowMd }}>
      <p className="text-[11px] font-semibold mb-1" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
          {typeof p.value === "number" ? fmtNum(p.value) : p.value}{suffix ?? ""}
        </p>
      ))}
    </div>
  );
}

// ─── Dönüşüm Hunisi ──────────────────────────────────────────────────────────────
const FUNNEL_STEPS = [
  { key: "views",      label: "Oturumlar",             sub: "Sayfa görüntüleme",    color: "#7C3AED" },
  { key: "addToCart",  label: "Sepete Ekleme",          sub: "Ürün sepete eklendi",  color: "#2563EB" },
  { key: "checkout",   label: "Ödeme Adımı",            sub: "Ödemeye yönlendirildi", color: "#0891B2" },
  { key: "purchases",  label: "Tamamlanan Alışveriş",   sub: "Sipariş oluşturuldu",  color: "#059669" },
] as const;

type FunnelData = { views: number; addToCart: number; checkout: number; purchases: number };

function ConversionFunnel({ funnel, isReal, c }: { funnel: FunnelData; isReal: boolean; c: PanelPalette }) {
  const max = Math.max(1, funnel.views);
  const values: Record<string, number> = {
    views:     funnel.views,
    addToCart: funnel.addToCart,
    checkout:  funnel.checkout,
    purchases: funnel.purchases,
  };

  const pct = (n: number, d: number) => d > 0 ? ((n / d) * 100).toFixed(1) : "—";

  const transitions = [
    { label: `%${pct(funnel.addToCart, funnel.views)} sepete ekledi` },
    { label: `%${pct(funnel.checkout, funnel.addToCart)} ödemeye geçti` },
    { label: `%${pct(funnel.purchases, funnel.checkout)} satın tamamladı` },
  ];

  const noData = !isReal && funnel.views === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="rounded-2xl p-6"
      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #059669)" }}>
            <TrendingDown className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Dönüşüm Hunisi</h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
          style={{ background: c.hover, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          {isReal
            ? <><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />Gerçek veri</>
            : "Örnek veri"}
        </span>
      </div>
      <p className="text-xs mb-6" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        Ziyaretçiden müşteriye dönüşüm akışı · {isReal ? "Seçili dönem" : "İlk satış etkinliğinde gerçek veriye geçer"}
      </p>

      {noData ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            <TrendingDown className="w-5 h-5" style={{ color: c.textSubtle }} />
          </div>
          <p className="text-sm font-medium" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Henüz etkinlik verisi yok</p>
          <p className="text-xs text-center max-w-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            Vitrininizdeki &quot;Sepete Ekle&quot; ve ödeme butonlarına tıklamalar burada görünecek.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {FUNNEL_STEPS.map((step, i) => {
            const val = values[step.key] ?? 0;
            const barPct = Math.max(0, Math.min(100, (val / max) * 100));
            const isLast = i === FUNNEL_STEPS.length - 1;
            const nextVal = i < FUNNEL_STEPS.length - 1 ? (values[FUNNEL_STEPS[i + 1].key] ?? 0) : null;
            const dropPct = nextVal !== null && val > 0 ? (((val - nextVal) / val) * 100).toFixed(1) : null;

            return (
              <div key={step.key}>
                {/* Step row */}
                <div className="flex items-center gap-4 py-3">
                  {/* Step info */}
                  <div style={{ minWidth: 160 }}>
                    <p className="text-sm font-semibold leading-tight" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                      {step.label}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                      {step.sub}
                    </p>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 relative h-8 rounded-lg overflow-hidden"
                    style={{ background: c.hover }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                      className="absolute inset-y-0 left-0 rounded-lg"
                      style={{ background: `linear-gradient(90deg, ${step.color}cc, ${step.color})` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-bold relative z-10"
                        style={{ color: barPct > 30 ? "rgba(255,255,255,0.92)" : c.text, fontFamily: PANEL_BODY_FONT }}>
                        {fmtNum(val)}
                      </span>
                    </div>
                  </div>

                  {/* Percentage of top */}
                  <div style={{ minWidth: 52, textAlign: "right" }}>
                    <span className="text-sm font-bold" style={{ color: step.color, fontFamily: PANEL_BODY_FONT }}>
                      {i === 0 ? "100%" : `%${pct(val, funnel.views)}`}
                    </span>
                  </div>
                </div>

                {/* Arrow between steps */}
                {!isLast && (
                  <div className="flex items-center gap-4 pb-1">
                    <div style={{ minWidth: 160 }} />
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-px flex-1" style={{ background: c.borderSoft }} />
                      {dropPct !== null && (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={{
                            background: `${transitions[i] ? "#DC262610" : c.hover}`,
                            color: c.textMuted,
                            border: `1px solid ${c.borderSoft}`,
                            fontFamily: PANEL_BODY_FONT,
                          }}>
                          {transitions[i]?.label ?? ""}
                        </span>
                      )}
                      <div className="h-px flex-1" style={{ background: c.borderSoft }} />
                    </div>
                    <div style={{ minWidth: 52 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Ana bileşen ────────────────────────────────────────────────────────────────
export default function AnalyticsCharts({
  orders, c, analytics, fromDate, toDate,
}: {
  orders: OrderWithItems[];
  c: PanelPalette;
  analytics?: RealAnalytics | null;
  fromDate?: string;
  toDate?: string;
}) {
  const isReal = !!analytics?.hasData;
  const series = useMemo(
    () => buildSeries(orders, analytics, fromDate, toDate),
    [orders, analytics, fromDate, toDate],
  );

  const totals = useMemo(() => {
    const totalOrders   = series.reduce((s, p) => s + p.orders, 0);
    const totalRevenue  = series.reduce((s, p) => s + p.revenue, 0);
    const totalVisitors = isReal
      ? (analytics?.totalVisitors ?? 0)
      : series.reduce((s, p) => s + p.visitors, 0);
    const conversion = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;
    const last7  = series.slice(Math.max(0, series.length - 7)).reduce((s, p) => s + p.visitors, 0);
    const prev7  = series.slice(Math.max(0, series.length - 14), Math.max(0, series.length - 7)).reduce((s, p) => s + p.visitors, 0);
    const visTrend = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0;
    return { totalVisitors, totalOrders, totalRevenue, conversion, visTrend };
  }, [series, isReal, analytics]);

  // Simüle canlı trafik dalgalanması
  const liveBase = Math.max(3, Math.round((series[series.length - 1]?.visitors ?? 0) / 42));
  const [simLive, setSimLive] = useState(liveBase);
  useEffect(() => {
    if (isReal) return;
    const id = setInterval(() => {
      setSimLive(() => Math.max(1, liveBase + Math.round((Math.random() - 0.5) * 4)));
    }, 3200);
    return () => clearInterval(id);
  }, [liveBase, isReal]);
  const live = isReal ? (analytics?.liveVisitors ?? 0) : simLive;

  // Dönüşüm hunisi verisi
  const funnel = useMemo<{ views: number; addToCart: number; checkout: number; purchases: number }>(() => {
    if (isReal && analytics?.funnel) return analytics.funnel;
    // Simüle huni
    const v  = totals.totalVisitors;
    const ac = Math.round(v * 0.14);
    const co = Math.round(ac * 0.45);
    const pu = totals.totalOrders;
    return { views: v, addToCart: ac, checkout: co, purchases: pu };
  }, [isReal, analytics, totals]);

  const axisStyle    = { fontSize: 11, fontFamily: PANEL_BODY_FONT, fill: c.textSubtle };
  const maxOrders    = Math.max(1, ...series.map((p) => p.orders));
  const trafficSuffix = isReal ? " görüntüleme" : " ziyaretçi";
  const xInterval    = series.length <= 7 ? 0 : series.length <= 14 ? 2 : 4;

  return (
    <div className="space-y-5">
      {/* Metrik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard index={0} c={c} label="Toplam Ziyaretçi" value={fmtNum(totals.totalVisitors)}
          trend={`%${Math.abs(totals.visTrend).toFixed(1)}`} trendUp={totals.visTrend >= 0}
          icon={Users} color="#7C3AED" />
        <MetricCard index={1} c={c} label="Dönüşüm Oranı" value={`%${totals.conversion.toFixed(1)}`}
          trend={totals.totalOrders > 0 ? "aktif" : undefined} trendUp
          icon={TrendingUp} color="#22C55E" />
        <MetricCard index={2} c={c} label="Canlı Trafik" value={`${live} kişi`}
          live icon={Radio} color="#EC4899" />
        <MetricCard index={3} c={c} label="Sipariş Geçmişi" value={fmtNum(totals.totalOrders)}
          trend={`${series.length} gün`} trendUp icon={ShoppingBag} color="#2563EB" />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Ziyaretçi trafiği — area chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="xl:col-span-2 rounded-2xl p-5"
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Ziyaretçi Trafiği</h2>
            <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
              style={{ background: c.hover, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              {isReal
                ? <><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />Gerçek veri</>
                : `Son ${series.length} gün`}
            </span>
          </div>
          <p className="text-xs mb-5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            {isReal ? "Vitrinlerinize gelen günlük sayfa görüntülemeleri" : "Örnek trafik verisi · ilk ziyaretlerle gerçek veriye döner"}
          </p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.borderSoft} />
                <XAxis dataKey="short" tick={axisStyle} axisLine={false} tickLine={false} interval={xInterval} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} allowDecimals={false} />
                <Tooltip content={<ChartTooltip c={c} suffix={trafficSuffix} />} cursor={{ stroke: c.border }} />
                <Area type="monotone" dataKey="visitors" stroke="#7C3AED" strokeWidth={2.5}
                  fill="url(#visGrad)" activeDot={{ r: 5, fill: "#7C3AED", stroke: c.cardBg, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Günlük sipariş — bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
          className="rounded-2xl p-5"
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Günlük Sipariş</h2>
          </div>
          <p className="text-xs mb-5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            {totals.totalRevenue > 0 ? `${fmtTRY(totals.totalRevenue)} ciro` : "Gerçek sipariş verisi"}
          </p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={series} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.borderSoft} />
                <XAxis dataKey="short" tick={axisStyle} axisLine={false} tickLine={false} interval={xInterval} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip c={c} suffix=" sipariş" />} cursor={{ fill: c.hover }} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={22}>
                  {series.map((p, i) => (
                    <Cell key={i} fill={p.orders >= maxOrders && maxOrders > 0 ? "#EC4899" : "#7C3AED"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Dönüşüm Hunisi */}
      <ConversionFunnel funnel={funnel} isReal={isReal} c={c} />
    </div>
  );
}
