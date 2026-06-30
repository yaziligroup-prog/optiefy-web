"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  ShoppingCart,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  Truck,
  RefreshCcw,
  Instagram,
  Twitter,
  Facebook,
  Signal,
  Wifi,
  Battery,
} from "lucide-react";
import { THEMES, type ThemeId, type ThemeConfig } from "@/types/theme";

interface AiData {
  seo_title: string | null;
  description: string | null;
  features: string[] | null;
  image_urls: string[];
  recommended_theme?: ThemeId;
}

interface MobilePreviewProps {
  imageUrl: string;
  storeName: string;
  price: string;
  aiData?: AiData;
  activeTheme?: ThemeId;
  onThemeChange?: (theme: ThemeId) => void;
}

const COLORS = [
  { name: "Siyah", hex: "#1f2937" },
  { name: "Bej", hex: "#d4b896" },
  { name: "Lacivert", hex: "#1e3a5f" },
];

const ACCORDIONS = [
  {
    title: "Kargo ve Teslimat",
    content:
      "Siparişleriniz 1–3 iş günü içinde kargoya verilir. Tüm siparişlerde ücretsiz kargo geçerlidir. Kargo takip numaranız SMS ile bildirilecektir.",
  },
  {
    title: "İade Koşulları",
    content:
      "Ürünü teslim aldıktan sonra 14 gün içinde iade talebinde bulunabilirsiniz. Ürün orijinal ambalajında ve kullanılmamış olmalıdır. İade bedeli 3–5 iş günü içinde hesabınıza aktarılır.",
  },
  {
    title: "Garanti Şartları",
    content:
      "Tüm ürünlerimiz 2 yıl Türkiye garantisi kapsamındadır. Garanti kapsamında arıza çıkması halinde ücretsiz onarım veya yenisi ile değişim yapılmaktadır.",
  },
];

function AccordionItem({
  title,
  content,
  theme,
}: {
  title: string;
  content: string;
  theme: ThemeConfig;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 px-4 text-left"
        style={{ background: theme.bgColor }}
      >
        <span
          className="text-[11px] font-semibold"
          style={{ color: theme.textColor, fontFamily: theme.fontFamilySans }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-3 h-3 flex-shrink-0" style={{ color: theme.subtleText }} />
        ) : (
          <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: theme.subtleText }} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
            style={{ background: theme.bgColor }}
          >
            <p
              className="text-[10px] leading-relaxed px-4 pb-3"
              style={{ color: theme.subtleText, fontFamily: theme.fontFamilySans }}
            >
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatPrice(raw: string): { sale: string; original: string } {
  const num = parseFloat(raw.replace(",", "."));
  if (isNaN(num)) return { sale: raw, original: "" };
  return {
    sale: num.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL",
    original:
      (num * 1.25).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL",
  };
}

const THEME_LABELS: Record<ThemeId, string> = {
  luxury: "Lüks",
  modern: "Tech",
  artisan: "Artisan",
  dynamic: "Dinamik",
  corporate: "Kurumsal",
};

export default function MobilePreview({
  imageUrl,
  storeName,
  price,
  aiData,
  activeTheme: activeProp,
  onThemeChange,
}: MobilePreviewProps) {
  const [internalTheme, setInternalTheme] = useState<ThemeId>(
    activeProp ?? aiData?.recommended_theme ?? "modern"
  );
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const activeThemeId = activeProp ?? internalTheme;
  const t = THEMES[activeThemeId];

  const images = aiData?.image_urls?.length ? aiData.image_urls : [imageUrl];
  const title =
    aiData?.seo_title ?? (storeName ? `${storeName} — Premium Koleksiyon` : "Premium Ürün");
  const features = aiData?.features ?? [];
  const descParagraphs = aiData?.description
    ? aiData.description.split(/\n\n+/).filter(Boolean)
    : [];
  const { sale: salePrice, original: originalPrice } = formatPrice(price);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const nextImg = () => setActiveImg((i) => (i + 1) % images.length);
  const prevImg = () => setActiveImg((i) => (i - 1 + images.length) % images.length);

  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30) { if (diff > 0) nextImg(); else prevImg(); }
    setTouchStartX(null);
  };

  const handleThemeClick = (id: ThemeId) => {
    setInternalTheme(id);
    onThemeChange?.(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.1 }}
      className="flex flex-col items-center gap-4"
    >
      {/* Üst etiket */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5"
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 text-sm font-medium">
          Vitrin Önizlemesi — Kaydırarak İncele
        </span>
      </motion.div>

      {/* ── Tema Değiştirici ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2"
      >
        <span className="text-slate-500 text-xs font-medium">Tema:</span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {(Object.keys(THEMES) as ThemeId[]).map((id) => {
            const th = THEMES[id];
            const isActive = activeThemeId === id;
            return (
              <motion.button
                key={id}
                onClick={() => handleThemeClick(id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300"
                style={
                  isActive
                    ? {
                        background: `${th.accentColor}22`,
                        border: `1.5px solid ${th.accentColor}`,
                        color: th.accentColor,
                        boxShadow: `0 0 12px ${th.accentColor}30`,
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                        color: "#64748b",
                      }
                }
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: th.accentColor }}
                />
                {THEME_LABELS[id]}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── iPhone Mockup ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
        style={{ width: "300px" }}
      >
        <div
          className="relative rounded-[42px] overflow-hidden"
          style={{
            background: "#0f172a",
            border: "10px solid #1e293b",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.1), 0 30px 80px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Status bar */}
          <div className="relative bg-white flex items-center justify-between px-5 pt-3 pb-1.5">
            <span className="text-black text-xs font-semibold">9:41</span>
            <div
              className="absolute left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl"
              style={{ top: "-10px" }}
            />
            <div className="flex items-center gap-1">
              <Signal className="w-3 h-3 text-black" />
              <Wifi className="w-3 h-3 text-black" />
              <Battery className="w-4 h-3 text-black" />
            </div>
          </div>

          {/* ══ App İçeriği (scrollable) ══ */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeThemeId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-y-auto scrollbar-hide"
              style={{ maxHeight: "580px", background: t.bgColor }}
            >
              {/* ── 1. Header ── */}
              <header
                className="sticky top-0 z-10 flex items-center justify-between px-3.5 py-2.5"
                style={{
                  background: t.headerBg,
                  borderBottom: `1px solid ${t.borderColor}`,
                }}
              >
                <button className="p-1">
                  <Menu className="w-4 h-4" style={{ color: t.textColor }} />
                </button>
                <span
                  className="text-[11px] tracking-[0.2em] uppercase truncate max-w-[110px]"
                  style={{
                    fontFamily: t.fontFamily,
                    color: t.titleColor,
                    fontWeight: 900,
                    letterSpacing: "0.18em",
                  }}
                >
                  {storeName || "MAĞAZA"}
                </span>
                <div className="flex items-center gap-3">
                  <button>
                    <Search className="w-4 h-4" style={{ color: t.subtleText }} />
                  </button>
                  <button className="relative">
                    <ShoppingCart className="w-4 h-4" style={{ color: t.textColor }} />
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-extrabold flex items-center justify-center leading-none">
                      1
                    </span>
                  </button>
                </div>
              </header>

              {/* ── 2. Kampanya Banner ── */}
              <div
                className="text-center py-1.5 text-[10px] font-semibold tracking-wide text-white"
                style={{ background: t.bannerBg, backgroundSize: "200% 100%" }}
              >
                🎉 Tüm siparişlerde ücretsiz kargo!
              </div>

              {/* ── 3. Görsel Galerisi ── */}
              <div
                className="relative overflow-hidden"
                style={{ height: "230px", background: t.galleryBg }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {/* Işık hüzmesi */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 65% at 20% 10%, rgba(255,255,255,0.9) 0%, transparent 65%)",
                  }}
                />
                {/* Zemin yansıması */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    width: "55%",
                    height: "20px",
                    background: t.accentGlow,
                    filter: "blur(12px)",
                    borderRadius: "50%",
                  }}
                />

                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    src={images[activeImg] ?? imageUrl}
                    alt={title}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full object-contain p-8"
                    style={{ filter: `drop-shadow(0 8px 24px ${t.accentGlow})` }}
                  />
                </AnimatePresence>

                {/* AI rozeti */}
                {aiData && images.length > 0 && (
                  <div
                    className="absolute top-2.5 left-2.5 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm"
                    style={{
                      background: t.badgeBg,
                      border: `1px solid ${t.badgeBorder}`,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: t.accentColor }}
                    />
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: t.badgeText }}
                    >
                      AI Stüdyo
                    </span>
                  </div>
                )}

                {/* Dot indikatörler */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className="rounded-full transition-all duration-300"
                        style={
                          i === activeImg
                            ? { width: "16px", height: "6px", background: t.dotColor }
                            : { width: "6px", height: "6px", background: `${t.dotColor}60` }
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail şeridi */}
              {images.length > 1 && (
                <div className="flex gap-2 px-3.5 pt-3 pb-1" style={{ background: t.bgColor }}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className="flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        width: "50px",
                        height: "50px",
                        background: t.cardBg,
                        boxShadow:
                          i === activeImg
                            ? `0 0 0 2px ${t.ringColor}, 0 0 0 3px rgba(0,0,0,0.08)`
                            : "none",
                        opacity: i === activeImg ? 1 : 0.45,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Görsel ${i + 1}`}
                        className="w-full h-full object-contain p-1.5"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* ── 4. Ürün Bilgileri ── */}
              <div className="px-4 pt-3 pb-2" style={{ background: t.bgColor }}>
                {/* Yıldız */}
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-[10px] font-bold" style={{ color: t.textColor }}>
                    4.9
                  </span>
                  <span className="text-[10px]" style={{ color: t.subtleText }}>
                    (128 Değerlendirme)
                  </span>
                </div>

                {/* Mağaza etiketi */}
                <p
                  className="text-[8px] font-black tracking-[0.2em] uppercase mb-1"
                  style={{ color: t.storeTagColor, fontFamily: t.fontFamilySans }}
                >
                  {storeName || "Mağazanız"}
                </p>

                {/* Başlık */}
                <h1
                  className="text-[13px] font-extrabold leading-snug mb-3 tracking-tight"
                  style={{ color: t.titleColor, fontFamily: t.fontFamily }}
                >
                  {title}
                </h1>

                {/* Fiyat */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span
                    className="text-[20px] font-black leading-none"
                    style={{ color: t.priceColor, fontFamily: t.fontFamily }}
                  >
                    {salePrice}
                  </span>
                  {originalPrice && (
                    <span
                      className="text-[11px] line-through"
                      style={{ color: t.subtleText }}
                    >
                      {originalPrice}
                    </span>
                  )}
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-lg"
                    style={{
                      background: t.discountBg,
                      color: t.discountText,
                      border: `1px solid ${t.discountBorder}`,
                    }}
                  >
                    %20 İNDİRİM
                  </span>
                </div>

                {/* Renk seçici */}
                <div className="mb-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}
                    >
                      Renk:
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: t.textColor, fontFamily: t.fontFamilySans }}
                    >
                      {COLORS[selectedColor].name}
                    </span>
                  </div>
                  <div className="flex gap-2.5">
                    {COLORS.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(i)}
                        className="w-6 h-6 rounded-full shadow-sm transition-all duration-200"
                        style={{
                          background: c.hex,
                          boxShadow:
                            i === selectedColor
                              ? `0 0 0 2px white, 0 0 0 4px ${t.ringColor}`
                              : "none",
                          transform: i === selectedColor ? "scale(1.1)" : "scale(1)",
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 5. Satın Alma Butonları ── */}
              <div className="px-4 pb-4 pt-2" style={{ background: t.bgColor }}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    className="pointer-events-none py-2.5 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 opacity-90"
                    style={{
                      background: t.primaryBtn,
                      fontFamily: t.fontFamilySans,
                    }}
                  >
                    <ShoppingCart className="w-3 h-3" />
                    Sepete Ekle
                  </button>
                  <button
                    className="pointer-events-none py-2.5 rounded-xl text-[11px] font-bold text-white flex items-center justify-center opacity-90"
                    style={{
                      background: t.secondaryBtn,
                      boxShadow: `0 2px 10px ${t.accentGlow}`,
                      fontFamily: t.fontFamilySans,
                    }}
                  >
                    Hemen Al
                  </button>
                </div>

                {/* Güven rozetleri */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { Icon: Shield, label: "PayTR Güvenli" },
                    { Icon: Truck, label: "Ücretsiz Kargo" },
                    { Icon: RefreshCcw, label: "14 Gün İade" },
                  ].map(({ Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl"
                      style={{
                        background: t.cardBg,
                        border: `1px solid ${t.borderColor}`,
                      }}
                    >
                      <Icon className="w-3 h-3" style={{ color: t.featureIconColor }} />
                      <span
                        className="text-[8px] font-semibold text-center leading-tight"
                        style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ayırıcı blok */}
              <div style={{ height: "10px", background: t.cardBg, borderTop: `1px solid ${t.borderColor}`, borderBottom: `1px solid ${t.borderColor}` }} />

              {/* ── 6. Öne Çıkan Özellikler ── */}
              {features.length > 0 && (
                <div className="px-4 py-4" style={{ background: t.bgColor }}>
                  <h2
                    className="text-[10px] font-black uppercase tracking-[0.15em] mb-3"
                    style={{ color: t.textColor, fontFamily: t.fontFamilySans }}
                  >
                    Öne Çıkan Özellikler
                  </h2>
                  <div className="space-y-2.5">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                          style={{ color: t.featureIconColor }}
                        />
                        <span
                          className="text-[10px] leading-relaxed font-medium"
                          style={{ color: t.textColor, fontFamily: t.fontFamilySans }}
                        >
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 7. Ürün Hikayesi ── */}
              {descParagraphs.length > 0 && (
                <div className="px-4 py-4" style={{ background: t.cardBg }}>
                  <h2
                    className="text-[10px] font-black uppercase tracking-[0.15em] mb-3"
                    style={{ color: t.textColor, fontFamily: t.fontFamilySans }}
                  >
                    Ürün Hikayesi
                  </h2>
                  <div className="space-y-3">
                    {descParagraphs.map((p, i) => (
                      <p
                        key={i}
                        className="text-[10px] leading-relaxed"
                        style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Ayırıcı blok */}
              <div style={{ height: "10px", background: t.cardBg, borderTop: `1px solid ${t.borderColor}`, borderBottom: `1px solid ${t.borderColor}` }} />

              {/* ── 8. Akordeon Menüler ── */}
              <div style={{ background: t.bgColor }}>
                {ACCORDIONS.map((item) => (
                  <AccordionItem
                    key={item.title}
                    title={item.title}
                    content={item.content}
                    theme={t}
                  />
                ))}
              </div>

              {/* ── 9. Footer ── */}
              <footer className="text-white px-4 py-6" style={{ background: t.footerBg }}>
                <p
                  className="text-[11px] tracking-[0.22em] uppercase text-center text-white mb-4"
                  style={{ fontFamily: t.fontFamily, fontWeight: 900 }}
                >
                  {storeName || "MAĞAZA"}
                </p>

                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mb-4">
                  {[
                    "Hakkımızda",
                    "Bize Ulaşın",
                    "Mesafeli Satış Sözleşmesi",
                    "Gizlilik Politikası",
                    "İptal ve İade",
                  ].map((link) => (
                    <span
                      key={link}
                      className="text-[9px] text-gray-400 cursor-pointer hover:text-white transition-colors"
                      style={{ fontFamily: t.fontFamilySans }}
                    >
                      {link}
                    </span>
                  ))}
                </div>

                <div className="flex justify-center gap-4 mb-4">
                  <Instagram className="w-3.5 h-3.5 text-gray-500" />
                  <Twitter className="w-3.5 h-3.5 text-gray-500" />
                  <Facebook className="w-3.5 h-3.5 text-gray-500" />
                </div>

                <p className="text-[8px] text-gray-600 text-center" style={{ fontFamily: t.fontFamilySans }}>
                  © 2026 {storeName || "Mağaza"}. Tüm Hakları Saklıdır.
                </p>
              </footer>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Home bar */}
        <div className="flex justify-center mt-2">
          <div className="w-24 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Alt ışıltı */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-8 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${t.accentGlow} 0%, transparent 70%)`,
            filter: "blur(10px)",
          }}
        />
      </motion.div>

      {/* Mağaza linki */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <p className="text-slate-400 text-sm">
          Mağaza linkiniz:{" "}
          <span className="text-purple-400 font-mono">
            optiefy.com/{slugify(storeName || "magazaniz")}
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}
