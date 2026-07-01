"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  Users, TrendingUp, Radio, ShoppingBag, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { OrderWithItems } from "@/types/order";
import { PANEL_BODY_FONT, type PanelPalette } from "../_lib/theme";

// ─── Deterministik simüle ziyaretçi (render'lar arası sabit) ────────────────────
function seededVisitors(d: Date): number {
  const day = d.getDay();
  const dow = day === 0 || day === 6 ? 1.32 : day === 5 ? 1.18 : 1;
  const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 50 + d.getDate();
  const rand = Math.abs(Math.sin(seed)); // 0..1 deterministik
  const base = 150 + Math.round(rand * 130);
  return Math.round(base * dow);
}

// Gerçek analitik yanıtı (/api/analytics)
export type RealAnalytics = {
  hasData:       boolean;
  days:          { key: string; views: number; visitors: number }[];
  totalViews:    number;
  totalVisitors: number;
  liveVisitors:  number;
};

type DayPoint = {
  key: string; label: string; short: string;
  orders: number; revenue: number; visitors: number;
};

function buildSeries(orders: OrderWithItems[], real?: RealAnalytics | null): DayPoint[] {
  const useReal = !!real?.hasData;
  const realByKey = new Map((real?.days ?? []).map((d) => [d.key, d.views]));
  const days: DayPoint[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
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

// ─── Ana bileşen ────────────────────────────────────────────────────────────────
export default function AnalyticsCharts({
  orders, c, analytics,
}: {
  orders: OrderWithItems[]; c: PanelPalette; analytics?: RealAnalytics | null;
}) {
  const isReal = !!analytics?.hasData;
  const series = useMemo(() => buildSeries(orders, analytics), [orders, analytics]);

  const totals = useMemo(() => {
    const totalOrders  = series.reduce((s, p) => s + p.orders, 0);
    const totalRevenue = series.reduce((s, p) => s + p.revenue, 0);
    // Gerçek modda benzersiz ziyaretçi global (server hesaplar); simülasyonda toplam
    const totalVisitors = isReal ? (analytics?.totalVisitors ?? 0) : series.reduce((s, p) => s + p.visitors, 0);
    const conversion    = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;
    // Son 7 gün vs önceki 7 gün trafik trendi
    const last7  = series.slice(7).reduce((s, p) => s + p.visitors, 0);
    const prev7  = series.slice(0, 7).reduce((s, p) => s + p.visitors, 0);
    const visTrend = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0;
    return { totalVisitors, totalOrders, totalRevenue, conversion, visTrend };
  }, [series, isReal, analytics]);

  // Canlı trafik — gerçek modda server'dan (poll ile tazelenir), simülasyonda dalgalanma
  const liveBase = Math.max(3, Math.round(series[series.length - 1].visitors / 42));
  const [simLive, setSimLive] = useState(liveBase);
  useEffect(() => {
    if (isReal) return; // gerçek modda dalgalanma yok
    const id = setInterval(() => {
      setSimLive(() => Math.max(1, liveBase + Math.round((Math.random() - 0.5) * 4)));
    }, 3200);
    return () => clearInterval(id);
  }, [liveBase, isReal]);
  const live = isReal ? (analytics?.liveVisitors ?? 0) : simLive;

  const axisStyle = { fontSize: 11, fontFamily: PANEL_BODY_FONT, fill: c.textSubtle };
  const maxOrders = Math.max(1, ...series.map((p) => p.orders));
  const trafficSuffix = isReal ? " görüntüleme" : " ziyaretçi";

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
          trend="14 gün" trendUp icon={ShoppingBag} color="#2563EB" />
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
                ? <><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} /> Gerçek veri</>
                : "Son 14 gün"}
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
                <XAxis dataKey="short" tick={axisStyle} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} allowDecimals={false} />
                <Tooltip content={<ChartTooltip c={c} suffix={trafficSuffix} />} cursor={{ stroke: c.border }} />
                <Area type="monotone" dataKey="visitors" stroke="#7C3AED" strokeWidth={2.5}
                  fill="url(#visGrad)" activeDot={{ r: 5, fill: "#7C3AED", stroke: c.cardBg, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Günlük sipariş — bar chart (gerçek veri) */}
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
                <XAxis dataKey="short" tick={axisStyle} axisLine={false} tickLine={false} interval={3} />
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
    </div>
  );
}
