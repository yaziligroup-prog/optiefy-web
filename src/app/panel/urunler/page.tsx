"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ExternalLink, CheckCheck, Package, Globe, Pencil,
  Power, Loader2, Eye, Search, X, RefreshCw, Trash2, Save,
  Tag, FileText, ListChecks,
} from "lucide-react";
import { THEMES, type ThemeId } from "@/types/theme";
import type { Store } from "@/types/store";
import {
  usePanelTheme, PANEL_DISPLAY_FONT, PANEL_BODY_FONT, type PanelPalette,
} from "../_lib/theme";
import ProductEditorDrawer from "../_components/ProductEditorDrawer";
import Toast from "@/components/Toast";

type StatusFilter = "all" | "active" | "pending";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Sayfa ───────────────────────────────────────────────────────────────────

export default function UrunlerPage() {
  const { c, isDark } = usePanelTheme();

  const [stores,       setStores]       = useState<Store[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const storesReady                     = useRef(false);

  const [togglingId,   setTogglingId]   = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [copiedId,     setCopiedId]     = useState<string | null>(null);
  const [toastMsg,     setToastMsg]     = useState("");
  const [showToast,    setShowToast]    = useState(false);
  const [addOpen,      setAddOpen]      = useState(false);
  const [highlightId,  setHighlightId]  = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ── Fetch via API route (RLS bypass ile güvenli) ──
  const fetchStores = useCallback(async (silent = false) => {
    if (!silent) {
      if (!storesReady.current) setLoading(true);
      else setRefreshing(true);
    }
    try {
      const res = await fetch("/api/stores", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as Store[];
        setStores(data);
        storesReady.current = true;
      }
    } catch { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  // ── Yayın durumu toggle ──
  const handleStatusToggle = useCallback(async (store: Store) => {
    const next = store.status === "active" ? "pending" : "active";
    setTogglingId(store.id);
    setStores((prev) => prev.map((s) => s.id === store.id ? { ...s, status: next } : s));
    const res = await fetch("/api/stores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: store.id, status: next }),
    });
    if (!res.ok) {
      setStores((prev) => prev.map((s) => s.id === store.id ? { ...s, status: store.status } : s));
      setToastMsg("Durum güncellenirken hata oluştu.");
    } else {
      setToastMsg(next === "active" ? "Ürün yayına alındı ✓" : "Ürün taslağa alındı");
    }
    setShowToast(true);
    setTogglingId(null);
  }, []);

  // ── Silme ──
  const handleDelete = useCallback(async (store: Store) => {
    setDeletingId(store.id);
    const res = await fetch(`/api/stores?id=${store.id}`, { method: "DELETE" });
    if (res.ok) {
      setStores((prev) => prev.filter((s) => s.id !== store.id));
      setToastMsg("Ürün silindi.");
    } else {
      setToastMsg("Silerken bir hata oluştu.");
    }
    setShowToast(true);
    setDeletingId(null);
  }, []);

  const handleCopy = useCallback((store: Store) => {
    const slug = slugify(store.store_name);
    const url = store.custom_domain ?? `optiefy.com/${slug}`;
    navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    setCopiedId(store.id);
    setToastMsg("Mağaza linki kopyalandı ✓");
    setShowToast(true);
    setTimeout(() => setCopiedId(null), 2200);
  }, []);

  const handleProductCreated = useCallback(async (storeId: string) => {
    await fetchStores(true);
    setHighlightId(storeId);
    setToastMsg("Yeni ürün kataloğa eklendi ✓");
    setShowToast(true);
    setTimeout(() => setHighlightId(null), 2600);
  }, [fetchStores]);

  const handleProductSaved = useCallback((storeId: string, patch: Partial<Store>) => {
    setStores((prev) => prev.map((s) => s.id === storeId ? { ...s, ...patch } : s));
    setToastMsg("Ürün bilgileri güncellendi ✓");
    setShowToast(true);
  }, []);

  const filtered = useMemo(() => {
    let list = stores;
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
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

      {/* Manuel ürün ekleme modalı */}
      <AddProductModal
        open={addOpen}
        c={c}
        onClose={() => setAddOpen(false)}
        onCreated={handleProductCreated}
      />

      {/* Ürün düzenleme drawer */}
      <ProductEditorDrawer
        store={editingStore}
        c={c}
        isDark={isDark}
        open={!!editingStore}
        onClose={() => setEditingStore(null)}
        onSaved={handleProductSaved}
      />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 style={{
                fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
                fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text,
              }}>
                Ürünler
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
              {loading && !storesReady.current
                ? "Ürünler yükleniyor…"
                : `${stores.length} ürün · ${activeCount} yayında`}
            </p>
          </div>

          <motion.button
            onClick={() => setAddOpen(true)}
            whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}
          >
            <Plus className="w-4 h-4" /> Ürün Ekle
          </motion.button>
        </div>
      </motion.div>

      {/* ── Toolbar ── */}
      {(!loading || storesReady.current) && (
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
                      <span className="text-[10px] opacity-70">({stores.filter((s) => s.status === key).length})</span>
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
        <EmptyState c={c} onCreate={() => setAddOpen(true)} />
      ) : filtered.length === 0 ? (
        <NoResults c={c} onClear={() => { setSearch(""); setStatusFilter("all"); }} />
      ) : (
        <ProductTable
          stores={filtered} c={c} isDark={isDark}
          togglingId={togglingId} deletingId={deletingId} copiedId={copiedId} highlightId={highlightId}
          onEdit={setEditingStore} onStatusToggle={handleStatusToggle} onDelete={handleDelete} onCopy={handleCopy}
        />
      )}
    </div>
  );
}

// ─── Manuel Ürün Ekleme Modalı ────────────────────────────────────────────────

type AddDraft = {
  store_name: string; seo_title: string; price: string; currency: "TRY" | "USD";
  theme: ThemeId; description: string; features: string[]; status: "active" | "pending";
};

function AddProductModal({
  open, c, onClose, onCreated,
}: {
  open: boolean; c: PanelPalette;
  onClose: () => void; onCreated: (id: string) => void;
}) {
  const BLANK: AddDraft = {
    store_name: "", seo_title: "", price: "", currency: "TRY",
    theme: "artisan", description: "", features: [""], status: "pending",
  };
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
    if (!draft.store_name.trim()) { setErr("Ürün / mağaza adı zorunludur."); return; }
    const priceNum = parseFloat(draft.price.replace(",", "."));
    if (isNaN(priceNum) || priceNum <= 0) { setErr("Geçerli bir fiyat girin."); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/stores", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_name:    draft.store_name.trim(),
        seo_title:     draft.seo_title.trim() || null,
        product_price: priceNum,
        currency:      draft.currency,
        theme:         draft.theme,
        description:   draft.description.trim() || null,
        features:      draft.features.map((f) => f.trim()).filter(Boolean),
        status:        draft.status,
      }),
    });
    setSaving(false);
    if (!res.ok) { setErr("Kaydedilirken hata oluştu."); return; }
    const created = await res.json() as Store;
    onCreated(created.id);
    onClose();
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 11, fontSize: 14,
    background: c.inputBg, border: `1px solid ${c.border}`, color: c.text,
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
                    <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Ürün bilgilerini girin, hemen kataloğa ekleyin</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: c.hover, border: `1px solid ${c.border}` }}>
                  <X className="w-4 h-4" style={{ color: c.textMuted }} />
                </button>
              </div>

              {/* Form */}
              <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

                {/* Ad */}
                <div>
                  <label style={lbl}><span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 inline" /> Ürün / Mağaza Adı *</span></label>
                  <input value={draft.store_name} onChange={(e) => p({ store_name: e.target.value })}
                    placeholder="Ör: El Yapımı Desenli Metal Kase" style={inp} maxLength={80} />
                </div>

                {/* SEO Başlık */}
                <div>
                  <label style={lbl}><span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 inline" /> Ürün Başlığı (SEO)</span></label>
                  <input value={draft.seo_title} onChange={(e) => p({ seo_title: e.target.value })}
                    placeholder="Vitrinde ve arama motorlarında görünecek başlık" style={inp} maxLength={70} />
                </div>

                {/* Fiyat */}
                <div>
                  <label style={lbl}>Fiyat *</label>
                  <div className="flex gap-2">
                    <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1px solid ${c.border}` }}>
                      {(["TRY", "USD"] as const).map((cur) => (
                        <button key={cur} onClick={() => p({ currency: cur })}
                          className="px-3.5 py-2.5 text-sm font-bold"
                          style={{ background: draft.currency === cur ? c.ctaBg : "transparent", color: draft.currency === cur ? c.ctaText : c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                          {cur === "TRY" ? "₺ TRY" : "$ USD"}
                        </button>
                      ))}
                    </div>
                    <input value={draft.price} inputMode="decimal" onChange={(e) => p({ price: e.target.value })}
                      placeholder="299,90" style={{ ...inp, flex: 1 }} />
                  </div>
                </div>

                {/* Tema */}
                <div>
                  <label style={lbl}>Mağaza Tasarımı (Tema)</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
                      const th = THEMES[tid];
                      const sel = draft.theme === tid;
                      return (
                        <button key={tid} onClick={() => p({ theme: tid })}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: sel ? `${th.accentColor}18` : c.hover,
                            border: sel ? `2px solid ${th.accentColor}` : `1px solid ${c.border}`,
                            color: sel ? th.accentColor : c.textMuted,
                            fontFamily: PANEL_BODY_FONT,
                          }}>
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: th.accentColor }} />
                          {th.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Açıklama */}
                <div>
                  <label style={lbl}><span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 inline" /> Ürün Açıklaması</span></label>
                  <textarea value={draft.description} onChange={(e) => p({ description: e.target.value })}
                    placeholder="Ürünün hikayesi, özellikleri ve değer önerisi…"
                    rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} maxLength={320} />
                </div>

                {/* Özellikler */}
                <div>
                  <label style={lbl}><span className="flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 inline" /> Özellikler</span></label>
                  <div className="space-y-2">
                    {draft.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.accentText }} />
                        <input value={f}
                          onChange={(e) => { const next = [...draft.features]; next[i] = e.target.value; p({ features: next }); }}
                          placeholder={`Özellik ${i + 1}`} style={{ ...inp, padding: "8px 12px" }} />
                        <button onClick={() => p({ features: draft.features.filter((_, idx) => idx !== i) })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: c.hover, border: `1px solid ${c.border}` }}>
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    ))}
                    {draft.features.length < 6 && (
                      <button onClick={() => p({ features: [...draft.features, ""] })}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg w-full justify-center"
                        style={{ background: c.hover, border: `1px dashed ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                        <Plus className="w-3.5 h-3.5" /> Özellik Ekle
                      </button>
                    )}
                  </div>
                </div>

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
                    color: draft.status === "active" ? "#16A34A" : c.textMuted, fontFamily: PANEL_BODY_FONT,
                  }}>
                  <Power className="w-3.5 h-3.5" /> {draft.status === "active" ? "Yayında" : "Taslak"}
                </button>

                <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold"
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

// ─── Shopify Ürün Tablosu ─────────────────────────────────────────────────────

function ProductTable({
  stores, c, isDark, togglingId, deletingId, copiedId, highlightId, onEdit, onStatusToggle, onDelete, onCopy,
}: {
  stores: Store[]; c: PanelPalette; isDark: boolean;
  togglingId: string | null; deletingId: string | null; copiedId: string | null; highlightId: string | null;
  onEdit: (s: Store) => void; onStatusToggle: (s: Store) => void;
  onDelete: (s: Store) => void; onCopy: (s: Store) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
              {["Ürün", "Fiyat", "Stok Durumu", "Tema", "Domain", "Tarih", ""].map((h, i) => (
                <th key={i} className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT, background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.018)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map((store, i) => (
              <ProductRow key={store.id} store={store} isLast={i === stores.length - 1}
                c={c} isDark={isDark} toggling={togglingId === store.id} deleting={deletingId === store.id}
                copied={copiedId === store.id} highlight={highlightId === store.id}
                onEdit={() => onEdit(store)} onStatusToggle={() => onStatusToggle(store)}
                onDelete={() => onDelete(store)} onCopy={() => onCopy(store)} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
        <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{stores.length} ürün listeleniyor</p>
      </div>
    </motion.div>
  );
}

// ─── Satır ────────────────────────────────────────────────────────────────────

function ProductRow({
  store, isLast, c, isDark, toggling, deleting, copied, highlight, onEdit, onStatusToggle, onDelete, onCopy,
}: {
  store: Store; isLast: boolean; c: PanelPalette; isDark: boolean;
  toggling: boolean; deleting: boolean; copied: boolean; highlight: boolean;
  onEdit: () => void; onStatusToggle: () => void; onDelete: () => void; onCopy: () => void;
}) {
  const [hovered,       setHovered]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const img    = store.image_urls?.[0];
  const isLive = store.status === "active";
  const theme  = (store.theme ?? "modern") as ThemeId;
  const cur    = store.currency === "USD" ? "$" : "₺";
  const slug   = slugify(store.store_name);
  const domain = store.custom_domain ?? `optiefy.com/${slug}`;
  const price  = typeof store.product_price === "number" ? store.product_price : 0;

  const rowBg = highlight
    ? isDark ? "rgba(168,85,247,0.07)" : "#FAF5FF"
    : hovered ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.018)")
    : "transparent";

  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      onClick={onEdit} className="cursor-pointer"
      style={{ borderBottom: isLast ? "none" : `1px solid ${c.borderSoft}`, background: rowBg, transition: "background 0.15s", outline: highlight ? `2px solid rgba(168,85,247,0.4)` : "none", outlineOffset: "-2px" }}>

      {/* Ürün */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative"
            style={{ background: isDark ? "#111" : "#F4F4F2", border: `1px solid ${c.border}` }}>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={store.store_name} className="w-full h-full object-contain p-1.5"
                style={{ filter: isLive ? "none" : "grayscale(0.4)" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-5 h-5" style={{ color: c.textSubtle }} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate max-w-[200px] leading-tight" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
              {store.seo_title ?? store.store_name}
            </p>
            <p className="text-[11px] truncate max-w-[200px] mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {store.store_name}
            </p>
          </div>
        </div>
      </td>

      {/* Fiyat */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-sm font-bold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
          {price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {cur}
        </span>
      </td>

      {/* Stok Durumu */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{
            background: isLive ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
            color:      isLive ? "#16A34A"              : "#B45309",
            border:     `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
          }}>
          <motion.span animate={isLive ? { scale: [1,1.4,1] } : {}} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ background: isLive ? "#22C55E" : "#F59E0B" }} />
          {isLive ? "Yayında" : "Taslak"}
        </span>
      </td>

      {/* Tema */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: THEMES[theme].accentColor }} />
          {THEMES[theme].shortName}
        </span>
      </td>

      {/* Domain */}
      <td className="px-5 py-3.5 whitespace-nowrap max-w-[180px]">
        {store.custom_domain ? (
          <a href={`https://${store.custom_domain}`} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-mono hover:underline" style={{ color: "#16A34A" }}>
            <Globe className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[130px]">{store.custom_domain}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-xs font-mono truncate block max-w-[160px]" style={{ color: c.textSubtle }}>{domain}</span>
        )}
      </td>

      {/* Tarih */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
          {new Date(store.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </td>

      {/* Aksiyonlar */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5 justify-end" style={{ opacity: hovered ? 1 : 0.4, transition: "opacity 0.15s" }}>
          <Link href={`/panel/${store.id}`} title="Önizle" onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.hover, border: `1px solid ${c.border}` }}>
            <Eye className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
          </Link>

          <button title="Linki kopyala" onClick={(e) => { e.stopPropagation(); onCopy(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: copied ? "rgba(34,197,94,0.1)" : c.hover, border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : c.border}` }}>
            <CheckCheck className="w-3.5 h-3.5" style={{ color: copied ? "#16A34A" : c.textMuted }} />
          </button>

          <button title={isLive ? "Taslağa al" : "Yayına al"}
            onClick={(e) => { e.stopPropagation(); if (!toggling) onStatusToggle(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: isLive ? "rgba(34,197,94,0.1)" : c.hover, border: `1px solid ${isLive ? "rgba(34,197,94,0.25)" : c.border}` }}>
            {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: c.textMuted }} />
              : <Power className="w-3.5 h-3.5" style={{ color: isLive ? "#16A34A" : c.textSubtle }} />}
          </button>

          {/* Sil — onay adımı */}
          {!confirmDelete ? (
            <button title="Ürünü sil" onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.hover, border: `1px solid ${c.border}` }}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
            </button>
          ) : (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                style={{ background: "#EF4444", color: "white", fontFamily: PANEL_BODY_FONT }}>
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sil"}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: PANEL_BODY_FONT }}>İptal</button>
            </div>
          )}

          {/* Düzenle */}
          <button title="Ürünü düzenle" onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: c.accentSoft, border: `1px solid ${c.border}`, color: c.accentText, fontFamily: PANEL_BODY_FONT }}>
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
        <div className="flex gap-6">{[80,50,70,50,100,70].map((w,i)=>(
          <div key={i} className="h-2.5 rounded animate-pulse" style={{ width: w, background: c.border }} />
        ))}</div>
      </div>
      {[0,1,2,3].map((i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-4"
          style={{ borderBottom: i<3 ? `1px solid ${c.borderSoft}` : "none" }}>
          <div className="w-12 h-12 rounded-xl animate-pulse flex-shrink-0" style={{ background: c.hover }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-36 rounded animate-pulse" style={{ background: c.hover }} />
            <div className="h-2 w-20 rounded animate-pulse" style={{ background: c.hover }} />
          </div>
          <div className="h-3 w-16 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: c.hover }} />
          <div className="h-3 w-14 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="h-3 w-20 rounded animate-pulse" style={{ background: c.hover }} />
          <div className="flex gap-1.5 ml-auto">
            {[0,1,2,3].map(j=><div key={j} className="w-8 h-8 rounded-lg animate-pulse" style={{ background: c.hover }} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sonuç yok ───────────────────────────────────────────────────────────────

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
        İlk ürününüzü ekleyin ve mağazanızı yayına alın. Görseller, açıklamalar ve fiyat bilgilerini dilediğiniz zaman güncelleyebilirsiniz.
      </p>
      <motion.button onClick={onCreate} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold"
        style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}>
        <Plus className="w-4 h-4" /> İlk Ürünü Ekle
      </motion.button>
    </motion.div>
  );
}
