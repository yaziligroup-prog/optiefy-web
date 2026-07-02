"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Save, Loader2, Tag, FileText, Power, Image as ImageIcon,
} from "lucide-react";
import type { Product } from "@/types/store";
import { PANEL_BODY_FONT, type PanelPalette } from "../_lib/theme";

interface Props {
  product: Product | null;
  c: PanelPalette;
  isDark: boolean;
  open: boolean;
  /** Nav editöründeki alt menülerden türeyen kategori seçenekleri */
  categoryOptions?: { label: string; slug: string }[];
  onClose: () => void;
  onSaved: (productId: string, patch: Partial<Product>) => void;
}

type Draft = {
  name:        string;
  price:       string;
  currency:    "TRY" | "USD";
  description: string;
  status:      "active" | "pending";
  category:    string; // nav alt menü slug'ı — "" → kategorisiz
};

function productToDraft(p: Product): Draft {
  return {
    name:        p.name ?? "",
    price:       String(p.price ?? ""),
    currency:    p.currency === "USD" ? "USD" : "TRY",
    description: p.description ?? "",
    status:      p.status === "active" ? "active" : "pending",
    category:    p.category ?? "",
  };
}

export default function ProductEditorDrawer({ product, c, isDark, open, categoryOptions = [], onClose, onSaved }: Props) {
  const [draft,  setDraft]  = useState<Draft | null>(null);
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

  if (!product || !draft) return null;

  const patch = (p: Partial<Draft>) => { setDraft((d) => d ? { ...d, ...p } : d); setDirty(true); setErr(""); };

  const isLive = draft.status === "active";

  const handleSave = async () => {
    const priceNum = parseFloat(draft.price.replace(",", "."));
    if (!draft.name.trim()) { setErr("Ürün adı boş olamaz."); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setErr("Geçerli bir fiyat girin."); return; }
    setSaving(true); setErr("");
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id:          product.id,
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
    onSaved(product.id, {
      name:        draft.name.trim(),
      price:       priceNum,
      currency:    draft.currency,
      description: draft.description.trim() || null,
      status:      draft.status,
      category:    draft.category || null,
    });
    setDirty(false);
    onClose();
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: 11, fontSize: 14,
    background: c.inputBg ?? (isDark ? "#111" : "#F9F9F9"),
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
              width: "min(520px, 100vw)",
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

              {/* Image preview (read-only) */}
              {product.image_url && (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: isDark ? "#111" : "#F4F4F2", border: `1px solid ${c.border}`, height: 200 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image_url} alt={product.name}
                    className="w-full h-full object-contain p-4" />
                </div>
              )}
              {!product.image_url && (
                <div className="rounded-2xl flex items-center justify-center gap-2"
                  style={{ background: isDark ? "#111" : "#F4F4F2", border: `1px dashed ${c.border}`, height: 100 }}>
                  <ImageIcon className="w-5 h-5" style={{ color: c.textSubtle }} />
                  <span className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Görsel yok</span>
                </div>
              )}

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
                    onChange={(e) => patch({ price: e.target.value })}
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
