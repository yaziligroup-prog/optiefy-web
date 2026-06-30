"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, Sparkles, Crown, Zap,
} from "lucide-react";
import OptiefyIcon from "@/components/OptiefyIcon";
import { createClient } from "@/utils/supabase/client";
import { THEMES, type ThemeId } from "@/types/theme";
import type { Store } from "@/types/store";

// ─── PhoneFrame (module-scope) ────────────────────────────────────────────────

function PhoneFrame({
  storeId,
  activeTheme,
  iframeRef,
  iframeLoaded,
  onIframeLoad,
  accentColor,
}: {
  storeId: string;
  activeTheme: ThemeId;
  iframeRef: React.RefObject<HTMLIFrameElement | null> | null;
  iframeLoaded: boolean;
  onIframeLoad: () => void;
  accentColor: string;
}) {
  const iframeSrc = `/store/preview/${storeId}?theme=${activeTheme}`;

  return (
    <div className="relative" style={{ filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.55))" }}>
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accentColor}28 0%, transparent 68%)`,
          filter: "blur(24px)",
          transform: "scale(1.3)",
          transition: "background 0.4s ease",
        }}
      />

      {/* Device shell */}
      <div
        className="relative overflow-hidden"
        style={{
          width:        310,
          height:       640,
          borderRadius: 44,
          border:       "10px solid #1C1C1E",
          background:   "#1C1C1E",
          boxShadow:    "inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 0 1px rgba(0,0,0,0.5)",
        }}
      >
        {/* Status bar */}
        <div
          className="relative flex items-center justify-between px-5 pt-2 pb-1 z-10"
          style={{ background: "#1C1C1E", height: 38 }}
        >
          <span className="text-white text-[11px] font-semibold">9:41</span>
          {/* Dynamic island */}
          <div
            className="absolute left-1/2 top-2"
            style={{
              transform:    "translateX(-50%)",
              width:        120,
              height:       34,
              borderRadius: 20,
              background:   "#000",
            }}
          />
          <div className="flex items-center gap-1.5">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="white" opacity={0.9}>
              <rect x="0" y="4" width="3" height="8" rx="1" />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" />
              <rect x="13.5" y="0" width="2.5" height="12" rx="1" opacity={0.35} />
            </svg>
            <svg width="15" height="12" viewBox="0 0 15 12" fill="white" opacity={0.9}>
              <path d="M7.5 2C9.8 2 11.9 2.9 13.4 4.4L15 2.8C13.1 1 10.4 0 7.5 0S1.9 1 0 2.8L1.6 4.4C3.1 2.9 5.2 2 7.5 2z"/>
              <path d="M7.5 5.5c1.4 0 2.7.6 3.6 1.5L12.7 5.3C11.4 4 9.5 3.2 7.5 3.2S3.6 4 2.3 5.3l1.6 1.7C4.8 6.1 6.1 5.5 7.5 5.5z"/>
              <circle cx="7.5" cy="10" r="2"/>
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" opacity={0.9}>
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" strokeOpacity={0.35}/>
              <rect x="2" y="2" width="17" height="8" rx="2" fill="white"/>
              <path d="M23 4v4a2 2 0 000-4z" fill="white" fillOpacity={0.4}/>
            </svg>
          </div>
        </div>

        {/* iframe area */}
        <div
          className="relative overflow-hidden"
          style={{ width: "100%", height: "calc(100% - 38px - 24px)" }}
        >
          {/* Skeleton shimmer */}
          {!iframeLoaded && (
            <div className="absolute inset-0 z-10" style={{ background: "#F8F8F6" }}>
              <div className="w-full h-full flex flex-col gap-3 p-4 animate-pulse">
                <div className="h-40 rounded-xl" style={{ background: "#E8E8E4" }} />
                <div className="h-4 rounded-full w-3/4" style={{ background: "#E8E8E4" }} />
                <div className="h-3 rounded-full w-1/2" style={{ background: "#EDEDEA" }} />
                <div className="h-3 rounded-full w-2/3" style={{ background: "#EDEDEA" }} />
                <div className="h-10 rounded-xl mt-2" style={{ background: "#E0E0DB" }} />
                <div className="flex gap-2 mt-1">
                  <div className="flex-1 h-20 rounded-lg" style={{ background: "#E8E8E4" }} />
                  <div className="flex-1 h-20 rounded-lg" style={{ background: "#E8E8E4" }} />
                </div>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={iframeSrc}
            onLoad={onIframeLoad}
            title="Mağaza önizlemesi"
            className="w-full h-full border-0"
            style={{ display: "block" }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Home indicator */}
        <div
          className="flex items-center justify-center"
          style={{ height: 24, background: "#1C1C1E" }}
        >
          <div
            className="rounded-full"
            style={{ width: 100, height: 4, background: "rgba(255,255,255,0.4)" }}
          />
        </div>
      </div>
    </div>
  );
}

type PlanId = "free" | "launch" | "grow";
type Billing = "monthly" | "yearly";

const PLANS: {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlighted: boolean;
  badge?: string;
  icon: typeof Sparkles;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Ücretsiz",
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlighted: false,
    icon: Zap,
    features: [
      "Temel vitrin",
      ".optiefy.com alan adı",
      "SSL sertifikası",
      "Aylık 3 AI içerik",
    ],
  },
  {
    id: "launch",
    name: "Başlangıç",
    monthlyPrice: 25,
    yearlyPrice: 22,
    highlighted: true,
    badge: "EN POPÜLER",
    icon: Crown,
    features: [
      "Kendi alan adını bağla",
      "PayTR ödeme entegrasyonu",
      "Sınırsız AI içerik",
      "Öncelikli destek",
    ],
  },
  {
    id: "grow",
    name: "Büyüme",
    monthlyPrice: 49,
    yearlyPrice: 41,
    highlighted: false,
    icon: Sparkles,
    features: [
      "Trendyol & Hepsiburada sync",
      "Çoklu kanal yönetimi",
      "Sınırsız AI kotası",
      "1-1 Uzman danışman",
    ],
  },
];

// ─── ThemeCard (module-scope) ─────────────────────────────────────────────────

function ThemeCard({
  themeId,
  isActive,
  onClick,
  bodyFont,
}: {
  themeId: ThemeId;
  isActive: boolean;
  onClick: () => void;
  bodyFont: string;
}) {
  const th = THEMES[themeId];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative flex flex-col items-center gap-1.5 flex-shrink-0"
      style={{ width: 72 }}
    >
      <div
        className="w-full rounded-xl overflow-hidden"
        style={{
          aspectRatio: "3/4",
          border: isActive
            ? `2px solid ${th.accentColor}`
            : "2px solid rgba(0,0,0,0.07)",
          boxShadow: isActive
            ? `0 0 0 3px ${th.accentColor}22, 0 8px 20px ${th.accentColor}1A`
            : "0 2px 8px rgba(0,0,0,0.05)",
          transition: "all 0.25s ease",
        }}
      >
        {/* Simulated store layout */}
        <div className="w-full h-full flex flex-col" style={{ background: th.bgColor }}>
          {/* Header */}
          <div
            className="flex items-center justify-between px-1.5 py-1"
            style={{ background: th.headerBg, borderBottom: `1px solid ${th.borderColor}` }}
          >
            <div className="w-5 h-1 rounded-full" style={{ background: th.titleColor, opacity: 0.5 }} />
            <div className="w-2 h-2 rounded-full" style={{ background: th.accentColor }} />
          </div>
          {/* Product image area */}
          <div className="mx-1 mt-0.5 mb-0.5 rounded-md flex-1" style={{ background: th.galleryBg }} />
          {/* Info + buttons */}
          <div className="px-1.5 pb-1.5 space-y-1">
            <div className="h-1 rounded-full" style={{ background: th.titleColor, opacity: 0.6, width: "65%" }} />
            <div className="flex gap-1">
              <div
                className="h-1.5 flex-1 rounded"
                style={{
                  background: th.solidBtn,
                  borderRadius: th.btnRadius === "9999px" ? "9999px" : "3px",
                }}
              />
              <div
                className="h-1.5 flex-1 rounded opacity-30"
                style={{
                  background: th.accentColor,
                  borderRadius: th.btnRadius === "9999px" ? "9999px" : "3px",
                }}
              />
            </div>
          </div>
        </div>
        {/* Active check overlay */}
        {isActive && (
          <div
            className="absolute inset-0 flex items-start justify-end p-1.5 pointer-events-none"
            style={{ background: `${th.accentColor}12` }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: th.accentColor }}
            >
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        )}
      </div>
      <span
        className="text-[11px] font-semibold truncate w-full text-center"
        style={{
          color: isActive ? th.accentColor : "#9CA3AF",
          fontFamily: bodyFont,
          transition: "color 0.2s ease",
        }}
      >
        {th.shortName}
      </span>
    </motion.button>
  );
}

// ─── PlanCard (module-scope) ──────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
  isSelected,
  onClick,
  bodyFont,
}: {
  plan: typeof PLANS[number];
  billing: Billing;
  isSelected: boolean;
  onClick: () => void;
  bodyFont: string;
}) {
  const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const Icon = plan.icon;
  const tr: React.CSSProperties = { transition: "all 0.25s ease" };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full text-left rounded-2xl overflow-hidden"
      style={{
        ...tr,
        border: isSelected
          ? plan.highlighted
            ? "2px solid #7C3AED"
            : "2px solid #111111"
          : "1.5px solid #E5E5E5",
        background: isSelected ? (plan.highlighted ? "#FAF5FF" : "#F5F5F5") : "#FFFFFF",
        boxShadow: isSelected
          ? plan.highlighted
            ? "0 4px 20px rgba(124,58,237,0.12)"
            : "0 4px 12px rgba(0,0,0,0.06)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        minWidth: 0,
        padding: "14px",
      }}
    >
      {plan.badge && (
        <div
          className="absolute top-0 right-0 text-[9px] font-black tracking-wider text-white px-2 py-0.5 rounded-bl-xl"
          style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)" }}
        >
          {plan.badge}
        </div>
      )}

      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5"
        style={{
          background: plan.highlighted
            ? "rgba(124,58,237,0.10)"
            : isSelected
            ? "rgba(0,0,0,0.06)"
            : "#F3F3F1",
        }}
      >
        <Icon
          className="w-3.5 h-3.5"
          style={{ color: plan.highlighted ? "#7C3AED" : "#6B7280" }}
        />
      </div>

      <p
        className="text-[10px] font-black uppercase tracking-widest mb-1"
        style={{ color: plan.highlighted ? "#7C3AED" : "#9CA3AF", fontFamily: bodyFont }}
      >
        {plan.name}
      </p>

      <div className="flex items-end gap-0.5 mb-2.5">
        <span className="text-sm font-semibold" style={{ color: "#6B7280", fontFamily: bodyFont }}>
          $
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={price}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="text-3xl font-black leading-none"
            style={{ color: "#111111", fontFamily: bodyFont }}
          >
            {price}
          </motion.span>
        </AnimatePresence>
        <span className="text-xs font-medium pb-0.5 ml-0.5" style={{ color: "#9CA3AF", fontFamily: bodyFont }}>
          /ay
        </span>
      </div>

      <ul className="space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
              style={{ background: plan.highlighted ? "rgba(124,58,237,0.10)" : "#F0F0EE" }}
            >
              <Check
                className="w-2 h-2"
                style={{ color: plan.highlighted ? "#7C3AED" : "#9CA3AF" }}
              />
            </div>
            <span
              className="text-[11px] leading-snug"
              style={{ color: "#6B7280", fontFamily: bodyFont }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {isSelected && (
        <div
          className="absolute bottom-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: plan.highlighted ? "#7C3AED" : "#111111" }}
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </motion.button>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────

function PreviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const storeId = params.get("storeId");
  const [supabase] = useState(() => createClient());

  const [store,         setStore]         = useState<Store | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [activeTheme,   setActiveTheme]   = useState<ThemeId>("modern");
  const [billing,       setBilling]       = useState<Billing>("monthly");
  const [selectedPlan,  setSelectedPlan]  = useState<PlanId>("launch");
  const [submitting,    setSubmitting]    = useState(false);
  const [iframeLoaded,  setIframeLoaded]  = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);

  const displayFont = "var(--font-display), Georgia, 'Times New Roman', serif";
  const bodyFont    = "var(--font-body), system-ui, -apple-system, sans-serif";

  // Fetch store data
  useEffect(() => {
    if (!storeId) { router.replace("/"); return; }
    supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setFetchError("Mağaza bilgileri yüklenemedi.");
        } else {
          setStore(data as Store);
          const t = (data as Store).theme as ThemeId;
          if (t && THEMES[t]) setActiveTheme(t);
        }
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Debounced theme save to Supabase
  const saveThemeDebounced = useCallback((themeId: ThemeId) => {
    if (!storeId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      supabase.from("stores").update({ theme: themeId }).eq("id", storeId).then(() => {});
    }, 800);
  }, [storeId, supabase]);

  const handleThemeChange = (themeId: ThemeId) => {
    setActiveTheme(themeId);
    saveThemeDebounced(themeId);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "optiefy-preview-theme", theme: themeId },
      window.location.origin,
    );
  };

  const handleGoToPanel = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (storeId) {
        await supabase
          .from("stores")
          .update({
            theme:         activeTheme,
            selected_plan: billing === "yearly" ? "yearly" : "monthly",
          })
          .eq("id", storeId);
      }
      router.push("/panel");
    } catch {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            className="w-9 h-9 rounded-full border-2"
            style={{ borderColor: "#E5E5E5", borderTopColor: "#7C3AED" }}
          />
          <p style={{ color: "#9CA3AF", fontFamily: bodyFont, fontSize: 14 }}>
            Mağazanız yükleniyor…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (fetchError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
        <div className="text-center max-w-sm px-6">
          <p style={{ color: "#EF4444", fontFamily: bodyFont, marginBottom: 12 }}>
            {fetchError ?? "Bir hata oluştu."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-sm underline"
            style={{ color: "#9CA3AF", fontFamily: bodyFont }}
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: "#FAFAF8" }}>

      {/* ── Top bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3.5"
        style={{
          background:    "rgba(250,250,248,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom:  "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
            <OptiefyIcon size={11} color="white" />
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: "#1A1A1A", fontFamily: bodyFont }}>
            Optiefy
          </span>
        </div>
        {/* Step trail */}
        <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: "#9CA3AF", fontFamily: bodyFont }}>
          <span style={{ color: "#22C55E", fontWeight: 600 }}>✓ Veri Toplandı</span>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: "#22C55E", fontWeight: 600 }}>✓ AI Oluşturdu</span>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: "#111111", fontWeight: 600 }}>Önizle & Başlat</span>
        </div>
        <div className="w-20 sm:w-auto" />
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 pt-14">

        {/* ════ LEFT PANEL ════════════════════════════════════════════════════ */}
        <div
          className="w-full lg:w-[460px] lg:fixed lg:top-14 lg:bottom-0 lg:left-0 lg:overflow-y-auto flex flex-col"
          style={{ borderRight: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex flex-col gap-6 px-4 sm:px-7 py-6 sm:py-8 flex-1">

            {/* Success header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)" }}
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold" style={{ color: "#16A34A", fontFamily: bodyFont }}>
                  Mağazanız yapay zeka tarafından oluşturuldu
                </span>
              </div>

              <h1
                style={{
                  fontFamily:    displayFont,
                  fontSize:      "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight:    400,
                  lineHeight:    1.1,
                  letterSpacing: "-0.018em",
                  color:         "#111111",
                  marginBottom:  "0.35rem",
                }}
              >
                {store.store_name}
              </h1>
              {store.seo_title && store.seo_title !== store.store_name && (
                <p className="text-sm" style={{ color: "#9CA3AF", fontFamily: bodyFont }}>
                  {store.seo_title}
                </p>
              )}
            </motion.div>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

            {/* ── Theme selector ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "#F0F0EE" }}
                >
                  🎨
                </div>
                <h2 className="text-sm font-bold" style={{ color: "#111111", fontFamily: bodyFont }}>
                  Temanızı seçin
                </h2>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${THEMES[activeTheme].accentColor}15`, color: THEMES[activeTheme].accentColor, fontFamily: bodyFont, fontWeight: 600 }}
                >
                  {THEMES[activeTheme].name}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                  <ThemeCard
                    key={id}
                    themeId={id}
                    isActive={activeTheme === id}
                    onClick={() => handleThemeChange(id)}
                    bodyFont={bodyFont}
                  />
                ))}
              </div>
              <p className="hidden lg:block text-xs mt-3" style={{ color: "#C4C4C0", fontFamily: bodyFont }}>
                Canlı önizlemede sağ taraftan görünümü inceleyin
              </p>
            </motion.div>

            {/* ── Mobile-only inline preview ── */}
            <div
              className="lg:hidden -mx-4 sm:-mx-7"
              style={{ background: "#0F172A", paddingTop: 20, paddingBottom: 24 }}
            >
              <p className="text-slate-400 text-xs font-medium mb-5 tracking-wider uppercase text-center" style={{ fontFamily: bodyFont }}>
                Canlı Önizleme
              </p>
              <div style={{ overflow: "hidden", position: "relative", height: 515 }}>
                <div style={{ display: "flex", justifyContent: "center", transform: "scale(0.78)", transformOrigin: "top center" }}>
                  <PhoneFrame
                    storeId={storeId!}
                    activeTheme={activeTheme}
                    iframeRef={null}
                    iframeLoaded={false}
                    onIframeLoad={() => {}}
                    accentColor={THEMES[activeTheme].accentColor}
                  />
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

            {/* ── Plan selector ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: "#F0F0EE" }}
                  >
                    💎
                  </div>
                  <h2 className="text-sm font-bold" style={{ color: "#111111", fontFamily: bodyFont }}>
                    Paket seçin
                  </h2>
                </div>

                {/* Billing toggle */}
                <div
                  className="flex items-center rounded-full overflow-hidden p-0.5"
                  style={{ background: "#EBEBEB" }}
                >
                  {(["monthly", "yearly"] as Billing[]).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBilling(b)}
                      className="relative px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        color: billing === b ? "#111111" : "#9CA3AF",
                        fontFamily: bodyFont,
                        zIndex: 1,
                      }}
                    >
                      {billing === b && (
                        <motion.div
                          layoutId="billing-bg"
                          className="absolute inset-0 rounded-full bg-white"
                          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.10)", zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative">
                        {b === "monthly" ? "Aylık" : "Yıllık −15%"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PLANS.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    billing={billing}
                    isSelected={selectedPlan === plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    bodyFont={bodyFont}
                  />
                ))}
              </div>

              {billing === "yearly" && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs mt-3 text-center"
                  style={{ color: "#16A34A", fontFamily: bodyFont, fontWeight: 600 }}
                >
                  🎉 Yıllık planla 2 ay ücretsiz
                </motion.p>
              )}
            </motion.div>

            {/* ── Spacer ── */}
            <div className="flex-1" />

            {/* ── CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.4 }}
              className="pb-2"
            >
              <motion.button
                type="button"
                onClick={handleGoToPanel}
                disabled={submitting}
                whileHover={{ opacity: 0.88 }}
                whileTap={{ scale: 0.985 }}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 text-base font-semibold"
                style={{
                  background:  selectedPlan === "launch"
                    ? "linear-gradient(135deg,#7C3AED,#9333EA)"
                    : "#111111",
                  color:      "white",
                  fontFamily: bodyFont,
                  boxShadow:  selectedPlan === "launch"
                    ? "0 6px 20px rgba(124,58,237,0.32)"
                    : "0 4px 14px rgba(0,0,0,0.18)",
                  opacity:    submitting ? 0.7 : 1,
                  transition: "all 0.25s ease",
                }}
              >
                {submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
                    />
                    Yönlendiriliyorsunuz…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {selectedPlan === "free"
                      ? "Ücretsiz Başla ve Panele Geç"
                      : "Aboneliği Başlat ve Panele Geç"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-xs mt-3" style={{ color: "#C4C4C0", fontFamily: bodyFont }}>
                14 gün ücretsiz deneme · Kredi kartı gerekmez · İstediğin zaman iptal et
              </p>
            </motion.div>
          </div>
        </div>

        {/* ════ RIGHT PANEL — Real iframe phone mockup ══════════════════════ */}
        <div
          className="hidden lg:flex flex-1 lg:ml-[460px] items-center justify-center py-12"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 60% 40%, rgba(124,58,237,0.06) 0%, rgba(59,130,246,0.04) 50%, transparent 80%), #0F172A",
            minHeight: "100dvh",
          }}
        >
          <PhoneFrame
            storeId={storeId!}
            activeTheme={activeTheme}
            iframeRef={iframeRef}
            iframeLoaded={iframeLoaded}
            onIframeLoad={() => {
              setIframeLoaded(true);
              iframeRef.current?.contentWindow?.postMessage(
                { type: "optiefy-preview-theme", theme: activeTheme },
                window.location.origin,
              );
            }}
            accentColor={THEMES[activeTheme].accentColor}
          />
        </div>

      </div>
    </div>
  );
}

// ─── Missing import ────────────────────────────────────────────────────────────

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewContent />
    </Suspense>
  );
}
