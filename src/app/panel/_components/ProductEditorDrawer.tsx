"use client";

/**
 * Ürün Düzenle drawer'ı — Shopify standartlarında tam kapsamlı editör:
 * çoklu görsel (drag & drop), stok takibi, varyantlar ve SEO önizlemesi.
 */

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Save, Loader2, Tag, FileText, Power, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/store";
import { PANEL_BODY_FONT, type PanelPalette } from "../_lib/theme";
import ProductImageUploader from "./ProductImageUploader";
import {
  type ProductDraft, productToDraft, draftToPayload, sanitizePriceInput,
  makeInputStyle, makeLabelStyle,
  InventorySection, VariantSection, SeoSection,
} from "./ProductFormSections";

interface Props {
  product: Product | null;
  c: PanelPalette;
  isDark: boolean;
  open: boolean;
  /** Nav editöründeki alt menülerden türeyen kategori seçenekleri */
  categoryOptions?: { label: string; slug: string }[];
  /** SEO önizlemesindeki domain */
  storeDomain?: string | null;
  onClose: () => void;
  onSaved: (productId: string, patch: Partial<Product>) => void;
}

export default function ProductEditorDrawer({
  product, c, isDark, open, categoryOptions = [], storeDomain, onClose, onSaved,
}: Props) {
  const [draft,  setDraft]  = useState<ProductDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const [dirty,  setDirty]  = useState(false);

  useEffect(() => {
    if (product) { setDraft(productToDraft(product)); setDirty(false); setErr(""); }
  }, [product]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const patch = useCallback((p: Partial<ProductDraft>) => {
    setDraft((d) => (d ? { ...d, ...p } : d));
    setDirty(true);
    setErr("");
  }, []);

  const patchImages = useCallback((updater: (prev: string[]) => string[]) => {
    setDraft((d) => (d ? { ...d, images: updater(d.images) } : d));
    setDirty(true);
  }, []);

  if (!product || !draft) return null;

  const isLive = draft.status === "active";

  const handleSave = async () => {
    const priceNum = parseFloat(draft.price.replace(",", "."));
    if (!draft.name.trim()) { setErr("Ürün adı boş olamaz."); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setErr("Geçerli bir fiyat girin."); return; }
    setSaving(true); setErr("");
    const payload = draftToPayload(draft);
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, ...payload }),
    });
    setSaving(false);
    if (!res.ok) {
      setErr("Kaydedilirken hata oluştu.");
      toast.error("Ürün kaydedilemedi — lütfen tekrar deneyin.");
      return;
    }
    onSaved(product.id, payload as Partial<Product>);
    setDirty(false);
    onClose();
  };

  const inp = makeInputStyle(c, isDark);
  const lbl = makeLabelStyle(c);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
            className="fixed inset-0 z-[80]"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} />

          {/* Drawer — slides from right */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed right-0 top-0 bottom-0 z-[81] flex flex-col"
            style={{
              width: "min(560px, 100vw)",
              background: c.appBg,
              borderLeft: `1px solid ${c.border}`,
              boxShadow: "-12px 0 48px rgba(0,0,0,0.22)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${c.border}`, background: c.cardBg }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                  Ürün Düzenle
                </p>
                <p className="text-[11px] mt-0.5 truncate max-w-[300px]"
                  style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  {product.name}
                </p>
              </div>
              <button onClick={onClose} disabled={saving}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: c.hover, border: `1px solid ${c.border}` }}>
                <X className="w-4 h-4" style={{ color: c.textMuted }} />
              </button>
            </div>

            {/* Scroll area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

              {/* Görseller — drag & drop */}
              <div>
                <label style={lbl}>
                  <span className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3 inline" /> Ürün Görselleri</span>
                </label>
                <ProductImageUploader
                  images={draft.images}
                  onImagesChange={patchImages}
                  storeId={product.store_id}
                  c={c} isDark={isDark}
                  onError={(msg) => toast.error(msg)}
                />
              </div>

              {/* Name */}
              <div>
                <label style={lbl}>
                  <span className="flex items-center gap-1.5"><Tag className="w-3 h-3 inline" /> Ürün Adı *</span>
                </label>
                <input value={draft.name} onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Ör: El Yapımı Seramik Kase" style={inp} maxLength={120} />
              </div>

              {/* Price */}
              <div>
                <label style={lbl}>Fiyat *</label>
                <div className="flex gap-2">
                  <div className="flex rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: `1px solid ${c.border}` }}>
                    {(["TRY", "USD"] as const).map((cur) => (
                      <button key={cur} onClick={() => patch({ currency: cur })}
                        className="px-3.5 py-2.5 text-sm font-bold transition-colors"
                        style={{
                          background: draft.currency === cur
                            ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "transparent",
                          color: draft.currency === cur ? "#fff" : c.textMuted,
                          fontFamily: PANEL_BODY_FONT,
                        }}>
                        {cur === "TRY" ? "₺" : "$"}
                      </button>
                    ))}
                  </div>
                  <input value={draft.price} inputMode="decimal"
                    onChange={(e) => patch({ price: sanitizePriceInput(e.target.value) })}
                    placeholder={draft.currency === "TRY" ? "299,90" : "49.99"}
                    style={{ ...inp, flex: 1 }} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>
                  <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 inline" /> Açıklama</span>
                </label>
                <textarea value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Ürünün özelliklerini, hikayesini anlatın…"
                  rows={4} maxLength={500}
                  style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
              </div>

              {/* Kategori — nav editöründeki alt menülerden beslenir */}
              {categoryOptions.length > 0 && (
                <div>
                  <label style={lbl}>Kategori / Alt Menü</label>
                  <select
                    value={draft.category}
                    onChange={(e) => patch({ category: e.target.value })}
                    style={{ ...inp, cursor: "pointer" }}
                  >
                    <option value="">Kategorisiz — yalnızca Tüm Ürünler&apos;de</option>
                    {categoryOptions.map((o) => (
                      <option key={o.slug} value={o.slug}>{o.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] mt-1.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                    Ürün, seçilen alt menünün kategori sayfasında (&quot;/urunler/{draft.category || "…"}&quot;) listelenir.
                  </p>
                </div>
              )}

              {/* Stok Takibi */}
              <InventorySection draft={draft} patch={patch} c={c} isDark={isDark} />

              {/* Varyantlar */}
              <VariantSection draft={draft} patch={patch} c={c} isDark={isDark} />

              {/* SEO */}
              <SeoSection draft={draft} patch={patch} c={c} isDark={isDark} storeDomain={storeDomain} />

              {err && (
                <p className="text-xs px-3 py-2 rounded-lg"
                  style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)", fontFamily: PANEL_BODY_FONT }}>
                  {err}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2.5 px-6 py-4 flex-shrink-0"
              style={{ borderTop: `1px solid ${c.border}`, background: c.cardBg }}>
              {/* Status toggle */}
              <button onClick={() => patch({ status: isLive ? "pending" : "active" })}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0"
                style={{
                  background: isLive ? "rgba(34,197,94,0.12)" : c.hover,
                  border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : c.border}`,
                  color: isLive ? "#16A34A" : c.textMuted,
                  fontFamily: PANEL_BODY_FONT,
                }}>
                <Power className="w-3.5 h-3.5" /> {isLive ? "Yayında" : "Taslak"}
              </button>

              <button onClick={onClose} disabled={saving}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: c.hover, border: `1px solid ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                İptal
              </button>

              <motion.button onClick={handleSave} disabled={saving || !dirty}
                whileHover={{ scale: saving || !dirty ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}>
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor…</>
                  : <><Save className="w-4 h-4" /> Kaydet</>}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
