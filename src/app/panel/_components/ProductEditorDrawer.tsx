"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Save, Loader2, Plus, Trash2, Sparkles, Package, Globe,
  Tag, FileText, ListChecks, Power, ExternalLink,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Store } from "@/types/store";
import { THEMES, type ThemeId } from "@/types/theme";
import { PANEL_BODY_FONT, type PanelPalette } from "../_lib/theme";

interface Props {
  store: Store | null;
  c: PanelPalette;
  isDark: boolean;
  open: boolean;
  onClose: () => void;
  onSaved: (storeId: string, patch: Partial<Store>) => void;
}

type Draft = {
  seo_title:   string;
  price:       string;
  currency:    "TRY" | "USD";
  description: string;
  features:    string[];
  status:      string;
};

function storeToDraft(s: Store): Draft {
  return {
    seo_title:   s.seo_title ?? s.store_name ?? "",
    price:       String(s.product_price ?? ""),
    currency:    (s.currency === "USD" ? "USD" : "TRY"),
    description: s.description ?? "",
    features:    s.features ? [...s.features] : [],
    status:      s.status ?? "pending",
  };
}

export default function ProductEditorDrawer({ store, c, isDark, open, onClose, onSaved }: Props) {
  const [draft, setDraft]     = useState<Draft | null>(null);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");
  const [dirty, setDirty]     = useState(false);

  // Store değişince taslağı sıfırla
  useEffect(() => {
    if (store) { setDraft(storeToDraft(store)); setDirty(false); setErr(""); }
  }, [store]);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!store || !draft) return null;

  const patch = (p: Partial<Draft>) => { setDraft((d) => (d ? { ...d, ...p } : d)); setDirty(true); setErr(""); };

  const updateFeature = (i: number, val: string) => {
    const next = [...draft.features]; next[i] = val; patch({ features: next });
  };
  const removeFeature = (i: number) => patch({ features: draft.features.filter((_, idx) => idx !== i) });
  const addFeature    = () => patch({ features: [...draft.features, ""] });

  const isLive = draft.status === "active";
  const images = store.image_urls?.length ? store.image_urls : (store.product_image_base64 ? [store.product_image_base64] : []);
  const theme  = (store.theme ?? "modern") as ThemeId;
  const liveHref = store.custom_domain ? `https://${store.custom_domain}` : null;

  const handleSave = async () => {
    const priceNum = parseFloat(draft.price.replace(",", "."));
    if (!draft.seo_title.trim()) { setErr("Ürün başlığı boş olamaz."); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setErr("Geçerli bir fiyat girin."); return; }

    setSaving(true); setErr("");
    const cleanFeatures = draft.features.map((f) => f.trim()).filter(Boolean);
    const payload = {
      seo_title:     draft.seo_title.trim(),
      product_price: priceNum,
      currency:      draft.currency,
      description:   draft.description.trim() || null,
      features:      cleanFeatures.length ? cleanFeatures : null,
      status:        draft.status,
    };

    const supabase = createClient();
    const { error } = await supabase.from("stores").update(payload).eq("id", store.id);
    setSaving(false);
    if (error) { setErr("Kaydedilirken bir hata oluştu. Tekrar deneyin."); return; }

    onSaved(store.id, payload);
    setDirty(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 11, fontSize: 14,
    background: c.inputBg, border: `1px solid ${c.border}`, color: c.text,
    outline: "none", fontFamily: PANEL_BODY_FONT,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
    color: c.textSubtle, fontFamily: PANEL_BODY_FONT, marginBottom: 8, display: "flex",
    alignItems: "center", gap: 6,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
            className="fixed inset-0 z-[90]"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 bottom-0 z-[91] w-full max-w-md flex flex-col"
            style={{ background: c.appBg, borderLeft: `1px solid ${c.border}`, boxShadow: c.shadowMd }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 flex-shrink-0"
              style={{ borderBottom: `1px solid ${c.border}`, background: c.cardBg }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Ürün Düzenle</p>
                  <p className="text-[11px] truncate" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{store.store_name}</p>
                </div>
              </div>
              <button onClick={() => !saving && onClose()} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: c.hover, border: `1px solid ${c.border}` }}>
                <X className="w-4 h-4" style={{ color: c.textMuted }} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

              {/* Görsel şeridi */}
              <div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.length > 0 ? images.map((img, i) => (
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ background: isDark ? "#0F0F0F" : "#F4F4F2", border: `1px solid ${c.border}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`${i + 1}`} className="w-full h-full object-contain p-1.5" />
                    </div>
                  )) : (
                    <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: c.hover, border: `1px solid ${c.border}` }}>
                      <Package className="w-6 h-6" style={{ color: c.textSubtle }} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] mt-2" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  Görseller AI stüdyosunda üretildi · {images.length} görsel
                </p>
              </div>

              {/* Ürün başlığı (SEO title) */}
              <div>
                <label style={labelStyle}><Tag className="w-3.5 h-3.5" /> Ürün Başlığı (SEO)</label>
                <input value={draft.seo_title} onChange={(e) => patch({ seo_title: e.target.value })}
                  placeholder="El Yapımı Desenli Metal Kase" style={inputStyle} maxLength={70} />
                <p className="text-[11px] mt-1.5 text-right" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  {draft.seo_title.length}/70
                </p>
              </div>

              {/* Fiyat + para birimi */}
              <div>
                <label style={labelStyle}><Sparkles className="w-3.5 h-3.5" /> Fiyat</label>
                <div className="flex gap-2">
                  <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1px solid ${c.border}` }}>
                    {(["TRY", "USD"] as const).map((cur) => (
                      <button key={cur} onClick={() => patch({ currency: cur })}
                        className="px-4 py-2.5 text-sm font-bold transition-colors"
                        style={{
                          background: draft.currency === cur ? c.ctaBg : "transparent",
                          color: draft.currency === cur ? c.ctaText : c.textMuted, fontFamily: PANEL_BODY_FONT,
                        }}>
                        {cur === "TRY" ? "₺" : "$"}
                      </button>
                    ))}
                  </div>
                  <input value={draft.price} inputMode="decimal"
                    onChange={(e) => patch({ price: e.target.value })}
                    placeholder="299,90" style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>

              {/* SEO açıklaması */}
              <div>
                <label style={labelStyle}><FileText className="w-3.5 h-3.5" /> SEO Açıklaması</label>
                <textarea value={draft.description} onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Ürünün değer önerisini anlatan, satışa dönük açıklama…"
                  rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} maxLength={320} />
                <p className="text-[11px] mt-1.5 text-right" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  {draft.description.length}/320
                </p>
              </div>

              {/* Özellikler */}
              <div>
                <label style={labelStyle}><ListChecks className="w-3.5 h-3.5" /> Öne Çıkan Özellikler</label>
                <div className="space-y-2">
                  {draft.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.accentText }} />
                      <input value={f} onChange={(e) => updateFeature(i, e.target.value)}
                        placeholder={`Özellik ${i + 1}`} style={{ ...inputStyle, padding: "9px 12px" }} />
                      <button onClick={() => removeFeature(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: c.hover, border: `1px solid ${c.border}` }}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  ))}
                  {draft.features.length < 6 && (
                    <button onClick={addFeature}
                      className="flex items-center gap-1.5 text-xs font-semibold mt-1 px-3 py-2 rounded-lg w-full justify-center"
                      style={{ background: c.hover, border: `1px dashed ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                      <Plus className="w-3.5 h-3.5" /> Özellik Ekle
                    </button>
                  )}
                </div>
              </div>

              {/* Meta: tema + domain */}
              <div className="rounded-xl p-3.5 space-y-2.5" style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: THEMES[theme].accentColor }} /> Vitrin Teması
                  </span>
                  <span className="text-xs font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{THEMES[theme].name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                    <Globe className="w-3.5 h-3.5" /> Adres
                  </span>
                  {liveHref ? (
                    <a href={liveHref} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold flex items-center gap-1 hover:underline" style={{ color: "#16A34A", fontFamily: PANEL_BODY_FONT }}>
                      {store.custom_domain} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs font-mono" style={{ color: c.textSubtle }}>otomatik</span>
                  )}
                </div>
              </div>

              {err && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs" style={{ color: "#EF4444", fontFamily: PANEL_BODY_FONT }}>{err}</motion.p>
              )}
            </div>

            {/* Footer aksiyonları */}
            <div className="flex-shrink-0 px-5 py-4 flex items-center gap-2.5"
              style={{ borderTop: `1px solid ${c.border}`, background: c.cardBg }}>
              {/* Yayın toggle */}
              <button onClick={() => patch({ status: isLive ? "pending" : "active" })}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0"
                style={{
                  background: isLive ? "rgba(34,197,94,0.12)" : c.hover,
                  border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : c.border}`,
                  color: isLive ? "#16A34A" : c.textMuted, fontFamily: PANEL_BODY_FONT,
                }}>
                <Power className="w-3.5 h-3.5" /> {isLive ? "Yayında" : "Taslak"}
              </button>

              <motion.button
                onClick={handleSave} disabled={saving || !dirty}
                whileHover={{ scale: saving || !dirty ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}>
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</>
                  : <><Save className="w-4 h-4" /> Değişiklikleri Kaydet</>}
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
