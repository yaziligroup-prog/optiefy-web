"use client";

/**
 * Premium ürün detay sayfası — Framer estetiğinde minimalist iki sütun:
 * solda büyük galeri + thumbnail'ler, sağda satın alma paneli.
 * Mağazanın teması ve theme_settings özelleştirmeleriyle giydirilir,
 * "Sepete Ekle" mevcut cart state'ini (CartProvider) tetikler.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, ArrowLeft, ChevronRight, Truck, RefreshCcw, ShieldCheck, Package,
} from "lucide-react";
import { THEMES, themeFontStack, type ThemeId } from "@/types/theme";
import type { Store, Product } from "@/types/store";
import { CartProvider, useCart } from "@/lib/cart";
import CartDrawer from "@/components/store/CartDrawer";
import CheckoutModal from "@/components/store/CheckoutModal";
import { applyThemeSettings, getLayout } from "./StoreView";

const TRUST = [
  { Icon: Truck,       label: "Ücretsiz kargo" },
  { Icon: RefreshCcw,  label: "14 gün iade" },
  { Icon: ShieldCheck, label: "Güvenli ödeme" },
];

function DetailInner({ store, product }: { store: Store; product: Product }) {
  const themeId: ThemeId =
    store.theme && THEMES[store.theme as ThemeId] ? (store.theme as ThemeId) : "modern";
  const ts     = store.theme_settings ?? null;
  const t      = applyThemeSettings(THEMES[themeId], ts);
  const layout = getLayout(themeId);

  const { addItem, openDrawer, count } = useCart();

  // Vitrin içi link tabanı — StoreView ile aynı çözümleme
  const pathname = usePathname() ?? "";
  const base     = pathname.startsWith("/store/") ? pathname.split("/").slice(0, 3).join("/") : "";
  const homeHref = base || "/";

  const headingFont =
    themeFontStack(ts?.font_heading) ??
    (layout === "luxury" ? '"DM Serif Display", Georgia, serif'
      : layout === "artisan" ? '"Lora", Georgia, serif'
      : t.fontFamily);

  const brand = store.store_name;

  // Galeri: ürünün kendi görseli öncelikli; yoksa mağaza galerisinden beslenir
  const images: string[] = product.image_url
    ? [product.image_url]
    : (store.image_urls ?? []).filter(Boolean);
  const [activeImg, setActiveImg] = useState(0);

  const price = product.price ?? 0;
  const currency = product.currency ?? store.currency;
  const priceStr = currency === "USD"
    ? "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2 })
    : price.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

  const description = product.description?.trim() || store.description?.trim() || null;

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price, image: images[0] ?? null });
    openDrawer();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: t.bgColor, fontFamily: t.fontFamilySans }}>
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

      {/* Header — sticky */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background: `${t.headerBg}f2`, backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${t.borderColor}`,
        }}
      >
        <a href={`${base}/urunler`} className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-60"
          style={{ color: t.textColor }}>
          <ArrowLeft className="w-4 h-4" />
          Tüm Ürünler
        </a>
        {ts?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ts.logo_url} alt={brand} className="h-7 w-auto object-contain absolute left-1/2 -translate-x-1/2" />
        ) : (
          <a href={homeHref}
            className="text-[15px] font-black tracking-[0.3em] uppercase absolute left-1/2 -translate-x-1/2"
            style={{ color: t.titleColor, fontFamily: t.fontFamily, textDecoration: "none" }}>
            {brand}
          </a>
        )}
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={openDrawer} className="relative p-1.5">
          <ShoppingBag className="w-5 h-5" style={{ color: t.titleColor }} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center text-white"
              style={{ background: t.accentColor }}>
              {count}
            </span>
          )}
        </motion.button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-12 py-10 md:py-16">

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          className="flex items-center gap-1.5 text-xs mb-8" style={{ color: t.subtleText }}
        >
          <a href={homeHref} className="hover:opacity-60 transition-opacity" style={{ color: t.subtleText }}>Ana Sayfa</a>
          <ChevronRight className="w-3 h-3" />
          <a href={`${base}/urunler`} className="hover:opacity-60 transition-opacity" style={{ color: t.subtleText }}>Tüm Ürünler</a>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold truncate max-w-[180px]" style={{ color: t.textColor }}>{product.name}</span>
        </motion.nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">

          {/* ── Sol: Galeri ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="md:sticky md:top-24 space-y-4"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "1 / 1", background: t.galleryBg,
                borderRadius: layout === "luxury" ? "4px" : "24px",
              }}
            >
              {images.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    src={images[activeImg]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </AnimatePresence>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-12 h-12" style={{ color: t.accentColor, opacity: 0.3 }} />
                </div>
              )}
            </div>

            {/* Thumbnail şeridi — birden fazla görsel varsa */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveImg(i)}
                    className="flex-shrink-0 overflow-hidden transition-all"
                    style={{
                      width: 72, height: 72,
                      borderRadius: layout === "luxury" ? "4px" : "14px",
                      border: `2px solid ${i === activeImg ? t.ringColor : "transparent"}`,
                      opacity: i === activeImg ? 1 : 0.55,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover object-center" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Sağ: Satın alma paneli ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-black tracking-[0.3em] uppercase mb-4" style={{ color: t.storeTagColor }}>
              {brand}
            </p>

            <h1
              className="leading-[1.1] tracking-tight mb-5"
              style={{
                color: t.titleColor, fontFamily: headingFont,
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: layout === "tech" ? 800 : 400,
              }}
            >
              {product.name}
            </h1>

            <p className="font-bold leading-none mb-7"
              style={{ color: t.priceColor, fontFamily: headingFont, fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
              {priceStr}
            </p>

            <div className="h-px w-full mb-7" style={{ background: t.borderColor }} />

            {description && (
              <p className="text-[15px] leading-[1.9] mb-7" style={{ color: t.textColor }}>
                {description}
              </p>
            )}

            {/* Beden / varyant çipleri */}
            {product.size_variants && product.size_variants.length > 0 && (
              <div className="mb-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2.5" style={{ color: t.subtleText }}>
                  Seçenekler
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.size_variants.map((v) => (
                    <span key={v} className="px-3.5 py-1.5 text-xs font-semibold"
                      style={{ border: `1.5px solid ${t.borderColor}`, color: t.textColor, borderRadius: t.btnRadius }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Jilet gibi Sepete Ekle — mevcut cart state'ini tetikler */}
            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
              className="w-full py-4 text-[15px] font-bold flex items-center justify-center gap-2.5 mb-4"
              style={{
                background: t.solidBtn,
                color: t.solidBtnText,
                borderRadius: t.btnRadius,
                boxShadow: `0 10px 32px ${t.accentGlow}`,
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              Sepete Ekle
            </motion.button>

            {/* Güven şeridi */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
              {TRUST.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: t.featureIconColor }} />
                  <span className="text-xs font-medium" style={{ color: t.subtleText }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 text-center" style={{ background: t.footerBg }}>
        <p className="text-xs font-black tracking-[0.3em] uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.85)", fontFamily: t.fontFamily }}>
          {brand}
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          © 2026 {brand}. Tüm Hakları Saklıdır.
        </p>
      </footer>
    </div>
  );
}

export default function ProductDetailView({ store, product }: { store: Store; product: Product }) {
  return (
    <CartProvider>
      <DetailInner store={store} product={product} />
    </CartProvider>
  );
}
