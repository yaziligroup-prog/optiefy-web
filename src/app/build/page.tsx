"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Camera, Rocket, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// ─── Zaman bazlı aşamalar ─────────────────────────────────────────────────────────
// Her aşama `from` saniyesinde tetiklenir; ikon, renk ve mesajlar değişir.

const PHASES = [
  {
    from:  0,
    icon:  Brain,
    color: "from-violet-500 to-purple-600",
    glow:  "rgba(139,92,246,0.45)",
    title: "Mağaza konseptiniz ve lüks SEO metinleriniz üretiliyor...",
    sub:   "GPT-4o Vision ürününüzü analiz ediyor",
    barLabel: "Başlatılıyor...",
  },
  {
    from:  5,
    icon:  Camera,
    color: "from-blue-500 to-cyan-500",
    glow:  "rgba(59,130,246,0.45)",
    title: "Ürününüz yapay zeka stüdyosuna alındı, arka planı temizleniyor...",
    sub:   "Photoroom + OpenAI stüdyo kalitesine getiriyor",
    barLabel: "Görsel işleniyor...",
  },
  {
    from:  15,
    icon:  Sparkles,
    color: "from-fuchsia-500 to-pink-500",
    glow:  "rgba(217,70,239,0.45)",
    title: "Sihir başlıyor: DALL-E 3 lüks lifestyle sahneleri çiziyor...",
    sub:   "Mermer tezgah · İskandinav minimal · Stüdyo beyazı",
    barLabel: "Sahneler çiziliyor...",
  },
  {
    from:  35,
    icon:  Rocket,
    color: "from-orange-500 to-amber-500",
    glow:  "rgba(249,115,22,0.45)",
    title: "Son rötuşlar yapılıyor, vitrin camları parlatılıyor...",
    sub:   "Dükkanınız kuruluyor, birazdan hazır",
    barLabel: "Tamamlanıyor...",
  },
] as const;

function getPhase(elapsedSec: number) {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (elapsedSec >= PHASES[i].from) return { phase: PHASES[i], index: i };
  }
  return { phase: PHASES[0], index: 0 };
}

// İki aşamalı ilerleme:
// 0–3s  → hızlı:  0 → 40%
// 3s+   → yavaş: +2.5% her 4 saniyede, max %88
// isDone → %100'e fırla (done effect yönetir)
function calcProgress(elapsedMs: number): number {
  const s = elapsedMs / 1000;
  if (s <= 3) return (s / 3) * 40;
  return Math.min(40 + ((s - 3) / 4) * 2.5, 88);
}

type StoreFormData = {
  photoBase64:     string | null;
  photoPreviewUrl: string | null;
  description:     string;
  price:           string;
  currency:        "TRY" | "USD";
  domain:          string;
};

// ─── BuildContent ─────────────────────────────────────────────────────────────────

function BuildContent() {
  const router     = useRouter();
  const params     = useSearchParams();
  const [supabase] = useState(() => createClient());

  const [displayName, setDisplayName] = useState(params.get("storeName") ?? "");
  const [elapsed,     setElapsed]     = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [isDone,      setIsDone]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // buildKey artınca ticker yeniden başlar (retry senaryosu)
  const [buildKey,  setBuildKey]  = useState(0);
  const calledRef                 = useRef(false);
  const startTimeRef              = useRef<number>(Date.now());
  const isDoneRef                 = useRef(false);

  // isDoneRef'i isDone state'i ile senkronize tut
  useEffect(() => { isDoneRef.current = isDone; }, [isDone]);

  // ── Progress ticker ─────────────────────────────────────────────────────────────
  useEffect(() => {
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      if (isDoneRef.current) return; // done effect devralınca durdur
      const elapsedMs = Date.now() - startTimeRef.current;
      setElapsed(Math.floor(elapsedMs / 1000));
      setProgress(calcProgress(elapsedMs));
    }, 100);
    return () => clearInterval(id);
  // buildKey değişince yeniden başlat (retry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey]);

  // ── Auth + API çağrısı ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?from=builder");
        return;
      }

      let sd: StoreFormData | null = null;
      try {
        const raw = sessionStorage.getItem("optiefy_store_data");
        if (raw) {
          sd = JSON.parse(raw) as StoreFormData;
          if (sd.description) setDisplayName(sd.description);
        }
      } catch { /* */ }

      const niche = sd?.description || params.get("storeName") || "Genel Mağaza";

      try {
        const res = await fetch("/api/generate-store", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            storeName:   niche,
            description: sd?.description ?? undefined,
            price:       sd?.price ?? undefined,
            currency:    sd?.currency ?? undefined,
            domain:      sd?.domain ?? undefined,
            photoBase64: sd?.photoBase64 ?? undefined,
          }),
        });
        const data = (await res.json()) as { error?: string; storeId?: string };
        if (!res.ok) throw new Error(data.error ?? "AI içerik üretimi başarısız");

        try { sessionStorage.removeItem("optiefy_store_data"); } catch { /* */ }
        if (data.storeId) {
          try { sessionStorage.setItem("optiefy_last_store_id", data.storeId); } catch { /* */ }
        }

        setIsDone(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Beklenmedik bir hata oluştu");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router, error]);

  // ── API döndüğünde: %100'e fırlat → preview'a geç ──────────────────────────────
  useEffect(() => {
    if (!isDone) return;

    // Anlık %100'e çık (hızlı ama smooth)
    const fillId = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(fillId); return 100; }
        return Math.min(p + 5, 100);
      });
    }, 22);

    const navId = setTimeout(() => {
      let storeId: string | null = null;
      try { storeId = sessionStorage.getItem("optiefy_last_store_id"); } catch { /* */ }
      router.push(storeId ? `/preview?storeId=${storeId}` : "/panel");
    }, 1100);

    return () => { clearInterval(fillId); clearTimeout(navId); };
  }, [isDone, router]);

  const retry = () => {
    calledRef.current = false;
    setError(null);
    setIsDone(false);
    setElapsed(0);
    setProgress(0);
    startTimeRef.current = Date.now();
    setBuildKey((k) => k + 1);
  };

  const { phase, index: phaseIndex } = getPhase(elapsed);
  const Icon = phase.icon;

  // ── Hata ekranı ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <AlertCircle className="w-8 h-8" style={{ color: "#F87171" }} />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Bir sorun oluştu</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-7">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Tekrar Dene
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Ana yükleme ekranı ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left:       `${(i * 37 + 13) % 100}%`,
              top:        `${(i * 53 + 7) % 100}%`,
              background: i % 3 === 0
                ? "rgba(139,92,246,0.4)"
                : i % 3 === 1
                ? "rgba(59,130,246,0.3)"
                : "rgba(236,72,153,0.3)",
            }}
            animate={{ y: [0, -32, 0], opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 2 + (i % 3) * 0.6, repeat: Infinity, delay: (i % 5) * 0.45 }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-9 px-8 max-w-sm w-full">

        {/* Mağaza/ürün adı chip */}
        {displayName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#C084FC" }} />
            <span className="text-slate-300 text-sm font-medium truncate max-w-[220px]">
              {displayName}
            </span>
          </motion.div>
        )}

        {/* Aşama ikonu — phaseIndex değişince animasyonla geçer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIndex}
            initial={{ scale: 0.5, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.15, opacity: 0, y: -18 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 30px ${phase.glow}`,
                  `0 0 62px ${phase.glow}`,
                  `0 0 30px ${phase.glow}`,
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${phase.color} flex items-center justify-center`}
            >
              <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
            </motion.div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-3 rounded-[2rem] border border-white/8"
              style={{ borderTopColor: "rgba(255,255,255,0.35)" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Dinamik durum mesajları */}
        <div className="text-center min-h-[100px] flex flex-col items-center justify-center gap-2">
          <p
            className="text-xs font-bold tracking-[0.2em] uppercase"
            style={{ color: "rgba(148,163,184,0.7)" }}
          >
            Yapay Zeka Stüdyosu Aktif
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={`title-${phaseIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="text-white text-xl font-bold text-center leading-snug"
            >
              {phase.title}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${phaseIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-sm"
              style={{ color: "rgba(148,163,184,0.55)" }}
            >
              {phase.sub}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div
            className="flex justify-between text-xs mb-2"
            style={{ color: "rgba(100,116,139,0.9)" }}
          >
            <span style={{ color: "rgba(148,163,184,0.45)" }}>{phase.barLabel}</span>
            <span className="font-mono tabular-nums">{Math.round(progress)}%</span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,1)" }}>
            <motion.div
              className={`h-full bg-gradient-to-r ${phase.color} rounded-full`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>

          {/* Geçen süre — arka planda dev bir mühendisliğin çalıştığını hissettir */}
          <motion.p
            className="text-xs text-center mt-2.5"
            style={{ color: "rgba(100,116,139,0.45)" }}
            animate={{ opacity: elapsed > 0 ? 1 : 0 }}
          >
            {elapsed}s · Ortalama tamamlanma süresi ~30–60 saniye
          </motion.p>
        </div>

        {/* Aşama noktaları */}
        <div className="flex gap-3">
          {PHASES.map((p, i) => (
            <motion.div
              key={i}
              animate={{
                scale:   i === phaseIndex ? 1.4 : i < phaseIndex ? 1 : 0.7,
                opacity: i <= phaseIndex ? 1 : 0.22,
              }}
              className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${p.color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BuildPage() {
  return (
    <Suspense>
      <BuildContent />
    </Suspense>
  );
}
