"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleDollarSign, Clock, ShoppingBag, CheckCircle2,
  ArrowUpRight, AlertTriangle, Sparkles, Zap, MoreHorizontal, RefreshCw, Inbox, BarChart3,
  Calendar, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { OrderWithItems, OrderStatus } from "@/types/order";
import {
  usePanelTheme, PANEL_DISPLAY_FONT, PANEL_BODY_FONT, type PanelPalette,
} from "./_lib/theme";
import { useActiveStore } from "./_lib/storeContext";
import type { RealAnalytics } from "./_components/AnalyticsCharts";

const AnalyticsCharts = dynamic(() => import("./_components/AnalyticsCharts"), {
  ssr: false, loading: () => null,
});

// ─── Tarih aralığı ──────────────────────────────────────────────────────────────

type PeriodKey = "today" | "yesterday" | "7d" | "14d" | "30d" | "custom";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today",     label: "Bugün" },
  { key: "yesterday", label: "Dün" },
  { key: "7d",        label: "Son 7 Gün" },
  { key: "14d",       label: "Son 14 Gün" },
  { key: "30d",       label: "Son 30 Gün" },
  { key: "custom",    label: "Özel Aralık" },
];

function getPeriodDates(
  period: PeriodKey,
  customFrom = "",
  customTo   = "",
): { from: string; to: string } {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "today":
      return { from: today.toISOString(), to: now.toISOString() };
    case "yesterday": {
      const yest    = new Date(today); yest.setDate(today.getDate() - 1);
      const yestEnd = new Date(today.getTime() - 1);
      return { from: yest.toISOString(), to: yestEnd.toISOString() };
    }
    case "7d":
      return { from: new Date(now.getTime() - 7 * 86_400_000).toISOString(), to: now.toISOString() };
    case "14d":
      return { from: new Date(now.getTime() - 14 * 86_400_000).toISOString(), to: now.toISOString() };
    case "30d":
      return { from: new Date(now.getTime() - 30 * 86_400_000).toISOString(), to: now.toISOString() };
    case "custom": {
      const from = customFrom
        ? new Date(customFrom + "T00:00:00").toISOString()
        : new Date(now.getTime() - 7 * 86_400_000).toISOString();
      const to = customTo
        ? new Date(customTo + "T23:59:59").toISOString()
        : now.toISOString();
      return { from, to };
    }
  }
}

// ─── MiniCalendar sabitleri ──────────────────────────────────────────────────────

const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const TR_DAYS   = ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"];

// Tarih → yerel YYYY-MM-DD (UTC timezone karışıklığı olmadan)
function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(s: string) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "2-digit" });
}

// ─── MiniCalendar bileşeni ───────────────────────────────────────────────────────

function MiniCalendar({
  fromDate, toDate, onFromChange, onToChange, c,
}: {
  fromDate: string; toDate: string;
  onFromChange: (v: string) => void; onToChange: (v: string) => void;
  c: PanelPalette;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hovered,   setHovered]   = useState<string | null>(null);
  const todayStr = localDateStr(today);

  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay  = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Pazartesi = 0
    const cells: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const result: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleClick = (d: Date) => {
    const s = localDateStr(d);
    if (!fromDate || (fromDate && toDate)) {
      onFromChange(s); onToChange("");
    } else {
      if (s < fromDate)      { onFromChange(s); onToChange(""); }
      else if (s === fromDate) { onFromChange(""); onToChange(""); }
      else                   { onToChange(s); }
    }
  };

  // Range hesaplaması (hover önizlemeli)
  const effectiveTo = toDate || (hovered && fromDate && hovered > fromDate ? hovered : null);
  const [lo, hi] = fromDate && effectiveTo
    ? [fromDate, effectiveTo]
    : [null, null];

  return (
    <div className="select-none">
      {/* Seçili aralık göstergesi */}
      <div className="flex items-center gap-1.5 mb-4">
        <div
          className="flex-1 px-2.5 py-1.5 rounded-lg text-center text-[11px] font-semibold transition-all"
          style={{
            background: fromDate ? "#7C3AED1A" : c.hover,
            color:      fromDate ? "#A78BFA"   : c.textSubtle,
            border:     `1px solid ${fromDate ? "#7C3AED35" : c.borderSoft}`,
            fontFamily: PANEL_BODY_FONT,
          }}
        >
          {fromDate ? formatDateLabel(fromDate) : "Başlangıç"}
        </div>
        <span className="text-[10px] font-bold" style={{ color: c.textSubtle }}>→</span>
        <div
          className="flex-1 px-2.5 py-1.5 rounded-lg text-center text-[11px] font-semibold transition-all"
          style={{
            background: toDate ? "#7C3AED1A" : c.hover,
            color:      toDate ? "#A78BFA"   : c.textSubtle,
            border:     `1px solid ${toDate ? "#7C3AED35" : c.borderSoft}`,
            fontFamily: PANEL_BODY_FONT,
          }}
        >
          {toDate ? formatDateLabel(toDate) : "Bitiş"}
        </div>
      </div>

      {/* Ay navigasyonu */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ background: c.hover }}
        >
          <ChevronLeft className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
        </button>
        <p className="text-xs font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
          {TR_MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ background: c.hover }}
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
        </button>
      </div>

      {/* Gün başlıkları */}
      <div className="grid grid-cols-7 mb-1">
        {TR_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold py-0.5"
            style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{d}</div>
        ))}
      </div>

      {/* Takvim ızgarası */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day, di) => {
            if (!day) return <div key={di} className="h-8" />;
            const s         = localDateStr(day);
            const isFrom    = s === fromDate;
            const isTo      = s === toDate;
            const inRange   = !!(lo && hi && s > lo && s < hi);
            const isEndpt   = isFrom || isTo;
            const isHov     = s === hovered && !isEndpt && !inRange;
            const isToday   = s === todayStr;

            // Yatay range bandı: aralık içi hücreler için arka plan
            const rangeEdge = isFrom && hi ? "range-start"
              : isTo && lo ? "range-end" : inRange ? "in-range" : "";

            return (
              <div
                key={di}
                className="relative flex items-center justify-center py-0.5"
                style={{
                  background: inRange ? "#7C3AED12" : "transparent",
                  borderRadius:
                    rangeEdge === "range-start" ? "50% 0 0 50%"
                    : rangeEdge === "range-end" ? "0 50% 50% 0"
                    : undefined,
                }}
              >
                <button
                  onClick={() => handleClick(day)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative w-7 h-7 text-[11px] flex items-center justify-center rounded-full transition-all"
                  style={{
                    background: isEndpt ? "#7C3AED"
                      : isHov   ? c.hover
                      : "transparent",
                    color:      isEndpt ? "#fff"
                      : inRange ? "#A78BFA"
                      : isToday ? "#7C3AED"
                      : c.text,
                    fontWeight: isEndpt || isToday ? 700 : 400,
                    fontFamily: PANEL_BODY_FONT,
                    boxShadow:  isEndpt ? "0 0 0 2px #7C3AED40" : undefined,
                  }}
                >
                  {day.getDate()}
                  {/* Bugün işareti */}
                  {isToday && !isEndpt && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "#7C3AED" }}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {/* Ipucu */}
      <p className="text-center text-[10px] mt-2.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        {!fromDate
          ? "Başlangıç tarihini seçin"
          : !toDate
          ? "Bitiş tarihini seçin"
          : "Aralığı uygulamak için ▼"}
      </p>
    </div>
  );
}

// ─── DateRangePicker ─────────────────────────────────────────────────────────────

function DateRangePicker({
  period, onSelectPeriod,
  customFrom, setCustomFrom,
  customTo,   setCustomTo,
  onApply, c,
}: {
  period: PeriodKey;
  onSelectPeriod: (p: PeriodKey) => void;
  customFrom: string; setCustomFrom: (v: string) => void;
  customTo:   string; setCustomTo:   (v: string) => void;
  onApply: () => void;
  c: PanelPalette;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel   = PERIODS.find((p) => p.key === period)?.label ?? "Son 14 Gün";

  return (
    <div className="relative">
      {/* Trigger butonu */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: c.hover,
          border:     `1px solid ${c.border}`,
          color:      c.textMuted,
          fontFamily: PANEL_BODY_FONT,
        }}
      >
        <Calendar className="w-3.5 h-3.5" />
        {selectedLabel}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5" style={{ opacity: 0.6 }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width:          period === "custom" ? 296 : 200,
                background:     c.cardBg,
                border:         `1px solid ${c.border}`,
                backdropFilter: "blur(24px)",
                transition:     "width 0.22s ease",
              }}
            >
              {/* Preset period butonları */}
              <div className="p-2 space-y-0.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      onSelectPeriod(p.key);
                      if (p.key !== "custom") { onApply(); setOpen(false); }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                    style={{
                      background: period === p.key ? "#7C3AED18" : "transparent",
                      color:      period === p.key ? "#7C3AED"   : c.text,
                      fontFamily: PANEL_BODY_FONT,
                      fontWeight: period === p.key ? 600 : 400,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {p.key === "custom" && <Calendar className="w-3 h-3" style={{ opacity: 0.6 }} />}
                      {p.label}
                    </span>
                    {period === p.key && p.key !== "custom" && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C3AED" }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Özel takvim — sadece "custom" seçilince görünür */}
              <AnimatePresence>
                {period === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mx-2 mb-2 p-3 rounded-xl"
                      style={{ background: c.hover, border: `1px solid ${c.borderSoft}` }}
                    >
                      <MiniCalendar
                        fromDate={customFrom}
                        toDate={customTo}
                        onFromChange={setCustomFrom}
                        onToChange={setCustomTo}
                        c={c}
                      />
                      <button
                        onClick={() => { onApply(); setOpen(false); }}
                        disabled={!customFrom || !customTo}
                        className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-35"
                        style={{
                          background: "linear-gradient(135deg,#7C3AED,#2563EB)",
                          color:      "#fff",
                          fontFamily: PANEL_BODY_FONT,
                        }}
                      >
                        {customFrom && customTo ? "Aralığı Uygula" : "Tarihleri Seçin"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmtTRY = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
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
  label, value, sub, icon: Icon, color, index, c, loading,
}: {
  label: string; value: string; sub: string;
  icon: typeof CircleDollarSign; color: string; index: number; c: PanelPalette; loading?: boolean;
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
      {loading ? (
        <>
          <div className="h-7 w-20 rounded-md animate-pulse mb-1.5" style={{ background: c.hover }} />
          <div className="h-3 w-28 rounded-md animate-pulse" style={{ background: c.hover }} />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold tracking-tight mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{value}</p>
          <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{sub}</p>
        </>
      )}
    </motion.div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { c, isDark } = usePanelTheme();
  const { activeStore, activeStoreId, refreshStores, loading: storeLoading } = useActiveStore();
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!activeStore || publishing) return;
    setPublishing(true);
    try {
      await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeStore.id, status: "active" }),
      });
      await refreshStores(true);
    } finally {
      setPublishing(false);
    }
  };

  const [orders,       setOrders]      = useState<OrderWithItems[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [aLoading,     setALoading]    = useState(true);   // yalnızca ilk yükleme
  const [isRefreshing, setRefreshing]  = useState(false);  // tarih değişimi — hafif gösterge
  const [today,        setToday]       = useState("");
  const [analytics,    setAnalytics]   = useState<RealAnalytics | null>(null);
  // İlk yükleme tamamlandı mı? — sonrasında skeleton göstermez
  const analyticsReady = useRef(false);

  // Tarih seçici state
  const [period,       setPeriod]      = useState<PeriodKey>("14d");
  const [customFrom,   setCustomFrom]  = useState("");
  const [customTo,     setCustomTo]    = useState("");
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string }>(
    () => getPeriodDates("14d"),
  );

  const handleSelectPeriod = useCallback((p: PeriodKey) => {
    setPeriod(p);
    if (p !== "custom") setAppliedRange(getPeriodDates(p));
  }, []);

  const applyCustom = useCallback(() => {
    if (period === "custom" && customFrom && customTo) {
      setAppliedRange(getPeriodDates("custom", customFrom, customTo));
    } else if (period !== "custom") {
      setAppliedRange(getPeriodDates(period));
    }
  }, [period, customFrom, customTo]);

  const fetchOrders = useCallback(async (sid: string | null, storeStillLoading: boolean) => {
    if (!sid) {
      // Mağaza context'i henüz çözümlenmediyse "yükleniyor" durumunda kal —
      // aksi halde gerçek veri gelmeden önce sahte sıfır istatistikler görünürdü.
      if (!storeStillLoading) { setOrders([]); setLoading(false); }
      return;
    }
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, id, order_id, product_id, unit_price, image, line_total)")
      .order("created_at", { ascending: false })
      .limit(50);
    q = q.eq("store_id", sid);
    const { data, error } = await q;
    if (!error && data) setOrders(data as OrderWithItems[]);
    setLoading(false);
  }, []);

  // İlk yüklemede skeleton, sonraki güncellemelerde stale-while-revalidate
  const fetchAnalytics = useCallback(async (from: string, to: string, sid: string | null, storeStillLoading: boolean) => {
    if (!sid) {
      if (!storeStillLoading) { setAnalytics(null); setALoading(false); }
      return;
    }
    if (!analyticsReady.current) {
      setALoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const qs  = new URLSearchParams({ from, to, storeId: sid });
      const res = await fetch(`/api/analytics?${qs}`, { cache: "no-store" });
      if (!res.ok) { if (!analyticsReady.current) setAnalytics(null); return; }
      setAnalytics((await res.json()) as RealAnalytics);
      analyticsReady.current = true;
    } catch {
      if (!analyticsReady.current) setAnalytics(null);
    } finally {
      setALoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setToday(new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  // Mağaza değişince veya tarih aralığı değişince siparişleri yeniden çek
  useEffect(() => {
    fetchOrders(activeStoreId, storeLoading);
    // analyticsReady sıfırla — yeni mağazada skeleton göster
    analyticsReady.current = false;
    setALoading(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoreId, storeLoading]);

  // Tarih aralığı veya mağaza değişince analitik çek
  useEffect(() => {
    fetchAnalytics(appliedRange.from, appliedRange.to, activeStoreId, storeLoading);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedRange, activeStoreId, storeLoading]);

  // ── İstatistikler ──
  const active         = orders.filter((o) => o.status !== "cancelled");
  const revenue        = active.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const pendingCount   = orders.filter((o) => o.status === "preparing" || o.status === "pending").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const todayCount     = orders.filter((o) => isToday(o.created_at)).length;
  const deliveredPct   = orders.length ? Math.round((deliveredCount / orders.length) * 100) : 0;

  const STATS = [
    { label: "Toplam Ciro",         value: fmtTRY(revenue),        sub: `${active.length} geçerli sipariş`, icon: CircleDollarSign, color: "#22C55E" },
    { label: "Bekleyen Siparişler", value: String(pendingCount),   sub: "Hazırlanıyor / onay bekliyor",     icon: Clock,            color: "#D97706" },
    { label: "Toplam Sipariş",      value: String(orders.length),  sub: `Bugün: ${todayCount}`,             icon: ShoppingBag,      color: "#7C3AED" },
    { label: "Teslim Edilen",       value: String(deliveredCount), sub: `%${deliveredPct} tamamlandı`,      icon: CheckCircle2,     color: "#2563EB" },
  ];

  const recent = orders.slice(0, 6);

  // Period etiket göstergesi
  const periodLabel = useMemo(() => {
    if (period === "custom" && customFrom && customTo)
      return `${formatDateLabel(customFrom)} – ${formatDateLabel(customTo)}`;
    return PERIODS.find((p) => p.key === period)?.label ?? "";
  }, [period, customFrom, customTo]);

  return (
    <div className="max-w-6xl mx-auto space-y-7">

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
              <span className="text-xs font-semibold" style={{ color: "#16A34A", fontFamily: PANEL_BODY_FONT }}>Canlı</span>
              {activeStore && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(124,58,237,0.12)", color: "#A78BFA", fontFamily: PANEL_BODY_FONT }}>
                  {activeStore.store_name}
                </span>
              )}
              {today && <span className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>· {today}</span>}
            </div>
            <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
              {activeStore ? `${activeStore.store_name} özeti` : "Dashboard"}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Gerçek zamanlı sipariş ve trafik verileri bu mağazaya ait.</p>
          </div>
          <button onClick={() => fetchOrders(activeStoreId, storeLoading)} title="Yenile"
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            <RefreshCw className="w-4 h-4" style={{ color: c.textMuted }} />
          </button>
        </div>
      </motion.div>

      {/* Taslak mağaza uyarı banner'ı */}
      {activeStore && activeStore.status !== "active" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center gap-4 px-5 py-3.5 rounded-2xl"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.22)" }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.12)" }}>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#D97706", fontFamily: PANEL_BODY_FONT }}>
                Mağaza taslak modunda
              </p>
              <p className="text-xs truncate" style={{ color: "#92400E", fontFamily: PANEL_BODY_FONT }}>
                Ziyaretçiler şu an mağazanızı göremez.{activeStore.custom_domain ? ` · ${activeStore.custom_domain}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0"
            style={{
              background: publishing
                ? "rgba(34,197,94,0.08)"
                : "linear-gradient(135deg,#16A34A,#15803D)",
              color: publishing ? "#6B7280" : "#FFFFFF",
              fontFamily: PANEL_BODY_FONT,
              boxShadow: publishing ? "none" : "0 4px 12px rgba(22,163,74,0.35)",
              opacity: publishing ? 0.7 : 1,
            }}
          >
            {publishing
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Yayınlanıyor…</>
              : <>⚡ Mağazayı Yayınla</>
            }
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s, i) => <StatCard key={s.label} {...s} index={i} c={c} loading={loading} />)}
      </div>

      {/* ── Analitik & Grafikler ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7C3AED,#2563EB)" }}>
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Mağaza Analitiği</h2>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: c.hover, color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {periodLabel}
            </span>
            {/* Hafif yenileme göstergesi — charts KAPATILMAZ */}
            <AnimatePresence>
              {isRefreshing && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <RefreshCw className="w-3 h-3" style={{ color: c.textSubtle }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DateRangePicker
            period={period}
            onSelectPeriod={handleSelectPeriod}
            customFrom={customFrom}
            setCustomFrom={setCustomFrom}
            customTo={customTo}
            setCustomTo={setCustomTo}
            onApply={applyCustom}
            c={c}
          />
        </div>

        {aLoading && !analyticsReady.current ? (
          /* İlk yüklemede skeleton — yalnızca bir kez */
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map((i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: c.hover }} />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 h-80 rounded-2xl animate-pulse" style={{ background: c.hover }} />
              <div className="h-80 rounded-2xl animate-pulse" style={{ background: c.hover }} />
            </div>
            <div className="h-64 rounded-2xl animate-pulse" style={{ background: c.hover }} />
          </div>
        ) : (
          /* Tarih değişimi / yenilemede charts canlı kalır — stale-while-revalidate */
          <AnalyticsCharts
            orders={orders}
            c={c}
            analytics={analytics}
            fromDate={appliedRange.from}
            toDate={appliedRange.to}
          />
        )}
      </motion.div>

      {/* Orders + AI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="xl:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
        >
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Son Gelen Siparişler</h2>
              <p className="text-xs mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                {loading ? "Yükleniyor…" : `${orders.length} sipariş kaydı`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[0,1,2,3].map((i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: c.hover }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: c.cardBgSoft, border: `1px solid ${c.border}` }}>
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
                    {["Müşteri","Ürün","Tutar","Durum",""].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o, i) => {
                    const st = STATUS[o.status] ?? STATUS.preparing;
                    const firstItem = o.order_items?.[0]?.product_name ?? "—";
                    const extra = (o.order_items?.length ?? 0) - 1;
                    return (
                      <motion.tr key={o.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.05 }}
                        style={{ borderBottom: i < recent.length - 1 ? `1px solid ${c.borderSoft}` : "none" }}>
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
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                            style={{ color: c.textSubtle }}>
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
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>AI Önerileri</h2>
          </div>
          <p className="text-xs mb-5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>İşletmenizi büyütmek için akıllı aksiyonlar</p>
          <div className="space-y-3">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 + i * 0.08 }}
                  className="rounded-xl p-3.5"
                  style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${s.color}18` }}>
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug mb-0.5" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{s.title}</p>
                      <p className="text-xs leading-relaxed mb-2" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{s.desc}</p>
                      <button className="text-xs font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
                        style={{ color: s.color, fontFamily: PANEL_BODY_FONT }}>
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
