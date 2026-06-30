"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Lock, CheckCircle2, User, Mail, Phone, MapPin, Loader2,
  CreditCard, AlertCircle, RefreshCw,
} from "lucide-react";
import type { ThemeConfig } from "@/types/theme";
import { useCart, formatPrice } from "@/lib/cart";
import { calculateShipping } from "@/lib/shipping";

// ─── Types ───────────────────────────────────────────────────────────────────────

interface DeliveryForm {
  firstName: string; lastName: string; email: string; phone: string;
  address: string; city: string; postalCode: string;
}

const EMPTY_FORM: DeliveryForm = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", city: "", postalCode: "",
};

type Step = "form" | "iframe" | "success" | "error";

// ─── CheckoutModal ────────────────────────────────────────────────────────────────

export default function CheckoutModal({
  theme: t, storeName, storeId, currency, shippingFee = 0, freeShippingThreshold = null,
}: {
  theme: ThemeConfig;
  storeName: string;
  storeId: string;
  currency?: string | null;
  shippingFee?: number;
  freeShippingThreshold?: number | null;
}) {
  const { items, checkoutOpen, closeCheckout, subtotal, count, clear } = useCart();

  const [form,       setForm]       = useState<DeliveryForm>(EMPTY_FORM);
  const [step,       setStep]       = useState<Step>("form");
  const [iframeUrl,  setIframeUrl]  = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  const shipping = useMemo(
    () => calculateShipping(subtotal, shippingFee, freeShippingThreshold),
    [subtotal, shippingFee, freeShippingThreshold],
  );
  const total = subtotal + shipping.cost;

  const set = (k: keyof DeliveryForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Sıfırla ─────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("form");
    setIframeUrl(null);
    setOrderNumber(null);
    setErrorMsg(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleClose = () => {
    closeCheckout();
    if (step === "success") clear();
    reset();
  };

  // ── PayTR postMessage dinleyici ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data as { paytr?: string } | undefined;
      if (!data?.paytr) return;
      if (data.paytr === "success") setStep("success");
      if (data.paytr === "fail")    setStep("error");
      if (data.paytr === "retry") { setIframeUrl(null); setStep("form"); setErrorMsg("Ödeme reddedildi. Tekrar deneyebilirsiniz."); }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ── Form submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/paytr/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          customer: {
            firstName: form.firstName, lastName: form.lastName,
            email: form.email, phone: form.phone,
            address: form.address, city: form.city, postalCode: form.postalCode,
          },
          items: items.map((it) => ({
            productId: it.id, name: it.name, unitPrice: it.price,
            quantity: it.quantity, image: it.image,
          })),
          subtotal,
          shippingCost: shipping.cost,
          totalDesi:    0,
          isOversized:  false,
        }),
      });

      const data = await res.json() as {
        iframeUrl?:  string;
        orderNumber?: string;
        mock?:       boolean;
        error?:      string;
      };

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Ödeme başlatılamadı. Lütfen tekrar deneyin.");
        setSubmitting(false);
        return;
      }

      if (data.orderNumber) setOrderNumber(data.orderNumber);

      if (data.mock) {
        setStep("success");
      } else if (data.iframeUrl) {
        setIframeUrl(data.iframeUrl);
        setStep("iframe");
      }
    } catch {
      setErrorMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
    }

    setSubmitting(false);
  };

  // ── Ortak input stiller ──────────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    background: t.bgColor, border: `1px solid ${t.borderColor}`, color: t.textColor,
    borderRadius: "14px", padding: "13px 15px", fontSize: "14px",
    fontFamily: t.fontFamilySans, width: "100%", outline: "none",
  };
  const inputIcon: React.CSSProperties = { ...inputBase, paddingLeft: "42px" };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-2"
      style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
      {children}
    </label>
  );

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto sm:rounded-[28px]"
            style={{
              background:  t.bgColor,
              boxShadow:   "0 48px 120px rgba(0,0,0,0.4)",
              maxWidth:    step === "iframe" ? "680px" : "760px",
            }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-7 md:px-9 py-6 sticky top-0 z-10"
              style={{ background: t.bgColor, borderBottom: `1px solid ${t.borderColor}` }}>
              <div>
                <h2 className="text-sm font-black tracking-[0.2em] uppercase"
                  style={{ color: t.titleColor, fontFamily: t.fontFamily }}>
                  {step === "form"    && "Ödeme"}
                  {step === "iframe"  && "Güvenli Ödeme"}
                  {step === "success" && "Sipariş Onayı"}
                  {step === "error"   && "Ödeme Başarısız"}
                </h2>
                <p className="text-xs mt-1" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>{storeName}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${t.borderColor}` }}
              >
                <X className="w-4 h-4" style={{ color: t.textColor }} />
              </motion.button>
            </div>

            {/* ── Step: Başarı ── */}
            {step === "success" && (
              <div className="flex flex-col items-center justify-center text-center px-8 py-20 gap-6">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: `${t.featureIconColor}18` }}
                >
                  <CheckCircle2 className="w-10 h-10" style={{ color: t.featureIconColor }} />
                </motion.div>
                <h3 className="text-3xl" style={{ color: t.titleColor, fontFamily: t.fontFamily }}>Siparişiniz Alındı</h3>
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                  Teşekkür ederiz. Onay ve kargo bilgileriniz e-posta ile iletilecek.
                </p>
                {orderNumber && (
                  <div className="flex flex-col items-center gap-1.5 px-8 py-4 rounded-2xl"
                    style={{ background: t.cardBg, border: `1px solid ${t.borderColor}` }}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                      Sipariş Takip No
                    </span>
                    <span className="text-xl font-black tracking-wide"
                      style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                      {orderNumber}
                    </span>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleClose}
                  className="mt-2 px-12 py-3.5 text-sm font-bold"
                  style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius }}
                >
                  Alışverişe Dön
                </motion.button>
              </div>
            )}

            {/* ── Step: Hata ── */}
            {step === "error" && (
              <div className="flex flex-col items-center justify-center text-center px-8 py-20 gap-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-red-50">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl" style={{ color: t.titleColor, fontFamily: t.fontFamily }}>Ödeme Başarısız</h3>
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                  Ödeme işlemi tamamlanamadı. Farklı bir kart deneyebilir veya lütfen tekrar deneyebilirsiniz.
                </p>
                <button
                  onClick={() => { setStep("form"); setErrorMsg(null); setIframeUrl(null); }}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold"
                  style={{ background: t.solidBtn, color: t.solidBtnText }}
                >
                  <RefreshCw className="w-4 h-4" /> Tekrar Dene
                </button>
              </div>
            )}

            {/* ── Step: PayTR iFrame ── */}
            {step === "iframe" && iframeUrl && (
              <div className="p-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Lock className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs text-green-700 font-semibold">SSL ile şifrelenmiş güvenli ödeme · PayTR</span>
                </div>
                <iframe
                  src={iframeUrl}
                  className="w-full rounded-2xl border-0"
                  style={{
                    height: "620px",
                    border: `1px solid ${t.borderColor}`,
                    borderRadius: "16px",
                  }}
                  allow="payment"
                  title="Güvenli Ödeme"
                />
                <p className="text-center text-[11px] mt-3" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                  Kart bilgileriniz PayTR&apos;ın PCI-DSS sertifikalı altyapısında işlenir. Optiefy kart verilerinizi görmez.
                </p>
              </div>
            )}

            {/* ── Step: Teslimat Formu ── */}
            {step === "form" && (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row">

                  {/* Form alanları */}
                  <div className="flex-1 p-7 md:p-9 space-y-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]"
                      style={{ color: t.accentColor, fontFamily: t.fontFamilySans }}>
                      Teslimat Bilgileri
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ad</Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.subtleText }} />
                          <input required type="text" placeholder="Adınız" value={form.firstName} onChange={set("firstName")} style={inputIcon} />
                        </div>
                      </div>
                      <div>
                        <Label>Soyad</Label>
                        <input required type="text" placeholder="Soyadınız" value={form.lastName} onChange={set("lastName")} style={inputBase} />
                      </div>
                    </div>

                    <div>
                      <Label>E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.subtleText }} />
                        <input required type="email" placeholder="ornek@eposta.com" value={form.email} onChange={set("email")} style={inputIcon} />
                      </div>
                    </div>

                    <div>
                      <Label>Telefon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.subtleText }} />
                        <input required type="tel" placeholder="0532 000 00 00" value={form.phone} onChange={set("phone")} style={inputIcon} />
                      </div>
                    </div>

                    <div>
                      <Label>Adres</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-4 w-4 h-4 pointer-events-none" style={{ color: t.subtleText }} />
                        <textarea required rows={2} placeholder="Mahalle, cadde, bina no, daire"
                          value={form.address} onChange={set("address")}
                          style={{ ...inputIcon, resize: "none" }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>İl</Label>
                        <input required type="text" placeholder="İstanbul" value={form.city} onChange={set("city")} style={inputBase} />
                      </div>
                      <div>
                        <Label>Posta Kodu</Label>
                        <input type="text" placeholder="34000" value={form.postalCode} onChange={set("postalCode")} style={inputBase} />
                      </div>
                    </div>

                    {/* Ödeme yöntemi bilgi kartı */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl"
                      style={{ background: `${t.accentColor}0D`, border: `1px solid ${t.accentColor}25` }}>
                      <CreditCard className="w-5 h-5 flex-shrink-0" style={{ color: t.accentColor }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: t.titleColor, fontFamily: t.fontFamilySans }}>
                          Güvenli Ödeme · PayTR
                        </p>
                        <p className="text-[11px] leading-snug mt-0.5" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                          Kart bilgileriniz bir sonraki adımda PayTR&apos;ın güvenli sayfasında girilecek.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sipariş özeti */}
                  <div className="md:w-72 flex-shrink-0 p-7 md:p-9 space-y-6" style={{ background: t.cardBg }}>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]"
                      style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                      Sipariş Özeti
                    </p>

                    <div className="space-y-4">
                      {items.map((it) => (
                        <div key={it.id} className="flex gap-3 items-start">
                          <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ background: t.bgColor }}>
                            {it.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.image} alt={it.name} className="w-full h-full object-contain p-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-snug line-clamp-2"
                              style={{ color: t.titleColor, fontFamily: t.fontFamilySans }}>{it.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: t.subtleText }}>{it.quantity} adet</p>
                          </div>
                          <p className="text-xs font-bold flex-shrink-0"
                            style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                            {formatPrice(it.price * it.quantity, currency)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2.5 pt-4" style={{ borderTop: `1px solid ${t.borderColor}` }}>
                      <div className="flex justify-between text-xs" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                        <span>Ara Toplam ({count})</span>
                        <span>{formatPrice(subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between items-start text-xs" style={{ fontFamily: t.fontFamilySans }}>
                        <span style={{ color: t.subtleText }}>{shipping.label}</span>
                        <span className="font-semibold text-right"
                          style={{ color: shipping.cost > 0 ? t.textColor : t.featureIconColor }}>
                          {shipping.cost > 0 ? formatPrice(shipping.cost, currency) : "Ücretsiz"}
                        </span>
                      </div>
                      {freeShippingThreshold !== null && shipping.cost > 0 && (
                        <p className="text-[10px] leading-relaxed" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                          {formatPrice(freeShippingThreshold - subtotal, currency)} daha ekleyin, kargo bedava!
                        </p>
                      )}
                      <div className="flex justify-between items-baseline pt-3"
                        style={{ borderTop: `1px solid ${t.borderColor}` }}>
                        <span className="text-sm font-semibold" style={{ color: t.textColor, fontFamily: t.fontFamilySans }}>Toplam</span>
                        <span className="text-lg font-black" style={{ color: t.priceColor, fontFamily: t.fontFamily }}>
                          {formatPrice(total, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="px-7 md:px-9 py-6 space-y-3" style={{ borderTop: `1px solid ${t.borderColor}` }}>
                  {errorMsg && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", color: "#DC2626", fontFamily: t.fontFamilySans }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errorMsg}
                    </div>
                  )}
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.01 }}
                    whileTap={{ scale: submitting ? 1 : 0.99 }}
                    className="w-full py-4 text-sm font-bold flex items-center justify-center gap-2.5 disabled:opacity-70"
                    style={{ background: t.solidBtn, color: t.solidBtnText, borderRadius: t.btnRadius, boxShadow: `0 10px 32px ${t.accentGlow}` }}
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Ödeme hazırlanıyor…</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Güvenli Ödemeye Geç — {formatPrice(total, currency)}</>
                    )}
                  </motion.button>
                  <p className="text-center text-[11px] leading-relaxed" style={{ color: t.subtleText, fontFamily: t.fontFamilySans }}>
                    Siparişi onaylayarak Kullanım Koşulları&apos;nı kabul etmiş olursunuz. Kart bilgileriniz hiçbir zaman sunucularımızda saklanmaz.
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
