"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, X, Search, RefreshCw, Inbox, Mail, Phone, MapPin,
  ShoppingBag, ChevronRight, TrendingUp, Calendar,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Order, OrderStatus } from "@/types/order";
import {
  usePanelTheme, PANEL_BODY_FONT, PANEL_DISPLAY_FONT, type PanelPalette,
} from "../_lib/theme";

// ─── Types ───────────────────────────────────────────────────────────────────────

interface CustomerRecord {
  email:         string;
  name:          string;
  phone:         string;
  orderCount:    number;
  totalSpent:    number;
  lastOrderDate: string;
  lastAddress:   string;
  lastCity:      string;
  orders:        Order[];
}

// ─── Constants ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   "Bekliyor",
  preparing: "Hazırlanıyor",
  shipped:   "Kargolandı",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   "#6B7280",
  preparing: "#D97706",
  shipped:   "#2563EB",
  delivered: "#059669",
  cancelled: "#DC2626",
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function groupByCustomer(orders: Order[]): CustomerRecord[] {
  const map = new Map<string, CustomerRecord>();

  for (const o of orders) {
    const key = o.customer_email.toLowerCase().trim();
    const existing = map.get(key);
    if (existing) {
      existing.orderCount += 1;
      if (o.status !== "cancelled") existing.totalSpent += Number(o.total ?? 0);
      if (o.created_at > existing.lastOrderDate) {
        existing.lastOrderDate = o.created_at;
        existing.name          = o.customer_name;
        existing.phone         = o.customer_phone;
        existing.lastAddress   = o.shipping_address;
        existing.lastCity      = o.city;
      }
      existing.orders.push(o);
    } else {
      map.set(key, {
        email:         key,
        name:          o.customer_name,
        phone:         o.customer_phone,
        orderCount:    1,
        totalSpent:    o.status !== "cancelled" ? Number(o.total ?? 0) : 0,
        lastOrderDate: o.created_at,
        lastAddress:   o.shipping_address,
        lastCity:      o.city,
        orders:        [o],
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
  );
}

// ─── CustomerDrawer ──────────────────────────────────────────────────────────────

function CustomerDrawer({ customer, c, onClose }: { customer: CustomerRecord; c: PanelPalette; onClose: () => void }) {
  const sortedOrders = [...customer.orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg flex flex-col overflow-hidden"
        style={{ background: c.cardBg, borderLeft: `1px solid ${c.border}`, boxShadow: "-24px 0 80px rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${c.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
              {initials(customer.name)}
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{customer.name}</p>
              <p className="text-xs mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            <X className="w-4 h-4" style={{ color: c.textMuted }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* İletişim bilgileri */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              İletişim
            </p>
            <div className="rounded-2xl p-4 space-y-2.5" style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.textSubtle }} />
                <span className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.textSubtle }} />
                <span className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{customer.phone}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: c.textSubtle }} />
                <span className="text-sm leading-relaxed" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                  {customer.lastAddress}, {customer.lastCity}
                </span>
              </div>
            </div>
          </section>

          {/* Özet */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Özet
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sipariş Sayısı", value: String(customer.orderCount), color: "#7C3AED" },
                { label: "Toplam Harcama", value: fmtPrice(customer.totalSpent), color: "#059669" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
                  <p className="text-[11px] font-medium mb-1" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{label}</p>
                  <p className="text-lg font-bold" style={{ color, fontFamily: PANEL_BODY_FONT }}>{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sipariş geçmişi */}
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Sipariş Geçmişi ({sortedOrders.length})
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.borderSoft}` }}>
              {sortedOrders.map((o, i) => {
                const color = STATUS_COLOR[o.status] ?? "#6B7280";
                return (
                  <div key={o.id} className="flex items-center justify-between px-4 py-3.5"
                    style={{ borderBottom: i < sortedOrders.length - 1 ? `1px solid ${c.borderSoft}` : "none", background: i % 2 === 0 ? c.cardBgSoft : "transparent" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>#{o.order_number}</p>
                      <p className="text-xs mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{fmtDate(o.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}1A`, color, border: `1px solid ${color}33` }}>
                        {STATUS_LABEL[o.status]}
                      </span>
                      <p className="text-sm font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                        {fmtPrice(Number(o.total ?? 0))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </motion.aside>
    </>
  );
}

// ─── MusterilerPage ──────────────────────────────────────────────────────────────

export default function MusterilerPage() {
  const { c, isDark } = usePanelTheme();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [drawer, setDrawer]     = useState<CustomerRecord | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, order_number, store_id, customer_name, customer_email, customer_phone, shipping_address, city, postal_code, subtotal, shipping_cost, total, total_desi, is_oversized, status, payment_status, tracking_number")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const customers = useMemo(() => groupByCustomer(orders), [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // İstatistikler
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const thisMonth    = customers.filter((c) => {
    const d = new Date(c.lastOrderDate); const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  const tr: React.CSSProperties = { transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease" };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Başlık */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
              Müşteriler
            </h1>
            <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              {loading ? "Yükleniyor…" : `${customers.length} benzersiz müşteri`}
            </p>
          </div>
          <button onClick={fetchOrders} title="Yenile"
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
            style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}>
            <RefreshCw className="w-4 h-4" style={{ color: c.textMuted }} />
          </button>
        </div>

        {!loading && customers.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: "Toplam Müşteri",  value: customers.length, color: "#7C3AED", Icon: Users },
              { label: "Bu Ay",           value: thisMonth,        color: "#2563EB", Icon: Calendar },
              { label: "Toplam Ciro",     value: fmtPrice(totalRevenue), color: "#059669", Icon: TrendingUp },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-semibold" style={{ color, fontFamily: PANEL_BODY_FONT }}>{label}: <strong>{value}</strong></span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Arama */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: c.textSubtle }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Müşteri adı veya e-posta..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
        />
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
              {search ? "Arama sonucu bulunamadı" : "Henüz müşteri yok"}
            </p>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              {search ? `"${search}" için eşleşme yok.` : "Vitrininizden sipariş geldiğinde müşteriler burada listelenir."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                  {["Müşteri", "Telefon", "Sipariş", "Harcama", "Son Sipariş", ""].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, i) => (
                  <motion.tr
                    key={customer.email}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.02 * i }}
                    onClick={() => setDrawer(customer)}
                    className="cursor-pointer"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${c.borderSoft}` : "none" }}
                    whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)" }}
                  >
                    {/* Müşteri */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white"
                          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                          {initials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[160px]" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{customer.name}</p>
                          <p className="text-[11px] truncate max-w-[160px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{customer.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Telefon */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{customer.phone}</p>
                    </td>

                    {/* Sipariş sayısı */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
                        <p className="text-sm font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{customer.orderCount}</p>
                      </div>
                    </td>

                    {/* Toplam harcama */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold" style={{ color: "#059669", fontFamily: PANEL_BODY_FONT }}>
                        {fmtPrice(customer.totalSpent)}
                      </p>
                    </td>

                    {/* Son sipariş */}
                    <td className="px-5 py-3.5">
                      <p className="text-xs whitespace-nowrap" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                        {timeAgo(customer.lastOrderDate)}
                      </p>
                    </td>

                    {/* Ok */}
                    <td className="px-5 py-3.5">
                      <ChevronRight className="w-4 h-4" style={{ color: c.textSubtle }} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
            <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {filtered.length} müşteri gösteriliyor
            </p>
            <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Toplam ciro: <strong style={{ color: c.textMuted }}>{fmtPrice(filtered.reduce((s, c) => s + c.totalSpent, 0))}</strong>
            </p>
          </div>
        )}
      </motion.div>

      {/* Drawer */}
      <AnimatePresence>
        {drawer && (
          <CustomerDrawer key={drawer.email} customer={drawer} c={c} onClose={() => setDrawer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
