"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Camera, FileText, CreditCard, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: Brain,
    text: "Ürününüz yapay zeka ile analiz ediliyor...",
    color: "from-violet-500 to-purple-600",
    glow: "rgba(139, 92, 246, 0.4)",
  },
  {
    icon: Camera,
    text: "Fotoğrafınız stüdyo ortamına taşınıyor...",
    color: "from-blue-500 to-cyan-500",
    glow: "rgba(59, 130, 246, 0.4)",
  },
  {
    icon: FileText,
    text: "SEO uyumlu ürün açıklamalarınız yazılıyor...",
    color: "from-emerald-500 to-teal-500",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  {
    icon: CreditCard,
    text: "PayTR ödeme altyapınız entegre ediliyor...",
    color: "from-orange-500 to-amber-500",
    glow: "rgba(249, 115, 22, 0.4)",
  },
  {
    icon: Rocket,
    text: "Mağazanız yayına alınıyor!",
    color: "from-pink-500 to-rose-500",
    glow: "rgba(236, 72, 153, 0.4)",
  },
];

const STEP_DURATION = 1000;

interface LoadingScreenProps {
  onComplete: () => void;
  apiReady: boolean;
}

export default function LoadingScreen({ onComplete, apiReady }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);

  // Adımları sırayla göster, son adımda dur ve apiReady bekle
  useEffect(() => {
    const timers = STEPS.slice(0, -1).map((_, i) =>
      setTimeout(() => setCurrentStep(i), i * STEP_DURATION)
    );
    const lastStepTimer = setTimeout(() => {
      setCurrentStep(STEPS.length - 1);
      setAnimationDone(true);
    }, (STEPS.length - 1) * STEP_DURATION);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(lastStepTimer);
    };
  }, []);

  // İlerleme çubuğu: API hazır olana kadar %90'da bekle
  useEffect(() => {
    const preDuration = (STEPS.length - 1) * STEP_DURATION;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + (90 / (preDuration / 50));
        return next >= 90 ? 90 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // API hazır olduğunda %90 → %100, sonra tamamla
  useEffect(() => {
    if (!apiReady) return;
    const ramp = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(ramp); return 100; }
        return Math.min(p + 3, 100);
      });
    }, 30);
    const complete = setTimeout(onComplete, 800);
    return () => {
      clearInterval(ramp);
      clearTimeout(complete);
    };
  }, [apiReady, onComplete]);

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isWaiting = animationDone && !apiReady;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
    >
      {/* Arka plan parçacıkları */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-500/30"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
            }}
            animate={{ y: [0, -30, 0], opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: (i % 4) * 0.7 }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-10 px-8 max-w-md w-full">
        {/* Merkez ikonu */}
        <motion.div
          key={currentStep}
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.2, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative"
        >
          <motion.div
            animate={{
              boxShadow: [
                `0 0 30px ${step.glow}`,
                `0 0 60px ${step.glow}`,
                `0 0 30px ${step.glow}`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center`}
          >
            <StepIcon className="w-14 h-14 text-white" strokeWidth={1.5} />
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-3 rounded-[2rem] border border-white/10"
            style={{ borderTopColor: "rgba(255,255,255,0.4)" }}
          />
        </motion.div>

        {/* Adım metni */}
        <div className="text-center min-h-[80px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={isWaiting ? "waiting" : currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-400 text-sm font-medium tracking-widest uppercase">
                  {isWaiting ? "Son rötuşlar..." : `Adım ${currentStep + 1} / ${STEPS.length}`}
                </span>
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-white text-2xl font-bold text-center leading-snug">
                {isWaiting ? "Neredeyse hazır, bekleyin..." : step.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* İlerleme çubuğu */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>{isWaiting ? "Son işlemler tamamlanıyor..." : "İşlem sürüyor..."}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${step.color} rounded-full`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>

        {/* Adım noktaları */}
        <div className="flex gap-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === currentStep ? 1.3 : i < currentStep ? 1 : 0.8,
                opacity: i <= currentStep ? 1 : 0.3,
              }}
              className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${s.color}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
