"use client";

/**
 * Canlı Tema Editörü — Shopify Customizer hissiyatında iki sütunlu editör.
 * Sol: derin özelleştirme paneli · Sağ: StoreView'in birebir ikizi canlı önizleme.
 * Tüm önizleme tamamen yerel React state'inden beslenir — sıfır gecikme.
 * Kaydedilmemiş değişiklik varsa altta floating bar çıkar (İptal / Yayınla).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Store as StoreIcon, Megaphone, Palette, Circle, Rocket, Loader2, CheckCircle,
  AlertCircle, ShoppingBag, Monitor, Type, Image as ImageIcon, LayoutTemplate,
  Upload, X, ArrowRight, Sparkles, Undo2, Truck, Award, Gem,
  Smartphone, Tablet, ChevronDown, PanelTop, Instagram, Twitter, Facebook, Layers,
  Menu as MenuIcon, GripVertical, Plus, Moon, CornerDownRight, ListPlus,
  AlignLeft, AlignCenter,
} from "lucide-react";
import {
  usePanelTheme, PANEL_BODY_FONT, PANEL_DISPLAY_FONT, type PanelPalette,
} from "../_lib/theme";
import { useActiveStore } from "../_lib/storeContext";
import { THEMES, THEME_FONT_NAMES, themeFontStack, type ThemeId } from "@/types/theme";
import type { Store, StoreThemeSettings } from "@/types/store";
import { CountdownTimer, applyThemeSettings } from "@/app/store/[domain]/StoreView";

// ─── Editor state modeli ─────────────────────────────────────────────────────
// Yayınlandığında stores.theme_settings (jsonb) kolonuna snake_case yazılır.

// Nav menü elemanları — id yalnızca editör içi (drag/reorder kimliği), yayında atılır.
// İki kademeli hiyerarşi: ana eleman + opsiyonel alt menü (max 1 derinlik).
type NavChild = { id: string; label: string; url: string };
type NavLink  = { id: string; label: string; url: string; children?: NavChild[] };

const DEFAULT_NAV_LINKS: Omit<NavLink, "id">[] = [
  { label: "Tüm Ürünler",   url: "/urunler" },
  { label: "Koleksiyonlar", url: "/urunler" },
  { label: "Hakkımızda",    url: "#hakkimizda" },
  { label: "İletişim",      url: "#iletisim" },
];

let navIdSeq = 0;
const navId = () => `nav-${++navIdSeq}`;

const MAX_NAV_LINKS = 6; // vitrin görsel dengesi için ana menü üst sınırı

// ── Otomatik URL slug üretici ────────────────────────────────────────────────
// "Yeni Ürünler" → "/yeni-urunler". Türkçe karakterler ASCII'ye çevrilir.
const TR_CHAR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", i̇: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
};

function slugify(text: string): string {
  return text
    .split("")
    .map((ch) => TR_CHAR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// prefix: alt menüler /urunler/<slug> konvansiyonuyla doğar → otomatik kategori sayfası
const autoSlugUrl = (label: string, prefix = ""): string => {
  const s = slugify(label);
  return s ? `${prefix}/${s}` : "#";
};

// URL hâlâ otomatik türetilmiş durumdaysa (boş, "#" veya önceki etiketin slug'ı)
// etiket yazılırken senkron güncellenir; kullanıcı URL'e elle dokunduysa dokunulmaz.
const shouldAutoSlug = (currentUrl: string, prevLabel: string, prefix = ""): boolean => {
  const u = currentUrl.trim();
  return u === "" || u === "#" || u === autoSlugUrl(prevLabel, prefix);
};

type EditorSettings = {
  themeId:          ThemeId; // baz tema — stores.theme kolonuna yazılır
  storeName:        string;
  announcementText: string;
  primaryColor:     string;
  buttonRadius:     number; // px
  fontHeading:      string; // "" → tema varsayılanı
  fontBody:         string; // "" → tema varsayılanı
  heroTitle:        string; // "" → ürün adı
  heroSubtitle:     string; // "" → mağaza açıklaması
  heroOverlay:      number; // 0–90 ek karartma %
  logoUrl:          string; // "" → metin logo
  showCountdown:        boolean; // duyuru barında geri sayım sayacı
  showCurrencySelector: boolean; // header'da TRY/USD/AUD dropdown'u
  socialInstagram:  string;
  socialTwitter:    string;
  socialFacebook:   string;
  navLinks:         NavLink[]; // vitrin nav menüsü (inline düzenlenebilir + sıralanabilir)
  heroImageUrl:     string;    // hero arka plan görseli override ("" → ürün görseli)
  darkMode:         boolean;   // vitrin gece modu
  headerLayout:     "center" | "left"; // marka/logo konumu
};

// Editörde önizlenen dükkanın cihaz modu — sadece yerel görünüm, yayınlanmaz
type DeviceMode = "mobile" | "tablet" | "desktop";

const SLOGAN = "Ustaların elinde şekillenen, zamana meydan okuyan bir tasarım.";

const COLOR_PRESETS = [
  "#7C3AED", "#EC4899", "#0EA5E9", "#059669", "#F59E0B", "#DC2626", "#111111",
];

type FeedbackState = { type: "success" | "error"; message: string } | null;

// Aktif mağazanın DB halini editor state'ine çevirir — baseline (dirty kıyası) budur
function fromStore(s: Store): EditorSettings {
  const ts = s.theme_settings;
  return {
    themeId:          s.theme && THEMES[s.theme as ThemeId] ? (s.theme as ThemeId) : "modern",
    // hide_store_name aktifse editör alanı boş açılır — vitrinde marka gizli demektir
    storeName:        ts?.hide_store_name ? "" : (s.store_name ?? ""),
    announcementText: ts?.announcement_text ?? "",
    primaryColor:     ts?.primary_color     ?? "#7C3AED",
    buttonRadius:     ts?.button_radius     ?? 12,
    fontHeading:      ts?.font_heading      ?? "",
    fontBody:         ts?.font_body         ?? "",
    heroTitle:        ts?.hero_title        ?? "",
    heroSubtitle:     ts?.hero_subtitle     ?? "",
    heroOverlay:      ts?.hero_overlay      ?? 0,
    logoUrl:          ts?.logo_url          ?? "",
    showCountdown:        ts?.show_countdown         ?? false,
    showCurrencySelector: ts?.show_currency_selector ?? false,
    socialInstagram:  ts?.social_instagram  ?? "",
    socialTwitter:    ts?.social_twitter    ?? "",
    socialFacebook:   ts?.social_facebook   ?? "",
    navLinks: (ts?.nav_links?.length ? ts.nav_links : DEFAULT_NAV_LINKS)
      .map((l) => ({
        id: navId(), label: l.label, url: l.url,
        children: ("children" in l && l.children?.length)
          ? l.children.map((child) => ({ id: navId(), label: child.label, url: child.url }))
          : undefined,
      })),
    heroImageUrl:     ts?.hero_image_url ?? "",
    darkMode:         ts?.dark_mode      ?? false,
    headerLayout:     ts?.header_layout === "left" ? "left" : "center",
  };
}

const FALLBACK_SETTINGS: EditorSettings = {
  themeId: "modern",
  storeName: "Mağazam", announcementText: "", primaryColor: "#7C3AED", buttonRadius: 12,
  fontHeading: "", fontBody: "", heroTitle: "", heroSubtitle: "", heroOverlay: 0, logoUrl: "",
  showCountdown: false, showCurrencySelector: false,
  socialInstagram: "", socialTwitter: "", socialFacebook: "",
  navLinks: DEFAULT_NAV_LINKS.map((l) => ({ id: navId(), ...l })),
  heroImageUrl: "", darkMode: false, headerLayout: "center",
};

// ─── Premium hazır seçimler ──────────────────────────────────────────────────

const FONT_PAIRINGS = [
  { name: "Zarif Serif",    heading: "Playfair Display", body: "Lora" },
  { name: "Keskin Modern",  heading: "Montserrat",       body: "Inter" },
  { name: "Brütalist Mono", heading: "Space Grotesk",    body: "JetBrains Mono" },
];

const RADIUS_PRESETS = [
  { label: "Keskin Köşeler",  value: 0 },
  { label: "Yumuşak Modern",  value: 10 },
  { label: "Tam Oval / Pill", value: 28 },
];

/** Protokolsüz girilen sosyal linklere https:// ekler — sanitizer http(s) şart koşar. */
function normalizeUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  return /^https?:\/\//.test(s) ? s : `https://${s}`;
}

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

function inputStyle(c: PanelPalette): React.CSSProperties {
  return {
    background: c.inputBg, border: `1px solid ${c.border}`, color: c.text,
    fontFamily: PANEL_BODY_FONT, transition: "border-color 0.2s",
  };
}

function TextSetting({ icon, iconColor, title, value, onChange, placeholder, c, textarea }: {
  icon: React.ElementType; iconColor: string; title: string;
  value: string; onChange: (v: string) => void; placeholder: string;
  c: PanelPalette; textarea?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <SettingLabel icon={icon} iconColor={iconColor} title={title} c={c} />
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
          style={inputStyle(c)}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
          style={inputStyle(c)}
        />
      )}
    </div>
  );
}

function SliderSetting({ icon, iconColor, title, value, onChange, min, max, unit, marks, accent, c }: {
  icon: React.ElementType; iconColor: string; title: string;
  value: number; onChange: (v: number) => void;
  min: number; max: number; unit: string; marks: [string, string, string];
  accent: string; c: PanelPalette;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <SettingLabel icon={icon} iconColor={iconColor} title={title} c={c} />
        <span className="text-xs font-mono px-2 py-0.5 rounded-md"
          style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.borderSoft}` }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: accent }}
      />
      <div className="flex justify-between text-[10px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        <span>{marks[0]}</span><span>{marks[1]}</span><span>{marks[2]}</span>
      </div>
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
        <label
          className="relative w-11 h-11 rounded-xl cursor-pointer overflow-hidden flex-shrink-0"
          style={{ background: value, border: `1px solid ${c.border}`, boxShadow: `0 2px 8px ${value}40` }}
          title="Renk seç"
        >
          <input
            type="color" value={value}
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

// Kompakt baz tema seçici — Ayarlar'daki büyük kartların yerini alan minimal swatch grid'i.
// Tıklama anında sağdaki önizleme o temanın iskelet düzenine bürünür (yerel state).
function ThemePicker({ value, onChange, c }: {
  value: ThemeId; onChange: (v: ThemeId) => void; c: PanelPalette;
}) {
  return (
    <div className="space-y-2.5">
      <SettingLabel icon={Layers} iconColor="#F97316" title="1. Baz Tema Seçin" c={c} />
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
          const th  = THEMES[tid];
          const sel = value === tid;
          return (
            <button
              key={tid}
              onClick={() => onChange(tid)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
              style={{
                background: sel ? `${th.accentColor}14` : c.cardBgSoft,
                border: sel ? `1.5px solid ${th.accentColor}` : `1px solid ${c.borderSoft}`,
              }}
            >
              <span className="flex gap-0.5 flex-shrink-0">
                {[th.accentColor, th.primaryBtn.startsWith("linear") ? th.accentColor : th.primaryBtn].map((color, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                ))}
              </span>
              <span className="text-[11px] font-bold truncate"
                style={{ color: sel ? th.accentColor : c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                {th.shortName}
              </span>
              {sel && <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: th.accentColor }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── NavLinksEditor — iki kademeli hiyerarşik, sürükle-bırak sıralanabilir menü ──
// Ana elemanlar kendi grubunda, alt menüler ebeveynlerinin içindeki bağımsız
// Reorder grubunda sıralanır. Drag yalnızca grip tutamacından başlar
// (dragListener kapalı) — böylece iç içe gruplar birbirinin sürüklemesini bozmaz.

function NavChildRow({ child, canDelete, onPatch, onRemove, c }: {
  child: NavChild; canDelete: boolean;
  onPatch: (patch: Partial<NavChild>) => void; onRemove: () => void;
  c: PanelPalette;
}) {
  const controls = useDragControls();

  // Etiket yazılırken URL hâlâ otomatikse slug senkron üretilir (/urunler/<slug>)
  const handleLabel = (v: string) => {
    const patch: Partial<NavChild> = { label: v };
    if (shouldAutoSlug(child.url, child.label, "/urunler")) patch.url = autoSlugUrl(v, "/urunler");
    onPatch(patch);
  };
  const handleUrlBlur = () => {
    const u = child.url.trim();
    if (!u) onPatch({ url: autoSlugUrl(child.label, "/urunler") });
    else if (!u.startsWith("/") && !u.startsWith("#")) onPatch({ url: `/${u}` });
  };

  return (
    <Reorder.Item
      value={child}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: "0 6px 18px rgba(0,0,0,0.16)", zIndex: 10 }}
      className="flex items-center gap-1.5 pl-8 pr-2 py-1 rounded-lg"
      style={{ background: c.hover, border: `1px solid ${c.borderSoft}` }}
    >
      {/* Hiyerarşi dirseği */}
      <CornerDownRight className="w-3 h-3 flex-shrink-0" style={{ color: c.textSubtle, opacity: 0.7 }} />
      <button
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        title="Sürükleyerek sırala"
      >
        <GripVertical className="w-3 h-3" style={{ color: c.textSubtle }} />
      </button>
      <input
        type="text"
        value={child.label}
        onChange={(e) => handleLabel(e.target.value)}
        onBlur={() => { if (!child.label.trim()) onPatch({ label: "İsimsiz Menü" }); }}
        className="flex-1 min-w-0 bg-transparent text-[11px] font-medium focus:outline-none"
        style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}
      />
      {/* Alt menü rotası — özgürce düzenlenebilir */}
      <input
        type="text"
        value={child.url}
        onChange={(e) => onPatch({ url: e.target.value })}
        onBlur={handleUrlBlur}
        placeholder="/rota veya #bölüm"
        className="w-[92px] flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono focus:outline-none"
        style={{ background: c.inputBg, border: `1px solid ${c.borderSoft}`, color: c.textSubtle }}
        title="Alt menü rotası"
      />
      <button
        onClick={onRemove}
        disabled={!canDelete}
        className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 disabled:opacity-30"
        style={{ background: "#DC262612" }}
        title="Alt menüyü kaldır"
      >
        <X className="w-2.5 h-2.5" style={{ color: "#DC2626" }} />
      </button>
    </Reorder.Item>
  );
}

function NavParentRow({ link, canDelete, onPatch, onRemove, c, accent }: {
  link: NavLink; canDelete: boolean;
  onPatch: (patch: Partial<NavLink>) => void; onRemove: () => void;
  c: PanelPalette; accent: string;
}) {
  const controls = useDragControls();
  const children = link.children ?? [];

  const addChild = () => {
    if (children.length >= 6) return;
    onPatch({ children: [...children, { id: navId(), label: "Yeni Alt Menü", url: autoSlugUrl("Yeni Alt Menü", "/urunler") }] });
  };

  // Etiket yazılırken URL hâlâ otomatikse slug senkron üretilir
  const handleLabel = (v: string) => {
    const patch: Partial<NavLink> = { label: v };
    if (shouldAutoSlug(link.url, link.label)) patch.url = autoSlugUrl(v);
    onPatch(patch);
  };
  const handleUrlBlur = () => {
    const u = link.url.trim();
    if (!u) onPatch({ url: autoSlugUrl(link.label) });
    else if (!u.startsWith("/") && !u.startsWith("#")) onPatch({ url: `/${u}` });
  };

  return (
    <Reorder.Item
      value={link}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.03, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 10 }}
      className="space-y-1"
    >
      {/* Ana eleman kartı */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
        style={{ background: c.inputBg, border: `1px solid ${c.borderSoft}` }}
      >
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          title="Sürükleyerek sırala"
        >
          <GripVertical className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
        </button>
        <input
          type="text"
          value={link.label}
          onChange={(e) => handleLabel(e.target.value)}
          onBlur={() => { if (!link.label.trim()) onPatch({ label: "İsimsiz Menü" }); }}
          className="flex-1 min-w-0 bg-transparent text-xs font-medium focus:outline-none"
          style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}
        />
        {/* Rota — özgürce düzenlenebilir, etiketten otomatik slug'lanır */}
        <input
          type="text"
          value={link.url}
          onChange={(e) => onPatch({ url: e.target.value })}
          onBlur={handleUrlBlur}
          placeholder="/rota"
          className="w-[92px] flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono focus:outline-none"
          style={{ background: c.hover, border: `1px solid ${c.borderSoft}`, color: c.textSubtle }}
          title="Menü rotası"
        />
        <button
          onClick={addChild}
          disabled={children.length >= 6}
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-transform hover:scale-110"
          style={{ background: `${accent}14`, border: `1px solid ${accent}30` }}
          title="Alt menü ekle"
        >
          <ListPlus className="w-3 h-3" style={{ color: accent }} />
        </button>
        <button
          onClick={onRemove}
          disabled={!canDelete}
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 disabled:opacity-30"
          style={{ background: "#DC262612" }}
          title="Menüden kaldır"
        >
          <X className="w-3 h-3" style={{ color: "#DC2626" }} />
        </button>
      </div>

      {/* Alt menüler — ebeveyn içinde bağımsız Reorder grubu */}
      {children.length > 0 && (
        <Reorder.Group
          axis="y"
          values={children}
          onReorder={(next: NavChild[]) => onPatch({ children: next })}
          className="space-y-1"
        >
          {children.map((child) => (
            <NavChildRow
              key={child.id}
              child={child}
              canDelete
              onPatch={(p) => onPatch({ children: children.map((x) => x.id === child.id ? { ...x, ...p } : x) })}
              onRemove={() => {
                const rest = children.filter((x) => x.id !== child.id);
                onPatch({ children: rest.length > 0 ? rest : undefined });
              }}
              c={c}
            />
          ))}
        </Reorder.Group>
      )}
    </Reorder.Item>
  );
}

function NavLinksEditor({ links, onChange, accent, c }: {
  links: NavLink[]; onChange: (v: NavLink[]) => void; accent: string; c: PanelPalette;
}) {
  const patch = (id: string, p: Partial<NavLink>) =>
    onChange(links.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const remove = (id: string) => {
    if (links.length <= 1) return;
    onChange(links.filter((l) => l.id !== id));
  };
  const atCapacity = links.length >= MAX_NAV_LINKS;
  const add = () => {
    if (atCapacity) return;
    onChange([...links, { id: navId(), label: "Yeni Menü", url: autoSlugUrl("Yeni Menü") }]);
  };

  return (
    <div className="space-y-2">
      <Reorder.Group axis="y" values={links} onReorder={onChange} className="space-y-1.5">
        {links.map((link) => (
          <NavParentRow
            key={link.id}
            link={link}
            canDelete={links.length > 1}
            onPatch={(p) => patch(link.id, p)}
            onRemove={() => remove(link.id)}
            c={c} accent={accent}
          />
        ))}
      </Reorder.Group>

      <button
        onClick={add}
        disabled={atCapacity}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ border: `1px dashed ${c.border}`, color: accent, fontFamily: PANEL_BODY_FONT }}
      >
        <Plus className="w-3.5 h-3.5" />
        Menü Elemanı Ekle
      </button>

      {/* Kapasite uyarısı — üst sınırda parlayan profesyonel uyarı */}
      <AnimatePresence>
        {atCapacity && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[11px] font-medium leading-relaxed"
            style={{
              background: "#DC26260F",
              border: "1px solid #DC262635",
              color: "#DC2626",
              boxShadow: "0 0 16px rgba(220,38,38,0.16)",
              fontFamily: PANEL_BODY_FONT,
            }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 animate-pulse" />
            <span>
              Maksimum menü kapasitesine ulaşıldı. Ziyaretçilerinizin ekran deneyimi için
              en fazla {MAX_NAV_LINKS} ana menü ekleyebilirsiniz.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-[10px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        Tutamaçtan sürükleyerek sıralayın; alt menüler kendi ebeveyni içinde sıralanır.
        Alt menülü elemanlar vitrinde açılır menüye dönüşür.
      </p>
    </div>
  );
}

// ─── HeroImageUploader — sürükle-bırak + mikro ilerleme çubuklu görsel alanı ──

function HeroImageUploader({ value, onChange, onError, accent, c }: {
  value: string; onChange: (v: string) => void; onError: (msg: string) => void;
  accent: string; c: PanelPalette;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { onError("Lütfen bir görsel dosyası seçin."); return; }
    if (file.size > 2.5 * 1024 * 1024) { onError("Hero görseli 2.5 MB'den küçük olmalıdır."); return; }
    const reader = new FileReader();
    setProgress(0);
    reader.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = () => {
      setProgress(100);
      setTimeout(() => { onChange(String(reader.result ?? "")); setProgress(null); }, 280);
    };
    reader.onerror = () => { setProgress(null); onError("Görsel okunamadı, tekrar deneyin."); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-xl overflow-hidden group" style={{ border: `1px solid ${c.borderSoft}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Hero görseli" className="w-full h-24 object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            title="Görseli kaldır (ürün görseline dön)"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
          className="w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-xl transition-all"
          style={{
            border: `1.5px dashed ${dragOver ? accent : c.border}`,
            background: dragOver ? `${accent}0D` : c.cardBgSoft,
          }}
        >
          <Upload className="w-4 h-4" style={{ color: dragOver ? accent : c.textSubtle }} />
          <span className="text-[11px] font-semibold" style={{ color: dragOver ? accent : c.textMuted, fontFamily: PANEL_BODY_FONT }}>
            {dragOver ? "Bırakın — anında uygulanır" : "Hero görselini sürükleyin veya tıklayın"}
          </span>
          <span className="text-[9px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            JPG · PNG · WEBP — max 2.5 MB
          </span>
        </button>
      )}

      {/* Mikro ilerleme çubuğu */}
      <AnimatePresence>
        {progress !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-1 rounded-full overflow-hidden" style={{ background: c.hover }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: accent }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}

function ToggleSetting({ label, checked, onChange, accent, c }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
  accent: string; c: PanelPalette;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-1 group"
      type="button"
    >
      <span className="text-xs font-medium" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
        {label}
      </span>
      <span
        className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200"
        style={{ background: checked ? accent : c.hover, border: `1px solid ${checked ? accent : c.border}` }}
      >
        <span
          className="absolute top-[1px] left-[1px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );
}

function AccordionSection({ icon, iconColor, title, c, children, defaultOpen = false }: {
  icon: React.ElementType; iconColor: string; title: string;
  c: PanelPalette; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl" style={{ border: `1px solid ${c.borderSoft}`, background: c.cardBgSoft }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-3.5 py-3"
        type="button"
      >
        <SettingLabel icon={icon} iconColor={iconColor} title={title} c={c} />
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200 flex-shrink-0"
          style={{ color: c.textSubtle, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FontSelect({ label, value, onChange, c }: {
  label: string; value: string; onChange: (v: string) => void; c: PanelPalette;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium block" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none cursor-pointer appearance-none"
        style={{ ...inputStyle(c), fontFamily: themeFontStack(value) ?? PANEL_BODY_FONT }}
      >
        <option value="">Tema Varsayılanı</option>
        {THEME_FONT_NAMES.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      {value && (
        <p className="text-sm px-1 pt-0.5" style={{ color: c.textMuted, fontFamily: themeFontStack(value) ?? undefined }}>
          Önizleme — Şık vitrinler AaBbÇç 0123
        </p>
      )}
    </div>
  );
}

function LogoSetting({ value, onChange, c, onError }: {
  value: string; onChange: (v: string) => void; c: PanelPalette;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { onError("Lütfen bir görsel dosyası seçin."); return; }
    if (file.size > 1024 * 1024) { onError("Logo dosyası 1 MB'den küçük olmalıdır."); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2.5">
      <SettingLabel icon={ImageIcon} iconColor="#059669" title="Mağaza Logosu" c={c} />

      {value && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Logo önizleme" className="h-8 max-w-[140px] w-auto object-contain rounded" />
          <button
            onClick={() => onChange("")}
            className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#DC262612", border: "1px solid #DC262630" }}
            title="Logoyu kaldır"
          >
            <X className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
          </button>
        </div>
      )}

      <input
        type="text"
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…/logo.png"
        className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
        style={inputStyle(c)}
      />

      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold"
        style={{ background: c.hover, border: `1px dashed ${c.border}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}
      >
        <Upload className="w-3.5 h-3.5" />
        Bilgisayardan Yükle (max 1 MB)
      </button>
      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />
      <p className="text-[10px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        Logo yüklendiğinde vitrindeki metin logonun yerini alır.
      </p>
    </div>
  );
}

// ─── Canlı önizleme — StoreView'in birebir ikizi (yerel state'ten beslenir) ───

const WHY = [
  { icon: Truck, label: "Ücretsiz Kargo",   sub: "Sigortalı & özel ambalaj" },
  { icon: Award, label: "El Yapımı Kalite", sub: "Ustaların imzasıyla" },
  { icon: Gem,   label: "1. Sınıf Malzeme", sub: "Doğal & dayanıklı" },
];

function PreviewStore({ s, store, device }: { s: EditorSettings; store: Store | null; device: DeviceMode }) {
  const isMobile = device === "mobile";
  // Baz tema — editördeki seçimden gelir (yerel state → sıfır gecikme iskelet değişimi).
  // applyThemeSettings ile gece modu dahil gerçek vitrin motoruyla aynı palet üretilir.
  const themeId: ThemeId = s.themeId;
  const tsPreview: StoreThemeSettings = {
    primary_color: s.primaryColor,
    button_radius: s.buttonRadius,
    font_heading:  s.fontHeading || null,
    font_body:     s.fontBody    || null,
    dark_mode:     s.darkMode,
  };
  const t      = applyThemeSettings(THEMES[themeId], tsPreview);
  const layout = themeId === "luxury" ? "luxury" : themeId === "artisan" ? "artisan" : "tech";

  const headingFont =
    themeFontStack(s.fontHeading) ??
    (layout === "luxury" ? '"DM Serif Display", Georgia, serif'
      : layout === "artisan" ? '"Lora", Georgia, serif'
      : t.fontFamily);
  const bodyFont = themeFontStack(s.fontBody) ?? t.fontFamilySans;

  const primary = s.primaryColor;
  const btnText = contrastText(primary);
  const radius  = `${s.buttonRadius}px`;

  const brand        = s.storeName.trim() || store?.store_name || "Mağazam";
  const productName  = store?.seo_title ?? store?.store_name ?? brand;
  const heroTitle    = s.heroTitle.trim() || productName;
  const heroSubtitle = s.heroSubtitle.trim() || store?.description?.trim() || SLOGAN;
  const heroImage    = s.heroImageUrl || store?.image_urls?.[0] || null;
  const galleryImage = store?.image_urls?.[1] ?? store?.image_urls?.[0] ?? null;

  const price = store?.product_price ?? 0;
  const priceStr = store?.currency === "USD"
    ? "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2 })
    : price.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

  const features = (store?.features ?? []).slice(0, 3);

  // StoreView'deki layout'a özgü hero overlay gradyanları
  const layoutOverlay =
    layout === "luxury"  ? "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.78) 100%)"
    : layout === "artisan" ? "linear-gradient(150deg, rgba(61,51,38,0.60) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.70) 100%)"
    : "linear-gradient(105deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.08) 100%)";

  return (
    <div className="w-full flex flex-col overflow-hidden" style={{ background: t.bgColor, fontFamily: bodyFont }}>

      {/* ── Duyuru barı — opsiyonel flash-sale geri sayımıyla ── */}
      {s.announcementText.trim() !== "" && (
        <div className="px-4 py-2 text-center text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
          style={{ background: primary, color: btnText }}>
          <Sparkles className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{s.announcementText}</span>
          {s.showCountdown && <CountdownTimer color={btnText} />}
        </div>
      )}

      {/* ── HERO — StoreView ikizi: full-bleed görsel + transparan header ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 440 }}>

        <div className="absolute inset-0" style={{ background: t.galleryBg }} />
        {heroImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={heroImage} alt={heroTitle} className="absolute inset-0 w-full h-full object-cover object-center" />
        )}

        {/* Layout'a özgü gradyan + kullanıcı tanımlı ek karartma */}
        <div className="absolute inset-0" style={{ background: layoutOverlay }} />
        {s.heroOverlay > 0 && (
          <div className="absolute inset-0" style={{ background: "#000000", opacity: Math.min(s.heroOverlay, 90) / 100 }} />
        )}

        {/* Transparan header — ayrışmış flex grupları, çakışmasız yerleşim */}
        <div className="absolute top-0 inset-x-0 flex items-center px-6 h-14 z-10">
          {/* Sol yerleşimde marka önce */}
          {s.headerLayout === "left" && (
            s.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={s.logoUrl} alt={brand} className="h-6 w-auto object-contain mr-3 flex-shrink-0" />
            ) : s.storeName.trim() ? (
              <span className="text-xs font-black tracking-[0.3em] uppercase truncate max-w-[40%] mr-3 flex-shrink-0"
                style={{ color: "#FFFFFF", fontFamily: headingFont }}>
                {s.storeName.trim()}
              </span>
            ) : null
          )}
          {!isMobile && (
            <nav className={`flex items-center gap-2.5 xl:gap-4 flex-1 min-w-0 ${s.headerLayout === "left" ? "justify-end" : ""}`}>
              {s.navLinks.slice(0, 6).map((item) => (
                <span key={item.id} className="relative group flex items-center gap-0.5 text-[10px] font-medium tracking-wide cursor-default"
                  style={{ color: "rgba(255,255,255,0.85)" }}>
                  <span className="truncate max-w-[58px] xl:max-w-[80px]">{item.label}</span>
                  {item.children && item.children.length > 0 && (
                    <>
                      <ChevronDown className="w-2.5 h-2.5 flex-shrink-0 transition-transform group-hover:rotate-180" />
                      {/* Hover'da açılır alt menü — mikro etkileşim */}
                      <span
                        className="absolute left-0 top-full mt-1.5 hidden group-hover:flex flex-col min-w-[110px] rounded-lg py-1 z-30"
                        style={{
                          background: "rgba(12,12,16,0.92)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.14)",
                          boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                        }}
                      >
                        {item.children.map((child) => (
                          /* Önizlemede yönlendirme simüle edilir — tıklama hissi canlı, rota değişmez */
                          <a
                            key={child.id}
                            href={child.url}
                            onClick={(e) => e.preventDefault()}
                            className="px-3 py-1.5 text-[9px] font-medium hover:opacity-70 active:opacity-50 transition-opacity cursor-pointer"
                            style={{ color: "rgba(255,255,255,0.88)", textDecoration: "none" }}
                            title={child.url}
                          >
                            {child.label}
                          </a>
                        ))}
                      </span>
                    </>
                  )}
                </span>
              ))}
            </nav>
          )}
          {/* Orta yerleşimde marka üç bölgeli flex'in merkezinde */}
          {s.headerLayout === "center" && (
            s.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={s.logoUrl} alt={brand} className="h-6 w-auto object-contain mx-2 flex-shrink-0" />
            ) : s.storeName.trim() ? (
              <span className="text-xs font-black tracking-[0.3em] uppercase truncate max-w-[40%] mx-2 flex-shrink-0"
                style={{ color: "#FFFFFF", fontFamily: headingFont }}>
                {s.storeName.trim()}
              </span>
            ) : null
          )}
          <div className={`flex justify-end items-center gap-2.5 ${s.headerLayout === "center" ? "flex-1" : "flex-shrink-0 ml-3"}`}>
            {/* Para birimi seçici */}
            {s.showCurrencySelector && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                style={{ color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.35)" }}>
                {store?.currency ?? "TRY"} <ChevronDown className="w-2.5 h-2.5" />
              </span>
            )}
            <div className="relative">
              <ShoppingBag className="w-4 h-4" style={{ color: "#FFFFFF" }} />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[8px] font-extrabold flex items-center justify-center"
                style={{ background: primary, color: btnText }}>
                2
              </span>
            </div>
          </div>
        </div>

        {/* Alt-orta caption — luxury hizalaması (vivinth görünümü) */}
        <div className="absolute inset-x-0 bottom-0 px-8 pb-9 flex flex-col items-center text-center z-10">
          <p className="text-[8px] font-bold tracking-[0.35em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
            {brand} · El Yapımı Koleksiyon
          </p>
          <h2
            className="leading-[1.05] tracking-tight mb-3 max-w-lg"
            style={{
              color: "#FFFFFF", fontFamily: headingFont,
              fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)",
              fontWeight: layout === "luxury" ? 400 : layout === "artisan" ? 600 : 800,
            }}
          >
            {heroTitle}
          </h2>
          <p className="text-[11px] leading-relaxed mb-5 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
            {heroSubtitle}
          </p>
          <span
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold tracking-wide"
            style={{
              background: "rgba(255,255,255,0.14)", color: "#FFFFFF",
              border: "1.5px solid rgba(255,255,255,0.45)",
              borderRadius: radius, backdropFilter: "blur(12px)",
            }}
          >
            Koleksiyonu Keşfet <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* ── SATIN ALMA BÖLÜMÜ — gerçek ürün verisiyle ── */}
      <div className={`grid gap-6 items-center px-6 py-7 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3", background: t.cardBg, borderRadius: 14 }}>
          {galleryImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={galleryImage} alt={productName} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: t.galleryBg }}>
              <ShoppingBag className="w-8 h-8" style={{ color: primary, opacity: 0.35 }} />
            </div>
          )}
        </div>

        <div>
          <p className="text-[9px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: primary }}>
            {brand} Atölyesi
          </p>
          <h3 className="text-lg leading-snug mb-1.5" style={{ color: t.titleColor, fontFamily: headingFont, fontWeight: 600 }}>
            {productName}
          </h3>
          <p className="text-base font-bold mb-3.5" style={{ color: t.priceColor }}>{priceStr}</p>

          {features.length > 0 && (
            <ul className="space-y-1.5 mb-5">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[11px]" style={{ color: t.textColor }}>
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: primary }} />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-bold"
              style={{ background: "transparent", border: `1.5px solid ${primary}`, color: primary, borderRadius: radius }}
            >
              Sepete Ekle
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-bold"
              style={{ background: primary, color: btnText, borderRadius: radius, boxShadow: `0 6px 18px ${primary}45` }}
            >
              Hemen Al <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ── NEDEN BİZ şeridi ── */}
      <div className="grid grid-cols-3 gap-3 px-6 py-5" style={{ background: t.cardBg, borderTop: `1px solid ${t.borderColor}` }}>
        {WHY.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center text-center gap-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${primary}14` }}>
              <Icon className="w-3.5 h-3.5" style={{ color: primary }} />
            </div>
            <p className="text-[10px] font-bold" style={{ color: t.titleColor }}>{label}</p>
            <p className="text-[9px]" style={{ color: t.subtleText }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Footer — sosyal ikonlar yalnızca URL girildiyse aktifleşir ── */}
      <div className="px-6 py-5 text-center" style={{ background: t.footerBg }}>
        <p className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.85)", fontFamily: headingFont }}>
          {brand}
        </p>
        {(() => {
          const socials = [
            { Icon: Instagram, url: s.socialInstagram.trim() },
            { Icon: Twitter,   url: s.socialTwitter.trim() },
            { Icon: Facebook,  url: s.socialFacebook.trim() },
          ].filter((x) => x.url);
          return socials.length > 0 ? (
            <div className="flex items-center justify-center gap-4 mt-2.5">
              {socials.map(({ Icon }, i) => (
                <Icon key={i} className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.55)" }} />
              ))}
            </div>
          ) : null;
        })()}
        <p className="text-[9px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          © 2026 {brand} · Optiefy altyapısıyla
        </p>
      </div>
    </div>
  );
}

// ─── Sayfa ───────────────────────────────────────────────────────────────────

export default function TasarimPage() {
  const { c } = usePanelTheme();
  const { activeStore, refreshStores } = useActiveStore();

  const [settings,   setSettings]   = useState<EditorSettings>(FALLBACK_SETTINGS);
  const [baseline,   setBaseline]   = useState<EditorSettings>(FALLBACK_SETTINGS);
  const [publishing, setPublishing] = useState(false);
  const [fb,         setFb]         = useState<FeedbackState>(null);
  const [device,     setDevice]     = useState<DeviceMode>("desktop");

  // Aktif mağaza değişince editörü + baseline'ı DB haliyle senkronize et
  useEffect(() => {
    if (!activeStore) return;
    const snapshot = fromStore(activeStore);
    setSettings(snapshot);
    setBaseline(snapshot);
    setFb(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore?.id]);

  const set = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(baseline),
    [settings, baseline],
  );

  const handleDiscard = () => {
    setSettings(baseline);
    setFb(null);
  };

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
          id:         activeStore.id,
          // Alan boş bırakıldıysa DB'deki kanonik ad korunur (panel/siparişler için gerekli);
          // vitrinde gizleme hide_store_name bayrağıyla yapılır — zorunlu isim dayatılmaz.
          store_name: settings.storeName.trim() || activeStore.store_name,
          theme:      settings.themeId, // baz tema — özelleştirmelerle aynı PATCH'te
          theme_settings: {
            announcement_text: settings.announcementText,
            primary_color:     settings.primaryColor,
            button_radius:     settings.buttonRadius,
            font_heading:      settings.fontHeading  || null,
            font_body:         settings.fontBody     || null,
            hero_title:        settings.heroTitle    || null,
            hero_subtitle:     settings.heroSubtitle || null,
            hero_overlay:      settings.heroOverlay,
            logo_url:          settings.logoUrl      || null,
            show_countdown:         settings.showCountdown,
            show_currency_selector: settings.showCurrencySelector,
            social_instagram:  normalizeUrl(settings.socialInstagram),
            social_twitter:    normalizeUrl(settings.socialTwitter),
            social_facebook:   normalizeUrl(settings.socialFacebook),
            // Editör-içi id'ler atılır — DB'ye yalın {label, url, children?} yazılır
            hide_store_name: settings.storeName.trim() === "",
            header_layout:   settings.headerLayout,
            nav_links: settings.navLinks.map(({ label, url, children }) => ({
              label, url,
              ...(children?.length
                ? { children: children.map((child) => ({ label: child.label, url: child.url })) }
                : {}),
            })),
            hero_image_url: settings.heroImageUrl || null,
            dark_mode:      settings.darkMode,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setBaseline(settings); // dirty bar kapanır
      await refreshStores(true);
      setFb({ type: "success", message: "Tasarım yayınlandı — vitrininiz güncellendi." });
    } catch {
      setFb({ type: "error", message: "Yayınlama başarısız oldu. Lütfen tekrar deneyin." });
    }
    setPublishing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">

      {/* Başlık */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
          Canlı Tema Editörü
        </h1>
        <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          Vitrininizi kişiselleştirin — her değişiklik sağdaki gerçek vitrin ikizinde anında görünür.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start"
      >

        {/* ── Sol sütun: Ayar Paneli ─────────────────────────────────── */}
        <div className="rounded-2xl lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto" style={sectionCard(c)}>
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

            <ThemePicker value={settings.themeId} onChange={(v) => set("themeId", v)} c={c} />

            <div className="space-y-2.5">
              <TextSetting
                icon={StoreIcon} iconColor="#7C3AED" title="Mağaza Adı"
                value={settings.storeName}
                onChange={(v) => set("storeName", v)}
                placeholder="Boş bırakılırsa vitrinde isim gizlenir" c={c}
              />
              {/* Yerleşim seçici — marka/logo konumu */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  Mağaza Adı / Logosu Nerede Dursun?
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { key: "left"   as const, Icon: AlignLeft,   label: "Sol — menüler sağda" },
                    { key: "center" as const, Icon: AlignCenter, label: "Orta — menüler solda" },
                  ]).map(({ key, Icon, label }) => {
                    const active = settings.headerLayout === key;
                    return (
                      <button
                        key={key}
                        onClick={() => set("headerLayout", key)}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: active ? `${settings.primaryColor}14` : c.cardBgSoft,
                          border: active ? `1.5px solid ${settings.primaryColor}` : `1px solid ${c.borderSoft}`,
                          color: active ? settings.primaryColor : c.textMuted,
                          fontFamily: PANEL_BODY_FONT,
                        }}
                      >
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <LogoSetting
              value={settings.logoUrl}
              onChange={(v) => set("logoUrl", v)}
              onError={(msg) => setFb({ type: "error", message: msg })}
              c={c}
            />

            <div className="space-y-3">
              <TextSetting
                icon={Megaphone} iconColor="#F59E0B" title="Duyuru Barı Metni"
                value={settings.announcementText}
                onChange={(v) => set("announcementText", v)}
                placeholder="Örn: 2000 TL üzeri ücretsiz kargo!" c={c}
              />
              <ToggleSetting
                label="Geri Sayım Sayacı Göster (Flash Sale)"
                checked={settings.showCountdown}
                onChange={(v) => set("showCountdown", v)}
                accent={settings.primaryColor} c={c}
              />
            </div>

            {/* ── Navigasyon Menüsü Yönetimi ── */}
            <AccordionSection icon={MenuIcon} iconColor="#0EA5E9" title="Navigasyon Menüsü Yönetimi" c={c}>
              <NavLinksEditor
                links={settings.navLinks}
                onChange={(v) => set("navLinks", v)}
                accent={settings.primaryColor} c={c}
              />
            </AccordionSection>

            <ColorSetting value={settings.primaryColor} onChange={(v) => set("primaryColor", v)} c={c} />

            {/* ── Buton karakteri: tek tık preset + ince ayar slider'ı ── */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {RADIUS_PRESETS.map(({ label, value }) => {
                  const active = settings.buttonRadius === value;
                  return (
                    <button
                      key={label}
                      onClick={() => set("buttonRadius", value)}
                      className="px-2 py-2 text-[10px] font-bold leading-tight transition-all"
                      style={{
                        borderRadius: Math.max(value, 6),
                        background: active ? `${settings.primaryColor}14` : c.cardBgSoft,
                        border: active ? `1.5px solid ${settings.primaryColor}` : `1px solid ${c.borderSoft}`,
                        color: active ? settings.primaryColor : c.textMuted,
                        fontFamily: PANEL_BODY_FONT,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <SliderSetting
                icon={Circle} iconColor="#0EA5E9" title="Buton Köşe Yuvarlaklığı"
                value={settings.buttonRadius} onChange={(v) => set("buttonRadius", v)}
                min={0} max={28} unit="px" marks={["Keskin", "Yumuşak", "Hap (Pill)"]}
                accent={settings.primaryColor} c={c}
              />
            </div>

            {/* ── Tipografi: hazır eşleşmeler + ince ayar ── */}
            <div className="space-y-3">
              <SettingLabel icon={Type} iconColor="#8B5CF6" title="Tipografi" c={c} />
              <div className="grid grid-cols-3 gap-1.5">
                {FONT_PAIRINGS.map(({ name, heading, body }) => {
                  const active = settings.fontHeading === heading && settings.fontBody === body;
                  return (
                    <button
                      key={name}
                      onClick={() => { set("fontHeading", heading); set("fontBody", body); }}
                      className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl transition-all"
                      style={{
                        background: active ? `${settings.primaryColor}14` : c.cardBgSoft,
                        border: active ? `1.5px solid ${settings.primaryColor}` : `1px solid ${c.borderSoft}`,
                      }}
                    >
                      <span className="text-base leading-none" style={{ fontFamily: themeFontStack(heading) ?? undefined, color: active ? settings.primaryColor : c.text }}>
                        Aa
                      </span>
                      <span className="text-[9px] font-semibold leading-tight text-center"
                        style={{ fontFamily: themeFontStack(body) ?? undefined, color: active ? settings.primaryColor : c.textSubtle }}>
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FontSelect label="Başlık Fontu (Headings)" value={settings.fontHeading} onChange={(v) => set("fontHeading", v)} c={c} />
              <FontSelect label="Gövde Fontu (Body)"      value={settings.fontBody}    onChange={(v) => set("fontBody", v)}    c={c} />
            </div>

            {/* ── Ana Sayfa Kahraman (Hero) Alanı ── */}
            <div className="space-y-4">
              <SettingLabel icon={LayoutTemplate} iconColor="#0891B2" title="Ana Sayfa Kahraman (Hero) Alanı" c={c} />

              {/* Görsel değiştirici — sürükle-bırak + mikro progress bar */}
              <HeroImageUploader
                value={settings.heroImageUrl}
                onChange={(v) => set("heroImageUrl", v)}
                onError={(msg) => setFb({ type: "error", message: msg })}
                accent={settings.primaryColor} c={c}
              />

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium block" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  Büyük Başlık — boş bırakılırsa ürün adı kullanılır
                </label>
                <input
                  type="text"
                  value={settings.heroTitle}
                  onChange={(e) => set("heroTitle", e.target.value)}
                  placeholder="Örn: El Yapımı Desenli Metal Kase"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={inputStyle(c)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium block" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  Alt Açıklama
                </label>
                <textarea
                  value={settings.heroSubtitle}
                  onChange={(e) => set("heroSubtitle", e.target.value)}
                  placeholder="Örn: Sofralarınıza zarafet katın…"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                  style={inputStyle(c)}
                />
              </div>
              <SliderSetting
                icon={ImageIcon} iconColor="#64748B" title="Görsel Karartma"
                value={settings.heroOverlay} onChange={(v) => set("heroOverlay", v)}
                min={0} max={90} unit="%" marks={["Yok", "Dengeli", "Koyu"]}
                accent={settings.primaryColor} c={c}
              />
            </div>

            {/* ── Vitrin Görünümü ── */}
            <div className="space-y-3">
              <SettingLabel icon={Moon} iconColor="#6366F1" title="Vitrin Görünümü" c={c} />
              <ToggleSetting
                label="Canlı Karanlık Mod (Gece Vitrini)"
                checked={settings.darkMode}
                onChange={(v) => set("darkMode", v)}
                accent={settings.primaryColor} c={c}
              />
            </div>

            {/* ── Üst Menü Ayarları ── */}
            <div className="space-y-3">
              <SettingLabel icon={PanelTop} iconColor="#D946EF" title="Üst Menü Ayarları" c={c} />
              <ToggleSetting
                label="Para Birimi Seçiciyi Göster (TRY · USD · AUD)"
                checked={settings.showCurrencySelector}
                onChange={(v) => set("showCurrencySelector", v)}
                accent={settings.primaryColor} c={c}
              />
            </div>

            {/* ── Sosyal Medya Linkleri (Accordion) ── */}
            <AccordionSection icon={Instagram} iconColor="#E1306C" title="Sosyal Medya Linkleri" c={c}>
              {([
                { key: "socialInstagram" as const, Icon: Instagram, label: "Instagram", placeholder: "instagram.com/magazam" },
                { key: "socialTwitter"   as const, Icon: Twitter,   label: "Twitter / X", placeholder: "x.com/magazam" },
                { key: "socialFacebook"  as const, Icon: Facebook,  label: "Facebook", placeholder: "facebook.com/magazam" },
              ]).map(({ key, Icon, label, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[11px] font-medium flex items-center gap-1.5"
                    style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                    <Icon className="w-3 h-3" /> {label}
                  </label>
                  <input
                    type="text"
                    value={settings[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={inputStyle(c)}
                  />
                </div>
              ))}
              <p className="text-[10px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                URL girilen ikonlar vitrin footer&apos;ında aktifleşir; boş bırakılanlar gizlenir.
              </p>
            </AccordionSection>

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

            <p className="text-[10px] text-center" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Değişiklikler yalnızca yayınladığınızda vitrininize yansır.
            </p>
          </div>
        </div>

        {/* ── Sağ sütun: Canlı Önizleme (gerçek vitrin ikizi) ─────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-60" style={{ background: "#059669" }} />
              <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "#059669" }} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Canlı Önizleme
            </span>

            {/* Cihaz modu anahtarları */}
            <div className="flex items-center gap-0.5 ml-3 p-0.5 rounded-lg"
              style={{ background: c.hover, border: `1px solid ${c.borderSoft}` }}>
              {([
                { mode: "mobile"  as const, Icon: Smartphone, title: "Mobil (375px)" },
                { mode: "tablet"  as const, Icon: Tablet,     title: "Tablet (768px)" },
                { mode: "desktop" as const, Icon: Monitor,    title: "Masaüstü (tam genişlik)" },
              ]).map(({ mode, Icon, title }) => {
                const active = device === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setDevice(mode)}
                    title={title}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-200"
                    style={{
                      background: active ? c.cardBg : "transparent",
                      color: active ? c.accentText : c.textSubtle,
                      boxShadow: active ? c.shadow : "none",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>

            {activeStore?.custom_domain && (
              <span className="text-[10px] font-mono ml-auto" style={{ color: c.textSubtle }}>
                {activeStore.custom_domain}
              </span>
            )}
          </div>

          {/* Tarayıcı/cihaz çerçevesi — mod değişimi pürüzsüz animasyonla */}
          <div
            className="mx-auto w-full transition-all duration-500 ease-out"
            style={{ maxWidth: device === "mobile" ? 375 : device === "tablet" ? 768 : "100%" }}
          >
            <div
              className="rounded-2xl overflow-hidden transition-shadow duration-500"
              style={{
                border: `1px solid ${c.border}`,
                boxShadow: device === "mobile" ? "0 24px 64px rgba(0,0,0,0.22)" : c.shadowMd,
              }}
            >
              <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: c.cardBgSoft, borderBottom: `1px solid ${c.borderSoft}` }}>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34D399" }} />
                </div>
                <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono truncate"
                  style={{ background: c.inputBg, color: c.textSubtle }}>
                  🔒 {activeStore?.custom_domain ?? `${(settings.storeName.trim() || "magazam").toLowerCase().replace(/\s+/g, "")}.optiefy.com`}
                </div>
              </div>
              <PreviewStore s={settings} store={activeStore} device={device} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Kaydedilmemiş Değişiklikler — Shopify tarzı floating bar ── */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            key="dirty-bar"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
          >
            <div
              className="pointer-events-auto flex items-center gap-3 pl-4 pr-2.5 py-2.5 rounded-2xl flex-wrap justify-center"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
                boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
              }}
            >
              <span className="relative flex w-2 h-2 flex-shrink-0">
                <span className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-60" style={{ background: "#F59E0B" }} />
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
              </span>
              <span className="text-sm font-medium" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
                Kaydedilmemiş değişiklikleriniz var
              </span>
              <div className="flex items-center gap-2 ml-1">
                <button
                  onClick={handleDiscard}
                  disabled={publishing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: PANEL_BODY_FONT }}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  İptal Et
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {publishing ? "Yayınlanıyor…" : "Değişiklikleri Yayınla"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
