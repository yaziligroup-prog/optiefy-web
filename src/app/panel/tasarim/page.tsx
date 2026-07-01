"use client";

/**
 * Canlı Tema Editörü — Shopify Customizer hissiyatında iki sütunlu editör.
 * Sol: ayar paneli · Sağ: tamamen yerel state'ten beslenen anlık önizleme.
 * "Değişiklikleri Yayınla" theme_settings JSON'ını /api/stores PATCH'ine gönderir.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Store, Megaphone, Palette, Circle, Rocket, Loader2, CheckCircle,
  AlertCircle, ShoppingBag, Search, Heart, Sparkles, Star, Monitor,
} from "lucide-react";
import {
  usePanelTheme, PANEL_BODY_FONT, PANEL_DISPLAY_FONT, type PanelPalette,
} from "../_lib/theme";
import { useActiveStore } from "../_lib/storeContext";

// ─── Theme settings modeli ────────────────────────────────────────────────────
// Yayınlandığında stores.theme_settings (jsonb) kolonuna bu şekilde yazılır.

export type ThemeSettings = {
  storeName:        string;
  announcementText: string;
  primaryColor:     string;
  buttonRadius:     number; // px
};

const DEFAULT_SETTINGS: ThemeSettings = {
  storeName:        "Mağazam",
  announcementText: "2000 TL üzeri ücretsiz kargo!",
  primaryColor:     "#7C3AED",
  buttonRadius:     12,
};

const COLOR_PRESETS = [
  "#7C3AED", "#EC4899", "#0EA5E9", "#059669", "#F59E0B", "#DC2626", "#111111",
];

type FeedbackState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Koyu zeminde beyaz, açık zeminde koyu metin döndürür. */
function contrastText(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((ch) => ch + ch).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111111" : "#FFFFFF";
}

function sectionCard(c: PanelPalette): React.CSSProperties {
  return { background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow };
}

// ─── Ayar paneli parçaları ───────────────────────────────────────────────────

function SettingLabel({ icon: Icon, iconColor, title, c }: {
  icon: React.ElementType; iconColor: string; title: string; c: PanelPalette;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}25` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
        {title}
      </span>
    </div>
  );
}

function TextSetting({ icon, iconColor, title, value, onChange, placeholder, c }: {
  icon: React.ElementType; iconColor: string; title: string;
  value: string; onChange: (v: string) => void; placeholder: string; c: PanelPalette;
}) {
  return (
    <div className="space-y-2.5">
      <SettingLabel icon={icon} iconColor={iconColor} title={title} c={c} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
        style={{
          background: c.inputBg, border: `1px solid ${c.border}`, color: c.text,
          fontFamily: PANEL_BODY_FONT, transition: "border-color 0.2s",
        }}
      />
    </div>
  );
}

function ColorSetting({ value, onChange, c }: {
  value: string; onChange: (v: string) => void; c: PanelPalette;
}) {
  return (
    <div className="space-y-2.5">
      <SettingLabel icon={Palette} iconColor="#EC4899" title="Ana Renk" c={c} />

      <div className="flex items-center gap-2.5">
        {/* Native color picker — şık bir swatch içine gömülü */}
        <label
          className="relative w-11 h-11 rounded-xl cursor-pointer overflow-hidden flex-shrink-0"
          style={{ background: value, border: `1px solid ${c.border}`, boxShadow: `0 2px 8px ${value}40` }}
          title="Renk seç"
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          className="w-28 px-3 py-2.5 rounded-xl text-sm font-mono focus:outline-none"
          style={{ background: c.inputBg, border: `1px solid ${c.border}`, color: c.text }}
        />
      </div>

      {/* Hazır paletler */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        {COLOR_PRESETS.map((preset) => {
          const active = preset.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: preset,
                border: active ? `2px solid ${c.text}` : `1px solid ${c.border}`,
                boxShadow: active ? `0 0 0 2px ${c.cardBg}, 0 0 0 4px ${preset}50` : "none",
              }}
              title={preset}
            >
              {active && <CheckCircle className="w-3.5 h-3.5" style={{ color: contrastText(preset) }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadiusSetting({ value, onChange, primaryColor, c }: {
  value: number; onChange: (v: number) => void; primaryColor: string; c: PanelPalette;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <SettingLabel icon={Circle} iconColor="#0EA5E9" title="Buton Köşe Yuvarlaklığı" c={c} />
        <span className="text-xs font-mono px-2 py-0.5 rounded-md"
          style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.borderSoft}` }}>
          {value}px
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={28}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: primaryColor }}
      />
      <div className="flex justify-between text-[10px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        <span>Keskin</span>
        <span>Yumuşak</span>
        <span>Hap (Pill)</span>
      </div>
    </div>
  );
}

// ─── Canlı önizleme (mockup dükkan) ──────────────────────────────────────────

const MOCK_PRODUCTS = [
  { name: "El Yapımı Seramik Vazo", price: "₺1.450", gradient: "linear-gradient(135deg,#FDE68A,#F59E0B)" },
  { name: "Doğal Keten Örtü",       price: "₺890",   gradient: "linear-gradient(135deg,#BFDBFE,#60A5FA)" },
  { name: "Ahşap Takı Kutusu",      price: "₺1.190", gradient: "linear-gradient(135deg,#FBCFE8,#EC4899)" },
];

function StorePreview({ s }: { s: ThemeSettings }) {
  const btnText = contrastText(s.primaryColor);
  const radius  = `${s.buttonRadius}px`;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">

      {/* Duyuru barı */}
      {s.announcementText.trim() !== "" && (
        <div className="px-4 py-2 text-center text-[11px] font-semibold tracking-wide flex items-center justify-center gap-1.5"
          style={{ background: s.primaryColor, color: btnText }}>
          <Sparkles className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{s.announcementText}</span>
        </div>
      )}

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-white">
        <span className="text-sm font-black tracking-tight text-gray-900 truncate max-w-[40%]"
          style={{ fontFamily: PANEL_DISPLAY_FONT }}>
          {s.storeName.trim() || "Mağazam"}
        </span>
        <div className="hidden sm:flex items-center gap-5 text-[11px] font-medium text-gray-500">
          <span>Yeni Gelenler</span>
          <span>Koleksiyon</span>
          <span style={{ color: s.primaryColor }} className="font-semibold">İndirim</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <Search className="w-3.5 h-3.5" />
          <Heart className="w-3.5 h-3.5" />
          <div className="relative">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full text-[7px] font-bold flex items-center justify-center"
              style={{ background: s.primaryColor, color: btnText }}>
              2
            </span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 pt-8 pb-7 text-center"
        style={{ background: `linear-gradient(180deg, ${s.primaryColor}0D 0%, #FFFFFF 100%)` }}>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest mb-3.5"
          style={{ background: `${s.primaryColor}15`, color: s.primaryColor, borderRadius: radius, border: `1px solid ${s.primaryColor}30` }}>
          <Star className="w-2.5 h-2.5" /> Yeni Sezon
        </span>
        <h2 className="text-2xl leading-tight text-gray-900 mb-2"
          style={{ fontFamily: PANEL_DISPLAY_FONT, fontWeight: 400, letterSpacing: "-0.02em" }}>
          Özenle üretilen tasarımlar,<br />kapınıza kadar.
        </h2>
        <p className="text-[11px] text-gray-500 max-w-xs mx-auto mb-5 leading-relaxed">
          {s.storeName.trim() || "Mağazam"} koleksiyonundaki el yapımı ürünleri keşfedin.
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <button
            className="px-5 py-2.5 text-xs font-bold transition-transform hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: s.primaryColor, color: btnText, borderRadius: radius,
              boxShadow: `0 6px 18px ${s.primaryColor}45`,
            }}
          >
            Alışverişe Başla
          </button>
          <button
            className="px-5 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200"
            style={{ borderRadius: radius }}
          >
            Koleksiyonu Gör
          </button>
        </div>
      </div>

      {/* Ürün kartları */}
      <div className="px-6 pb-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Öne Çıkanlar</span>
          <span className="text-[10px] font-semibold" style={{ color: s.primaryColor }}>Tümünü Gör →</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MOCK_PRODUCTS.map((p) => (
            <div key={p.name} className="overflow-hidden border border-gray-100 bg-white"
              style={{ borderRadius: Math.min(s.buttonRadius + 4, 20) }}>
              <div className="aspect-square" style={{ background: p.gradient }} />
              <div className="p-2">
                <p className="text-[9px] font-semibold text-gray-800 truncate">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold" style={{ color: s.primaryColor }}>{p.price}</span>
                  <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold"
                    style={{ background: s.primaryColor, color: btnText, borderRadius: Math.max(s.buttonRadius - 6, 3) }}>
                    +
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sayfa ───────────────────────────────────────────────────────────────────

export default function TasarimPage() {
  const { c } = usePanelTheme();
  const { activeStore, refreshStores } = useActiveStore();

  const [settings,   setSettings]   = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [publishing, setPublishing] = useState(false);
  const [fb,         setFb]         = useState<FeedbackState>(null);

  // Aktif mağaza değişince editörü o mağazanın kayıtlı verisiyle doldur
  useEffect(() => {
    if (!activeStore) return;
    const saved = activeStore.theme_settings;
    setSettings({
      storeName:        activeStore.store_name ?? DEFAULT_SETTINGS.storeName,
      announcementText: saved?.announcement_text ?? DEFAULT_SETTINGS.announcementText,
      primaryColor:     saved?.primary_color     ?? DEFAULT_SETTINGS.primaryColor,
      buttonRadius:     saved?.button_radius     ?? DEFAULT_SETTINGS.buttonRadius,
    });
    setFb(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore?.id]);

  const set = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  // Yayınlanacak JSON — stores.theme_settings (jsonb) kolonu için hazır payload
  const themeSettingsPayload = useMemo(() => ({
    announcement_text: settings.announcementText,
    primary_color:     settings.primaryColor,
    button_radius:     settings.buttonRadius,
  }), [settings]);

  const handlePublish = async () => {
    if (!activeStore) {
      setFb({ type: "error", message: "Önce soldaki seçiciden bir mağaza seçin." });
      return;
    }
    setPublishing(true);
    setFb(null);
    try {
      const res = await fetch("/api/stores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:             activeStore.id,
          store_name:     settings.storeName.trim() || activeStore.store_name,
          theme_settings: themeSettingsPayload,
        }),
      });
      if (!res.ok) throw new Error();
      await refreshStores(true);
      setFb({ type: "success", message: "Tasarım yayınlandı — vitrininiz güncellendi." });
    } catch {
      setFb({ type: "error", message: "Yayınlama başarısız oldu. Lütfen tekrar deneyin." });
    }
    setPublishing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Başlık */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
          Canlı Tema Editörü
        </h1>
        <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          Vitrininizi kişiselleştirin — her değişiklik sağdaki önizlemede anında görünür.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start"
      >

        {/* ── Sol sütun: Ayar Paneli ─────────────────────────────────── */}
        <div className="rounded-2xl flex flex-col lg:sticky lg:top-6" style={sectionCard(c)}>

          <div className="p-6 space-y-7">
            {activeStore && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
                <Monitor className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.textSubtle }} />
                <span className="text-xs truncate" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                  Düzenlenen: <span className="font-semibold" style={{ color: c.text }}>{activeStore.store_name}</span>
                </span>
              </div>
            )}

            <TextSetting
              icon={Store} iconColor="#7C3AED" title="Mağaza Adı"
              value={settings.storeName}
              onChange={(v) => set("storeName", v)}
              placeholder="Örn: Vivinth Atölye" c={c}
            />

            <TextSetting
              icon={Megaphone} iconColor="#F59E0B" title="Duyuru Barı Metni"
              value={settings.announcementText}
              onChange={(v) => set("announcementText", v)}
              placeholder="Örn: 2000 TL üzeri ücretsiz kargo!" c={c}
            />

            <ColorSetting value={settings.primaryColor} onChange={(v) => set("primaryColor", v)} c={c} />

            <RadiusSetting
              value={settings.buttonRadius}
              onChange={(v) => set("buttonRadius", v)}
              primaryColor={settings.primaryColor} c={c}
            />

            {fb && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs"
                style={{
                  background: fb.type === "success" ? "#05966912" : "#DC262612",
                  border: `1px solid ${fb.type === "success" ? "#05966940" : "#DC262640"}`,
                  color: fb.type === "success" ? "#059669" : "#DC2626",
                  fontFamily: PANEL_BODY_FONT,
                }}
              >
                {fb.type === "success"
                  ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                <span>{fb.message}</span>
              </motion.div>
            )}
          </div>

          {/* Yayınla — panelin alt footer'ı */}
          <div className="px-6 py-5 mt-auto" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-60 transition-opacity"
              style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {publishing ? "Yayınlanıyor…" : "Değişiklikleri Yayınla"}
            </button>
            <p className="text-[10px] text-center mt-2.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Değişiklikler yalnızca yayınladığınızda vitrininize yansır.
            </p>
          </div>
        </div>

        {/* ── Sağ sütun: Canlı Önizleme ─────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-60" style={{ background: "#059669" }} />
              <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "#059669" }} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Canlı Önizleme
            </span>
          </div>

          {/* Tarayıcı çerçevesi */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.border}`, boxShadow: c.shadowMd }}>
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: c.cardBgSoft, borderBottom: `1px solid ${c.borderSoft}` }}>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34D399" }} />
              </div>
              <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono truncate"
                style={{ background: c.inputBg, color: c.textSubtle }}>
                🔒 {(settings.storeName.trim() || "magazam").toLowerCase().replace(/\s+/g, "")}.optiefy.com
              </div>
            </div>
            <StorePreview s={settings} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
