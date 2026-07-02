"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Package, Pencil,
  Power, Loader2, Search, X, RefreshCw, Trash2, Save,
  Tag, FileText, Store,
} from "lucide-react";
import type { Product } from "@/types/store";
import {
  usePanelTheme, PANEL_DISPLAY_FONT, PANEL_BODY_FONT, type PanelPalette,
} from "../_lib/theme";
import { useActiveStore } from "../_lib/storeContext";
import ProductEditorDrawer from "../_components/ProductEditorDrawer";
import Toast from "@/components/Toast";

type StatusFilter = "all" | "active" | "pending";

// ─── Sayfa ───────────────────────────────────────────────────────────────────

export default function UrunlerPage() {
  const { c, isDark } = usePanelTheme();
  const { activeStore, activeStoreId } = useActiveStore();

  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const productsReady                   = useRef(false);

  const [togglingId,   setTogglingId]   = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [highlightId,  setHighlightId]  = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addOpen,      setAddOpen]      = useState(false);
  const [toastMsg,     setToastMsg]     = useState("");
  const [showToast,    setShowToast]    = useState(false);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const toast = (msg: string) => { setToastMsg(msg); setShowToast(true); };

  // ── Ürünleri çek — aktif mağaza değişince yeniden tetiklenir ──
  const fetchProducts = useCallback(async (sid: string | null, silent = false) => {
    if (!sid) { setProducts([]); setLoading(false); return; }
    if (!silent) {
      if (!productsReady.current) setLoading(true);
      else setRefreshing(true);
    }
    const res = await fetch(`/api/products?storeId=${sid}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json() as Product[];
      setProducts(data);
      productsReady.current = true;
    } else {
      console.error("Products fetch failed:", res.status, await res.text().catch(() => ""));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    productsReady.current = false;
    setProducts([]);
    fetchProducts(activeStoreId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoreId]);

  // ── Status toggle ──
  const handleStatusToggle = useCallback(async (product: Product) => {
    const next = product.status === "active" ? "pending" : "active";
    setTogglingId(product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: next } : p));
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, status: next }),
    });
    if (!res.ok) {
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: product.status } : p));
      toast("Durum güncellenirken hata oluştu.");
    } else {
      toast(next === "active" ? "Ürün yayına alındı ✓" : "Ürün taslağa alındı");
    }
    setTogglingId(null);
  }, []);

  // ── Silme ──
  const handleDelete = useCallback(async (product: Product) => {
    setDeletingId(product.id);
    const res = await fetch(`/api/products?id=${product.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast("Ürün silindi.");
    } else {
      toast("Silerken bir hata oluştu.");
    }
    setDeletingId(null);
  }, []);

  const handleProductCreated = useCallback(async () => {
    await fetchProducts(activeStoreId, true);
    toast("Yeni ürün kataloğa eklendi ✓");
  }, [fetchProducts, activeStoreId]);

  const handleProductSaved = useCallback((productId: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, ...patch } : p));
    setHighlightId(productId);
    toast("Ürün bilgileri güncellendi ✓");
    setTimeout(() => setHighlightId(null), 2600);
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (statusFilter !== "all") list = list.filter((p) => (p.status ?? "active") === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, statusFilter, search]);

  const activeCount = products.filter((p) => (p.status ?? "active") === "active").length;

  // Nav editöründeki alt menüler → ürün kategori seçenekleri.
  // Slug, alt menü URL'inin son segmentidir (/urunler/yeni-urunler → "yeni-urunler").
  const categoryOptions = useMemo(() => {
    const opts: { label: string; slug: string }[] = [];
    for (const link of activeStore?.theme_settings?.nav_links ?? []) {
      for (const child of link.children ?? []) {
        const slug = child.url.split("/").filter(Boolean).pop() ?? "";
        if (slug && slug !== "#" && !opts.some((o) => o.slug === slug)) {
          opts.push({ label: child.label, slug });
        }
      }
    }
    return opts;
  }, [activeStore]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Toast message={toastMsg} show={showToast} onHide={() => setShowToast(false)} />

      {/* Ürün ekleme modalı */}
      <AddProductModal
        open={addOpen}
        c={c}
        isDark={isDark}
        storeId={activeStoreId}
        categoryOptions={categoryOptions}
        onClose={() => setAddOpen(false)}
        onCreated={handleProductCreated}
      />

      {/* Ürün düzenleme drawer */}
      <ProductEditorDrawer
        product={editingProduct}
        c={c}
        isDark={isDark}
        open={!!editingProduct}
        categoryOptions={categoryOptions}
        onClose={() => setEditingProduct(null)}
        onSaved={handleProductSaved}
      />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h1 style={{
                fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text,
              }}>
                Ürün Kataloğu
              </h1>
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
              {loading && !productsReady.current
                ? "Yükleniyor…"
                : activeStore
                  ? `${products.length} ürün · ${activeCount} yayında · ${activeStore.store_name}`
                  : "Bir mağaza seçin"}
            </p>
          </div>

          {/* Aktif mağaza chip */}
          {activeStore && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl self-start flex-shrink-0"
              style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <span className="w-2 h-2 rounded-full" style={{
                background: activeStore.status === "active" ? "#22C55E" : "#F59E0B"
              }} />
              <span className="text-xs font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                {activeStore.store_name}
              </span>
              {activeStore.custom_domain && (
                <span className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  · {activeStore.custom_domain}
                </span>
              )}
            </div>
          )}

          <motion.button
            onClick={() => setAddOpen(true)}
            disabled={!activeStoreId}
            whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 disabled:opacity-40"
            style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}
          >
            <Plus className="w-4 h-4" /> Ürün Ekle
          </motion.button>
        </div>
      </motion.div>

      {/* No active store notice */}
      {!activeStoreId && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
          style={{ background: c.cardBg, border: `1px dashed ${c.border}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            <Store className="w-6 h-6" style={{ color: c.textSubtle }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
            Mağaza seçilmedi
          </p>
          <p className="text-xs max-w-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            Sol üstteki mağaza seçiciden bir mağaza seçin.
          </p>
        </motion.div>
      )}

      {/* ── Toolbar ── */}
      {activeStoreId && (!loading || productsReady.current) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: c.textSubtle }} />
            <input type="text" placeholder="Ürün ara…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-sm outline-none"
              style={{ background: c.hover, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded">
                <X className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
              </button>
            )}
          </div>
          <div className="flex rounded-xl p-1 gap-1" style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            {([["all","Tümü"],["active","Yayında"],["pending","Taslak"]] as [StatusFilter,string][]).map(([key, label]) => {
              const active = statusFilter === key;
              return (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className="relative px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ color: active ? c.text : c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  {active && (
                    <motion.span layoutId="status-pill" className="absolute inset-0 rounded-lg"
                      style={{ background: c.cardBg, boxShadow: c.shadow }}
                      transition={{ type: "spring", stiffness: 440, damping: 36 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {key === "active" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />}
                    {key === "pending" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />}
                    {label}
                    {key !== "all" && (
                      <span className="text-[10px] opacity-70">
                        ({products.filter((p) => (p.status ?? "active") === key).length})
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
      {activeStoreId && (
        <>
          {loading && !productsReady.current ? (
            <SkeletonTable c={c} />
          ) : products.length === 0 ? (
            <EmptyState c={c} onCreate={() => setAddOpen(true)} />
          ) : filtered.length === 0 ? (
            <NoResults c={c} onClear={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <ProductTable
              products={filtered} c={c} isDark={isDark}
              togglingId={togglingId} deletingId={deletingId} highlightId={highlightId}
              onEdit={setEditingProduct}
              onStatusToggle={handleStatusToggle}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Ürün Ekleme Modalı ───────────────────────────────────────────────────────

type AddDraft = {
  name:        string;
  price:       string;
  currency:    "TRY" | "USD";
  description: string;
  status:      "active" | "pending";
  category:    string; // nav alt menü slug'ı — "" → kategorisiz
};

function AddProductModal({
  open, c, isDark, storeId, categoryOptions, onClose, onCreated,
}: {
  open: boolean; c: PanelPalette; isDark: boolean;
  storeId: string | null;
  categoryOptions: { label: string; slug: string }[];
  onClose: () => void; onCreated: () => void;
}) {
  const BLANK: AddDraft = { name: "", price: "", currency: "TRY", description: "", status: "active", category: "" };
  const [draft,  setDraft]  = useState<AddDraft>(BLANK);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!open) { setDraft(BLANK); setErr(""); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const p = (patch: Partial<AddDraft>) => { setDraft((d) => ({ ...d, ...patch })); setErr(""); };

  const handleSave = async () => {
    if (!storeId) { setErr("Önce bir mağaza seçin."); return; }
    if (!draft.name.trim()) { setErr("Ürün adı zorunludur."); return; }
    const priceNum = parseFloat(draft.price.replace(",", "."));
    if (isNaN(priceNum) || priceNum <= 0) { setErr("Geçerli bir fiyat girin."); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_id:    storeId,
        name:        draft.name.trim(),
        price:       priceNum,
        currency:    draft.currency,
        description: draft.description.trim() || null,
        status:      draft.status,
        category:    draft.category || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { setErr("Kaydedilirken hata oluştu."); return; }
    onCreated();
    onClose();
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 11, fontSize: 14,
    background: isDark ? "#111" : "#F9F9F9",
    border: `1px solid ${c.border}`, color: c.text,
    outline: "none", fontFamily: PANEL_BODY_FONT,
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
    color: c.textSubtle, fontFamily: PANEL_BODY_FONT, marginBottom: 6, display: "block",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[90]"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-0 z-[91] flex items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
              style={{ background: c.appBg, border: `1px solid ${c.border}`, boxShadow: c.shadowMd, pointerEvents: "all", maxHeight: "90vh" }}
            >
              {/* Başlık */}
              <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: `1px solid ${c.border}`, background: c.cardBg }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Yeni Ürün Ekle</p>
                    <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                      Mağazanıza yeni bir ürün kaydedin
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: c.hover, border: `1px solid ${c.border}` }}>
                  <X className="w-4 h-4" style={{ color: c.textMuted }} />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

                {/* Ürün Adı */}
                <div>
                  <label style={lbl}><span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 inline" /> Ürün Adı *</span></label>
                  <input value={draft.name} onChange={(e) => p({ name: e.target.value })}
                    placeholder="Ör: El Yapımı Seramik Kase" style={inp} maxLength={120} autoFocus />
                </div>

                {/* Fiyat */}
                <div>
                  <label style={lbl}>Fiyat *</label>
                  <div className="flex gap-2">
                    <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1px solid ${c.border}` }}>
                      {(["TRY", "USD"] as const).map((cur) => (
                        <button key={cur} onClick={() => p({ currency: cur })}
                          className="px-3.5 py-2.5 text-sm font-bold transition-colors"
                          style={{
                            background: draft.currency === cur ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "transparent",
                            color: draft.currency === cur ? "#fff" : c.textMuted,
                            fontFamily: PANEL_BODY_FONT,
                          }}>
                          {cur === "TRY" ? "₺ TRY" : "$ USD"}
                        </button>
                      ))}
                    </div>
                    <input value={draft.price} inputMode="decimal" onChange={(e) => p({ price: e.target.value })}
                      placeholder={draft.currency === "TRY" ? "299,90" : "49.99"}
                      style={{ ...inp, flex: 1 }} />
                  </div>
                </div>

                {/* Açıklama */}
                <div>
                  <label style={lbl}><span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 inline" /> Ürün Açıklaması</span></label>
                  <textarea value={draft.description} onChange={(e) => p({ description: e.target.value })}
                    placeholder="Ürünün özelliklerini, hikayesini kısaca anlatın…"
                    rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} maxLength={500} />
                </div>

                {/* Kategori — nav editöründeki alt menülerden beslenir */}
                {categoryOptions.length > 0 && (
                  <div>
                    <label style={lbl}>Kategori / Alt Menü</label>
                    <select
                      value={draft.category}
                      onChange={(e) => p({ category: e.target.value })}
                      style={{ ...inp, cursor: "pointer" }}
                    >
                      <option value="">Kategorisiz — yalnızca Tüm Ürünler&apos;de</option>
                      {categoryOptions.map((o) => (
                        <option key={o.slug} value={o.slug}>{o.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] mt-1.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                      Ürün, seçilen alt menünün kategori sayfasında listelenir.
                    </p>
                  </div>
                )}

                {err && <p className="text-xs" style={{ color: "#EF4444", fontFamily: PANEL_BODY_FONT }}>{err}</p>}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2.5 px-5 py-4 flex-shrink-0"
                style={{ borderTop: `1px solid ${c.border}`, background: c.cardBg }}>
                {/* Yayın toggle */}
                <button onClick={() => p({ status: draft.status === "active" ? "pending" : "active" })}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0"
                  style={{
                    background: draft.status === "active" ? "rgba(34,197,94,0.12)" : c.hover,
                    border: `1px solid ${draft.status === "active" ? "rgba(34,197,94,0.3)" : c.border}`,
                    color: draft.status === "active" ? "#16A34A" : c.textMuted,
                    fontFamily: PANEL_BODY_FONT,
                  }}>
                  <Power className="w-3.5 h-3.5" /> {draft.status === "active" ? "Yayında" : "Taslak"}
                </button>

                <button onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: c.hover, border: `1px solid ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                  İptal
                </button>

                <motion.button onClick={handleSave} disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Ekleniyor…</> : <><Save className="w-4 h-4" /> Ürünü Ekle</>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Ürün Tablosu ─────────────────────────────────────────────────────────────

function ProductTable({
  products, c, isDark, togglingId, deletingId, highlightId, onEdit, onStatusToggle, onDelete,
}: {
  products: Product[]; c: PanelPalette; isDark: boolean;
  togglingId: string | null; deletingId: string | null; highlightId: string | null;
  onEdit: (p: Product) => void;
  onStatusToggle: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
              {["Ürün", "Fiyat", "Durum", "Eklenme", ""].map((h, i) => (
                <th key={i} className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT, background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.018)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => (
              <ProductRow key={product.id} product={product} isLast={i === products.length - 1}
                c={c} isDark={isDark}
                toggling={togglingId === product.id}
                deleting={deletingId === product.id}
                highlight={highlightId === product.id}
                onEdit={() => onEdit(product)}
                onStatusToggle={() => onStatusToggle(product)}
                onDelete={() => onDelete(product)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
        <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
          {products.length} ürün listeleniyor
        </p>
      </div>
    </motion.div>
  );
}

// ─── Ürün Satırı ──────────────────────────────────────────────────────────────

function ProductRow({
  product, isLast, c, isDark, toggling, deleting, highlight,
  onEdit, onStatusToggle, onDelete,
}: {
  product: Product; isLast: boolean; c: PanelPalette; isDark: boolean;
  toggling: boolean; deleting: boolean; highlight: boolean;
  onEdit: () => void; onStatusToggle: () => void; onDelete: () => void;
}) {
  const [hovered,       setHovered]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isLive = (product.status ?? "active") === "active";
  const cur    = product.currency === "USD" ? "$" : "₺";
  const price  = typeof product.price === "number" ? product.price : 0;

  const rowBg = highlight
    ? isDark ? "rgba(168,85,247,0.07)" : "#FAF5FF"
    : hovered ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.018)")
    : "transparent";

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
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
      {/* Ürün */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
            style={{ background: isDark ? "#111" : "#F4F4F2", border: `1px solid ${c.border}` }}>
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name}
                className="w-full h-full object-contain p-1.5"
                style={{ filter: isLive ? "none" : "grayscale(0.4)" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5" style={{ color: c.textSubtle }} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate max-w-[220px] leading-tight"
              style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
              {product.name}
            </p>
            {product.description && (
              <p className="text-[11px] truncate max-w-[220px] mt-0.5"
                style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                {product.description}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Fiyat */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-sm font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
          {price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {cur}
        </span>
      </td>

      {/* Durum */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{
            background: isLive ? "rgba(34,197,94,0.12)"   : "rgba(245,158,11,0.12)",
            color:      isLive ? "#16A34A"                : "#B45309",
            border:     `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
          }}>
          <motion.span animate={isLive ? { scale: [1,1.4,1] } : {}} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ background: isLive ? "#22C55E" : "#F59E0B" }} />
          {isLive ? "Yayında" : "Taslak"}
        </span>
      </td>

      {/* Tarih */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
          {new Date(product.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </td>

      {/* Aksiyonlar */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5 justify-end"
          style={{ opacity: hovered ? 1 : 0.4, transition: "opacity 0.15s" }}
          onClick={(e) => e.stopPropagation()}>

          <button title={isLive ? "Taslağa al" : "Yayına al"}
            onClick={() => { if (!toggling) onStatusToggle(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: isLive ? "rgba(34,197,94,0.1)" : c.hover, border: `1px solid ${isLive ? "rgba(34,197,94,0.25)" : c.border}` }}>
            {toggling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: c.textMuted }} />
              : <Power className="w-3.5 h-3.5" style={{ color: isLive ? "#16A34A" : c.textSubtle }} />}
          </button>

          {/* Sil — onay adımı */}
          {!confirmDelete ? (
            <button title="Ürünü sil" onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.hover, border: `1px solid ${c.border}` }}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                style={{ background: "#EF4444", color: "white", fontFamily: PANEL_BODY_FONT }}>
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sil"}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: PANEL_BODY_FONT }}>
                İptal
              </button>
            </div>
          )}

          {/* Düzenle */}
          <button title="Ürünü düzenle" onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: c.accentSoft ?? "rgba(124,58,237,0.1)", border: `1px solid ${c.border}`, color: c.accentText ?? "#7C3AED", fontFamily: PANEL_BODY_FONT }}>
            <Pencil className="w-3.5 h-3.5" /> Düzenle
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonTable({ c }: { c: PanelPalette }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
      <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${c.borderSoft}`, background: c.hover }}>
        <div className="flex gap-6">{[80,50,70,60,80].map((w, i) => (
          <div key={i} className="h-2.5 rounded animate-pulse" style={{ width: w, background: c.border }} />
        ))}</div>
      </div>
      {[0,1,2,3].map((i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-4"
          style={{ borderBottom: i < 3 ? `1px solid ${c.borderSoft}` : "none" }}>
          <div className="w-12 h-12 rounded-xl animate-pulse flex-shrink-0" style={{ background: c.hover }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-36 rounded animate-pulse" style={{ background: c.hover }} />
            <div className="h-2 w-20 rounded animate-pulse" style={{ background: c.hover }} />
          </div>
          <div className="h-3 w-16 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: c.hover }} />
          <div className="h-3 w-20 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="flex gap-1.5 ml-auto">
            {[0,1,2].map(j => <div key={j} className="w-8 h-8 rounded-lg animate-pulse" style={{ background: c.hover }} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sonuç yok ────────────────────────────────────────────────────────────────

function NoResults({ c, onClear }: { c: PanelPalette; onClear: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
      style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: c.hover, border: `1px solid ${c.border}` }}>
        <Search className="w-5 h-5" style={{ color: c.textSubtle }} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Eşleşen ürün bulunamadı</p>
      <p className="text-xs mb-4" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Arama veya filtreyi temizlemeyi deneyin</p>
      <button onClick={onClear} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
        style={{ background: c.hover, border: `1px solid ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
        <X className="w-3.5 h-3.5" /> Filtreyi Temizle
      </button>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ c, onCreate }: { c: PanelPalette; onCreate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      className="rounded-3xl flex flex-col items-center justify-center text-center px-6"
      style={{ background: c.cardBg, border: `1px dashed ${c.border}`, minHeight: "55vh" }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
        <Package className="w-9 h-9 text-white" />
      </div>
      <h2 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.8rem", fontWeight: 400, color: c.text, marginBottom: "0.5rem" }}>
        Henüz ürün yok
      </h2>
      <p className="text-sm max-w-sm leading-relaxed mb-7" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
        Bu mağazaya ilk ürününüzü ekleyin. Görsel, fiyat ve açıklama bilgilerini dilediğiniz zaman güncelleyebilirsiniz.
      </p>
      <motion.button onClick={onCreate} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold"
        style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "#FFFFFF", boxShadow: "0 8px 30px rgba(124,58,237,0.4)", fontFamily: PANEL_BODY_FONT }}>
        <Plus className="w-4 h-4" /> İlk Ürünü Ekle
      </motion.button>
    </motion.div>
  );
}
