"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CircleDollarSign, Clock, ShoppingBag, CheckCircle2,
  ArrowUpRight, AlertTriangle, Sparkles, Zap, MoreHorizontal, RefreshCw, Inbox,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { OrderWithItems, OrderStatus } from "@/types/order";
import {
  usePanelTheme, PANEL_DISPLAY_FONT, PANEL_BODY_FONT, type PanelPalette,
} from "./_lib/theme";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmtTRY = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  const d = Math.floor(h / 24);
  return `${d} gün önce`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso); const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

const STATUS: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: "Onay Bekliyor",  color: "#6B7280" },
  preparing: { label: "Hazırlanıyor",   color: "#D97706" },
  shipped:   { label: "Kargolandı",     color: "#2563EB" },
  delivered: { label: "Teslim Edildi",  color: "#059669" },
  cancelled: { label: "İptal Edildi",   color: "#DC2626" },
};

const SUGGESTIONS = [
  { icon: AlertTriangle, color: "#F59E0B", title: "Stok seviyelerini gözden geçir", desc: "Büyük boyutlu ürünlerde üretim süresi uzun; stoğu önceden planlayın.", cta: "Kataloğa Git" },
  { icon: Sparkles,      color: "#7C3AED", title: "Fiyatları AI ile optimize et",  desc: "Rakip analizine göre fiyatlandırma fırsatlarını değerlendirin.", cta: "Optimize Et" },
  { icon: Zap,           color: "#22C55E", title: "Pazaryeri entegrasyonu",         desc: "Trendyol & Hepsiburada bağlayarak erişimini katla.", cta: "Bağlan" },
];

// ─── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, index, c,
}: {
  label: string; value: string; sub: string;
  icon: typeof CircleDollarSign; color: string; index: number; c: PanelPalette;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl p-5"
      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}18` }}>
        <Icon className="w-[18px] h-[18px]" style={{ color }} />
      </div>
      <p className="text-xs font-medium mb-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{label}</p>
      <p className="text-2xl font-bold tracking-tight mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{value}</p>
      <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{sub}</p>
    </motion.div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { c, isDark } = usePanelTheme();
  const [orders, setOrders]   = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday]     = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, id, order_id, product_id, unit_price, image, line_total)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setOrders(data as OrderWithItems[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    setToday(new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    fetchOrders();
  }, [fetchOrders]);

  // ── Gerçek istatistikler ──
  const active = orders.filter((o) => o.status !== "cancelled");
  const revenue = active.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const pendingCount = orders.filter((o) => o.status === "preparing" || o.status === "pending").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const todayCount = orders.filter((o) => isToday(o.created_at)).length;
  const deliveredPct = orders.length ? Math.round((deliveredCount / orders.length) * 100) : 0;

  const STATS = [
    { label: "Toplam Ciro",         value: fmtTRY(revenue),        sub: `${active.length} geçerli sipariş`, icon: CircleDollarSign, color: "#22C55E" },
    { label: "Bekleyen Siparişler", value: String(pendingCount),   sub: "Hazırlanıyor / onay bekliyor",     icon: Clock,            color: "#D97706" },
    { label: "Toplam Sipariş",      value: String(orders.length),  sub: `Bugün: ${todayCount}`,             icon: ShoppingBag,      color: "#7C3AED" },
    { label: "Teslim Edilen",       value: String(deliveredCount), sub: `%${deliveredPct} tamamlandı`,      icon: CheckCircle2,     color: "#2563EB" },
  ];

  const recent = orders.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto space-y-7">

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
              <span className="text-xs font-semibold" style={{ color: "#16A34A", fontFamily: PANEL_BODY_FONT }}>Mağazanız canlı</span>
              {today && <span className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>· {today}</span>}
            </div>
            <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
              İşletmenizin bugünkü özeti
            </h1>
            <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>İşte gerçek zamanlı sipariş tablonuz.</p>
          </div>
          <button onClick={fetchOrders} title="Yenile"
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            <RefreshCw className="w-4 h-4" style={{ color: c.textMuted }} />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s, i) => <StatCard key={s.label} {...s} index={i} c={c} />)}
      </div>

      {/* Orders + AI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Orders table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="xl:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Son Gelen Siparişler</h2>
              <p className="text-xs mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                {loading ? "Yükleniyor…" : `${orders.length} sipariş kaydı`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: c.hover }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: c.cardBgSoft, border: `1px solid ${c.border}` }}>
                <Inbox className="w-6 h-6" style={{ color: c.textSubtle }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Henüz sipariş yok</p>
              <p className="text-xs max-w-xs leading-relaxed" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                Vitrininizden ilk sipariş geldiğinde burada gerçek zamanlı olarak görünecek.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                    {["Müşteri", "Ürün", "Tutar", "Durum", ""].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o, i) => {
                    const st = STATUS[o.status] ?? STATUS.preparing;
                    const firstItem = o.order_items?.[0]?.product_name ?? "—";
                    const extra = (o.order_items?.length ?? 0) - 1;
                    return (
                      <motion.tr
                        key={o.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}
                        style={{ borderBottom: i < recent.length - 1 ? `1px solid ${c.borderSoft}` : "none" }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                              style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#F1F0FE", color: c.accentText }}>
                              {initials(o.customer_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{o.customer_name}</p>
                              <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{o.order_number} · {timeAgo(o.created_at)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm truncate max-w-[180px]" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                            {firstItem}{extra > 0 ? ` +${extra}` : ""}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold whitespace-nowrap" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{fmtTRY(Number(o.total ?? 0))}</p>
                          {o.is_oversized && <p className="text-[10px]" style={{ color: c.textSubtle }}>Büyük boyutlu</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                            style={{ background: `${st.color}1A`, color: st.color, border: `1px solid ${st.color}33` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity" style={{ color: c.textSubtle }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="rounded-2xl p-5"
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>AI Önerileri</h2>
          </div>
          <p className="text-xs mb-5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>İşletmenizi büyütmek için akıllı aksiyonlar</p>

          <div className="space-y-3">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 + i * 0.08 }}
                  className="rounded-xl p-3.5"
                  style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${s.color}18` }}>
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug mb-0.5" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{s.title}</p>
                      <p className="text-xs leading-relaxed mb-2" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{s.desc}</p>
                      <button className="text-xs font-bold flex items-center gap-1 hover:gap-1.5 transition-all" style={{ color: s.color, fontFamily: PANEL_BODY_FONT }}>
                        {s.cta} <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
