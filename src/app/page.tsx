"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Store, Tag, ArrowRight, Sun, Moon, Check,
  ShieldCheck, Globe, Zap, ChevronLeft, Plus, Minus, Palette, Search,
} from "lucide-react";
import OptiefyIcon from "@/components/OptiefyIcon";
import dynamic from "next/dynamic";
import Link from "next/link";
import UploadZone from "@/components/UploadZone";
import { blobUrlToBase64 } from "@/utils/supabase";
import { THEMES, type ThemeId } from "@/types/theme";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

const LoadingScreen = dynamic(() => import("@/components/LoadingScreen"), { ssr: false });
const MobilePreview  = dynamic(() => import("@/components/MobilePreview"),  { ssr: false });
const PaywallCard    = dynamic(() => import("@/components/PaywallCard"),    { ssr: false });
const RedirectScreen = dynamic(() => import("@/components/RedirectScreen"), { ssr: false });

void blobUrlToBase64;

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = "landing" | "tone" | "form" | "loading" | "preview";

type GenerateResult = {
  seo_title: string | null;
  description: string | null;
  features: string[] | null;
  image_urls: string[];
  recommended_theme?: ThemeId;
  color_palette?: { primary: string; secondary: string } | null;
};

// ─── Palettes ─────────────────────────────────────────────────────────────────

const L = {
  bg:           "#FFFFFF",
  bgSoft:       "#F7F7F5",
  bgCard:       "#FFFFFF",
  text:         "#1A1A1A",
  textMuted:    "#6B7280",
  textSubtle:   "#9CA3AF",
  border:       "#E5E5E5",
  headerBg:     "rgba(255,255,255,0.97)",
  accent:       "#7C3AED",
  accentSoft:   "#F3F0FF",
  accentGlow:   "rgba(124,58,237,0.08)",
  cardShadow:      "0 1px 2px rgba(0,0,0,0.04)",
  cardShadowHover: "0 6px 24px rgba(0,0,0,0.08)",
  highlightCardBorder: "#7C3AED",
  inputBg:      "#F3F3F1",
  ctaBg:        "#111111",
  ctaText:      "#FFFFFF",
  sectionLabel: "#EA580C",
};

const D = {
  bg:           "#0A0A0A",
  bgSoft:       "#111111",
  bgCard:       "#1C1C1C",
  text:         "#F5F5F4",
  textMuted:    "#9CA3AF",
  textSubtle:   "#6B7280",
  border:       "rgba(255,255,255,0.08)",
  headerBg:     "rgba(10,10,10,0.97)",
  accent:       "#A855F7",
  accentSoft:   "rgba(168,85,247,0.10)",
  accentGlow:   "rgba(168,85,247,0.20)",
  cardShadow:      "0 1px 3px rgba(0,0,0,0.5)",
  cardShadowHover: "0 8px 32px rgba(0,0,0,0.6)",
  highlightCardBorder: "#9333EA",
  inputBg:      "rgba(255,255,255,0.05)",
  ctaBg:        "#F5F5F4",
  ctaText:      "#111111",
  sectionLabel: "#FB923C",
};

type CP = typeof L;

// ─── Static data ──────────────────────────────────────────────────────────────

const TONE_CHIPS = [
  { label: "Lüks & Sofistike",        emoji: "💎" },
  { label: "Genç & Enerjik",          emoji: "⚡" },
  { label: "Samimi & Sıcak",          emoji: "🤝" },
  { label: "Profesyonel & Güvenilir", emoji: "🏆" },
  { label: "Minimal & Modern",        emoji: "◻️" },
  { label: "Eğlenceli & Yaratıcı",   emoji: "🎨" },
];

const CATEGORIES = [
  { title: "Moda & Giyim",      desc: "Giyim, çanta, ayakkabı ve aksesuar" },
  { title: "Sağlık & Güzellik", desc: "Kozmetik, cilt bakımı ve wellness ürünleri" },
  { title: "El Sanatları",      desc: "El yapımı ve özgün tasarım ürünler" },
  { title: "Yiyecek & İçecek",  desc: "Özel üretim organik ve artisan gıda" },
  { title: "Ev & Dekorasyon",   desc: "Tekstil, yaşam alanı ve dekorasyon" },
  { title: "Elektronik",        desc: "Teknoloji, aksesuar ve dijital ürünler" },
];

const FEATURES = [
  { title: "Profesyonel vitrin tasarımları",   desc: "Ziyaretçiyi müşteriye dönüştürmek için optimize edilmiş, sektörünüze özel hazır vitrin şablonları. Tek tıkla uygulayın." },
  { title: "AI destekli içerik üretimi",       desc: "GPT-4o ile ürün başlığı, açıklama ve SEO metinleri saniyeler içinde hazır. Rakiplerinizden her zaman bir adım önde olun." },
  { title: "Mobil öncelikli tasarım",          desc: "Tüm müşterilerinizin %70'i mobil cihazdan alışveriş yapıyor. Her vitrin otomatik olarak tüm ekran boyutlarına uyum sağlar." },
  { title: "Arama motoru optimizasyonu",       desc: "Yapay zeka tarafından üretilen meta etiketler, sayfa yapısı ve schema markup ile Google'da üst sıralara çıkın." },
  { title: "PayTR ile güvenli ödeme",          desc: "Türkiye'nin en güvenilir ödeme altyapısı PayTR ile tüm bankalar, 3D Secure ve taksit imkânı. Dakikalar içinde kurulum." },
  { title: "Özel domain & analitik",           desc: "Kendi alan adınızı DNS kaydıyla bağlayın. Satış, trafik ve dönüşüm oranlarınızı gerçek zamanlı takip edin." },
];

const PLANS = [
  {
    id: "free",
    name: "Ücretsiz",
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null as string | null,
    cta: "Ücretsiz Başla",
    highlighted: false,
    features: [
      "Temel e-ticaret vitrini",
      "Ücretsiz alt alan adı (.optiefy.com)",
      "Sınırsız site trafiği",
      "Temel SEO araçları",
      "Aylık 3 ürün için AI içerik üretimi",
      "SSL sertifikası dahil",
    ],
  },
  {
    id: "launch",
    name: "Başlangıç",
    monthlyPrice: 25,
    yearlyPrice: 22,
    badge: "MOST POPULAR" as string | null,
    cta: "Hemen Başla",
    highlighted: true,
    features: [
      "Ücretsiz planın tüm özellikleri",
      "Kendi alan adını bağla (BYOD)",
      "PayTR Sanal POS entegrasyonu",
      "Sınırsız AI içerik ve görsel üretimi",
      "Otomatik fatura ve ürün açıklamaları",
      "Öncelikli müşteri desteği",
    ],
  },
  {
    id: "grow",
    name: "Büyüme",
    monthlyPrice: 49,
    yearlyPrice: 41,
    badge: null as string | null,
    cta: "Büyümeye Başla",
    highlighted: false,
    features: [
      "Başlangıç planın tüm özellikleri",
      "Trendyol & Hepsiburada senkronizasyonu",
      "Çoklu kanal sipariş yönetimi",
      "Sınırsız AI kotası — hiçbir sınır yok",
      "1-1 Uzman danışman desteği",
      "Gelişmiş satış analitiği",
    ],
  },
];

// ─── PricingCard ──────────────────────────────────────────────────────────────

function PricingCard({
  plan, c, isDark, isYearly, bodyFont, onCta,
}: {
  plan: typeof PLANS[number];
  c: CP;
  isDark: boolean;
  isYearly: boolean;
  bodyFont: string;
  onCta: () => void;
}) {
  const tr: React.CSSProperties = { transition: "background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease" };
  const isHigh = plan.highlighted;
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <motion.div
      className="relative pt-4 flex flex-col h-full"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      {plan.badge && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.14em] uppercase text-white whitespace-nowrap"
          style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}
        >
          {plan.badge}
        </div>
      )}
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden flex-1"
        style={{
          ...tr,
          background: c.bgCard,
          border: `1.5px solid ${isHigh ? (isDark ? "rgba(124,58,237,0.5)" : "#7C3AED") : c.border}`,
          boxShadow: isHigh ? `0 20px 56px ${c.accentGlow}` : c.cardShadow,
        }}
      >
        <div className="p-7 pb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-5" style={{ color: isHigh ? c.accent : c.textSubtle, fontFamily: bodyFont, ...tr }}>
            {plan.name}
          </p>
          <div className="flex items-end mb-6">
            <span className="text-lg font-semibold pb-1 mr-0.5" style={{ color: c.text, fontFamily: bodyFont, ...tr }}>$</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={price}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16 }}
                className="text-5xl leading-none"
                style={{ color: c.text, fontFamily: bodyFont, fontWeight: 800, ...tr }}
              >
                {price}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm font-medium pb-1.5 ml-1" style={{ color: c.textMuted, fontFamily: bodyFont }}>/m</span>
          </div>
          <motion.button
            whileHover={{ opacity: 0.86 }} whileTap={{ scale: 0.97 }}
            onClick={onCta}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={isHigh
              ? { background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "white", boxShadow: "0 4px 14px rgba(124,58,237,0.35)", fontFamily: bodyFont }
              : { background: isDark ? "rgba(255,255,255,0.09)" : "#111111", color: isDark ? c.text : "#FFFFFF", border: isDark ? `1px solid ${c.border}` : "none", fontFamily: bodyFont, ...tr }
            }
          >
            {plan.cta}
          </motion.button>
        </div>
        <div className="mx-7" style={{ height: "1px", background: isHigh ? (isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.12)") : c.border }} />
        <div className="px-7 py-5 flex-1">
          <ul className="space-y-3">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{ background: isHigh ? c.accentSoft : (isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9") }}>
                  <Check className="w-2.5 h-2.5" style={{ color: isHigh ? c.accent : c.textSubtle }} />
                </div>
                <span className="text-sm leading-relaxed" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function compressImageToBase64(blobUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const cv = document.createElement("canvas");
      cv.width = width; cv.height = height;
      cv.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(cv.toDataURL("image/jpeg", 0.85));
    };
    img.src = blobUrl;
  });
}

// ─── StoreBuilderForm (module-scope — prevents focus-loss bugs) ───────────────

type StoreFormData = {
  photoBase64: string | null;
  photoPreviewUrl: string | null;
  description: string;
  price: string;
  currency: "TRY" | "USD";
  domain: string;
};

type StoreBuilderFormProps = {
  isDark: boolean;
  c: CP;
  displayFont: string;
  bodyFont: string;
  onSubmit: (data: StoreFormData) => void;
};

const SBF_STEPS = [
  { num: "01", title: "Ürün fotoğrafı",       sub: "Yapay zeka görselinizi analiz edecek" },
  { num: "02", title: "Ürününüzü tanımlayın",  sub: "Kısaca ne satıyorsunuz? (2–3 kelime)" },
  { num: "03", title: "Satış fiyatı",          sub: "Ürününüzün fiyatını girin" },
  { num: "04", title: "Alan adı seçin",        sub: "Mağazanızın adresi nasıl olsun?" },
] as const;

type DomainCatalogEntry = { tld: string; raw: number };

const DOMAIN_CATALOG: DomainCatalogEntry[] = [
  { tld: ".com",    raw: 10  },
  { tld: ".net",    raw: 12  },
  { tld: ".org",    raw: 11  },
  { tld: ".io",     raw: 35  },
  { tld: ".co",     raw: 25  },
  { tld: ".xyz",    raw: 2   },
  { tld: ".shop",   raw: 4   },
  { tld: ".store",  raw: 5   },
  { tld: ".app",    raw: 14  },
  { tld: ".biz",    raw: 9   },
  { tld: ".info",   raw: 5   },
  { tld: ".online", raw: 3   },
];

const TAKEN_NAMES = new Set([
  "google","facebook","amazon","apple","instagram","twitter","netflix",
  "microsoft","youtube","linkedin","whatsapp","tiktok","vivinth","spotify",
  "airbnb","uber","tesla","shopify","wordpress","github","reddit","wikipedia",
  "yahoo","bing","paypal","ebay","alibaba","samsung","nike","adidas","zara",
  "ikea","hepsiburada","trendyol","gittigidiyor","n11","sahibinden",
]);

function domainHash(name: string, tld: string): number {
  const s = name + tld;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function simulateAvailability(name: string, tld: string): boolean {
  if (TAKEN_NAMES.has(name.toLowerCase())) return false;
  const h = domainHash(name, tld);
  if (tld === ".com")    return h % 10 > 5;
  if (tld === ".net")    return h % 10 > 4;
  if (tld === ".org")    return h % 10 > 3;
  if (tld === ".io")     return h % 10 > 2;
  if (tld === ".co")     return h % 10 > 3;
  if (tld === ".app")    return h % 10 > 2;
  return h % 10 > 1;
}

type DomainResult = { tld: string; raw: number; optiefyPrice: number; available: boolean };

const OPTIEFY_IP = "185.199.108.153";

function StoreBuilderForm({ isDark, c, displayFont, bodyFont, onSubmit }: StoreBuilderFormProps) {
  const [step,         setStep]        = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description,  setDescription] = useState("");
  const [price,        setPrice]       = useState("");
  const [currency,     setCurrency]    = useState<"TRY" | "USD">("TRY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descErr,      setDescErr]     = useState("");
  const [priceErr,     setPriceErr]    = useState("");

  // Step 04 — domain management
  const [domainTab,       setDomainTab]       = useState<"free" | "own" | "buy">("free");
  const [freeSubdomain,   setFreeSubdomain]   = useState("");
  const [ownDomainInput,  setOwnDomainInput]  = useState("");
  const [buyName,         setBuyName]         = useState("");
  const [buyResults,      setBuyResults]      = useState<DomainResult[]>([]);
  const [isBuySearching,  setIsBuySearching]  = useState(false);
  const [chosenBuyDomain, setChosenBuyDomain] = useState("");

  const tr: React.CSSProperties = { transition: "background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease" };

  const handlePhotoSelect = useCallback((_file: File, preview: string) => {
    setPhotoPreview(preview);
  }, []);

  const goNext = () => {
    if (step === 1) {
      if (!description.trim() || description.trim().length < 2) { setDescErr("En az 2 karakter girin"); return; }
      setDescErr("");
    }
    if (step === 2) {
      const num = parseFloat(price.replace(",", "."));
      if (!price.trim() || isNaN(num) || num <= 0) { setPriceErr("Geçerli bir fiyat girin"); return; }
      setPriceErr("");
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let photoBase64: string | null = null;
      if (photoPreview) photoBase64 = await compressImageToBase64(photoPreview);
      let finalDomain = "";
      if (domainTab === "free") {
        finalDomain = freeSubdomain.trim() ? `${freeSubdomain.trim()}.optiefy.com` : "";
      } else if (domainTab === "own") {
        finalDomain = ownDomainInput.trim();
      } else if (domainTab === "buy") {
        finalDomain = chosenBuyDomain;
      }
      onSubmit({ photoBase64, photoPreviewUrl: photoPreview, description, price, currency, domain: finalDomain });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inpSt: React.CSSProperties = {
    ...tr,
    background:   isDark ? "rgba(255,255,255,0.05)" : "#F5F5F5",
    border:       `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "#E5E5E5"}`,
    color:        c.text,
    borderRadius: "12px",
    padding:      "13px 15px",
    fontSize:     "15px",
    width:        "100%",
    outline:      "none",
    fontFamily:   bodyFont,
  };

  const info = SBF_STEPS[step];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        ...tr,
        background: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
        border:     `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E5E5"}`,
        boxShadow:  isDark ? "0 4px 32px rgba(0,0,0,0.4)" : "0 2px 20px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F0F0EE"}` }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: displayFont, fontSize: "2.8rem", lineHeight: 1, color: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.055)", letterSpacing: "-0.02em", userSelect: "none" }}>
            {info.num}
          </span>
          <div className="flex items-center gap-2">
            {SBF_STEPS.map((_, i) => (
              <div key={i} style={{
                width:        i === step ? 20 : 7,
                height:       7,
                borderRadius: 99,
                transition:   "all 0.3s ease",
                background:   i < step
                  ? (isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)")
                  : i === step
                  ? c.text
                  : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"),
              }} />
            ))}
          </div>
        </div>
        <h3 style={{ fontFamily: displayFont, fontSize: "1.3rem", fontWeight: 400, color: c.text, marginBottom: "0.2rem", lineHeight: 1.2, ...tr }}>
          {info.title}
        </h3>
        <p className="text-xs" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>{info.sub}</p>
      </div>

      {/* Body */}
      <div className="px-6 py-5" style={{ minHeight: 148 }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <UploadZone onImageSelect={handlePhotoSelect} previewUrl={photoPreview} />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <input
                type="text"
                autoFocus
                placeholder="El yapımı dev çiçek…"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDescErr(""); }}
                onKeyDown={(e) => e.key === "Enter" && goNext()}
                style={inpSt}
              />
              {descErr && <p className="text-red-400 text-xs mt-1.5" style={{ fontFamily: bodyFont }}>{descErr}</p>}
              <p className="text-xs mt-2" style={{ color: c.textSubtle, fontFamily: bodyFont }}>Örnekler: &ldquo;el yapımı şeker&rdquo;, &ldquo;organik sabun&rdquo;, &ldquo;hasır çanta&rdquo;</p>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <div className="flex gap-2.5">
                <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "#E5E5E5"}`, ...tr }}>
                  {(["TRY", "USD"] as const).map((cur) => (
                    <button key={cur} type="button" onClick={() => setCurrency(cur)}
                      className="px-4 py-3 text-sm font-bold"
                      style={{ ...tr, background: currency === cur ? c.ctaBg : "transparent", color: currency === cur ? c.ctaText : c.textMuted, fontFamily: bodyFont }}>
                      {cur === "TRY" ? "₺" : "$"}
                    </button>
                  ))}
                </div>
                <input
                  type="text" inputMode="decimal" autoFocus
                  placeholder={currency === "TRY" ? "299,90" : "49.99"}
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setPriceErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                  style={{ ...inpSt, flex: 1, width: "auto" }}
                />
              </div>
              {priceErr && <p className="text-red-400 text-xs mt-1.5" style={{ fontFamily: bodyFont }}>{priceErr}</p>}
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              {/* Tab bar */}
              <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#F0F0EE" }}>
                {(["free", "own", "buy"] as const).map((tab) => {
                  const labels = { free: "Ücretsiz", own: "Kendi Domaini", buy: "Domain Satın Al" };
                  const isPro = tab !== "free";
                  const isActive = domainTab === tab;
                  return (
                    <button key={tab} type="button" onClick={() => setDomainTab(tab)}
                      className="relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{
                        background: isActive ? (isDark ? "rgba(255,255,255,0.10)" : "#FFFFFF") : "transparent",
                        color: isActive ? c.text : c.textSubtle,
                        boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        fontFamily: bodyFont,
                      }}>
                      {labels[tab]}
                      {isPro && (
                        <span className="absolute -top-1 -right-1 px-1 rounded-full text-[9px] font-black leading-tight"
                          style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "white" }}>
                          Pro
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {domainTab === "free" && (
                  <motion.div key="tab-free" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <div className="flex items-stretch rounded-xl overflow-hidden" style={{ border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "#E5E5E5"}`, ...tr }}>
                      <input
                        type="text" autoFocus placeholder="elifbutik"
                        value={freeSubdomain}
                        onChange={(e) => setFreeSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleFinalSubmit()}
                        className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
                        style={{ color: c.text, fontFamily: bodyFont, ...tr }}
                      />
                      <div className="px-3 flex items-center flex-shrink-0 text-xs font-medium"
                        style={{ ...tr, background: isDark ? "rgba(255,255,255,0.04)" : "#F0F0EE", color: c.textSubtle, borderLeft: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E5E5"}`, fontFamily: bodyFont }}>
                        .optiefy.com
                      </div>
                    </div>
                    <p className="text-xs mt-2" style={{ color: c.textSubtle, fontFamily: bodyFont }}>İsteğe bağlı — boş bırakırsanız otomatik oluşturulur</p>
                  </motion.div>
                )}

                {domainTab === "own" && (
                  <motion.div key="tab-own" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <input
                      type="text" placeholder="shop.markanim.com"
                      value={ownDomainInput}
                      onChange={(e) => setOwnDomainInput(e.target.value.toLowerCase().trim())}
                      onKeyDown={(e) => e.key === "Enter" && handleFinalSubmit()}
                      style={{ ...inpSt, marginBottom: "10px" }}
                    />
                    <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#F5F5F3", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#E8E8E8"}`, fontFamily: bodyFont }}>
                      <p className="font-semibold mb-1" style={{ color: c.text }}>DNS Kaydı Nasıl Eklenir?</p>
                      <p style={{ color: c.textMuted }}>Domain sağlayıcınızın panelinde şu kayıtları ekleyin:</p>
                      <div className="rounded-lg px-3 py-2 mt-1.5 font-mono text-[11px] space-y-1" style={{ background: isDark ? "rgba(0,0,0,0.3)" : "#EBEBEB", color: c.text }}>
                        <div><span style={{ color: "#F59E0B" }}>A</span>{"  "}@{"  →  "}{OPTIEFY_IP}</div>
                        <div><span style={{ color: "#60A5FA" }}>CNAME</span>{"  "}www{"  →  "}stores.optiefy.com</div>
                      </div>
                      <p className="mt-1" style={{ color: c.textSubtle }}>DNS yayılması 24 saate kadar sürebilir.</p>
                    </div>
                  </motion.div>
                )}

                {domainTab === "buy" && (
                  <motion.div key="tab-buy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {/* Search row */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text" placeholder="mağazanızın-adı"
                        value={buyName}
                        onChange={(e) => {
                          setBuyName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                          setBuyResults([]);
                          setChosenBuyDomain("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && buyName.trim() && !isBuySearching) {
                            e.currentTarget.blur();
                            void (async () => {
                              setIsBuySearching(true);
                              setBuyResults([]);
                              setChosenBuyDomain("");
                              await new Promise((r) => setTimeout(r, 750));
                              setBuyResults(
                                DOMAIN_CATALOG.map(({ tld, raw }) => ({
                                  tld,
                                  raw,
                                  optiefyPrice: Math.round(raw * 1.15 * 100) / 100,
                                  available: simulateAvailability(buyName, tld),
                                }))
                              );
                              setIsBuySearching(false);
                            })();
                          }
                        }}
                        style={{ ...inpSt, flex: 1, width: "auto" }}
                      />
                      <motion.button type="button"
                        whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                        disabled={!buyName.trim() || isBuySearching}
                        onClick={async () => {
                          if (!buyName.trim() || isBuySearching) return;
                          setIsBuySearching(true);
                          setBuyResults([]);
                          setChosenBuyDomain("");
                          await new Promise((r) => setTimeout(r, 750));
                          setBuyResults(
                            DOMAIN_CATALOG.map(({ tld, raw }) => ({
                              tld,
                              raw,
                              optiefyPrice: Math.round(raw * 1.15 * 100) / 100,
                              available: simulateAvailability(buyName, tld),
                            }))
                          );
                          setIsBuySearching(false);
                        }}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold flex-shrink-0"
                        style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, opacity: (!buyName.trim() || isBuySearching) ? 0.5 : 1, minWidth: 90 }}>
                        {isBuySearching
                          ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25}/><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity={0.75}/></svg> Sorgulanıyor</>
                          : <><Search className="w-3.5 h-3.5" /> Sorgula</>
                        }
                      </motion.button>
                    </div>

                    {/* Results list */}
                    {buyResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                        className="rounded-xl overflow-hidden overflow-y-auto"
                        style={{ border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E5E5"}`, maxHeight: 260 }}>
                        {buyResults.map(({ tld, optiefyPrice, available }, i) => {
                          const fullDomain = `${buyName}${tld}`;
                          const isChosen = chosenBuyDomain === fullDomain;
                          return (
                            <div key={tld}
                              className="flex items-center justify-between gap-2 px-3 py-2.5"
                              style={{
                                borderTop: i > 0 ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#F0F0EE"}` : "none",
                                background: isChosen
                                  ? (isDark ? "rgba(34,197,94,0.08)" : "#F0FDF4")
                                  : (isDark ? (i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent") : (i % 2 === 0 ? "#FAFAFA" : "#FFFFFF")),
                                transition: "background 0.15s ease",
                              }}>
                              <div className="flex items-center gap-2 min-w-0">
                                <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: available ? "#22C55E" : "#F87171" }} />
                                <span className="text-sm font-semibold" style={{ color: c.text, fontFamily: bodyFont }}>
                                  {buyName}
                                  <span style={{ color: available ? c.text : c.textSubtle, fontWeight: 400 }}>{tld}</span>
                                </span>
                              </div>
                              {available ? (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs font-bold whitespace-nowrap" style={{ color: "#16A34A", fontFamily: bodyFont }}>
                                    ${optiefyPrice.toFixed(2)}
                                    <span style={{ color: c.textSubtle, fontWeight: 400 }}>/yıl</span>
                                  </span>
                                  <motion.button type="button"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => setChosenBuyDomain(isChosen ? "" : fullDomain)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-white whitespace-nowrap"
                                    style={{ background: isChosen ? "#16A34A" : "linear-gradient(135deg,#7C3AED,#9333EA)", fontFamily: bodyFont }}>
                                    {isChosen ? "✓ Seçildi" : "Seç"}
                                  </motion.button>
                                </div>
                              ) : (
                                <span className="text-xs flex-shrink-0 font-medium" style={{ color: "#F87171", fontFamily: bodyFont }}>Alınamaz</span>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}

                    {chosenBuyDomain && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: isDark ? "rgba(34,197,94,0.10)" : "#F0FDF4", border: "1px solid rgba(34,197,94,0.30)", color: "#16A34A", fontFamily: bodyFont }}>
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{chosenBuyDomain} seçildi — mağaza kurulumunda bağlanacak</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 pt-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F0F0EE"}` }}>
        {step === 0 ? (
          <button type="button" onClick={() => { setPhotoPreview(null); setStep(1); }}
            className="text-xs hover:opacity-60 transition-opacity"
            style={{ color: c.textMuted, fontFamily: bodyFont }}>
            Fotoğrafsız devam et →
          </button>
        ) : (
          <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))}
            className="flex items-center gap-1 text-xs font-medium hover:opacity-60 transition-opacity"
            style={{ color: c.textMuted, fontFamily: bodyFont }}>
            <ChevronLeft className="w-3.5 h-3.5" /> Geri
          </button>
        )}

        {step < 3 ? (
          <motion.button type="button" whileHover={{ opacity: 0.82 }} whileTap={{ scale: 0.97 }}
            onClick={goNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}>
            Devam Et <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        ) : (
          <motion.button type="button" whileHover={{ opacity: 0.84 }} whileTap={{ scale: 0.97 }}
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "white", fontFamily: bodyFont, boxShadow: "0 4px 14px rgba(124,58,237,0.35)", opacity: isSubmitting ? 0.7 : 1 }}>
            <Sparkles className="w-3.5 h-3.5" />
            {isSubmitting ? "Hazırlanıyor…" : "Mağazamı Kur"}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  const [user,        setUser]        = useState<User | null>(null);
  const [supabase]                    = useState(() => createClient());

  const [isDark,      setIsDark]      = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [appState,    setAppState]    = useState<AppState>("landing");
  const [isYearly,    setIsYearly]    = useState(false);
  const [openFeature, setOpenFeature] = useState<number | null>(0);

  const [storeType,        setStoreType]        = useState("");
  const [brandTone,        setBrandTone]        = useState("");
  const [selectedToneChip, setSelectedToneChip] = useState<string | null>(null);
  const [customToneInput,  setCustomToneInput]  = useState("");

  const [imagePreview,    setImagePreview]    = useState<string | null>(null);
  const [storeName,       setStoreName]       = useState("");
  const [price,           setPrice]           = useState("");
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [isSaving,        setIsSaving]        = useState(false);
  const [isRedirecting,   setIsRedirecting]   = useState(false);
  const [storeId,         setStoreId]         = useState<string | null>(null);
  const [saveError,       setSaveError]       = useState<string | null>(null);
  const [apiReady,        setApiReady]        = useState(false);
  const [generateResult,  setGenerateResult]  = useState<GenerateResult | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [selectedTheme,   setSelectedTheme]   = useState<ThemeId>("modern");
  const [userPickedTheme, setUserPickedTheme] = useState(false);
  const [customDomain,    setCustomDomain]    = useState<string | null>(null);

  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef  = useRef<HTMLDivElement>(null);

  const displayFont = "var(--font-display), Georgia, 'Times New Roman', serif";
  const bodyFont    = "var(--font-body), system-ui, -apple-system, sans-serif";

  useEffect(() => {
    try { if (localStorage.getItem("sv-dark") === "true") setIsDark(true); } catch { /* SSR */ }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDark = () => setIsDark((d) => {
    const next = !d;
    try { localStorage.setItem("sv-dark", String(next)); } catch { /* */ }
    return next;
  });

  const c: CP = isDark ? D : L;
  const tr: React.CSSProperties = { transition: "background-color 0.45s ease, color 0.45s ease, border-color 0.45s ease" };

  useEffect(() => {
    if (!isRedirecting) return;
    const dest  = storeId ? `/panel/${storeId}` : "/panel";
    const timer = setTimeout(() => router.push(dest), 2500);
    return () => clearTimeout(timer);
  }, [isRedirecting, router, storeId]);

  const handleImageSelect = useCallback((file: File, preview: string) => {
    void file; setImagePreview(preview); setErrors((e) => ({ ...e, image: "" }));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!imagePreview)     e.image     = "Lütfen bir ürün fotoğrafı yükleyin.";
    if (!storeName.trim()) e.storeName = "Mağaza adı zorunludur.";
    if (!price.trim())     e.price     = "Fiyat zorunludur.";
    else if (isNaN(parseFloat(price.replace(",", ".")))) e.price = "Geçerli bir fiyat girin.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };


  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setAppState("loading"); setApiReady(false); setSaveError(null);
    const contextParts: string[] = [];
    if (storeType.trim()) contextParts.push(`Mağaza türü: ${storeType.trim()}`);
    if (brandTone.trim()) contextParts.push(`Marka tonu: ${brandTone.trim()}`);
    const contextPrompt = contextParts.join(". ");
    try {
      const compressed = await compressImageToBase64(imagePreview!);
      setCompressedImage(compressed);
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: compressed, storeName, price, ...(contextPrompt ? { context_prompt: contextPrompt } : {}) }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ error: "Sunucu hatası" })); throw new Error(err.error || "İşlem başarısız"); }
      const data = (await res.json()) as GenerateResult;
      setGenerateResult(data);
      if (data.recommended_theme && !userPickedTheme) setSelectedTheme(data.recommended_theme);
      setApiReady(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      setSaveError(msg.length < 120 ? msg : "Bir hata oluştu. Lütfen tekrar deneyin.");
      setAppState("form");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePreview, storeName, price, storeType, brandTone, userPickedTheme]);

  const handleLoadingComplete = useCallback(() => setAppState("preview"), []);

  const handleReset = () => {
    setAppState("landing");
    setImagePreview(null); setStoreName(""); setPrice(""); setErrors({});
    setIsSaving(false); setIsRedirecting(false); setSaveError(null); setStoreId(null);
    setApiReady(false); setGenerateResult(null); setCompressedImage(null);
    setSelectedTheme("modern"); setUserPickedTheme(false); setCustomDomain(null);
    setStoreType(""); setBrandTone(""); setSelectedToneChip(null); setCustomToneInput("");
    setIsYearly(false);
  };

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!generateResult || !compressedImage) return;
    setIsSaving(true); setSaveError(null);
    try {
      const res = await fetch("/api/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressedImage, storeName, price, selectedPlan: plan,
          seo_title: generateResult.seo_title, description: generateResult.description,
          features: generateResult.features, image_urls: generateResult.image_urls,
          theme: selectedTheme, custom_domain: customDomain ?? null,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ error: "Kayıt hatası" })); throw new Error(err.error || "Kayıt başarısız"); }
      const { storeId: newId } = await res.json();
      setStoreId(newId ?? null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      setSaveError(msg.length < 120 ? msg : "Kayıt sırasında bir hata oluştu.");
      setIsSaving(false); return;
    }
    setIsSaving(false); setIsRedirecting(true);
  };

  const handleFormSubmit = useCallback((data: StoreFormData) => {
    try { sessionStorage.setItem("optiefy_store_data", JSON.stringify(data)); } catch { /* */ }
    if (user) {
      router.push("/build");
    } else {
      router.push("/login?from=builder");
    }
  }, [user, router]);

  const handleCategoryClick = (title: string) => {
    const data: StoreFormData = { photoBase64: null, photoPreviewUrl: null, description: title, price: "", currency: "TRY", domain: "" };
    try { sessionStorage.setItem("optiefy_store_data", JSON.stringify(data)); } catch { /* */ }
    if (user) {
      router.push("/build");
    } else {
      router.push("/login?from=builder");
    }
  };

  const handleToneContinue = () => {
    setBrandTone(selectedToneChip ?? customToneInput.trim());
    setAppState("form");
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (appState !== "landing") { setAppState("landing"); setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120); }
    else ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showHeader = appState !== "loading" && !isRedirecting;

  const inputStyle: React.CSSProperties = {
    ...tr,
    background: isDark ? "rgba(255,255,255,0.04)" : "#F5F5F5",
    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E5E5"}`,
    color: c.text,
    borderRadius: "12px",
    padding: "11px 15px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: bodyFont,
  };

  return (
    <div style={{ ...tr, background: c.bg, color: c.text, minHeight: "100vh", fontFamily: bodyFont }}>

      {/* Overlays */}
      <AnimatePresence>
        {appState === "loading" && <LoadingScreen key="ls" onComplete={handleLoadingComplete} apiReady={apiReady} />}
      </AnimatePresence>
      <AnimatePresence>
        {isRedirecting && <RedirectScreen key="rs" />}
      </AnimatePresence>

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showHeader && (
          <motion.header
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50"
            style={{
              ...tr,
              background: scrolled ? c.headerBg : "transparent",
              backdropFilter: scrolled ? "blur(16px)" : "none",
              WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
              borderBottom: scrolled ? `1px solid ${c.border}` : "none",
            }}
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <button onClick={handleReset} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
                  <OptiefyIcon size={13} color="white" />
                </div>
                <span className="font-semibold text-sm tracking-tight" style={{ color: c.text, fontFamily: bodyFont, ...tr }}>Optiefy</span>
              </button>

              {appState === "landing" && (
                <nav className="hidden md:flex items-center gap-8">
                  {[{ label: "Özellikler", ref: featuresRef }, { label: "Fiyatlandırma", ref: pricingRef }].map(({ label, ref }) => (
                    <button key={label} onClick={() => scrollTo(ref)} className="text-sm hover:opacity-60 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                      {label}
                    </button>
                  ))}
                </nav>
              )}

              <div className="flex items-center gap-3">
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={toggleDark}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ ...tr, background: isDark ? "rgba(255,255,255,0.06)" : "#F0F0EE", border: `1px solid ${c.border}` }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={isDark ? "sun" : "moon"} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 20, opacity: 0 }} transition={{ duration: 0.18 }}>
                      {isDark ? <Sun className="w-3.5 h-3.5" style={{ color: "#FB923C" }} /> : <Moon className="w-3.5 h-3.5" style={{ color: c.textMuted }} />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>

                {appState === "landing" ? (
                  user ? (
                    <>
                      <Link
                        href="/panel"
                        className="hidden sm:block text-sm px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity font-medium"
                        style={{ color: c.textMuted, fontFamily: displayFont, ...tr }}
                      >
                        Yönetim Paneli
                      </Link>
                      <motion.button
                        whileHover={{ opacity: 0.75 }} whileTap={{ scale: 0.97 }}
                        onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
                        className="text-sm px-4 py-2 rounded-lg"
                        style={{ color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: bodyFont, ...tr }}
                      >
                        Çıkış Yap
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="hidden sm:block text-sm px-3 py-1.5 hover:opacity-60 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                        Giriş Yap
                      </Link>
                      <motion.button whileHover={{ opacity: 0.82 }} whileTap={{ scale: 0.97 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}>
                        Ücretsiz Başla
                      </motion.button>
                    </>
                  )
                ) : (
                  <motion.button whileHover={{ opacity: 0.7 }} whileTap={{ scale: 0.97 }} onClick={handleReset}
                    className="text-sm px-4 py-2 rounded-lg"
                    style={{ color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: bodyFont, ...tr }}>
                    ← Yeni Vitrin
                  </motion.button>
                )}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ══ PAGE CONTENT ════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ── LANDING ────────────────────────────────────────────────────────── */}
        {appState === "landing" && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ ...tr, background: c.bg }}>

            {/* ─── HERO ─────────────────────────────────────────────────────── */}
            <section className="pt-44 pb-24 px-6 text-center" style={{ ...tr, background: c.bg }}>
              <div className="max-w-2xl mx-auto">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    fontFamily: displayFont,
                    fontSize: "clamp(3.2rem, 9vw, 6rem)",
                    fontWeight: 400,
                    lineHeight: 1.03,
                    letterSpacing: "-0.02em",
                    color: c.text,
                    marginBottom: "1.5rem",
                    ...tr,
                  }}
                >
                  Satışa hazır<br />e-ticaret<br />altyapısı
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.45 }}
                  className="text-base md:text-lg leading-relaxed mb-8 max-w-md mx-auto"
                  style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}
                >
                  Yapay zeka destekli içerik, PayTR ödeme altyapısı ve otomatik SEO. Ürün fotoğrafınızı yükleyin, 30 saniyede mağazanız yayında.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.45 }}
                  className="mb-7 text-left"
                >
                  <StoreBuilderForm isDark={isDark} c={c} displayFont={displayFont} bodyFont={bodyFont} onSubmit={handleFormSubmit} />
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34 }}
                  className="flex items-center justify-center gap-3 flex-wrap">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <span key={i} style={{ fontSize: 13, color: "#22C55E", lineHeight: 1 }}>★</span>)}
                  </div>
                  <span className="text-sm" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                    <strong style={{ color: c.text, fontWeight: 600 }}>4.9</strong> Trustpilot
                    &nbsp;·&nbsp;
                    <strong style={{ color: c.text, fontWeight: 600 }}>2.400+</strong> aktif satıcı
                  </span>
                </motion.div>
              </div>
            </section>

            {/* ─── CATEGORIES ───────────────────────────────────────────────── */}
            <section className="pb-20 px-6" style={{ ...tr, background: c.bg }}>
              <div className="max-w-5xl mx-auto">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="text-xl font-semibold mb-6"
                  style={{ fontFamily: bodyFont, color: c.text, ...tr }}
                >
                  İşletmenize özel
                </motion.h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CATEGORIES.map(({ title, desc }, i) => (
                    <motion.button
                      key={title}
                      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      transition={{ delay: i * 0.055 }}
                      whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.045)" : "#F5F5F3" }}
                      onClick={() => handleCategoryClick(title)}
                      className="flex items-center justify-between gap-4 p-5 rounded-xl text-left"
                      style={{ ...tr, background: c.bgCard, border: `1px solid ${c.border}` }}
                    >
                      <div>
                        <p className="text-sm font-semibold mb-0.5" style={{ color: c.text, fontFamily: bodyFont, ...tr }}>{title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>{desc}</p>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ ...tr, background: isDark ? "rgba(255,255,255,0.07)" : "#EBEBEB" }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </section>

            {/* ─── MID CTA ("All-in-one platform") ─────────────────────────── */}
            <section className="py-20 px-6" style={{ ...tr, background: c.bgSoft }}>
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
                  <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                    <p className="text-sm font-semibold mb-5" style={{ color: c.sectionLabel, fontFamily: bodyFont }}>Her şey dahil platform</p>
                    <h2 style={{
                      fontFamily: displayFont,
                      fontSize: "clamp(2.6rem, 5.5vw, 4.2rem)",
                      fontWeight: 400,
                      lineHeight: 1.07,
                      letterSpacing: "-0.015em",
                      color: c.text,
                      ...tr,
                    }}>
                      Kurun ve büyütün<br />iş yerinizi
                    </h2>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }}>
                    <p className="text-sm mb-5" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>
                      AI destekli içerik, otomatik SEO ve PayTR entegrasyonu ile dakikalar içinde satışa başlayın.
                    </p>
                    <motion.button
                      whileHover={{ opacity: 0.82 }} whileTap={{ scale: 0.97 }}
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold"
                      style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}>
                      <Sparkles className="w-4 h-4" /> Mağazamı Şimdi Kur
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ─── FEATURES SPLIT ───────────────────────────────────────────── */}
            <section ref={featuresRef} className="py-20 px-6" style={{ ...tr, background: c.bg }}>
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

                  {/* Left: overlapping store mock cards */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}
                    className="relative"
                  >
                    <div style={{ position: "relative", height: 380 }}>
                      {/* Back card */}
                      <div style={{
                        position: "absolute", inset: 0,
                        transform: "rotate(2.5deg) translate(14px, -12px)",
                        zIndex: 1, borderRadius: 20, overflow: "hidden",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                        background: "#0F2417",
                      }}>
                        <div className="flex items-center justify-between px-5 pt-5 pb-4">
                          <div className="flex items-center gap-2">
                            <div style={{ width: 20, height: 20, borderRadius: 6, background: "#22C55E" }} />
                            <div style={{ width: 80, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.12)" }} />
                          </div>
                          <div style={{ padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 700, color: "white", background: "#22C55E", fontFamily: bodyFont }}>YENİ</div>
                        </div>
                        <div style={{ margin: "0 20px", borderRadius: 14, height: 210, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div style={{ textAlign: "center", padding: "0 16px" }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,197,94,0.15)" }}>
                              <Sparkles style={{ width: 20, height: 20, color: "#22C55E" }} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)", fontFamily: bodyFont, marginBottom: 4 }}>Naturel Köy</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontFamily: bodyFont }}>Organik gıda ürünleri</p>
                          </div>
                        </div>
                        <div style={{ margin: "16px 20px 0" }}>
                          <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                            <div style={{ height: "100%", borderRadius: 99, background: "#22C55E", width: "54%" }} />
                          </div>
                          <p style={{ fontSize: 10, marginTop: 6, color: "rgba(255,255,255,0.28)", fontFamily: bodyFont }}>54 sipariş bu ay</p>
                        </div>
                      </div>

                      {/* Front card */}
                      <div style={{
                        position: "absolute", inset: 0,
                        transform: "rotate(-1.5deg) translate(-12px, 16px)",
                        zIndex: 2, borderRadius: 20, overflow: "hidden",
                        boxShadow: "0 28px 72px rgba(0,0,0,0.28)",
                        background: "#1A0A2E",
                      }}>
                        <div className="flex items-center justify-between px-5 pt-5 pb-4">
                          <div className="flex items-center gap-2">
                            <div style={{ width: 20, height: 20, borderRadius: 6, background: "#E91E8C" }} />
                            <div style={{ width: 80, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.12)" }} />
                          </div>
                          <div style={{ padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 700, color: "white", background: "#E91E8C", fontFamily: bodyFont }}>CANLIDA</div>
                        </div>
                        <div style={{ margin: "0 20px", borderRadius: 14, height: 215, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div style={{ textAlign: "center", padding: "0 16px" }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(233,30,140,0.15)" }}>
                              <Sparkles style={{ width: 20, height: 20, color: "#E91E8C" }} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.80)", fontFamily: bodyFont, marginBottom: 4 }}>Elif Butik</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontFamily: bodyFont }}>El yapımı çanta & aksesuar</p>
                          </div>
                        </div>
                        <div style={{ margin: "16px 20px 0" }}>
                          <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                            <div style={{ height: "100%", borderRadius: 99, background: "#E91E8C", width: "73%" }} />
                          </div>
                          <p style={{ fontSize: 10, marginTop: 6, color: "rgba(255,255,255,0.30)", fontFamily: bodyFont }}>73 sipariş bu ay</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats badge */}
                    <div className="mt-10">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: c.textSubtle, fontFamily: bodyFont }}>#1 AI Vitrin Platformu</p>
                      <p className="text-sm" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                        En hızlı, en güçlü AI vitrin oluşturucu.{" "}
                        <strong style={{ color: c.text, fontWeight: 600 }}>2.400+</strong> vitrin kuruldu.
                      </p>
                    </div>
                  </motion.div>

                  {/* Right: accordion */}
                  <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}>
                    <p className="text-sm font-semibold mb-5" style={{ color: c.sectionLabel, fontFamily: bodyFont }}>Platform özellikleri</p>
                    <h2 style={{
                      fontFamily: displayFont,
                      fontSize: "clamp(2rem, 4vw, 3rem)",
                      fontWeight: 400,
                      lineHeight: 1.1,
                      letterSpacing: "-0.01em",
                      color: c.text,
                      marginBottom: "2rem",
                      ...tr,
                    }}>
                      Müşterilerinizi<br />büyüleyin
                    </h2>

                    <div>
                      {FEATURES.map(({ title, desc }, i) => (
                        <div key={title} style={{ borderTop: `1px solid ${c.border}` }}>
                          <button
                            className="w-full flex items-center justify-between py-4 text-left gap-4"
                            onClick={() => setOpenFeature(openFeature === i ? null : i)}
                          >
                            <span className="text-sm font-semibold" style={{ color: c.text, fontFamily: bodyFont, ...tr }}>{title}</span>
                            <span
                              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{ ...tr, background: openFeature === i ? c.ctaBg : (isDark ? "rgba(255,255,255,0.07)" : "#EBEBEB") }}
                            >
                              {openFeature === i
                                ? <Minus className="w-3 h-3" style={{ color: c.ctaText }} />
                                : <Plus className="w-3 h-3" style={{ color: c.textMuted }} />}
                            </span>
                          </button>
                          <AnimatePresence>
                            {openFeature === i && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                                <p className="pb-5 text-sm leading-relaxed" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>{desc}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                      <div style={{ borderTop: `1px solid ${c.border}` }} />
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ─── PRICING ──────────────────────────────────────────────────── */}
            <section ref={pricingRef} className="py-20 px-6" style={{ ...tr, background: c.bgSoft }}>
              <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                  <p className="text-sm font-semibold mb-4" style={{ color: c.sectionLabel, fontFamily: bodyFont }}>Şeffaf fiyatlandırma</p>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                    <h2 style={{
                      fontFamily: displayFont,
                      fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                      fontWeight: 400,
                      lineHeight: 1.08,
                      letterSpacing: "-0.015em",
                      color: c.text,
                      ...tr,
                    }}>
                      İşinize uygun plan
                    </h2>

                    <div className="inline-flex items-center p-1 rounded-full self-start sm:self-auto"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#EBEBEB", border: `1px solid ${c.border}` }}>
                      {[{ label: "Aylık", yearly: false }, { label: "Yıllık  ·  %15", yearly: true }].map(({ label, yearly }) => (
                        <button key={String(yearly)} onClick={() => setIsYearly(yearly)}
                          className="relative px-4 py-1.5 rounded-full text-sm font-medium"
                          style={{ color: isYearly === yearly ? (yearly ? "white" : c.text) : c.textMuted, zIndex: 1, fontFamily: bodyFont }}>
                          {isYearly === yearly && (
                            <motion.div layoutId="billing-pill" className="absolute inset-0 rounded-full"
                              style={{ background: yearly ? "#111111" : (isDark ? "rgba(255,255,255,0.12)" : "white"), boxShadow: "0 1px 4px rgba(0,0,0,0.1)", zIndex: -1 }}
                              transition={{ type: "spring", stiffness: 420, damping: 32 }} />
                          )}
                          <span className="relative">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-10 pb-10" style={{ borderBottom: `1px solid ${c.border}` }}>
                  <span className="text-xs font-semibold" style={{ color: c.textSubtle, fontFamily: bodyFont }}>Tüm planlarda dahil:</span>
                  {["SSL Sertifikası", "Sınırsız Trafik", "SEO Optimizasyonu"].map((item) => (
                    <div key={item} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
                      <span className="text-xs" style={{ color: c.textMuted, fontFamily: bodyFont }}>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-1">
                  {PLANS.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} c={c} isDark={isDark} isYearly={isYearly} bodyFont={bodyFont}
                      onCta={() => {
                        if (!user) { router.push("/login"); return; }
                        window.scrollTo({ top: 0 }); setAppState("tone");
                      }} />
                  ))}
                </div>
                <p className="text-center text-sm mt-10" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
                  14 gün ücretsiz deneme · Kredi kartı gerekmez · İstediğin zaman iptal et
                </p>
              </div>
            </section>

            {/* ─── FOOTER CTA ───────────────────────────────────────────────── */}
            <section className="py-24 px-6" style={{ ...tr, background: c.bg, borderTop: `1px solid ${c.border}` }}>
              <div className="max-w-xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  style={{
                    fontFamily: displayFont,
                    fontSize: "clamp(2.8rem, 6.5vw, 4.5rem)",
                    fontWeight: 400,
                    lineHeight: 1.06,
                    letterSpacing: "-0.018em",
                    color: c.text,
                    marginBottom: "1rem",
                    ...tr,
                  }}
                >
                  Bugün başlayın
                </motion.h2>
                <p className="text-base mb-10" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>
                  Mağazanız 30 saniyede hazır. Kredi kartı gerekmez.
                </p>
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ opacity: 0.82 }} whileTap={{ scale: 0.97 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold"
                    style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}>
                    <Sparkles className="w-5 h-5" /> Ücretsiz Başla
                  </motion.button>
                </div>
              </div>
            </section>

            {/* ─── FOOTER ───────────────────────────────────────────────────── */}
            <footer className="py-10 px-6" style={{ ...tr, background: c.bg, borderTop: `1px solid ${c.border}` }}>
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
                    <OptiefyIcon size={11} color="white" />
                  </div>
                  <span className="font-semibold text-sm tracking-tight" style={{ color: c.text, fontFamily: bodyFont, ...tr }}>Optiefy</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                  {["Gizlilik Politikası", "Kullanım Koşulları", "KVKK", "İletişim"].map((l) => (
                    <a key={l} href="#" className="text-xs hover:opacity-60 transition-opacity" style={{ color: c.textSubtle, fontFamily: bodyFont, ...tr }}>{l}</a>
                  ))}
                </div>
                <p className="text-xs" style={{ color: c.textSubtle, fontFamily: bodyFont, ...tr }}>© 2026 Optiefy. Tüm Hakları Saklıdır.</p>
              </div>
            </footer>
          </motion.div>
        )}

        {/* ── TONE STEP ──────────────────────────────────────────────────────── */}
        {appState === "tone" && (
          <motion.div key="tone" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-16"
            style={{ ...tr, background: isDark ? D.bg : "#F7F7F5" }}>
            <div className="w-full max-w-xl">
              <div className="rounded-3xl p-7 sm:p-9"
                style={{ ...tr, background: isDark ? "#1C1C1C" : "#FFFFFF", border: `1px solid ${c.border}`, boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.6)" : "0 2px 16px rgba(0,0,0,0.05)" }}>
                <button onClick={() => setAppState("landing")} className="flex items-center gap-1.5 text-xs font-medium mb-7 hover:opacity-70 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                  <ChevronLeft className="w-3.5 h-3.5" /> Geri
                </button>
                <div className="mb-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: c.accent, fontFamily: bodyFont }}>Adım 1 / 2</p>
                  <h2 style={{ fontFamily: displayFont, fontSize: "1.9rem", fontWeight: 400, lineHeight: 1.15, color: c.text, marginBottom: "0.5rem", ...tr }}>
                    Markanızın tonu nasıl olmalı?
                  </h2>
                  <p className="text-sm" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>
                    Yapay zekanın size özel içerik üretmesi için iletişim tonunu seçin.
                    {storeType && <span style={{ color: c.accent }}> ({storeType})</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {TONE_CHIPS.map(({ label, emoji }) => {
                    const active = selectedToneChip === label;
                    return (
                      <motion.button key={label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedToneChip(active ? null : label); if (!active) setCustomToneInput(""); }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                        style={{
                          ...tr,
                          background: active ? c.ctaBg : (isDark ? "rgba(255,255,255,0.06)" : "#F3F3F1"),
                          color: active ? c.ctaText : c.textMuted,
                          border: active ? "none" : `1px solid ${c.border}`,
                          fontFamily: bodyFont,
                        }}>
                        <span>{emoji}</span>{label}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="mb-7">
                  <p className="text-xs font-medium mb-2" style={{ color: c.textSubtle, fontFamily: bodyFont }}>Ya da kendi tonunuzu yazın (isteğe bağlı)</p>
                  <input type="text" placeholder="Örn: 35-50 yaş arası kadınlara, zarif ve güven verici bir dil"
                    value={customToneInput}
                    onChange={(e) => { setCustomToneInput(e.target.value); if (e.target.value) setSelectedToneChip(null); }}
                    style={inputStyle} />
                </div>
                <motion.button whileHover={{ opacity: 0.84 }} whileTap={{ scale: 0.975 }} onClick={handleToneContinue}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}>
                  Devam Et <ArrowRight className="w-4 h-4" />
                </motion.button>
                <button onClick={() => { setBrandTone(""); setAppState("form"); }} className="w-full mt-3 py-2 text-xs font-medium hover:opacity-60 transition-opacity" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
                  Atla, fotoğrafa geç →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FORM ───────────────────────────────────────────────────────────── */}
        {(appState === "form" || appState === "loading") && (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-16"
            style={{ ...tr, background: isDark ? D.bg : "#F7F7F5" }}>
            <div className="w-full max-w-xl">
              {saveError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <span className="text-red-500 text-sm" style={{ fontFamily: bodyFont }}>{saveError}</span>
                </motion.div>
              )}
              <div className="rounded-3xl p-7 sm:p-9"
                style={{ ...tr, background: isDark ? "#1C1C1C" : "#FFFFFF", border: `1px solid ${c.border}`, boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.6)" : "0 2px 16px rgba(0,0,0,0.05)" }}>
                <button onClick={() => setAppState("tone")} className="flex items-center gap-1.5 text-xs font-medium mb-7 hover:opacity-70 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                  <ChevronLeft className="w-3.5 h-3.5" /> Geri
                </button>

                <div className="flex items-center gap-2 mb-7">
                  {["Ton", "Fotoğraf", "Yayınla"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={i === 0
                            ? { background: isDark ? "rgba(34,197,94,0.15)" : "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0" }
                            : i === 1
                            ? { background: c.ctaBg, color: c.ctaText, ...tr }
                            : { background: isDark ? "rgba(255,255,255,0.05)" : "#F3F3F1", color: c.textSubtle, ...tr }
                          }>
                          {i === 0 ? <Check className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className="text-xs font-medium hidden sm:block"
                          style={{ color: i === 1 ? c.text : i === 0 ? "#16A34A" : c.textSubtle, fontFamily: bodyFont, ...tr }}>{step}</span>
                      </div>
                      {i < 2 && <div className="w-6 h-px" style={{ background: c.border, ...tr }} />}
                    </div>
                  ))}
                </div>

                {brandTone && (
                  <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl text-xs font-medium"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#F3F3F1", color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: bodyFont, ...tr }}>
                    <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: c.textSubtle }} />
                    <span>Ton: <strong style={{ color: c.text }}>{brandTone}</strong></span>
                    <button onClick={() => { setBrandTone(""); setSelectedToneChip(null); setCustomToneInput(""); }} className="ml-auto opacity-50 hover:opacity-100 transition-opacity">✕</button>
                  </div>
                )}

                <div className="mb-5">
                  <label className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                    Ürün Fotoğrafı <span className="text-red-400">*</span>
                  </label>
                  <UploadZone onImageSelect={handleImageSelect} previewUrl={imagePreview} />
                  {errors.image && <p className="text-red-400 text-xs mt-1.5" style={{ fontFamily: bodyFont }}>{errors.image}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="store-name" className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                      <Store className="w-3.5 h-3.5" /> Mağaza Adı <span className="text-red-400">*</span>
                    </label>
                    <input id="store-name" type="text" value={storeName}
                      onChange={(e) => { setStoreName(e.target.value); setErrors((err) => ({ ...err, storeName: "" })); }}
                      placeholder="Örn: Elif'in Butik" style={inputStyle} />
                    {errors.storeName && <p className="text-red-400 text-xs mt-1" style={{ fontFamily: bodyFont }}>{errors.storeName}</p>}
                  </div>
                  <div>
                    <label htmlFor="price" className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                      <Tag className="w-3.5 h-3.5" /> Fiyat (TL) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input id="price" type="text" inputMode="decimal" value={price}
                        onChange={(e) => { setPrice(e.target.value); setErrors((err) => ({ ...err, price: "" })); }}
                        placeholder="299,90" style={{ ...inputStyle, paddingRight: "40px" }} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: c.textSubtle }}>₺</span>
                    </div>
                    {errors.price && <p className="text-red-400 text-xs mt-1" style={{ fontFamily: bodyFont }}>{errors.price}</p>}
                  </div>
                </div>

                {/* Vitrin teması — 5 görsel önizleme */}
                <div className="mb-6">
                  <label className="text-sm font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                    <Palette className="w-3.5 h-3.5" /> Vitrin Teması
                  </label>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
                      const th = THEMES[tid];
                      const active = selectedTheme === tid;
                      return (
                        <button
                          key={tid} type="button"
                          onClick={() => { setSelectedTheme(tid); setUserPickedTheme(true); }}
                          className="flex-shrink-0" style={{ width: 72 }}
                        >
                          <div className="rounded-lg overflow-hidden mb-1.5"
                            style={{ aspectRatio: "3 / 4", border: `2px solid ${active ? th.accentColor : c.border}`, transition: "border-color 0.2s ease" }}>
                            <div className="w-full h-full flex flex-col p-1.5" style={{ background: th.bgColor }}>
                              <div className="h-1 rounded-full mb-1" style={{ width: "60%", background: th.titleColor }} />
                              <div className="flex-1 rounded" style={{ background: th.galleryBg }} />
                              <div className="h-2 mt-1.5" style={{ background: th.solidBtn, borderRadius: th.btnRadius === "9999px" ? "9999px" : "2px" }} />
                            </div>
                          </div>
                          <p className="text-[10px] text-center font-medium truncate" style={{ color: active ? th.accentColor : c.textSubtle, fontFamily: bodyFont }}>
                            {th.shortName}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
                    Seçmezseniz yapay zeka ürününüze en uygun temayı önerir.
                  </p>
                </div>

                <motion.button onClick={handleSubmit} whileHover={{ opacity: 0.84 }} whileTap={{ scale: 0.975 }}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}>
                  <Sparkles className="w-4 h-4" /> Vitrini Oluştur <ArrowRight className="w-4 h-4" />
                </motion.button>

                <div className="flex flex-wrap items-center justify-center gap-5 mt-5">
                  {[
                    { Icon: ShieldCheck, label: "SSL Güvenli",     color: "#22C55E" },
                    { Icon: Zap,         label: "Anında Kurulum",  color: "#F59E0B" },
                    { Icon: Globe,       label: "Ücretsiz Domain", color: "#60A5FA" },
                  ].map(({ Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-xs" style={{ color: c.textSubtle, fontFamily: bodyFont }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PREVIEW ────────────────────────────────────────────────────────── */}
        {appState === "preview" && imagePreview && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col" style={{ background: "#0a0f1e" }}>
            <div className="flex-1 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-12 px-6 py-12 pt-28">
              <PaywallCard storeName={storeName} onSubscribe={handleSubscribe} isLoading={isSaving} error={saveError} onDomainSelect={setCustomDomain} />
              <MobilePreview imageUrl={imagePreview} storeName={storeName} price={price} aiData={generateResult ?? undefined} activeTheme={selectedTheme} onThemeChange={setSelectedTheme} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
