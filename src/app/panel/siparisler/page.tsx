"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, X, Truck, CheckCircle2, XCircle, Clock, AlertCircle,
  RefreshCw, Search, Inbox, User, Mail, Phone, MapPin, Hash, Save,
  ChevronRight, Package, Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStatus } from "@/app/actions/orders";
import type { OrderWithItems, OrderStatus, OrderItem } from "@/types/order";
import {
  usePanelTheme, PANEL_BODY_FONT, PANEL_DISPLAY_FONT, type PanelPalette,
} from "../_lib/theme";
import { useActiveStore } from "../_lib/storeContext";

// ─── Constants ───────────────────────────────────────────────────────────────────

const STATUS_TABS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all",       label: "Tümü" },
  { key: "pending",   label: "Bekliyor" },
  { key: "preparing", label: "Hazırlanıyor" },
  { key: "shipped",   label: "Kargolandı" },
  { key: "delivered", label: "Teslim Edildi" },
  { key: "cancelled", label: "İptal" },
];

const STATUS_META: Record<OrderStatus, { label: string; color: string; Icon: typeof Clock }> = {
  pending:   { label: "Bekliyor",      color: "#6B7280", Icon: Clock },
  preparing: { label: "Hazırlanıyor",  color: "#D97706", Icon: AlertCircle },
  shipped:   { label: "Kargolandı",    color: "#2563EB", Icon: Truck },
  delivered: { label: "Teslim Edildi", color: "#059669", Icon: CheckCircle2 },
  cancelled: { label: "İptal Edildi",  color: "#DC2626", Icon: XCircle },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────

const fmtPrice = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.preparing;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `${m.color}1A`, color: m.color, border: `1px solid ${m.color}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

// ─── OrderDetailDrawer ───────────────────────────────────────────────────────────

function OrderDetailDrawer({
  order, c, onClose, onSaved,
}: {
  order: OrderWithItems;
  c: PanelPalette;
  onClose: () => void;
  onSaved: (id: string, status: OrderStatus, tracking: string | null) => void;
}) {
  const [status, setStatus]     = useState<OrderStatus>(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const items: OrderItem[] = (order.order_items ?? []) as OrderItem[];

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    const res = await updateOrderStatus(order.id, status, tracking);
    setSaving(false);
    if (res.success) {
      setMsg({ ok: true, text: "Değişiklikler kaydedildi" });
      onSaved(order.id, status, tracking.trim() || null);
    } else {
      setMsg({ ok: false, text: res.error ?? "Kayıt başarısız" });
    }
  };

  const inputStyle: React.CSSProperties = {
    background: c.inputBg,
    border: `1px solid ${c.border}`,
    color: c.text,
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "14px",
    fontFamily: PANEL_BODY_FONT,
    width: "100%",
    outline: "none",
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg flex flex-col overflow-hidden"
        style={{ background: c.cardBg, borderLeft: `1px solid ${c.border}`, boxShadow: "-24px 0 80px rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${c.border}` }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: c.accentText, fontFamily: PANEL_BODY_FONT }}>
              Sipariş Detayı
            </p>
            <p className="text-lg font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
              #{order.order_number}
            </p>
            <p className="text-xs mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {fmtDate(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}
          >
            <X className="w-4 h-4" style={{ color: c.textMuted }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Müşteri */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" style={{ color: c.accentText }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Müşteri</p>
            </div>
            <div className="rounded-2xl p-4 space-y-2.5" style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
              <p className="font-semibold text-sm" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{order.customer_name}</p>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.textSubtle }} />
                <p className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{order.customer_email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.textSubtle }} />
                <p className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{order.customer_phone}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: c.textSubtle }} />
                <p className="text-sm leading-relaxed" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                  {order.shipping_address}, {order.city}
                  {order.postal_code ? ` ${order.postal_code}` : ""}
                </p>
              </div>
            </div>
          </section>

          {/* Ürünler */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" style={{ color: c.accentText }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Ürünler</p>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.borderSoft}` }}>
              {items.length === 0 ? (
                <p className="px-4 py-3 text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Kalem bulunamadı</p>
              ) : (
                items.map((it, i) => (
                  <div
                    key={it.id ?? i}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ background: i % 2 === 0 ? c.cardBgSoft : "transparent", borderBottom: i < items.length - 1 ? `1px solid ${c.borderSoft}` : "none" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image} alt={it.product_name} className="w-9 h-9 rounded-lg object-contain flex-shrink-0" style={{ background: c.hover }} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.hover }}>
                          <Package className="w-4 h-4" style={{ color: c.textSubtle }} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{it.product_name}</p>
                        <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{it.quantity} adet × {fmtPrice(it.unit_price)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                      {fmtPrice(it.line_total)}
                    </p>
                  </div>
                ))
              )}

              {/* Tutar özeti */}
              <div className="px-4 py-3 space-y-2" style={{ background: c.cardBgSoft, borderTop: `1px solid ${c.border}` }}>
                <div className="flex justify-between text-xs" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                  <span>Ara toplam</span>
                  <span>{fmtPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                  <span className="flex items-center gap-1">
                    {order.is_oversized && <Package className="w-3 h-3" style={{ color: c.accentText }} />}
                    Kargo
                  </span>
                  <span>{order.shipping_cost > 0 ? fmtPrice(order.shipping_cost) : "Ücretsiz"}</span>
                </div>
                <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${c.border}` }}>
                  <span className="text-sm font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Toplam</span>
                  <span className="text-sm font-bold" style={{ color: c.accentText, fontFamily: PANEL_BODY_FONT }}>{fmtPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Durum Güncelle */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4" style={{ color: c.accentText }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Durum Güncelle</p>
            </div>
            <div className="space-y-3">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as OrderStatus); setMsg(null); }}
                style={{ ...inputStyle, appearance: "auto", cursor: "pointer" }}
              >
                {Object.entries(STATUS_META).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>

              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: c.textSubtle }} />
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => { setTracking(e.target.value); setMsg(null); }}
                  placeholder="Kargo takip no (opsiyonel)"
                  style={{ ...inputStyle, paddingLeft: "40px" }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0 space-y-2.5" style={{ borderTop: `1px solid ${c.border}` }}>
          {msg && (
            <p
              className="text-xs text-center font-medium"
              style={{ color: msg.ok ? "#059669" : "#DC2626", fontFamily: PANEL_BODY_FONT }}
            >
              {msg.ok ? "✓ " : "✕ "}{msg.text}
            </p>
          )}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ opacity: saving ? 1 : 0.88 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}

// ─── SiparislerPage ──────────────────────────────────────────────────────────────

export default function SiparislerPage() {
  const { c, isDark } = usePanelTheme();
  const { activeStoreId, loading: storeLoading } = useActiveStore();
  const [orders, setOrders]   = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<OrderStatus | "all">("all");
  const [search, setSearch]   = useState("");
  const [drawer, setDrawer]   = useState<OrderWithItems | null>(null);

  const fetchOrders = useCallback(async (sid: string | null, storeStillLoading: boolean) => {
    if (!sid) {
      if (!storeStillLoading) { setOrders([]); setLoading(false); }
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("store_id", sid)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setOrders(data as OrderWithItems[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders(activeStoreId, storeLoading);
  }, [fetchOrders, activeStoreId, storeLoading]);

  const openDrawer = (o: OrderWithItems) => setDrawer(o);
  const closeDrawer = () => setDrawer(null);

  const handleSaved = (id: string, status: OrderStatus, tracking: string | null) => {
    setOrders((prev) =>
      prev.map((o) => o.id === id ? { ...o, status, tracking_number: tracking } : o)
    );
    setDrawer((prev) => prev?.id === id ? { ...prev, status, tracking_number: tracking } : prev);
  };

  // Filtre
  const filtered = orders.filter((o) => {
    const matchTab = tab === "all" || o.status === tab;
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      o.customer_name.toLowerCase().includes(q) ||
      o.order_number.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // İstatistikler
  const pendingCount  = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;
  const todayCount    = orders.filter((o) => {
    const d = new Date(o.created_at); const n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const totalRevenue  = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total ?? 0), 0);

  const tabCount = (key: OrderStatus | "all") =>
    key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

  const tr: React.CSSProperties = { transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease" };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Başlık */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
              Sipariş Yönetimi
            </h1>
            <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              {loading ? "Yükleniyor…" : `${orders.length} sipariş kaydı`}
            </p>
          </div>
          <button
            onClick={() => fetchOrders(activeStoreId, storeLoading)}
            title="Yenile"
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
            style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: c.textMuted }} />
          </button>
        </div>

        {/* Mini istatistikler */}
        {!loading && (
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: "Bekleyen", value: pendingCount, color: "#D97706" },
              { label: "Bugün",    value: todayCount,   color: "#7C3AED" },
              { label: "Ciro",     value: fmtPrice(totalRevenue), color: "#059669" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-xs font-semibold" style={{ color, fontFamily: PANEL_BODY_FONT }}>{label}: <strong>{value}</strong></span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Arama + Filtre */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Arama */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: c.textSubtle }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri adı veya sipariş no..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
          />
        </div>

        {/* Durum filtre tab'ları */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => {
            const active = tab === key;
            const count = tabCount(key);
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  ...tr,
                  background: active ? c.ctaBg : c.hover,
                  color: active ? c.ctaText : c.textMuted,
                  border: `1px solid ${active ? c.ctaBg : c.border}`,
                  fontFamily: PANEL_BODY_FONT,
                }}
              >
                {label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: active ? "rgba(255,255,255,0.2)" : c.cardBgSoft, color: active ? c.ctaText : c.textSubtle }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tablo */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
      >
        {loading ? (
          <div className="p-5 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: c.hover }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: c.cardBgSoft, border: `1px solid ${c.border}` }}>
              <Inbox className="w-6 h-6" style={{ color: c.textSubtle }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
              {search ? "Arama sonucu bulunamadı" : "Henüz sipariş yok"}
            </p>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              {search ? `"${search}" için eşleşme yok.` : "Vitrininizden sipariş geldiğinde burada görünecek."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                  {["Müşteri", "Ürünler", "Tutar", "Durum", "Tarih", ""].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => {
                  const items = o.order_items ?? [];
                  const firstItem = items[0]?.product_name ?? "—";
                  const extra = items.length - 1;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => openDrawer(o)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${c.borderSoft}` : "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {/* Müşteri */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#F1F0FE", color: c.accentText, fontFamily: PANEL_BODY_FONT }}>
                            {initials(o.customer_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[140px]" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                              {o.customer_name}
                            </p>
                            <p className="text-[11px] truncate max-w-[140px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                              {o.order_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Ürünler */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm truncate max-w-[180px]" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                          {firstItem}{extra > 0 ? ` +${extra} daha` : ""}
                        </p>
                      </td>

                      {/* Tutar */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold whitespace-nowrap" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                          {fmtPrice(Number(o.total ?? 0))}
                        </p>
                        {o.is_oversized && (
                          <p className="text-[10px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Büyük boyutlu</p>
                        )}
                      </td>

                      {/* Durum */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={o.status} />
                          {o.tracking_number && (
                            <p className="text-[10px] flex items-center gap-1" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                              <Hash className="w-2.5 h-2.5" /> {o.tracking_number}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Tarih */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs whitespace-nowrap" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                          {timeAgo(o.created_at)}
                        </p>
                      </td>

                      {/* Ok */}
                      <td className="px-5 py-3.5">
                        <ChevronRight className="w-4 h-4" style={{ color: c.textSubtle }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
            <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {filtered.length} sipariş gösteriliyor
            </p>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
              <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                Toplam: <strong style={{ color: c.textMuted }}>{fmtPrice(filtered.reduce((s, o) => s + Number(o.total ?? 0), 0))}</strong>
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {drawer && (
          <OrderDetailDrawer
            key={drawer.id}
            order={drawer}
            c={c}
            onClose={closeDrawer}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
