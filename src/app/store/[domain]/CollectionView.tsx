"use client";

/**
 * Tüm Ürünler / Koleksiyon sayfası — Shopify tarzı grid.
 * Mağazanın teması + theme_settings özelleştirmeleriyle giydirilir,
 * ürünler Supabase'den store_id ilişkisiyle dinamik gelir (urunler/page.tsx).
 */

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft, Package, Sparkles, Plus } from "lucide-react";
import { THEMES, themeFontStack, type ThemeId } from "@/types/theme";
import type { Store, Product } from "@/types/store";
import { CartProvider, useCart } from "@/lib/cart";
import CartDrawer from "@/components/store/CartDrawer";
import CheckoutModal from "@/components/store/CheckoutModal";
import { applyThemeSettings, getLayout, contrastText } from "./StoreView";

function CollectionInner({ store }: { store: Store }) {
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

  const titleFont =
    themeFontStack(ts?.font_heading) ??
    (layout === "luxury" ? '"DM Serif Display", Georgia, serif'
      : layout === "artisan" ? '"Lora", Georgia, serif'
      : t.fontFamily);

  const brand = store.store_name;

  // ── Katalog derleme ─────────────────────────────────────────────────────────
  // 1) Mağazanın kuruluş (amiral gemisi) ürünü stores satırında yaşar — ana
  //    sayfadaki hero ürün burada da mutlaka listelenir.
  // 2) products tablosundan gelenler için filtre kapsayıcıdır: yalnızca açıkça
  //    gizlenmiş durumlar elenir; status'u boş/bilinmeyen (test) ürünler görünür.
  const HIDDEN_STATUSES = ["inactive", "archived", "hidden", "deleted", "draft"];

  const tableProducts: Product[] = (store.products ?? []).filter(
    (p) => !p.status || !HIDDEN_STATUSES.includes(p.status)
  );

  const flagship: Product = {
    id:            store.id, // StoreView'in sepet kimliğiyle birebir aynı
    created_at:    store.created_at,
    store_id:      store.id,
    user_id:       store.user_id,
    name:          store.seo_title ?? store.store_name,
    size_variants: null,
    price:         store.product_price ?? 0,
    currency:      store.currency,
    image_url:     store.image_urls?.[0] ?? null,
    status:        "active",
  };

  const products: Product[] = [flagship, ...tableProducts];

  const fmtPrice = (price: number) =>
    store.currency === "USD"
      ? "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2 })
      : price.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

  const announcement = ts?.announcement_text?.trim() ?? "";

  const handleAdd = (p: Product) => {
    addItem({ id: p.id, name: p.name, price: p.price ?? 0, image: p.image_url ?? null });
    openDrawer();
  };

  return (
    <div className="min-h-screen" style={{ background: t.bgColor, fontFamily: t.fontFamilySans }}>
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

      {/* Duyuru barı */}
      {announcement && (
        <div className="px-4 py-2.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5"
          style={{ background: ts?.primary_color ?? t.bannerBg, color: ts?.primary_color ? contrastText(ts.primary_color) : "#FFFFFF" }}>
          <Sparkles className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{announcement}</span>
        </div>
      )}

      {/* Header — solid, scroll'da sabit */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background: `${t.headerBg}f2`, backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${t.borderColor}`,
        }}
      >
        <a href={homeHref} className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-60"
          style={{ color: t.textColor }}>
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfa
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

      {/* Başlık */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-14 md:pt-20 pb-10 text-center">
        <p className="text-[11px] font-black tracking-[0.35em] uppercase mb-4" style={{ color: t.accentColor }}>
          {brand} · Koleksiyon
        </p>
        <h1
          className="leading-[1.08] tracking-tight mb-4"
          style={{ color: t.titleColor, fontFamily: titleFont, fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: layout === "tech" ? 800 : 400 }}
        >
          Tüm Ürünler
        </h1>
        <p className="text-sm" style={{ color: t.subtleText }}>
          {products.length > 0
            ? `${products.length} el yapımı ürün · Her parça bir ustanın imzasını taşır`
            : "Koleksiyon hazırlanıyor"}
        </p>
      </div>

      {/* Shopify tarzı ürün grid'i */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {products.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${t.accentColor}12` }}>
              <Package className="w-7 h-7" style={{ color: t.accentColor, opacity: 0.6 }} />
            </div>
            <p className="text-base font-semibold mb-1.5" style={{ color: t.titleColor }}>Henüz ürün eklenmedi</p>
            <p className="text-sm max-w-xs" style={{ color: t.subtleText }}>
              Yeni ürünler çok yakında burada olacak. Takipte kalın!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 6) * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5 }}
                className="group overflow-hidden flex flex-col"
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.borderColor}`,
                  borderRadius: layout === "luxury" ? "4px" : "20px",
                }}
              >
                {/* Görsel — kusursuz kare, object-cover */}
                <div className="relative aspect-square overflow-hidden" style={{ background: t.galleryBg }}>
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-9 h-9" style={{ color: t.accentColor, opacity: 0.3 }} />
                    </div>
                  )}
                </div>

                {/* Bilgi + hızlı sepete ekle */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-sm font-semibold leading-snug mb-1 line-clamp-2" style={{ color: t.titleColor }}>
                    {p.name}
                  </p>
                  {p.size_variants && p.size_variants.length > 0 && (
                    <p className="text-[11px] mb-1.5 truncate" style={{ color: t.subtleText }}>
                      {p.size_variants.join(" · ")}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <p className="text-[15px] font-bold" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                      {fmtPrice(p.price ?? 0)}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                      onClick={() => handleAdd(p)}
                      title="Sepete Ekle"
                      className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                      style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius, boxShadow: `0 4px 14px ${t.accentGlow}` }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 text-center" style={{ background: t.footerBg }}>
        <p className="text-sm font-black tracking-[0.3em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.85)", fontFamily: t.fontFamily }}>
          {brand}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4 px-6">
          {[
            { label: "Gizlilik Politikası",       href: `${base}/legal/gizlilik-politikasi` },
            { label: "Mesafeli Satış Sözleşmesi", href: `${base}/legal/mesafeli-satis-sozlesmesi` },
            { label: "İade ve İptal Koşulları",   href: `${base}/legal/iade-ve-iptal-kosullari` },
          ].map(({ label, href }) => (
            <a key={label} href={href} className="text-xs text-white/40 hover:text-white/80 transition-colors">{label}</a>
          ))}
        </nav>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          © 2026 {brand}. Tüm Hakları Saklıdır.
        </p>
      </footer>
    </div>
  );
}

export default function CollectionView({ store }: { store: Store }) {
  return (
    <CartProvider>
      <CollectionInner store={store} />
    </CartProvider>
  );
}
