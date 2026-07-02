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

function CollectionInner({ store, categorySlug, categoryLabel }: {
  store: Store;
  /** Dolu ise yalnızca bu kategori slug'ına bağlı ürünler listelenir */
  categorySlug?: string;
  categoryLabel?: string;
}) {
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

  // Kategori görünümü: yalnızca o slug'a bağlanmış ürünler (amiral gemisi dahil edilmez);
  // genel katalog: amiral gemisi + tüm görünür ürünler
  const products: Product[] = categorySlug
    ? tableProducts.filter((p) => p.category === categorySlug)
    : [flagship, ...tableProducts];

  const pageTitle = categoryLabel ?? "Tüm Ürünler";

  const fmtPrice = (price: number) =>
    store.currency === "USD"
      ? "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2 })
      : price.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";

  const announcement = ts?.announcement_text?.trim() ?? "";

  // ── Tema iskeletine göre grid mimarisi ──────────────────────────────────────
  // luxury: devasa 2'li, bol boşluklu, kenarlıksız · modern: kompakt 4'lü teknik
  // artisan: klasik 3'lü · dynamic: zigzag asimetrik · corporate: standart 4'lü
  const gridClass =
    themeId === "luxury"   ? "grid-cols-1 md:grid-cols-2 gap-12"
    : themeId === "modern"  ? "grid-cols-2 lg:grid-cols-4 gap-4"
    : themeId === "artisan" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"
    : themeId === "dynamic" ? "grid-cols-2 md:grid-cols-3 gap-5"
    : "grid-cols-2 md:grid-cols-4 gap-5";

  const cardHover =
    themeId === "dynamic" ? { y: -6, rotate: 1, scale: 1.02 }
    : themeId === "modern" ? { y: -4, boxShadow: `0 0 26px ${t.accentGlow}` }
    : { y: -5 };

  const cardRadius =
    themeId === "luxury" ? 4
    : themeId === "modern" ? 0
    : themeId === "corporate" ? 12
    : themeId === "dynamic" ? 10
    : 16;

  const handleAdd = (p: Product) => {
    addItem({ id: p.id, name: p.name, price: p.price ?? 0, image: p.images?.[0] ?? p.image_url ?? null });
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
          {pageTitle}
        </h1>
        <p className="text-sm" style={{ color: t.subtleText }}>
          {products.length > 0
            ? `${products.length} el yapımı ürün · Her parça bir ustanın imzasını taşır`
            : categorySlug
            ? "Bu koleksiyona henüz ürün eklenmedi"
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
          <div className={`grid ${gridClass}`}>
            {products.map((p, i) => {
              // Amiral gemisi ürün (id === store.id) mağaza ana sayfasındaki detay
              // görünümüne, tablo ürünleri kendi /urun/[id] rotasına köprülenir
              const detailHref = p.id === store.id ? homeHref : `${base}/urun/${p.id}`;
              // Dynamic: zigzag — her üçüncü kart daha uzun oranlı
              const imgAspect =
                themeId === "dynamic" ? (i % 3 === 0 ? "aspect-[4/5]" : "aspect-square")
                : themeId === "luxury" ? "aspect-[4/5]"
                : "aspect-square";
              return (
              <motion.a
                key={p.id}
                href={detailHref}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 6) * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={cardHover}
                className="group overflow-hidden flex flex-col cursor-pointer"
                style={{
                  // Luxury: kenarlıksız, şeffaf — ultra premium mücevher havası
                  background: themeId === "luxury" ? "transparent" : t.cardBg,
                  border: themeId === "luxury" ? "none" : `1px solid ${t.borderColor}`,
                  borderRadius: cardRadius,
                  boxShadow: themeId === "corporate" ? "0 2px 10px rgba(15,44,92,0.08)" : "none",
                  textDecoration: "none",
                }}
              >
                {/* Görsel — tema oranıyla, object-cover */}
                <div className={`relative ${imgAspect} overflow-hidden`}
                  style={{ background: t.galleryBg, borderRadius: themeId === "luxury" ? cardRadius : 0 }}>
                  {(p.images?.[0] ?? p.image_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images?.[0] ?? p.image_url ?? ""}
                      alt={p.name}
                      className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.05] ${themeId === "dynamic" ? "group-hover:rotate-1" : ""}`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-9 h-9" style={{ color: t.accentColor, opacity: 0.3 }} />
                    </div>
                  )}
                </div>

                {/* Bilgi + aksiyon — tema karakterine göre */}
                <div className={`flex flex-col flex-1 ${themeId === "luxury" ? "px-1 py-4 items-center text-center" : "p-4"}`}
                  style={themeId === "artisan" ? { background: "rgba(61,51,38,0.045)" } : undefined}>
                  <p className={`font-semibold leading-snug mb-1 line-clamp-2 ${themeId === "luxury" ? "text-base" : "text-sm"}`}
                    style={{ color: t.titleColor, fontFamily: themeId === "luxury" ? t.fontFamily : undefined }}>
                    {p.name}
                  </p>
                  {p.size_variants && p.size_variants.length > 0 && (
                    <p className="text-[11px] mb-1.5 truncate" style={{ color: t.subtleText }}>
                      {p.size_variants.join(" · ")}
                    </p>
                  )}
                  {themeId === "corporate" ? (
                    /* Corporate: dönüşüm odaklı sabit tam-genişlik sepet butonu */
                    <div className="mt-auto pt-2 space-y-2">
                      <p className="text-[15px] font-bold" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                        {fmtPrice(p.price ?? 0)}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(p); }}
                        className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                        style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: 8 }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Sepete Ekle
                      </motion.button>
                    </div>
                  ) : (
                    <div className={`mt-auto flex items-center gap-2 pt-2 ${themeId === "luxury" ? "justify-center" : "justify-between"}`}>
                      <p className="text-[15px] font-bold" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                        {fmtPrice(p.price ?? 0)}
                      </p>
                      {themeId !== "luxury" && (
                        <motion.button
                          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                          onClick={(e) => {
                            // Kart bir <a> — sepete ekleme, detay sayfasına gitmesin
                            e.preventDefault();
                            e.stopPropagation();
                            handleAdd(p);
                          }}
                          title="Sepete Ekle"
                          className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                          style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius, boxShadow: `0 4px 14px ${t.accentGlow}` }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.a>
              );
            })}
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

export default function CollectionView({ store, categorySlug, categoryLabel }: {
  store: Store; categorySlug?: string; categoryLabel?: string;
}) {
  return (
    <CartProvider>
      <CollectionInner store={store} categorySlug={categorySlug} categoryLabel={categoryLabel} />
    </CartProvider>
  );
}
