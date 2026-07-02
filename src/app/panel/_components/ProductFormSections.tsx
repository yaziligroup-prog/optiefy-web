"use client";

/**
 * Ürün formunun paylaşılan altyapısı — hem "Yeni Ürün Ekle" modalı hem de
 * "Ürün Düzenle" drawer'ı bu draft tipini ve bölümleri kullanır.
 *
 * Bölümler: Stok Takibi (SKU / adet / stoksuz satış), Varyantlar (dinamik
 * tag input), SEO Düzenleyici (Google arama önizlemesi + meta alanlar).
 */

import { useState } from "react";
import { Boxes, Layers, Globe, Plus, X, ChevronDown } from "lucide-react";
import type { Product } from "@/types/store";
import { PANEL_BODY_FONT, type PanelPalette } from "../_lib/theme";

// ─── Draft modeli ─────────────────────────────────────────────────────────────

export type VariantOption = { name: string; values: string[] };

export type ProductDraft = {
  name:        string;
  price:       string;
  currency:    "TRY" | "USD";
  description: string;
  status:      "active" | "pending";
  category:    string; // nav alt menü slug'ı — "" → kategorisiz
  images:      string[]; // [0] = ana/cover görsel (DB kolonu: images text[])
  sku:         string;
  stock_quantity: string; // "" → stok takibi yok
  continue_selling_out_of_stock: boolean;
  variants:    VariantOption[];
  seo_title:   string;
  seo_description: string;
  slug:        string;
};

export function emptyDraft(): ProductDraft {
  return {
    name: "", price: "", currency: "TRY", description: "",
    status: "active", category: "", images: [],
    sku: "", stock_quantity: "", continue_selling_out_of_stock: false,
    variants: [], seo_title: "", seo_description: "", slug: "",
  };
}

export function productToDraft(p: Product): ProductDraft {
  const images = p.images?.length
    ? p.images
    : p.image_url ? [p.image_url] : [];
  return {
    name:        p.name ?? "",
    price:       String(p.price ?? ""),
    currency:    p.currency === "USD" ? "USD" : "TRY",
    description: p.description ?? "",
    status:      p.status === "active" ? "active" : "pending",
    category:    p.category ?? "",
    images,
    sku:         p.sku ?? "",
    stock_quantity: p.stock_quantity == null ? "" : String(p.stock_quantity),
    continue_selling_out_of_stock: !!p.continue_selling_out_of_stock,
    variants:    Array.isArray(p.variants) ? p.variants : [],
    seo_title:   p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    slug:        p.slug ?? "",
  };
}

/**
 * SKU girişini anlık temizler: Türkçe karakterler Latin karşılığına çevrilir,
 * harf/rakam/tire/alt çizgi/nokta/slash dışındaki semboller atılır, BÜYÜK harfe çevrilir.
 */
export function sanitizeSku(text: string): string {
  const map: Record<string, string> = {
    ç: "C", ğ: "G", ı: "I", i: "I", ö: "O", ş: "S", ü: "U",
    Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U",
  };
  return text
    .replace(/[çğıiöşüÇĞİÖŞÜ]/g, (ch) => map[ch] ?? ch)
    .toUpperCase()
    .replace(/[^A-Z0-9\-_./]/g, "")
    .slice(0, 60);
}

/**
 * Fiyat girişini anlık temizler: yalnızca rakam ve TEK ondalık ayracına
 * (virgül veya nokta) izin verir — harf, negatif işaret vb. yazılamaz.
 */
export function sanitizePriceInput(text: string): string {
  let out = "";
  let sepUsed = false;
  for (const ch of text) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if ((ch === "," || ch === ".") && !sepUsed && out.length > 0) {
      out += ch;
      sepUsed = true;
    }
  }
  return out.slice(0, 12);
}

/** Türkçe karakterleri sadeleştirerek SEO dostu slug üretir. */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return text
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (ch) => map[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Draft'ı API payload'una çevirir (id/store_id hariç). */
export function draftToPayload(d: ProductDraft) {
  const priceNum = parseFloat(d.price.replace(",", "."));
  const stockRaw = d.stock_quantity.trim();
  const stockNum = stockRaw === "" ? null : Math.max(0, parseInt(stockRaw, 10) || 0);
  return {
    name:        d.name.trim(),
    price:       priceNum,
    currency:    d.currency,
    description: d.description.trim() || null,
    status:      d.status,
    category:    d.category || null,
    images:      d.images, // [0] = cover
    sku:         d.sku.trim() || null,
    stock_quantity: stockNum,
    continue_selling_out_of_stock: d.continue_selling_out_of_stock,
    variants:    d.variants
      .map((v) => ({ name: v.name.trim(), values: v.values.filter(Boolean) }))
      .filter((v) => v.name && v.values.length > 0),
    seo_title:       d.seo_title.trim() || null,
    seo_description: d.seo_description.trim() || null,
    slug:            d.slug.trim() ? slugify(d.slug) : slugify(d.name),
  };
}

// ─── Paylaşılan stiller ───────────────────────────────────────────────────────

export function makeInputStyle(c: PanelPalette, isDark: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "10px 13px", borderRadius: 11, fontSize: 14,
    background: c.inputBg ?? (isDark ? "#111" : "#F9F9F9"),
    border: `1px solid ${c.border}`, color: c.text,
    outline: "none", fontFamily: PANEL_BODY_FONT,
  };
}

export function makeLabelStyle(c: PanelPalette): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
    color: c.textSubtle, fontFamily: PANEL_BODY_FONT, marginBottom: 6, display: "block",
  };
}

function SectionCard({
  icon, title, subtitle, c, children,
}: {
  icon: React.ReactNode; title: string; subtitle?: string;
  c: PanelPalette; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4 space-y-4"
      style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: c.accentSoft ?? "rgba(124,58,237,0.1)", color: c.accentText ?? "#7C3AED" }}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-bold leading-tight" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Stok Takibi ──────────────────────────────────────────────────────────────

export function InventorySection({
  draft, patch, c, isDark,
}: {
  draft: ProductDraft;
  patch: (p: Partial<ProductDraft>) => void;
  c: PanelPalette; isDark: boolean;
}) {
  const inp = makeInputStyle(c, isDark);
  const lbl = makeLabelStyle(c);

  return (
    <SectionCard icon={<Boxes className="w-3.5 h-3.5" />} title="Stok Takibi"
      subtitle="SKU ve stok adediyle envanterinizi yönetin" c={c}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={lbl}>SKU (Stok Kodu)</label>
          <input value={draft.sku} onChange={(e) => patch({ sku: sanitizeSku(e.target.value) })}
            placeholder="ÖR: TSHIRT-SYH-M" style={inp} maxLength={60}
            autoCapitalize="characters" spellCheck={false} />
        </div>
        <div>
          <label style={lbl}>Stok Adedi</label>
          {/* Yalnızca rakam — negatif değer ve işaret girişi imkânsız */}
          <input value={draft.stock_quantity} type="text" inputMode="numeric"
            pattern="[0-9]*"
            onChange={(e) => patch({ stock_quantity: e.target.value.replace(/[^0-9]/g, "").slice(0, 7) })}
            placeholder="Boş = sınırsız" style={inp} maxLength={7} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <span className="relative w-[18px] h-[18px] rounded-md flex-shrink-0 flex items-center justify-center transition-colors"
          style={{
            background: draft.continue_selling_out_of_stock ? "#7C3AED" : "transparent",
            border: `1.5px solid ${draft.continue_selling_out_of_stock ? "#7C3AED" : c.border}`,
          }}>
          {draft.continue_selling_out_of_stock && (
            <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
              <path d="M1 4L3.8 6.8L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <input type="checkbox" hidden checked={draft.continue_selling_out_of_stock}
          onChange={(e) => patch({ continue_selling_out_of_stock: e.target.checked })} />
        <span className="text-xs" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          Stok tükendiğinde de satışa devam et
        </span>
      </label>
    </SectionCard>
  );
}

// ─── Varyantlar ───────────────────────────────────────────────────────────────

const VARIANT_SUGGESTIONS = ["Renk", "Beden", "Malzeme"];
const MAX_VARIANT_OPTIONS = 3;

export function VariantSection({
  draft, patch, c, isDark,
}: {
  draft: ProductDraft;
  patch: (p: Partial<ProductDraft>) => void;
  c: PanelPalette; isDark: boolean;
}) {
  const inp = makeInputStyle(c, isDark);
  const lbl = makeLabelStyle(c);

  const updateOption = (index: number, opt: Partial<VariantOption>) => {
    patch({
      variants: draft.variants.map((v, i) => (i === index ? { ...v, ...opt } : v)),
    });
  };

  const removeOption = (index: number) => {
    patch({ variants: draft.variants.filter((_, i) => i !== index) });
  };

  const usedNames = draft.variants.map((v) => v.name);
  const freeSuggestions = VARIANT_SUGGESTIONS.filter((s) => !usedNames.includes(s));

  return (
    <SectionCard icon={<Layers className="w-3.5 h-3.5" />} title="Varyantlar"
      subtitle="Renk, beden veya malzeme gibi seçenekler ekleyin" c={c}>
      {draft.variants.map((option, i) => (
        <div key={i} className="rounded-xl p-3 space-y-3"
          style={{ border: `1px solid ${c.borderSoft ?? c.border}`, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>
          <div className="flex items-center gap-2">
            <input value={option.name}
              onChange={(e) => updateOption(i, { name: e.target.value })}
              placeholder="Seçenek adı — Örn: Renk"
              style={{ ...inp, flex: 1, padding: "8px 11px", fontSize: 13 }} maxLength={30} />
            <button type="button" onClick={() => removeOption(i)} title="Seçeneği kaldır"
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.hover, border: `1px solid ${c.border}` }}>
              <X className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
            </button>
          </div>
          <TagInput
            values={option.values}
            onChange={(values) => updateOption(i, { values })}
            placeholder="Değer yazıp Enter'a basın — Örn: Kırmızı"
            c={c} isDark={isDark}
          />
        </div>
      ))}

      {draft.variants.length < MAX_VARIANT_OPTIONS && (
        <div>
          <label style={lbl}>Seçenek Ekle</label>
          <div className="flex flex-wrap gap-2">
            {freeSuggestions.map((s) => (
              <button key={s} type="button"
                onClick={() => patch({ variants: [...draft.variants, { name: s, values: [] }] })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: c.hover, border: `1px dashed ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                <Plus className="w-3 h-3" /> {s}
              </button>
            ))}
            <button type="button"
              onClick={() => patch({ variants: [...draft.variants, { name: "", values: [] }] })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: c.hover, border: `1px dashed ${c.border}`, color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              <Plus className="w-3 h-3" /> Özel Seçenek
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/** Enter/virgül ile değer ekleyen chip'li tag input. */
function TagInput({
  values, onChange, placeholder, c, isDark,
}: {
  values: string[]; onChange: (values: string[]) => void;
  placeholder: string; c: PanelPalette; isDark: boolean;
}) {
  const [text, setText] = useState("");

  const commit = () => {
    const val = text.trim().replace(/,+$/, "");
    if (val && !values.includes(val)) onChange([...values, val]);
    setText("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl px-2.5 py-2"
      style={{ background: c.inputBg ?? (isDark ? "#111" : "#F9F9F9"), border: `1px solid ${c.border}` }}>
      {values.map((v) => (
        <span key={v} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold"
          style={{
            background: c.accentSoft ?? "rgba(124,58,237,0.1)",
            color: c.accentText ?? "#7C3AED",
            fontFamily: PANEL_BODY_FONT,
          }}>
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}
            className="w-4 h-4 rounded flex items-center justify-center hover:opacity-70">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => {
          if (e.target.value.endsWith(",")) { setText(e.target.value.slice(0, -1)); commit(); }
          else setText(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          else if (e.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px] py-0.5"
        style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}
        maxLength={40}
      />
    </div>
  );
}

// ─── SEO Düzenleyici ──────────────────────────────────────────────────────────

export function SeoSection({
  draft, patch, c, isDark, storeDomain,
}: {
  draft: ProductDraft;
  patch: (p: Partial<ProductDraft>) => void;
  c: PanelPalette; isDark: boolean;
  storeDomain?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const inp = makeInputStyle(c, isDark);
  const lbl = makeLabelStyle(c);

  const domain = storeDomain || "magazaniz.com";
  const previewSlug = draft.slug.trim() ? slugify(draft.slug) : slugify(draft.name) || "urun-adi";
  const previewTitle = draft.seo_title.trim() || draft.name.trim() || "Ürün Başlığı";
  const previewDesc = draft.seo_description.trim() || draft.description.trim()
    || "Meta açıklama girilmediğinde Google, ürün açıklamanızdan bir kesit gösterir.";

  return (
    <SectionCard icon={<Globe className="w-3.5 h-3.5" />} title="Arama Motoru Önizlemesi"
      subtitle="Ürünün Google'da nasıl görüneceğini düzenleyin" c={c}>
      {/* Google SERP önizlemesi */}
      <div className="rounded-xl px-4 py-3.5"
        style={{ background: isDark ? "#0D0D0D" : "#FFFFFF", border: `1px solid ${c.borderSoft ?? c.border}` }}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
            {domain.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] leading-tight truncate" style={{ color: isDark ? "#DADCE0" : "#202124", fontFamily: "arial, sans-serif" }}>
              {domain}
            </p>
            <p className="text-[11px] leading-tight truncate" style={{ color: isDark ? "#9AA0A6" : "#4D5156", fontFamily: "arial, sans-serif" }}>
              https://{domain} › urun › {previewSlug}
            </p>
          </div>
        </div>
        <p className="text-[17px] leading-snug truncate" style={{ color: isDark ? "#8AB4F8" : "#1A0DAB", fontFamily: "arial, sans-serif" }}>
          {previewTitle.slice(0, 60)}{previewTitle.length > 60 ? "…" : ""}
        </p>
        <p className="text-[12.5px] leading-snug mt-0.5" style={{
          color: isDark ? "#BDC1C6" : "#4D5156", fontFamily: "arial, sans-serif",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {previewDesc.slice(0, 160)}{previewDesc.length > 160 ? "…" : ""}
        </p>
      </div>

      <button type="button" onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: c.accentText ?? "#7C3AED", fontFamily: PANEL_BODY_FONT }}>
        <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
        {expanded ? "SEO alanlarını gizle" : "SEO alanlarını düzenle"}
      </button>

      {expanded && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label style={lbl}>Meta Başlık</label>
              <span className="text-[10px]" style={{ color: draft.seo_title.length > 60 ? "#EF4444" : c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                {draft.seo_title.length}/60
              </span>
            </div>
            <input value={draft.seo_title} onChange={(e) => patch({ seo_title: e.target.value })}
              placeholder={draft.name || "Google'da görünecek başlık"} style={inp} maxLength={70} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label style={lbl}>Meta Açıklama</label>
              <span className="text-[10px]" style={{ color: draft.seo_description.length > 160 ? "#EF4444" : c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                {draft.seo_description.length}/160
              </span>
            </div>
            <textarea value={draft.seo_description} onChange={(e) => patch({ seo_description: e.target.value })}
              placeholder="Arama sonuçlarında görünecek kısa açıklama…"
              rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} maxLength={180} />
          </div>

          <div>
            <label style={lbl}>URL Slug</label>
            <div className="flex items-center rounded-xl overflow-hidden"
              style={{ border: `1px solid ${c.border}`, background: c.inputBg ?? (isDark ? "#111" : "#F9F9F9") }}>
              <span className="pl-3 pr-1 text-[12px] flex-shrink-0" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                /urun/
              </span>
              <input value={draft.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                onBlur={(e) => patch({ slug: slugify(e.target.value) })}
                placeholder={slugify(draft.name) || "urun-adi"}
                className="flex-1 bg-transparent outline-none py-2.5 pr-3 text-[13px]"
                style={{ color: c.text, fontFamily: PANEL_BODY_FONT }} maxLength={80} />
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
