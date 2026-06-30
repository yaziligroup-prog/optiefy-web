"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ShoppingCart,
  Shield,
  Truck,
  RefreshCcw,
  Star,
  ArrowLeft,
  Sparkles,
  Package,
  Loader2,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { Store } from "@/types/store";

const GALLERY_LABELS = ["Mermer Stüdyo", "Yaşam Alanı", "Editöryal"];

function ImageGallery({
  images,
  fallback,
  title,
}: {
  images: string[];
  fallback: string | null;
  title: string;
}) {
  const [active, setActive] = useState(0);
  const displayImages = images.length > 0 ? images : fallback ? [fallback] : [];
  const hasMultiple = displayImages.length > 1;

  const prev = () => setActive((a) => (a - 1 + displayImages.length) % displayImages.length);
  const next = () => setActive((a) => (a + 1) % displayImages.length);

  if (displayImages.length === 0) {
    return (
      <div
        className="w-full rounded-3xl flex items-center justify-center"
        style={{ aspectRatio: "1/1", background: "linear-gradient(135deg,#1e1b4b,#312e81)" }}
      >
        <Package className="w-20 h-20 text-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Ana görsel */}
      <div
        className="relative w-full rounded-3xl overflow-hidden"
        style={{
          aspectRatio: "1/1",
          background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#1e1b4b 100%)",
        }}
      >
        {/* Işık efekti */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 20%,rgba(255,255,255,0.1) 0%,transparent 60%)",
          }}
        />
        {/* Zemin gölgesi */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          style={{
            width: "60%",
            height: "28px",
            background: "rgba(139,92,246,0.3)",
            filter: "blur(18px)",
            borderRadius: "50%",
          }}
        />

        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={displayImages[active]}
            alt={title}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-0 w-full h-full object-contain p-10"
            style={{ filter: "drop-shadow(0 20px 40px rgba(139,92,246,0.45))" }}
          />
        </AnimatePresence>

        {/* AI rozeti */}
        {images.length > 0 && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3 text-purple-300" />
            <span className="text-white/80 text-[10px] font-semibold">
              AI Stüdyo · {GALLERY_LABELS[active] ?? ""}
            </span>
          </div>
        )}

        {/* Ok butonları */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* Nokta indikatörler */}
        {hasMultiple && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {displayImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail şeridi */}
      {hasMultiple && (
        <div className="grid grid-cols-3 gap-2">
          {displayImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                i === active
                  ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-950"
                  : "opacity-60 hover:opacity-90"
              }`}
              style={{ aspectRatio: "1/1" }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg,#1e1b4b,#312e81)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={GALLERY_LABELS[i] ?? `Varyasyon ${i + 1}`}
                className="relative w-full h-full object-contain p-3"
                style={{ filter: "drop-shadow(0 4px 12px rgba(139,92,246,0.3))" }}
              />
              <div className="absolute bottom-0 inset-x-0 py-1 bg-black/50 backdrop-blur-sm">
                <p className="text-center text-white/70 text-[9px] font-semibold tracking-wide">
                  {GALLERY_LABELS[i] ?? `V${i + 1}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StoreDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else if (data.user_id && data.user_id !== user.id) {
        router.replace("/panel");
        return;
      } else {
        setStore(data as Store);
      }
      setLoading(false);
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Vitrin yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-white font-bold text-xl">Vitrin bulunamadı</p>
          <button
            onClick={() => router.push("/panel")}
            className="mt-4 text-purple-400 hover:text-purple-300 text-sm"
          >
            ← Panele dön
          </button>
        </div>
      </div>
    );
  }

  const images = store.image_urls ?? [];
  const title = store.seo_title ?? store.store_name;
  const features = store.features ?? [];
  const descParagraphs = store.description
    ? store.description.split(/\n\n+/)
    : [`${store.store_name} — kaliteli ve güvenilir.`];

  const formattedPrice = store.product_price.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
  });
  const originalPrice = (store.product_price * 1.25).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <nav
        className="sticky top-0 z-20 border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: "rgba(2,6,23,0.88)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm truncate max-w-[140px]">
            {store.store_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {store.selected_plan === "yearly" && (
            <div className="hidden sm:flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="text-amber-300 text-[10px] font-bold">YILLIK</span>
            </div>
          )}
          <Link
            href="/panel"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/6 hover:border-white/15"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Panel
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Sol — Görsel Galerisi */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <ImageGallery
              images={images}
              fallback={store.product_image_base64}
              title={title}
            />

            {/* Güven rozeti — küçük ekran */}
            <div className="grid grid-cols-3 gap-2 mt-4 lg:hidden">
              {[
                { Icon: Shield, label: "Güvenli Ödeme" },
                { Icon: Truck, label: "Hızlı Kargo" },
                { Icon: RefreshCcw, label: "Kolay İade" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-xl py-2.5 border border-white/6"
                  style={{ background: "rgba(15,23,42,0.6)" }}
                >
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-[10px] font-medium text-center">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sağ — Ürün bilgileri */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-col gap-7"
          >
            {/* Mağaza + yıldızlar */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 text-xs font-bold tracking-widest uppercase">
                  {store.store_name}
                </span>
                <span className="text-white/15">·</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i <= 4
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-700 fill-slate-700"
                      }`}
                    />
                  ))}
                  <span className="text-slate-500 text-xs ml-1">(127)</span>
                </div>
              </div>

              {/* SEO Başlığı */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
                {title}
              </h1>
            </div>

            {/* Fiyat */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-4xl sm:text-5xl font-extrabold"
                style={{
                  backgroundImage: "linear-gradient(135deg,#c084fc,#818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {formattedPrice} TL
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 line-through text-sm">
                  {originalPrice} TL
                </span>
                <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-lg self-start">
                  %20 İNDİRİM
                </span>
              </div>
            </div>

            {/* AI Özellikleri */}
            {features.length > 0 && (
              <div className="rounded-2xl border border-white/6 p-5 space-y-3"
                style={{ background: "rgba(15,23,42,0.5)" }}>
                <p className="text-xs text-purple-400 font-bold tracking-widest uppercase mb-1">
                  Öne Çıkan Özellikler
                </p>
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200 text-sm leading-relaxed font-medium">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Ayırıcı */}
            {descParagraphs.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 font-bold tracking-widest uppercase mb-4">
                  Ürün Hikayesi
                </p>
                <div className="space-y-4">
                  {descParagraphs.map((p, i) => (
                    <p
                      key={i}
                      className="text-slate-400 text-sm leading-loose"
                      style={{ fontVariantNumeric: "proportional-nums" }}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Güven rozetleri — büyük ekran */}
            <div className="hidden lg:grid grid-cols-3 gap-2">
              {[
                { Icon: Shield, label: "Güvenli Ödeme" },
                { Icon: Truck, label: "Hızlı Kargo" },
                { Icon: RefreshCcw, label: "Kolay İade" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-xl py-2.5 border border-white/6"
                  style={{ background: "rgba(15,23,42,0.6)" }}
                >
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-[10px] font-medium text-center">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Satın Al CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg,#667eea 0%,#a855f7 50%,#ec4899 100%)",
                boxShadow: "0 8px 32px rgba(168,85,247,0.4)",
              }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1.5,
                }}
                style={{
                  background:
                    "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
                  width: "60%",
                }}
              />
              <ShoppingCart className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Kredi Kartı ile Güvenli Öde</span>
            </motion.button>

            <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>PayTR Güvenceli · 256-bit SSL Şifreli</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
