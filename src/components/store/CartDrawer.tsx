"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, Lock } from "lucide-react";
import type { ThemeConfig } from "@/types/theme";
import { useCart, formatPrice } from "@/lib/cart";
import { calculateShipping } from "@/lib/shipping";

export default function CartDrawer({
  theme: t,
  currency,
  shippingFee = 0,
  freeShippingThreshold = null,
}: {
  theme: ThemeConfig;
  currency?: string | null;
  shippingFee?: number;
  freeShippingThreshold?: number | null;
}) {
  const { items, drawerOpen, closeDrawer, updateQty, removeItem, openCheckout, subtotal, count } = useCart();
  const shipping = calculateShipping(subtotal, shippingFee, freeShippingThreshold);
  const total = subtotal + shipping.cost;

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            style={{ background: t.cartBackdrop }}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md flex flex-col"
            style={{
              background: t.cartBg,
              backdropFilter: t.cartBlur,
              WebkitBackdropFilter: t.cartBlur,
              boxShadow: "-24px 0 80px rgba(0,0,0,0.14)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-6" style={{ borderBottom: `1px solid ${t.borderColor}` }}>
              <div>
                <h2 className="text-sm font-black tracking-[0.22em] uppercase" style={{ color: t.titleColor, fontFamily: t.fontFamily }}>
                  Sepetim
                </h2>
                <p className="text-xs mt-1" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                  {count > 0 ? `${count} ürün` : "Boş"}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={closeDrawer}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${t.borderColor}` }}
              >
                <X className="w-4 h-4" style={{ color: t.textColor }} />
              </motion.button>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ border: `1px solid ${t.borderColor}` }}>
                  <ShoppingBag className="w-6 h-6" style={{ color: t.subtleText }} />
                </div>
                <div>
                  <p className="text-xl leading-snug" style={{ color: t.titleColor, fontFamily: t.fontFamily }}>
                    Sepetinizde ürün bulunmuyor
                  </p>
                  <p className="text-sm mt-2.5 leading-relaxed" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                    Koleksiyonu keşfederek özel bir esere sahip olun.
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="mt-2 text-sm font-semibold tracking-wide transition-opacity hover:opacity-60"
                  style={{ color: t.accentColor, fontFamily: t.fontFamilySans }}
                >
                  Alışverişe Dön
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-7">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                      className="flex gap-4 py-6"
                      style={{ borderBottom: `1px solid ${t.borderColor}` }}
                    >
                      {/* Thumbnail */}
                      <div className="w-[72px] h-[72px] rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ background: t.galleryBg }}>
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-sm leading-snug line-clamp-2 mb-1" style={{ color: t.titleColor, fontFamily: t.fontFamily }}>
                          {item.name}
                        </p>
                        <p className="text-xs mb-auto" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                          {formatPrice(item.price, currency)}
                        </p>

                        {/* Stepper */}
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                            style={{ border: `1px solid ${t.borderColor}` }}
                          >
                            <Minus className="w-3 h-3" style={{ color: t.textColor }} />
                          </button>
                          <span className="text-sm font-semibold w-5 text-center" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                            style={{ border: `1px solid ${t.borderColor}` }}
                          >
                            <Plus className="w-3 h-3" style={{ color: t.textColor }} />
                          </button>
                        </div>
                      </div>

                      {/* Right: line total + remove */}
                      <div className="flex flex-col items-end justify-between flex-shrink-0">
                        <button onClick={() => removeItem(item.id)} className="transition-opacity hover:opacity-100 opacity-40">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: t.subtleText }} />
                        </button>
                        <p className="text-sm font-bold" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                          {formatPrice(item.price * item.quantity, currency)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-7 py-6 space-y-5" style={{ borderTop: `1px solid ${t.borderColor}` }}>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                    <span>Ara Toplam</span>
                    <span style={{ color: t.textColor }}>{formatPrice(subtotal, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm" style={{ fontFamily: t.fontFamilySans }}>
                    <span style={{ color: t.subtleText }}>{shipping.label}</span>
                    <span className="font-semibold" style={{ color: shipping.cost > 0 ? t.textColor : t.featureIconColor }}>
                      {shipping.cost > 0 ? formatPrice(shipping.cost, currency) : "Ücretsiz"}
                    </span>
                  </div>
                  {freeShippingThreshold !== null && shipping.cost > 0 && (
                    <p className="text-[11px]" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                      {formatPrice(freeShippingThreshold - subtotal, currency)} daha ekleyin, kargo bedava!
                    </p>
                  )}
                  <div className="flex items-baseline justify-between pt-3" style={{ borderTop: `1px solid ${t.borderColor}` }}>
                    <span className="text-sm font-semibold" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>Toplam</span>
                    <span className="text-xl font-black" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>{formatPrice(total, currency)}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={openCheckout}
                  className="w-full py-4 text-sm font-bold flex items-center justify-center gap-2.5"
                  style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius }}
                >
                  <Lock className="w-4 h-4" />
                  Ödemeye Geç
                </motion.button>

                <p className="text-center text-[11px]" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                  256-bit SSL ile güvenli ödeme
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
