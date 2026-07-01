"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ExternalLink, CheckCheck, Package, Sparkles,
  Globe, Pencil, Power, Loader2, Eye, ArrowRight, Search,
  X, RefreshCw, TrendingUp,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Toast from "@/components/Toast";
import type { Store } from "@/types/store";
import { THEMES, type ThemeId } from "@/types/theme";
import {
  usePanelTheme, PANEL_DISPLAY_FONT, PANEL_BODY_FONT, type PanelPalette,
} from "../_lib/theme";
import NewStoreWizard from "../_components/NewStoreWizard";
import ProductEditorDrawer from "../_components/ProductEditorDrawer";

type StatusFilter = "all" | "active" | "pending";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Sayfa ────────────────────────────────────────────────────────────────────

export default function UrunlerPage() {
  const { c, isDark } = usePanelTheme();

  const [stores,      setStores]      = useState<Store[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const storesReady                   = useRef(false);

  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);
  const [toastMsg,    setToastMsg]    = useState("");
  const [showToast,   setShowToast]   = useState(false);
  const [wizardOpen,  setWizardOpen]  = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // Arama + filtre
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ── Fetch: product_image_base64 HARİÇ (200KB+ base64 → yavaşlığın kaynağı)
  const fetchStores = useCallback(async (silent = false) => {
    if (!silent) {
      if (!storesReady.current) setLoading(true);
      else setRefreshing(true);
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stores")
      .select(
        "id, created_at, store_name, product_price, currency, selected_plan, status, seo_title, description, features, image_urls, custom_domain, theme"
      )
      .order("created_at", { ascending: false });
    if (!error && data) {
      setStores(data as Store[]);
      storesReady.current = true;
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  // ── Yayın durumu toggle ──
  const handleStatusToggle = useCallback(async (store: Store) => {
    const next = store.status === "active" ? "pending" : "active";
    setTogglingId(store.id);
    // Optimistik güncelleme
    setStores((prev) => prev.map((s) => (s.id === store.id ? { ...s, status: next } : s)));
    const supabase = createClient();
    const { error } = await supabase.from("stores").update({ status: next }).eq("id", store.id);
    if (error) {
      // Geri al
      setStores((prev) => prev.map((s) => (s.id === store.id ? { ...s, status: store.status } : s)));
      setToastMsg("Durum güncellenirken bir hata oluştu.");
    } else {
      setToastMsg(next === "active" ? "Vitrin yayına alındı ✓" : "Vitrin taslağa alındı");
    }
    setShowToast(true);
    setTogglingId(null);
  }, []);

  const handleCopy = useCallback((store: Store) => {
    const slug = slugify(store.store_name);
    const url = store.custom_domain ? store.custom_domain : `optiefy.com/${slug}`;
    navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    setCopiedId(store.id);
    setToastMsg("Vitrin bağlantısı panoya kopyalandı ✓");
    setShowToast(true);
    setTimeout(() => setCopiedId(null), 2200);
  }, []);

  const handleWizardCreated = useCallback(async (storeId: string) => {
    await fetchStores(true);
    setHighlightId(storeId);
    setToastMsg("Yeni vitriniz kataloğunuza eklendi ✓");
    setShowToast(true);
    setTimeout(() => setHighlightId(null), 2600);
  }, [fetchStores]);

  const handleProductSaved = useCallback((storeId: string, patch: Partial<Store>) => {
    setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...patch } : s)));
    setToastMsg("Ürün bilgileri güncellendi ✓");
    setShowToast(true);
  }, []);

  // ── Filtreli liste ──
  const filtered = useMemo(() => {
    let list = stores;
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.store_name.toLowerCase().includes(q) ||
          (s.seo_title ?? "").toLowerCase().includes(q) ||
          (s.custom_domain ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [stores, statusFilter, search]);

  const activeCount = stores.filter((s) => s.status === "active").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Toast message={toastMsg} show={showToast} onHide={() => setShowToast(false)} />
      <NewStoreWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={handleWizardCreated} />
      <ProductEditorDrawer
        store={editingStore}
        c={c}
        isDark={isDark}
        open={!!editingStore}
        onClose={() => setEditingStore(null)}
        onSaved={handleProductSaved}
      />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 style={{
                fontFamily: PANEL_DISPLAY_FONT,
                fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
                color: c.text,
              }}>
                Ürün Kataloğu
              </h1>
              {/* Hafif yenileme indikatörü */}
              <AnimatePresence>
                {refreshing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RefreshCw className="w-4 h-4 mt-1" style={{ color: c.textSubtle }} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              {loading && !storesReady.current
                ? "Vitrinler yükleniyor…"
                : `${stores.length} ürün · ${activeCount} yayında`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <motion.button
              onClick={() => setWizardOpen(true)}
              whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}
            >
              <Plus className="w-4 h-4" /> Yeni Vitrin Üret
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Toolbar: arama + filtre ── */}
      {(!loading || storesReady.current) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Arama */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: c.textSubtle }} />
            <input
              type="text"
              placeholder="Ürün ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-sm outline-none transition-all"
              style={{
                background: c.hover,
                border: `1px solid ${c.border}`,
                color: c.text,
                fontFamily: PANEL_BODY_FONT,
              }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded">
                <X className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
              </button>
            )}
          </div>

          {/* Durum filtreleri */}
          <div className="flex rounded-xl p-1 gap-1" style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            {([
              ["all",     "Tümü"],
              ["active",  "Yayında"],
              ["pending", "Taslak"],
            ] as [StatusFilter, string][]).map(([key, label]) => {
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className="relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    color: isActive ? c.text : c.textSubtle,
                    fontFamily: PANEL_BODY_FONT,
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="status-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: c.cardBg, boxShadow: c.shadow }}
                      transition={{ type: "spring", stiffness: 440, damping: 36 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {key === "active" && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />
                    )}
                    {key === "pending" && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />
                    )}
                    {label}
                    {key !== "all" && (
                      <span className="text-[10px] opacity-70">
                        ({stores.filter((s) => s.status === key).length})
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── İçerik ── */}
      {loading && !storesReady.current ? (
        <SkeletonTable c={c} />
      ) : stores.length === 0 ? (
        <EmptyState c={c} onCreate={() => setWizardOpen(true)} />
      ) : filtered.length === 0 ? (
        <NoResults c={c} onClear={() => { setSearch(""); setStatusFilter("all"); }} />
      ) : (
        <ProductTable
          stores={filtered}
          c={c}
          isDark={isDark}
          togglingId={togglingId}
          copiedId={copiedId}
          highlightId={highlightId}
          onEdit={setEditingStore}
          onStatusToggle={handleStatusToggle}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}

// ─── Shopify Ürün Tablosu ─────────────────────────────────────────────────────

function ProductTable({
  stores, c, isDark, togglingId, copiedId, highlightId, onEdit, onStatusToggle, onCopy,
}: {
  stores: Store[];
  c: PanelPalette;
  isDark: boolean;
  togglingId: string | null;
  copiedId: string | null;
  highlightId: string | null;
  onEdit: (s: Store) => void;
  onStatusToggle: (s: Store) => void;
  onCopy: (s: Store) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
              {["Ürün", "Fiyat", "Durum", "Tema", "Domain", "Tarih", ""].map((h, i) => (
                <th
                  key={i}
                  className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    color: c.textSubtle,
                    fontFamily: PANEL_BODY_FONT,
                    whiteSpace: "nowrap",
                    background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.018)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map((store, i) => (
              <ProductRow
                key={store.id}
                store={store}
                isLast={i === stores.length - 1}
                c={c}
                isDark={isDark}
                toggling={togglingId === store.id}
                copied={copiedId === store.id}
                highlight={highlightId === store.id}
                onEdit={() => onEdit(store)}
                onStatusToggle={() => onStatusToggle(store)}
                onCopy={() => onCopy(store)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Alt özet */}
      <div className="px-5 py-3" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
        <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
          {stores.length} ürün gösteriliyor
        </p>
      </div>
    </motion.div>
  );
}

// ─── Satır ────────────────────────────────────────────────────────────────────

function ProductRow({
  store, isLast, c, isDark, toggling, copied, highlight, onEdit, onStatusToggle, onCopy,
}: {
  store: Store;
  isLast: boolean;
  c: PanelPalette;
  isDark: boolean;
  toggling: boolean;
  copied: boolean;
  highlight: boolean;
  onEdit: () => void;
  onStatusToggle: () => void;
  onCopy: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const img    = store.image_urls?.[0];
  const isLive = store.status === "active";
  const theme  = (store.theme ?? "modern") as ThemeId;
  const cur    = store.currency === "USD" ? "$" : "₺";
  const slug   = slugify(store.store_name);
  const domain = store.custom_domain ?? `optiefy.com/${slug}`;

  const rowBg = highlight
    ? isDark ? "rgba(168,85,247,0.07)" : "#FAF5FF"
    : hovered
    ? isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.018)"
    : "transparent";

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
      className="cursor-pointer"
      style={{
        borderBottom: isLast ? "none" : `1px solid ${c.borderSoft}`,
        background: rowBg,
        transition: "background 0.15s",
        outline: highlight ? `2px solid rgba(168,85,247,0.4)` : "none",
        outlineOffset: "-2px",
      }}
    >
      {/* ── Ürün ── */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
            style={{ background: isDark ? "#111" : "#F4F4F2", border: `1px solid ${c.border}` }}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={store.store_name}
                className="w-full h-full object-contain p-1.5"
                style={{ filter: isLive ? "none" : "grayscale(0.4)" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5" style={{ color: c.textSubtle }} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold truncate max-w-[200px] leading-tight"
              style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}
            >
              {store.seo_title ?? store.store_name}
            </p>
            <p className="text-[11px] truncate max-w-[200px] mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {store.store_name}
            </p>
          </div>
        </div>
      </td>

      {/* ── Fiyat ── */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-sm font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
          {store.product_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {cur}
        </span>
      </td>

      {/* ── Durum ── */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{
            background: isLive ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
            color:      isLive ? "#16A34A"              : "#B45309",
            border:     `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
          }}
        >
          <motion.span
            animate={isLive ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isLive ? "#22C55E" : "#F59E0B" }}
          />
          {isLive ? "Yayında" : "Taslak"}
        </span>
      </td>

      {/* ── Tema ── */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: THEMES[theme].accentColor }} />
          {THEMES[theme].shortName}
        </span>
      </td>

      {/* ── Domain ── */}
      <td className="px-5 py-3.5 whitespace-nowrap max-w-[180px]">
        {store.custom_domain ? (
          <a
            href={`https://${store.custom_domain}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-mono hover:underline"
            style={{ color: "#16A34A" }}
          >
            <Globe className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[130px]">{store.custom_domain}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-xs font-mono truncate block max-w-[160px]" style={{ color: c.textSubtle }}>
            {domain}
          </span>
        )}
      </td>

      {/* ── Tarih ── */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
          {new Date(store.created_at).toLocaleDateString("tr-TR", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </span>
      </td>

      {/* ── Aksiyonlar ── */}
      <td className="px-5 py-3.5">
        <div
          className="flex items-center gap-1.5 justify-end"
          style={{
            opacity: hovered ? 1 : 0.4,
            transition: "opacity 0.15s",
          }}
        >
          {/* Vitrin önizleme */}
          <Link
            href={`/panel/${store.id}`}
            title="Vitrin sayfasını görüntüle"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}
          >
            <Eye className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
          </Link>

          {/* Kopyala */}
          <button
            title="Vitrin linkini kopyala"
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: copied ? "rgba(34,197,94,0.1)" : c.hover,
              border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : c.border}`,
            }}
          >
            <CheckCheck className="w-3.5 h-3.5" style={{ color: copied ? "#16A34A" : c.textMuted }} />
          </button>

          {/* Yayın toggle */}
          <button
            title={isLive ? "Taslağa al" : "Yayına al"}
            onClick={(e) => { e.stopPropagation(); if (!toggling) onStatusToggle(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: isLive ? "rgba(34,197,94,0.1)" : c.hover,
              border: `1px solid ${isLive ? "rgba(34,197,94,0.25)" : c.border}`,
            }}
          >
            {toggling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: c.textMuted }} />
              : <Power className="w-3.5 h-3.5" style={{ color: isLive ? "#16A34A" : c.textSubtle }} />}
          </button>

          {/* Düzenle */}
          <button
            title="Ürünü düzenle"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: c.accentSoft, border: `1px solid ${c.border}`, color: c.accentText, fontFamily: PANEL_BODY_FONT }}
          >
            <Pencil className="w-3.5 h-3.5" /> Düzenle
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Skeleton (table formatında, card değil) ──────────────────────────────────

function SkeletonTable({ c }: { c: PanelPalette }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
      {/* Thead */}
      <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${c.borderSoft}`, background: c.hover }}>
        <div className="grid grid-cols-7 gap-4">
          {["w-16", "w-10", "w-12", "w-10", "w-24", "w-16", "w-8"].map((w, i) => (
            <div key={i} className={`h-2.5 rounded animate-pulse ${w}`} style={{ background: c.border }} />
          ))}
        </div>
      </div>
      {/* Tbody */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="px-5 py-4 flex items-center gap-4"
          style={{ borderBottom: i < 3 ? `1px solid ${c.borderSoft}` : "none" }}
        >
          {/* Ürün */}
          <div className="w-12 h-12 rounded-xl animate-pulse flex-shrink-0" style={{ background: c.hover }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 rounded animate-pulse" style={{ background: c.hover }} />
            <div className="h-2 w-24 rounded animate-pulse" style={{ background: c.hover }} />
          </div>
          {/* Diğer sütunlar */}
          <div className="h-3 w-16 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: c.hover }} />
          <div className="h-3 w-14 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="h-3 w-20 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="h-3 w-16 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="flex gap-1.5">
            <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: c.hover }} />
            <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: c.hover }} />
            <div className="w-20 h-8 rounded-lg animate-pulse" style={{ background: c.hover }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sonuç yok ───────────────────────────────────────────────────────────────

function NoResults({ c, onClear }: { c: PanelPalette; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
      style={{ background: c.cardBg, border: `1px solid ${c.border}` }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: c.hover, border: `1px solid ${c.border}` }}>
        <Search className="w-5 h-5" style={{ color: c.textSubtle }} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
        Eşleşen ürün bulunamadı
      </p>
      <p className="text-xs mb-4" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        Arama veya filtreyi temizlemeyi deneyin
      </p>
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
        style={{ background: c.hover, border: `1px solid ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}
      >
        <X className="w-3.5 h-3.5" /> Filtreyi Temizle
      </button>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ c, onCreate }: { c: PanelPalette; onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      className="rounded-3xl flex flex-col items-center justify-center text-center px-6"
      style={{ background: c.cardBg, border: `1px dashed ${c.border}`, minHeight: "58vh" }}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          <Package className="w-9 h-9 text-white" />
        </div>
        <motion.div
          animate={{ rotate: [0, 12, 0], y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "#7C3AED" }} />
        </motion.div>
      </div>

      {/* Özellik listesi */}
      <div className="flex items-center gap-6 mb-6">
        {[
          { icon: Sparkles, label: "AI içerik", color: "#7C3AED" },
          { icon: TrendingUp, label: "Analitik",  color: "#2563EB" },
          { icon: Globe,     label: "Domain",     color: "#16A34A" },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="text-[11px] font-medium" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{label}</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.8rem", fontWeight: 400, color: c.text, marginBottom: "0.5rem" }}>
        Henüz ürün eklemediniz
      </h2>
      <p className="text-sm max-w-sm leading-relaxed mb-7" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
        Tek fotoğraf yükleyin, yapay zeka saniyeler içinde profesyonel vitrin oluştursun.
      </p>

      <motion.button
        onClick={onCreate}
        whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold"
        style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}
      >
        <Sparkles className="w-4 h-4" /> İlk Vitrinini Oluştur <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
