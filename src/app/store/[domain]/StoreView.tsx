"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, ChevronDown,
  Truck, RefreshCcw, ShieldCheck, Gem, Award, Package,
  Instagram, Twitter, Facebook,
} from "lucide-react";
import { THEMES, type ThemeId, type ThemeConfig } from "@/types/theme";
import type { Store } from "@/types/store";
import { CartProvider, useCart } from "@/lib/cart";
import CartDrawer from "@/components/store/CartDrawer";
import CheckoutModal from "@/components/store/CheckoutModal";

interface Props {
  store: Store;
  overrideTheme?: ThemeId;
  previewMode?: boolean;
}

// ─── Layout variant derived from themeId ──────────────────────────────────────────
// luxury → centered hero, DM Serif, generous whitespace
// artisan → stacked buy layout, Lora, warm organic
// tech → left-aligned, Inter/sharp, split grid (modern / dynamic / corporate)

type LayoutVariant = "luxury" | "artisan" | "tech";

function getLayout(id: ThemeId): LayoutVariant {
  if (id === "luxury") return "luxury";
  if (id === "artisan") return "artisan";
  return "tech";
}

// ─── Static editorial content ─────────────────────────────────────────────────────

const SLOGAN = "Ustaların elinde şekillenen, zamana meydan okuyan bir tasarım.";

const ACCORDIONS = [
  { title: "Malzeme & Üretim", icon: Gem, content: "Her parça, birinci sınıf doğal malzemelerden ustalarımız tarafından tek tek el ile şekillendirilir. Hiçbir ürün bir diğerinin aynısı değildir — sahip olduğunuz, kendine has bir eserdir." },
  { title: "Kargo & Teslimat", icon: Truck, content: "Büyük boyutlu eserlerimiz, özel koruyucu ambalajla, sigortalı ve ücretsiz olarak 3–7 iş günü içinde adresinize ulaştırılır. Kurulum desteği talep üzerine sağlanır." },
  { title: "İade & Değişim", icon: RefreshCcw, content: "Teslimattan itibaren 14 gün boyunca koşulsuz iade hakkınız vardır. Eserin orijinal durumunda olması yeterlidir; iade bedeli 3–5 iş günü içinde iade edilir." },
  { title: "Güvenli Ödeme", icon: ShieldCheck, content: "PayTR altyapısıyla 3D Secure ve 256-bit SSL şifrelemesiyle korunan ödeme. Tüm Türk bankaları ve taksit seçenekleri desteklenir." },
];

const WHY = [
  { icon: Truck, label: "Ücretsiz Kargo",   sub: "Sigortalı & özel ambalaj" },
  { icon: Award, label: "El Yapımı Kalite", sub: "Ustaların imzasıyla" },
  { icon: Gem,   label: "1. Sınıf Malzeme", sub: "Doğal & zamana dayanıklı" },
];

// ─── Image fallback placeholder ───────────────────────────────────────────────────

function ImagePlaceholder({ theme, label, tall }: { theme: ThemeConfig; label?: string; tall?: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
      style={{ background: theme.galleryBg }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: tall ? 88 : 64,
          height: tall ? 88 : 64,
          borderRadius: 22,
          background: `${theme.accentColor}12`,
          border: `1.5px solid ${theme.borderColor}`,
        }}
      >
        <Package style={{ width: tall ? 40 : 28, height: tall ? 40 : 28, color: theme.accentColor, opacity: 0.45 }} />
      </div>
      {label && (
        <p
          className="text-xs font-semibold text-center px-4 max-w-[160px] leading-snug"
          style={{ color: theme.subtleText, fontFamily: theme.fontFamilySans }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

// ─── Fade-in image with error handling ───────────────────────────────────────────

function FadeImage({
  src, alt, className, style, fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback ?? null}</>;

  return (
    <>
      <motion.img
        src={src}
        alt={alt}
        className={className}
        style={style}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      {/* Show fallback while loading (before onLoad) */}
      {!loaded && !failed && <>{fallback ?? null}</>}
    </>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────────

function AccordionItem({
  title, content, icon: Icon, theme, defaultOpen,
}: {
  title: string; content: string; icon: React.ElementType; theme: ThemeConfig; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left">
        <div className="flex items-center gap-3.5">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: open ? theme.accentColor : theme.subtleText }} />
          <span className="text-sm font-semibold tracking-wide" style={{ color: open ? theme.titleColor : theme.textColor, fontFamily: theme.fontFamilySans }}>
            {title}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4" style={{ color: theme.subtleText }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.04, 0.62, 0.23, 0.98] }} className="overflow-hidden"
          >
            <p className="text-sm leading-[1.85] pb-6 pl-[30px] pr-2" style={{ color: theme.subtleText, fontFamily: theme.fontFamilySans }}>
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── StoreViewInner ───────────────────────────────────────────────────────────────

function StoreViewInner({ store, overrideTheme, previewMode }: Props) {
  const defaultTheme: ThemeId =
    overrideTheme && THEMES[overrideTheme]
      ? overrideTheme
      : store.theme && THEMES[store.theme as ThemeId]
      ? (store.theme as ThemeId)
      : "modern";

  const [themeId, setThemeId] = useState<ThemeId>(defaultTheme);

  // Hot-swap theme via postMessage from preview page iframe
  useEffect(() => {
    if (!previewMode) return;
    const handle = (e: MessageEvent) => {
      if (e.data?.type === "optiefy-preview-theme" && THEMES[e.data.theme as ThemeId]) {
        setThemeId(e.data.theme as ThemeId);
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [previewMode]);

  // ── Anonim ziyaret takibi — yalnızca gerçek vitrin yüklemelerinde ──
  // previewMode (panel önizleme iframe'i) sayılmaz. Oturum başına bir kez.
  useEffect(() => {
    if (previewMode || !store.id) return;
    const flag = `optiefy_tracked_${store.id}`;
    try { if (sessionStorage.getItem(flag)) return; sessionStorage.setItem(flag, "1"); } catch { /* ignore */ }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store.id, eventType: "view" }),
      keepalive: true,
    }).catch(() => { /* takip hatası sessiz */ });
  }, [previewMode, store.id]);

  // Dönüşüm hunisi etkinlik izleyici (cart/checkout — her tetiklemede kaydedilir)
  const trackEvent = (eventType: "add_to_cart" | "checkout") => {
    if (previewMode || !store.id) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store.id, eventType }),
      keepalive: true,
    }).catch(() => {});
  };

  const t      = THEMES[themeId];
  const layout = getLayout(themeId);

  const { addItem, openDrawer, openCheckout, count } = useCart();

  // ─── Derive display values from real DB data ───────────────────────────────────
  const brand = store.store_name;

  // Sadece aktif ürünler — status kolonu yoksa hepsini göster
  const aiProducts = (store.products ?? []).filter(
    (p) => !p.status || p.status === "active"
  );
  const productName = aiProducts[0]?.name ?? store.seo_title ?? store.store_name;

  // Price: prefer stored product_price; fallback to AI products[0].price if available
  const productPrice = store.product_price ?? aiProducts[0]?.price ?? 0;
  const isUSD = store.currency === "USD";
  const priceStr = isUSD
    ? "$" + productPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })
    : productPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

  // Images: check all possible sources in priority order
  function toDataUrl(raw: string): string {
    if (!raw) return "";
    return raw.startsWith("data:") ? raw : `data:image/jpeg;base64,${raw}`;
  }

  const images: string[] = (() => {
    if (store.image_urls?.length) return store.image_urls;
    if (store.product_image_base64) return [toDataUrl(store.product_image_base64)];
    const fromProducts = aiProducts
      .map((p) => p.image_url)
      .filter((u): u is string => !!u)
      .map(toDataUrl);
    if (fromProducts.length) return fromProducts;
    return [];
  })();

  // Description: the AI-generated seo_description stored in store.description
  const features    = store.features ?? [];
  // Use the full description (it's ≤160 chars — no split needed)
  const description = store.description?.trim() || null;

  // For the editorial story section (multi-paragraph long description, if ever present)
  const descParagraphs = store.description?.split(/\n\n+/).filter(Boolean) ?? [];

  const [activeImg,  setActiveImg]  = useState(0);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const buyRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setShowSticky(!e.isIntersecting && window.scrollY > 400),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollToBuy = () => buyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const heroImage   = images[0] ?? null;
  const buildItem   = () => ({ id: store.id, name: productName, price: productPrice, image: heroImage });
  const handleAddToCart = () => { addItem(buildItem()); openDrawer(); trackEvent("add_to_cart"); };
  const handleBuyNow    = () => { addItem(buildItem()); openCheckout(); trackEvent("checkout"); };

  // ─── Per-layout font tokens ────────────────────────────────────────────────────
  const luxurySerif  = '"DM Serif Display", Georgia, serif';
  const artisanSerif = '"Lora", Georgia, serif';
  const titleFont    = layout === "luxury" ? luxurySerif : layout === "artisan" ? artisanSerif : t.fontFamily;
  const heroSize     = layout === "luxury" ? "clamp(3rem, 9vw, 6.5rem)" : "clamp(2.6rem, 7vw, 5rem)";

  // Header icon color — white over full-bleed hero image, themed once scrolled
  const headerIconColor = scrolled ? t.titleColor : "#FFFFFF";

  // ─── RENDER ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{
        background:    t.bgColor,
        fontFamily:    t.fontFamilySans,
        paddingBottom: showSticky ? 72 : 0,
      }}
    >
      <CartDrawer
        theme={t}
        currency={store.currency}
        shippingFee={store.shipping_fee ?? 0}
        freeShippingThreshold={store.free_shipping_threshold ?? null}
      />
      <CheckoutModal
        theme={t}
        storeName={brand}
        storeId={store.id}
        currency={store.currency}
        shippingFee={store.shipping_fee ?? 0}
        freeShippingThreshold={store.free_shipping_threshold ?? null}
      />

      {/* ════ HEADER — fixed, scroll-aware ════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 transition-all duration-500"
        style={{
          height:              scrolled ? 64 : 84,
          background:          scrolled ? `${t.headerBg}f2` : "transparent",
          backdropFilter:      scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom:        scrolled ? `1px solid ${t.borderColor}` : "1px solid transparent",
        }}
      >
        <button onClick={() => setMenuOpen(true)} className="md:hidden -ml-1.5 p-1.5">
          <Menu className="w-5 h-5" style={{ color: headerIconColor }} />
        </button>

        <nav className="hidden md:flex items-center gap-9 flex-1">
          {["Koleksiyon", "Hikaye", "İletişim"].map((item) => (
            <a
              key={item} href="#"
              className="text-[13px] font-medium tracking-wide transition-opacity hover:opacity-50"
              style={{ color: scrolled ? t.textColor : "rgba(255,255,255,0.85)" }}
            >
              {item}
            </a>
          ))}
        </nav>

        <h1
          className="text-[15px] md:text-base font-black tracking-[0.3em] uppercase md:absolute md:left-1/2 md:-translate-x-1/2"
          style={{ color: headerIconColor, fontFamily: t.fontFamily }}
        >
          {brand}
        </h1>

        <div className="flex-1 flex justify-end">
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={openDrawer} className="relative p-1.5 -mr-1.5">
            <ShoppingBag className="w-5 h-5" style={{ color: headerIconColor }} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center text-white"
                  style={{ background: t.accentColor }}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 p-8 flex flex-col"
              style={{ background: t.bgColor }}
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-sm font-black tracking-[0.25em] uppercase" style={{ color: t.titleColor, fontFamily: t.fontFamily }}>{brand}</span>
                <button onClick={() => setMenuOpen(false)}><X className="w-5 h-5" style={{ color: t.subtleText }} /></button>
              </div>
              <nav className="flex flex-col">
                {["Ana Sayfa", "Koleksiyon", "Hikaye", "İletişim"].map((item) => (
                  <a
                    key={item} href="#" onClick={() => setMenuOpen(false)}
                    className="text-base py-4 transition-opacity hover:opacity-50"
                    style={{ color: t.textColor, borderBottom: `1px solid ${t.borderColor}`, fontFamily: t.fontFamilySans }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex items-center gap-5">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <a key={i} href="#"><Icon className="w-4 h-4" style={{ color: t.subtleText }} /></a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ HERO — full-bleed object-cover image, layout-specific caption ════ */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "100vh" }}>

        {/* Background — always object-cover; shows themed gradient while loading or on error */}
        <div className="absolute inset-0" style={{ background: t.galleryBg }} />
        {heroImage && (
          <FadeImage
            src={heroImage}
            alt={productName}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center" }}
          />
        )}

        {/* ── LUXURY: bottom-centered dark overlay ── */}
        {layout === "luxury" && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.78) 100%)" }}
          />
        )}

        {/* ── ARTISAN: warm amber-tinted overlay ── */}
        {layout === "artisan" && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(150deg, rgba(61,51,38,0.60) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.70) 100%)" }}
          />
        )}

        {/* ── TECH: left-dominant dark overlay ── */}
        {layout === "tech" && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(105deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.08) 100%)" }}
          />
        )}

        {/* Caption — anchored to bottom, layout-specific alignment */}
        <div
          className={`absolute inset-x-0 bottom-0 px-8 md:px-16 pb-20 md:pb-28 ${layout === "luxury" ? "flex flex-col items-center text-center" : ""}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className={layout === "luxury" ? "max-w-2xl w-full" : "max-w-2xl"}
          >
            {/* Eyebrow */}
            <p
              className="text-[11px] font-bold tracking-[0.35em] uppercase mb-5"
              style={{ color: layout === "luxury" ? "rgba(255,255,255,0.65)" : layout === "artisan" ? "rgba(255,229,190,0.85)" : t.accentColor }}
            >
              {brand} · {layout === "artisan" ? "Zanaat Koleksiyonu" : "El Yapımı Koleksiyon"}
            </p>

            {/* Main title */}
            <h2
              className="leading-[1.02] tracking-tight mb-6"
              style={{
                color:      "#FFFFFF",
                fontFamily: titleFont,
                fontSize:   heroSize,
                fontWeight: layout === "luxury" ? 400 : layout === "artisan" ? 600 : 800,
              }}
            >
              {productName}
            </h2>

            {/* Description from AI — fallback to static slogan */}
            <p
              className={`text-base md:text-lg leading-relaxed mb-9 ${layout === "luxury" ? "mx-auto max-w-md" : "max-w-lg"}`}
              style={{
                color:      layout === "artisan" ? "rgba(255,229,190,0.78)" : "rgba(255,255,255,0.75)",
                fontFamily: t.fontFamilySans,
              }}
            >
              {description ?? SLOGAN}
            </p>

            {/* CTA button — style varies by layout */}
            {layout === "luxury" ? (
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={scrollToBuy}
                className="inline-flex items-center gap-2.5 px-10 py-4 text-sm font-bold tracking-wide"
                style={{
                  background:  "rgba(255,255,255,0.14)",
                  color:       "#FFFFFF",
                  borderRadius: "9999px",
                  border:      "1.5px solid rgba(255,255,255,0.45)",
                  backdropFilter: "blur(12px)",
                }}
              >
                Koleksiyonu Keşfet <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ gap: "14px" }} whileTap={{ scale: 0.97 }}
                onClick={scrollToBuy}
                className="inline-flex items-center gap-2.5 px-8 py-4 text-sm font-bold"
                style={{
                  background:   layout === "artisan" ? t.primaryBtn : t.solidBtn,
                  color:        layout === "artisan" ? "#FBF7F0" : t.solidBtnText,
                  borderRadius: t.btnRadius,
                  boxShadow:    `0 8px 28px ${t.accentGlow}`,
                }}
              >
                Ürünü İncele <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ════ BUY SECTION ════ */}
      {layout === "artisan" ? (

        /* ── ARTISAN: stacked — full-width image banner then info column ── */
        <section ref={buyRef as React.RefObject<HTMLElement>} className="scroll-mt-24">

          {/* Full-bleed görsel — 16:10, object-cover → çerçevesiz, seamless */}
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: "16/10", background: t.bgColor }}
          >
            {images.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div key={activeImg} className="absolute inset-0"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                  <FadeImage
                    src={images[activeImg]}
                    alt={productName}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    fallback={<ImagePlaceholder theme={t} label={productName} tall />}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <ImagePlaceholder theme={t} label={productName} tall />
            )}
            {images.length > 1 && (
              <>
                {/* Apple tarzı frosty nav butonları — açık/koyu görsel üzerinde her ikisinde de görünür */}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(0,0,0,0.14)", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <ChevronLeft className="w-4 h-4" style={{ color: t.titleColor }} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(0,0,0,0.14)", border: "1px solid rgba(0,0,0,0.07)" }}>
                  <ChevronRight className="w-4 h-4" style={{ color: t.titleColor }} />
                </motion.button>
              </>
            )}
            {images.length > 1 && (
              <>
                <div
                  className="absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(8px)" }}
                >
                  <span className="text-[11px] font-semibold leading-none" style={{ color: "rgba(255,255,255,0.92)", fontFamily: t.fontFamilySans }}>
                    {activeImg + 1} / {images.length}
                  </span>
                </div>
                {/* Koyu pill içinde nokta göstergeler — beyaz ürün fotoğrafları üzerinde görünür */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.26)", backdropFilter: "blur(8px)" }}>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      style={{
                        width:      i === activeImg ? 18 : 5,
                        height:     5,
                        borderRadius: 3,
                        background: i === activeImg ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.40)",
                        transition: "all 0.25s ease",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip — sayfa arka planıyla tam eşleşme */}
          {images.length > 1 && (
            <div className="flex gap-2 px-6 md:px-12 py-3 overflow-x-auto" style={{ background: t.bgColor }}>
              {images.map((img, i) => (
                <motion.button key={i} onClick={() => setActiveImg(i)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex-shrink-0 overflow-hidden rounded-xl"
                  style={{ width: 64, height: 64, background: t.bgColor, border: `2px solid ${i === activeImg ? t.ringColor : t.borderColor}`, opacity: i === activeImg ? 1 : 0.55 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${i + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          )}

          {/* Info — centered narrow column */}
          <div className="max-w-2xl mx-auto px-6 md:px-8 py-12 md:py-16">
            <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-4" style={{ color: t.storeTagColor }}>{brand}</p>
            <h3
              className="leading-[1.08] tracking-tight mb-5"
              style={{ color: t.titleColor, fontFamily: artisanSerif, fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600 }}
            >
              {productName}
            </h3>
            <div className="flex items-center gap-2.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.featureIconColor }} />
              <span className="text-sm tracking-wide" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>El yapımı · Doğal malzeme · Stokta mevcut</span>
            </div>
            <div className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: t.subtleText }}>Fiyat</p>
              <p className="font-bold leading-none" style={{ color: t.priceColor, fontFamily: artisanSerif, fontSize: "clamp(2rem, 4vw, 2.8rem)" }}>
                {priceStr}
              </p>
            </div>
            <div className="h-px w-full mb-7" style={{ background: t.borderColor }} />
            {/* AI-generated description */}
            {description && (
              <p className="text-[15px] leading-[1.9] mb-6" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>
                {description}
              </p>
            )}
            {/* AI-generated features as inline bullets */}
            {features.length > 0 && (
              <ul className="space-y-2 mb-8">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-snug" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>
                    <span className="mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.accentColor }} />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mb-7">
              <motion.button onClick={handleAddToCart}
                whileHover={{ backgroundColor: t.ghostHoverBg, color: t.ghostHoverText }} whileTap={{ scale: 0.97 }}
                className="flex-1 py-4 text-[15px] font-bold flex items-center justify-center gap-2"
                style={{ background: "transparent", border: `${t.ghostBorderWidth} solid ${t.ghostBorder}`, color: t.ghostText, borderRadius: t.btnRadius }}>
                <ShoppingBag className="w-4 h-4" /> Sepete Ekle
              </motion.button>
              <motion.button onClick={handleBuyNow}
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                className="flex-1 py-4 text-[15px] font-bold flex items-center justify-center gap-2"
                style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius, boxShadow: `0 8px 24px ${t.accentGlow}` }}>
                Hemen Al <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-10">
              {[{ Icon: Truck, label: "Ücretsiz kargo" }, { Icon: RefreshCcw, label: "14 gün iade" }, { Icon: ShieldCheck, label: "Güvenli ödeme" }].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: t.featureIconColor }} />
                  <span className="text-xs font-medium" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>{label}</span>
                </div>
              ))}
            </div>
            <div>
              {ACCORDIONS.map((item, i) => (
                <AccordionItem key={item.title} title={item.title} content={item.content} icon={item.icon} theme={t} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </section>

      ) : (

        /* ── LUXURY / TECH: split 2-col grid ── */
        <section ref={buyRef as React.RefObject<HTMLElement>} className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-36 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-24 items-start">

            {/* LEFT — gallery (sticky) */}
            <div className="md:sticky md:top-28 md:self-start space-y-5">
              {/* Sabit 1:1 kare container — max 520px × 90vw → görsel asla taşmaz */}
              <div
                className="relative overflow-hidden w-full"
                style={{
                  background:   t.galleryBg,
                  aspectRatio:  "1 / 1",
                  maxHeight:    "min(520px, 90vw)",
                  borderRadius: layout === "luxury" ? "4px" : "28px",
                }}
              >
                {images.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div key={activeImg} className="absolute inset-0"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                      <FadeImage
                        src={images[activeImg]}
                        alt={productName}
                        /* object-contain → tüm ürün görünür, kırpılmaz */
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ padding: "12px" }}
                        fallback={<ImagePlaceholder theme={t} label={productName} tall />}
                      />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <ImagePlaceholder theme={t} label={productName} tall />
                )}

                {images.length > 1 && (
                  <>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: `${t.bgColor}e6`, backdropFilter: "blur(8px)", border: `1px solid ${t.borderColor}` }}>
                      <ChevronLeft className="w-4 h-4" style={{ color: t.titleColor }} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: `${t.bgColor}e6`, backdropFilter: "blur(8px)", border: `1px solid ${t.borderColor}` }}>
                      <ChevronRight className="w-4 h-4" style={{ color: t.titleColor }} />
                    </motion.button>
                  </>
                )}
                {images.length > 1 && (
                  <>
                    <div
                      className="absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(8px)" }}
                    >
                      <span className="text-[11px] font-semibold leading-none" style={{ color: "rgba(255,255,255,0.92)", fontFamily: t.fontFamilySans }}>
                        {activeImg + 1} / {images.length}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          style={{
                            width:      i === activeImg ? 20 : 6,
                            height:     6,
                            borderRadius: 3,
                            background: i === activeImg ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
                            transition: "all 0.25s ease",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveImg(i)}
                      className="flex-shrink-0 overflow-hidden transition-all"
                      style={{
                        width:        84,
                        height:       84,
                        background:   t.cardBg,
                        borderRadius: layout === "luxury" ? "4px" : "16px",
                        border:       `2px solid ${i === activeImg ? t.ringColor : "transparent"}`,
                        opacity:      i === activeImg ? 1 : 0.5,
                      }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`${i + 1}`} className="w-full h-full object-contain" style={{ padding: "4px" }} />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — buy panel */}
            <div className={`flex flex-col ${layout === "luxury" ? "items-center text-center" : ""}`}>
              <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-5" style={{ color: t.storeTagColor }}>
                {brand}
              </p>

              <h3
                className="leading-[1.08] tracking-tight mb-6"
                style={{
                  color:      t.titleColor,
                  fontFamily: titleFont,
                  fontSize:   "clamp(2rem, 4vw, 3.2rem)",
                  fontWeight: layout === "luxury" ? 400 : 800,
                }}
              >
                {productName}
              </h3>

              <div className={`flex items-center gap-2.5 mb-9 ${layout === "luxury" ? "justify-center" : ""}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.featureIconColor }} />
                <span className="text-sm tracking-wide" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                  El yapımı · Sınırlı üretim · Stokta mevcut
                </span>
              </div>

              <div className="mb-9">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: t.subtleText }}>Fiyat</p>
                <p
                  className="font-black leading-none"
                  style={{
                    color:      t.priceColor,
                    fontFamily: layout === "luxury" ? luxurySerif : t.fontFamily,
                    fontSize:   "clamp(2.2rem, 4vw, 3rem)",
                    fontWeight: layout === "luxury" ? 400 : 900,
                  }}
                >
                  {priceStr}
                </p>
              </div>

              <div className="h-px w-full mb-9" style={{ background: t.borderColor }} />

              {/* AI-generated store description */}
              {description && (
                <p
                  className="text-[15px] leading-[1.9] mb-6"
                  style={{ color: t.textColor, fontFamily: t.fontFamilySans }}
                >
                  {description}
                </p>
              )}
              {/* AI-generated features as inline bullet list */}
              {features.length > 0 && (
                <ul className={`space-y-2 mb-8 ${layout === "luxury" ? "text-center" : ""}`}>
                  {features.map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2.5 text-sm leading-snug ${layout === "luxury" ? "justify-center" : ""}`}
                      style={{ color: t.textColor, fontFamily: t.fontFamilySans }}
                    >
                      {layout !== "luxury" && (
                        <span className="mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.accentColor }} />
                      )}
                      {layout === "luxury" && (
                        <span style={{ color: t.accentColor, fontFamily: luxurySerif }}>·</span>
                      )}
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3.5 mb-8 w-full">
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ backgroundColor: t.ghostHoverBg, color: t.ghostHoverText }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-4 text-[15px] font-bold flex items-center justify-center gap-2.5"
                  style={{ background: "transparent", border: `${t.ghostBorderWidth} solid ${t.ghostBorder}`, color: t.ghostText, borderRadius: t.btnRadius }}
                >
                  <ShoppingBag className="w-4 h-4" /> Sepete Ekle
                </motion.button>
                <motion.button
                  onClick={handleBuyNow}
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-4 text-[15px] font-bold flex items-center justify-center gap-2"
                  style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius, boxShadow: `0 10px 32px ${t.accentGlow}` }}
                >
                  Hemen Al <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

              <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 mb-12 ${layout === "luxury" ? "justify-center" : ""}`}>
                {[{ Icon: Truck, label: "Ücretsiz kargo" }, { Icon: RefreshCcw, label: "14 gün iade" }, { Icon: ShieldCheck, label: "Güvenli ödeme" }].map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: t.featureIconColor }} />
                    <span className="text-xs font-medium" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>{label}</span>
                  </div>
                ))}
              </div>

              <div className="w-full">
                {ACCORDIONS.map((item, i) => (
                  <AccordionItem key={item.title} title={item.title} content={item.content} icon={item.icon} theme={t} defaultOpen={i === 0} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════ EDITORIAL STORY ════ */}
      {descParagraphs.length > 1 && (
        <section className="py-24 md:py-32" style={{ background: t.cardBg, borderTop: `1px solid ${t.borderColor}` }}>
          <div className={`max-w-3xl mx-auto px-6 md:px-10 ${layout === "luxury" ? "text-center" : ""}`}>
            <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-5" style={{ color: t.accentColor }}>Hikayemiz</p>
            <h3
              className="mb-14"
              style={{
                color:      t.titleColor,
                fontFamily: titleFont,
                fontSize:   "clamp(2rem, 4vw, 3rem)",
                fontWeight: layout === "luxury" ? 400 : 800,
              }}
            >
              {layout === "artisan" ? "Zanaatın Ardındaki Hikaye" : "Bir eserin ardındaki ustalık"}
            </h3>
            <div className="space-y-8 text-left">
              {descParagraphs.slice(1).map((p, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}
                  className="text-lg md:text-xl leading-[1.95]"
                  style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>
                  {p}
                </motion.p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ FEATURE SECTION — structure varies by layout ════ */}
      {features.length > 0 && (
        <section className="py-24 md:py-32" style={{ borderTop: `1px solid ${t.borderColor}` }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10">

            {layout === "luxury" && (
              /* Luxury: centered headings, large number labels */
              <>
                <div className="text-center mb-16">
                  <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-5" style={{ color: t.accentColor }}>Detaylar</p>
                  <h3 style={{ color: t.titleColor, fontFamily: luxurySerif, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400 }}>
                    Eseri özel kılan nitelikler
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                  {features.map((f, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }} transition={{ delay: (i % 2) * 0.08, duration: 0.5 }}
                      className="flex flex-col items-center text-center gap-4 pb-10"
                      style={{ borderBottom: `1px solid ${t.borderColor}` }}>
                      <span className="text-3xl" style={{ color: t.accentColor, fontFamily: luxurySerif, fontWeight: 400 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-base md:text-[17px] leading-[1.7]" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>{f}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {layout === "artisan" && (
              /* Artisan: organic rounded cards */
              <>
                <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-4" style={{ color: t.storeTagColor }}>Nitelikler</p>
                <h3 className="mb-12" style={{ color: t.titleColor, fontFamily: artisanSerif, fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 600 }}>
                  El emeği göz nuru
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {features.map((f, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-30px" }} transition={{ delay: i * 0.06, duration: 0.5 }}
                      className="p-6 rounded-2xl" style={{ background: t.cardBg, border: `1.5px solid ${t.borderColor}` }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4" style={{ background: `${t.accentColor}15` }}>
                        <span className="text-sm font-bold" style={{ color: t.accentColor }}>{i + 1}</span>
                      </div>
                      <p className="text-[15px] leading-[1.7]" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>{f}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {layout === "tech" && (
              /* Tech: left-aligned numbered list, sharp dividers */
              <>
                <div className="mb-14">
                  <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-4" style={{ color: t.accentColor }}>Detaylar</p>
                  <h3 className="font-extrabold" style={{ color: t.titleColor, fontFamily: t.fontFamily, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                    Teknik üstünlükler
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                  {features.map((f, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }} transition={{ delay: (i % 2) * 0.08, duration: 0.5 }}
                      className="flex items-start gap-5 pb-10"
                      style={{ borderBottom: `1px solid ${t.borderColor}` }}>
                      <span className="text-2xl font-black flex-shrink-0 leading-none pt-0.5" style={{ color: t.accentColor, fontFamily: t.fontFamily }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="text-base md:text-[17px] leading-[1.7]" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>{f}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ════ "NEDEN BİZ?" STRIP ════ */}
      <section
        className="py-20"
        style={{ background: t.cardBg, borderTop: `1px solid ${t.borderColor}`, borderBottom: `1px solid ${t.borderColor}` }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-10 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
          {WHY.map(({ icon: Icon, label, sub }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center">
              <div
                className="w-12 h-12 flex items-center justify-center mb-4"
                style={{
                  background:   `${t.accentColor}14`,
                  borderRadius: layout === "artisan" ? "50%" : layout === "luxury" ? "50%" : "16px",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: t.accentColor }} />
              </div>
              <p className="text-[15px] font-bold mb-1" style={{ color: t.titleColor, fontFamily: t.fontFamilySans }}>{label}</p>
              <p className="text-xs" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>{sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════ DİĞER ÜRÜNLER — sadece 2+ ürün varsa göster ════ */}
      {aiProducts.length > 1 && (
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ color: t.titleColor, fontFamily: t.fontFamily }}
          >
            Diğer Ürünler
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {aiProducts.slice(1).map((prod) => {
              const prodImg = prod.image_url ?? null;
              const prodPrice = prod.price ?? 0;
              const priceDisplay = store.currency === "USD"
                ? "$" + prodPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })
                : prodPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
              return (
                <motion.div
                  key={prod.id}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                  className="rounded-2xl overflow-hidden cursor-pointer"
                  style={{ background: t.cardBg ?? t.bgColor, border: `1px solid ${t.borderColor}` }}
                  onClick={() => {
                    addItem({ id: prod.id, name: prod.name, price: prodPrice, image: prodImg });
                    openDrawer();
                    trackEvent("add_to_cart");
                  }}
                >
                  <div className="aspect-square relative" style={{ background: t.galleryBg }}>
                    {prodImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prodImg} alt={prod.name}
                        className="w-full h-full object-contain p-3" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package style={{ width: 40, height: 40, color: t.accentColor, opacity: 0.3 }} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold leading-snug mb-1 line-clamp-2"
                      style={{ color: t.titleColor, fontFamily: t.fontFamilySans }}>
                      {prod.name}
                    </p>
                    <p className="text-sm font-bold" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                      {priceDisplay}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ════ FOOTER ════ */}
      <footer style={{ background: t.footerBg }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-12">
            <div>
              <h2 className="text-lg font-black tracking-[0.3em] uppercase mb-2.5 text-white" style={{ fontFamily: t.fontFamily }}>
                {brand}
              </h2>
              <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                El yapımı eserler, zamansız tasarım. Her parça bir ustanın imzasını taşır.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-9 gap-y-3">
              {["Hikaye", "Koleksiyon", "Gizlilik", "İade Koşulları", "İletişim"].map((link) => (
                <a key={link} href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors">{link}</a>
              ))}
            </nav>
            <div className="flex items-center gap-5">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="text-white/40 hover:text-white/80 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-3 pt-8 text-white/25 text-xs"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p>© 2026 {brand}. Tüm Hakları Saklıdır.</p>
            <p>
              <a href="https://optiefy.com" className="hover:text-white/55 transition-colors">Optiefy</a> ile güçlendirildi
            </p>
          </div>
        </div>
      </footer>

      {/* ════ MOBILE STICKY BUY BAR ════ */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
            style={{
              background:          `${t.bgColor}f5`,
              backdropFilter:      "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop:           `1px solid ${t.borderColor}`,
              paddingBottom:       "env(safe-area-inset-bottom)",
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0">
                <p className="text-[10px] leading-none mb-1" style={{ color: t.subtleText }}>Fiyat</p>
                <p className="text-[15px] font-black leading-none" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>{priceStr}</p>
              </div>
              <div className="flex-1 flex gap-2">
                <motion.button onClick={handleAddToCart} whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3.5 text-sm font-bold flex items-center justify-center"
                  style={{ background: "transparent", border: `${t.ghostBorderWidth} solid ${t.ghostBorder}`, color: t.ghostText, borderRadius: t.btnRadius }}>
                  Sepete Ekle
                </motion.button>
                <motion.button onClick={handleBuyNow} whileTap={{ scale: 0.95 }}
                  className="flex-1 py-3.5 text-sm font-bold flex items-center justify-center"
                  style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius, boxShadow: `0 4px 16px ${t.accentGlow}` }}>
                  Hemen Al
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────────

export default function StoreView({ store, overrideTheme, previewMode }: Props) {
  return (
    <CartProvider>
      <StoreViewInner store={store} overrideTheme={overrideTheme} previewMode={previewMode} />
    </CartProvider>
  );
}
