"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, Sparkles, Check, Wand2, Store as StoreIcon,
  Palette, ImageIcon, FileText, LayoutTemplate, ScanEye, PartyPopper, AlertTriangle,
} from "lucide-react";
import UploadZone from "@/components/UploadZone";
import { PANEL_BODY_FONT, PANEL_DISPLAY_FONT } from "../_lib/theme";

// ─── Görsel sıkıştırma (client-side canvas) ─────────────────────────────────────
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

// ─── AI üretim aşamaları (loading sırasında döner) ──────────────────────────────
const STAGES = [
  { icon: ScanEye,        label: "Ürününüz analiz ediliyor",        sub: "Yapay zeka görseli inceliyor" },
  { icon: StoreIcon,      label: "Marka kimliğiniz oluşturuluyor",  sub: "İsim ve karakter belirleniyor" },
  { icon: Palette,        label: "Vitrin tasarımı çiziliyor",       sub: "Renkler ve tipografi seçiliyor" },
  { icon: ImageIcon,      label: "Ürün görselleri stüdyoya taşınıyor", sub: "Profesyonel arka planlar üretiliyor" },
  { icon: FileText,       label: "SEO metinleri yazılıyor",         sub: "Satışa dönük açıklamalar hazırlanıyor" },
  { icon: LayoutTemplate, label: "Son rötuşlar yapılıyor",          sub: "Mağazanız yayına hazırlanıyor" },
] as const;

type WizardData = {
  photoPreview: string | null;
  productDesc:  string;
  price:        string;
  currency:     "TRY" | "USD";
  subdomain:    string;
  ownDomain:    string;
  domainMode:   "free" | "own";
};

const EMPTY: WizardData = {
  photoPreview: null, productDesc: "", price: "", currency: "TRY",
  subdomain: "", ownDomain: "", domainMode: "free",
};

const STEPS = [
  { num: "01", title: "Ürün fotoğrafı",  sub: "Yapay zekanın analiz edeceği görseli yükleyin" },
  { num: "02", title: "Ürününüz nedir?", sub: "Kısaca tanımlayın — gerisini AI halleder" },
  { num: "03", title: "Fiyatlandırma",   sub: "Satış fiyatını ve para birimini belirleyin" },
  { num: "04", title: "Alan adı",        sub: "Mağazanızın internet adresi" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (storeId: string) => void;
}

type Phase = "form" | "generating" | "success" | "error";

export default function NewStoreWizard({ open, onClose, onCreated }: Props) {
  const [step, setStep]   = useState(0);
  const [data, setData]   = useState<WizardData>(EMPTY);
  const [phase, setPhase] = useState<Phase>("form");
  const [stageIdx, setStageIdx]     = useState(0);
  const [progress, setProgress]     = useState(0);
  const [errorMsg, setErrorMsg]     = useState("");
  const [newStoreId, setNewStoreId] = useState<string | null>(null);
  const [fieldErr, setFieldErr]     = useState("");

  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modal kapandığında sıfırla
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(0); setData(EMPTY); setPhase("form");
        setStageIdx(0); setProgress(0); setErrorMsg(""); setNewStoreId(null); setFieldErr("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Loading animasyonu — aşama döngüsü + progress bar
  useEffect(() => {
    if (phase !== "generating") {
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (progTimer.current)  clearInterval(progTimer.current);
      return;
    }
    setStageIdx(0);
    setProgress(6);
    stageTimer.current = setInterval(() => {
      setStageIdx((i) => (i + 1) % STAGES.length);
    }, 2600);
    // Progress %90'a kadar yumuşak dolum (gerçek bitişte %100'e çekilir)
    progTimer.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(0.4, (90 - p) * 0.035) : p));
    }, 220);
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (progTimer.current)  clearInterval(progTimer.current);
    };
  }, [phase]);

  // ESC ile kapat (yalnızca form aşamasında)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "form") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, onClose]);

  const patch = (p: Partial<WizardData>) => setData((d) => ({ ...d, ...p }));

  const canProceed = (): boolean => {
    if (step === 1) return data.productDesc.trim().length >= 2 || !!data.photoPreview;
    if (step === 2) {
      const n = parseFloat(data.price.replace(",", "."));
      return !isNaN(n) && n > 0;
    }
    return true;
  };

  const goNext = () => {
    if (step === 1 && !canProceed()) { setFieldErr("Ürününüzü tanımlayın veya fotoğraf ekleyin"); return; }
    if (step === 2 && !canProceed()) { setFieldErr("Geçerli bir fiyat girin"); return; }
    setFieldErr("");
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else void handleGenerate();
  };

  const goBack = () => { setFieldErr(""); setStep((s) => Math.max(0, s - 1)); };

  const handleGenerate = useCallback(async () => {
    setPhase("generating");
    setErrorMsg("");
    try {
      let photoBase64: string | null = null;
      if (data.photoPreview) photoBase64 = await compressImageToBase64(data.photoPreview);

      const domain =
        data.domainMode === "own"
          ? data.ownDomain.trim().toLowerCase()
          : data.subdomain.trim()
          ? `${data.subdomain.trim()}.optiefy.com`
          : "";

      const res = await fetch("/api/generate-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: data.productDesc.trim(),
          price:       data.price.trim(),
          currency:    data.currency,
          domain:      domain || undefined,
          photoBase64: photoBase64 || undefined,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Sunucu hatası" }));
        throw new Error(e.error || "Vitrin oluşturulamadı");
      }
      const json = await res.json() as { storeId?: string };
      setNewStoreId(json.storeId ?? null);
      setProgress(100);
      setPhase("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Beklenmedik bir hata oluştu";
      setErrorMsg(msg.length < 140 ? msg : "Bir hata oluştu. Lütfen tekrar deneyin.");
      setPhase("error");
    }
  }, [data]);

  const handleFinish = () => {
    if (newStoreId) onCreated(newStoreId);
    onClose();
  };

  if (!open) return null;

  const info = STEPS[step];
  const Stage = STAGES[stageIdx].icon;

  // ─── Dark AI-studio paleti (panel temasından bağımsız — her zaman lüks gece) ──
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15,
    background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.12)",
    color: "#F5F5F4", outline: "none", fontFamily: PANEL_BODY_FONT,
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        onClick={() => phase === "form" && onClose()}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(165deg, #171520 0%, #0E0D14 100%)",
            border: "1px solid rgba(168,85,247,0.18)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          {/* Dekoratif ışıltı */}
          <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.20) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)" }} />

          <AnimatePresence mode="wait">
            {/* ═══════════ FORM ═══════════ */}
            {phase === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                {/* Header */}
                <div className="px-7 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                        <Wand2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold tracking-wide" style={{ color: "#F5F5F4", fontFamily: PANEL_BODY_FONT }}>
                        AI Vitrin Stüdyosu
                      </span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                    </button>
                  </div>

                  {/* Adım göstergesi */}
                  <div className="flex items-center gap-2 mb-4">
                    {STEPS.map((_, i) => (
                      <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: i === step ? 28 : 8,
                          background: i < step ? "#A855F7" : i === step ? "#EC4899" : "rgba(255,255,255,0.12)",
                        }} />
                    ))}
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.6rem", color: "rgba(168,85,247,0.35)", lineHeight: 1 }}>
                      {info.num}
                    </span>
                    <div>
                      <h3 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.35rem", fontWeight: 400, color: "#F5F5F4", lineHeight: 1.15 }}>
                        {info.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>{info.sub}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-7 py-6" style={{ minHeight: 210 }}>
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                        <UploadZone
                          previewUrl={data.photoPreview}
                          onImageSelect={(_f, preview) => patch({ photoPreview: preview })}
                        />
                        <p className="text-xs mt-3 text-center" style={{ color: "#6B7280", fontFamily: PANEL_BODY_FONT }}>
                          İsteğe bağlı — fotoğraf eklerseniz yapay zeka çok daha isabetli çalışır
                        </p>
                      </motion.div>
                    )}

                    {step === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                        <input
                          autoFocus type="text" placeholder="El yapımı deri cüzdan…"
                          value={data.productDesc}
                          onChange={(e) => { patch({ productDesc: e.target.value }); setFieldErr(""); }}
                          onKeyDown={(e) => e.key === "Enter" && goNext()}
                          style={inputStyle}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          {["Seramik kupa", "Organik sabun", "Gümüş kolye", "Hasır çanta"].map((chip) => (
                            <button key={chip} onClick={() => { patch({ productDesc: chip }); setFieldErr(""); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#C4B5FD", fontFamily: PANEL_BODY_FONT }}>
                              {chip}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                        <div className="flex gap-2.5">
                          <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}>
                            {(["TRY", "USD"] as const).map((cur) => (
                              <button key={cur} onClick={() => patch({ currency: cur })}
                                className="px-4 py-3.5 text-sm font-bold transition-colors"
                                style={{
                                  background: data.currency === cur ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "transparent",
                                  color: data.currency === cur ? "#FFFFFF" : "#9CA3AF", fontFamily: PANEL_BODY_FONT,
                                }}>
                                {cur === "TRY" ? "₺" : "$"}
                              </button>
                            ))}
                          </div>
                          <input
                            autoFocus type="text" inputMode="decimal"
                            placeholder={data.currency === "TRY" ? "299,90" : "49.99"}
                            value={data.price}
                            onChange={(e) => { patch({ price: e.target.value }); setFieldErr(""); }}
                            onKeyDown={(e) => e.key === "Enter" && goNext()}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                        </div>
                        <p className="text-xs mt-3" style={{ color: "#6B7280", fontFamily: PANEL_BODY_FONT }}>
                          Yapay zeka bu fiyata uygun premium bir konumlandırma yapacak
                        </p>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                          {(["free", "own"] as const).map((mode) => (
                            <button key={mode} onClick={() => patch({ domainMode: mode })}
                              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                              style={{
                                background: data.domainMode === mode ? "rgba(255,255,255,0.10)" : "transparent",
                                color: data.domainMode === mode ? "#F5F5F4" : "#6B7280", fontFamily: PANEL_BODY_FONT,
                              }}>
                              {mode === "free" ? "Ücretsiz Adres" : "Kendi Domainim"}
                            </button>
                          ))}
                        </div>

                        <AnimatePresence mode="wait">
                          {data.domainMode === "free" ? (
                            <motion.div key="free" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                              <div className="flex items-stretch rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}>
                                <input
                                  autoFocus type="text" placeholder="magazam"
                                  value={data.subdomain}
                                  onChange={(e) => patch({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                  className="flex-1 bg-transparent px-4 py-3.5 text-sm focus:outline-none"
                                  style={{ color: "#F5F5F4", fontFamily: PANEL_BODY_FONT }}
                                />
                                <div className="px-3 flex items-center flex-shrink-0 text-xs font-medium"
                                  style={{ background: "rgba(255,255,255,0.04)", color: "#9CA3AF", borderLeft: "1.5px solid rgba(255,255,255,0.10)", fontFamily: PANEL_BODY_FONT }}>
                                  .optiefy.com
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div key="own" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                              <input
                                autoFocus type="text" placeholder="magazam.com"
                                value={data.ownDomain}
                                onChange={(e) => patch({ ownDomain: e.target.value.toLowerCase().trim() })}
                                style={inputStyle}
                              />
                              <p className="text-xs mt-2" style={{ color: "#6B7280", fontFamily: PANEL_BODY_FONT }}>
                                Oluşturduktan sonra Ayarlar&apos;dan DNS talimatlarını alabilirsiniz
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <p className="text-xs mt-3" style={{ color: "#6B7280", fontFamily: PANEL_BODY_FONT }}>
                          İsteğe bağlı — boş bırakırsanız otomatik bir adres atanır
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {fieldErr && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-xs mt-3 flex items-center gap-1.5" style={{ color: "#F87171", fontFamily: PANEL_BODY_FONT }}>
                      <AlertTriangle className="w-3.5 h-3.5" /> {fieldErr}
                    </motion.p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-7 py-5 flex items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button onClick={step === 0 ? onClose : goBack}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>
                    {step === 0 ? "Vazgeç" : <><ArrowLeft className="w-4 h-4" /> Geri</>}
                  </button>

                  <motion.button
                    onClick={goNext}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 8px 24px rgba(124,58,237,0.35)", fontFamily: PANEL_BODY_FONT }}
                  >
                    {step === STEPS.length - 1
                      ? <><Sparkles className="w-4 h-4" /> Vitrini Oluştur</>
                      : <>Devam <ArrowRight className="w-4 h-4" /></>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ═══════════ GENERATING ═══════════ */}
            {phase === "generating" && (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="relative px-8 py-14 flex flex-col items-center text-center">
                {/* Dönen halka + ikon */}
                <div className="relative mb-8" style={{ width: 96, height: 96 }}>
                  <motion.div
                    animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: "conic-gradient(from 0deg, transparent, #7C3AED, #EC4899, transparent)", padding: 3 }}>
                    <div className="w-full h-full rounded-full" style={{ background: "#0E0D14" }} />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div key={stageIdx}
                        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                        transition={{ duration: 0.3 }}>
                        <Stage className="w-9 h-9" style={{ color: "#C084FC" }} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Aşama metni */}
                <AnimatePresence mode="wait">
                  <motion.div key={stageIdx}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}>
                    <h3 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.4rem", fontWeight: 400, color: "#F5F5F4", marginBottom: 6 }}>
                      {STAGES[stageIdx].label}
                    </h3>
                    <p className="text-sm" style={{ color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>
                      {STAGES[stageIdx].sub}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="w-full max-w-xs mt-8">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg,#7C3AED,#EC4899)" }}
                      animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
                  </div>
                  <p className="text-[11px] mt-2.5" style={{ color: "#6B7280", fontFamily: PANEL_BODY_FONT }}>
                    Bu işlem 20–40 saniye sürebilir · lütfen pencereyi kapatmayın
                  </p>
                </div>

                {/* Skeleton önizleme */}
                <div className="w-full max-w-xs mt-8 space-y-2.5 opacity-60">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
                      className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 rounded-full" style={{ width: `${70 - i * 12}%`, background: "rgba(255,255,255,0.06)" }} />
                        <div className="h-2 rounded-full" style={{ width: `${45 - i * 8}%`, background: "rgba(255,255,255,0.05)" }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══════════ SUCCESS ═══════════ */}
            {phase === "success" && (
              <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="relative px-8 py-14 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 relative"
                  style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)", boxShadow: "0 12px 40px rgba(34,197,94,0.4)" }}>
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  <motion.div
                    animate={{ rotate: [0, 14, 0], y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute -top-2 -right-2 w-9 h-9 rounded-2xl flex items-center justify-center"
                    style={{ background: "#171520", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <PartyPopper className="w-4 h-4" style={{ color: "#FBBF24" }} />
                  </motion.div>
                </motion.div>

                <h3 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.6rem", fontWeight: 400, color: "#F5F5F4", marginBottom: 8 }}>
                  Vitriniz hazır! 🎉
                </h3>
                <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>
                  Yapay zeka mağazanızı oluşturdu. Katalogunuzda görüntüleyebilir, temasını değiştirebilir ve hemen yayına alabilirsiniz.
                </p>

                <motion.button
                  onClick={handleFinish}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white w-full max-w-xs justify-center"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 8px 24px rgba(124,58,237,0.35)", fontFamily: PANEL_BODY_FONT }}>
                  Kataloğa Dön <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* ═══════════ ERROR ═══════════ */}
            {phase === "error" && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="relative px-8 py-14 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)" }}>
                  <AlertTriangle className="w-8 h-8" style={{ color: "#F87171" }} />
                </div>
                <h3 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.4rem", fontWeight: 400, color: "#F5F5F4", marginBottom: 8 }}>
                  Bir sorun oluştu
                </h3>
                <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>
                  {errorMsg}
                </p>
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <button onClick={onClose}
                    className="flex-1 py-3 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>
                    Kapat
                  </button>
                  <motion.button onClick={() => setPhase("form")}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", fontFamily: PANEL_BODY_FONT }}>
                    Tekrar Dene
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
