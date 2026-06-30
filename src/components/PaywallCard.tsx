"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  CheckCircle2,
  Crown,
  CreditCard,
  Gift,
  Globe,
  Loader2,
  AlertCircle,
  Search,
  XCircle,
  Link2,
  Sparkles,
  Info,
  Plug,
} from "lucide-react";

type Plan = "monthly" | "yearly";
type DomainMode = "new" | "byod";
type DomainStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

interface PaywallCardProps {
  storeName: string;
  onSubscribe: (plan: Plan) => void;
  isLoading: boolean;
  error?: string | null;
  onDomainSelect?: (domain: string | null) => void;
}

const FEATURES_YEARLY = [
  "Tüm aylık özellikler dahil",
  "Ücretsiz .com alan adı (1 yıl)",
  "2 ay ücretsiz",
  "Öncelikli destek",
];

const FEATURES_MONTHLY = [
  "Sınırsız ürün yükle",
  "PayTR ödeme entegrasyonu",
  "AI ürün açıklaması",
  "Mobil optimize vitrin",
];

const VALID_DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function cleanDomain(raw: string) {
  return raw.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
}

const STATUS_STYLE = {
  available: {
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.25)",
    textColor: "#4ade80",
    Icon: CheckCircle2,
  },
  taken: {
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.25)",
    textColor: "#f87171",
    Icon: XCircle,
  },
  invalid: {
    bg: "rgba(251,146,60,0.07)",
    border: "rgba(251,146,60,0.25)",
    textColor: "#fb923c",
    Icon: AlertCircle,
  },
  error: {
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.25)",
    textColor: "#f87171",
    Icon: AlertCircle,
  },
  checking: null,
  idle: null,
} as const;

const TABS: { id: DomainMode; label: string; sub: string; Icon: typeof Sparkles }[] = [
  { id: "new", label: "Yeni Domain Al", sub: "Ücretsiz .com kaydı", Icon: Sparkles },
  { id: "byod", label: "Mevcut Domainimi Bağla", sub: "Kendi alan adım var", Icon: Link2 },
];

export default function PaywallCard({
  storeName,
  onSubscribe,
  isLoading,
  error,
  onDomainSelect,
}: PaywallCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [domainMode, setDomainMode] = useState<DomainMode>("new");
  const [domainInput, setDomainInput] = useState("");
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("idle");
  const [domainStatusMsg, setDomainStatusMsg] = useState("");
  const [isDomainChecking, setIsDomainChecking] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);

  const resetDomain = (keepInput = false) => {
    if (!keepInput) setDomainInput("");
    setDomainStatus("idle");
    setDomainStatusMsg("");
    setAlternatives([]);
    onDomainSelect?.(null);
  };

  const handleTabSwitch = (mode: DomainMode) => {
    setDomainMode(mode);
    resetDomain();
  };

  // ── "Yeni Domain Al" — Supabase müsaitlik kontrolü ──
  const handleDomainCheck = async () => {
    const raw = domainInput.trim();
    if (!raw) return;
    setIsDomainChecking(true);
    setDomainStatus("checking");
    setDomainStatusMsg("");

    try {
      const res = await fetch("/api/domain/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: raw }),
      });
      const data = (await res.json()) as {
        available?: boolean;
        status?: string;
        message?: string;
        domain?: string;
        alternatives?: string[];
      };
      const status = (data.status ?? (data.available ? "available" : "taken")) as DomainStatus;
      setDomainStatus(status);
      setDomainStatusMsg(data.message ?? "");
      setAlternatives(data.alternatives ?? []);
      onDomainSelect?.(status === "available" && data.domain ? data.domain : null);
    } catch {
      setDomainStatus("error");
      setDomainStatusMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      onDomainSelect?.(null);
    } finally {
      setIsDomainChecking(false);
    }
  };

  // ── "Mevcut Domainimi Bağla" — yerel format doğrulama ──
  const handleByodConnect = () => {
    const cleaned = cleanDomain(domainInput);
    if (!cleaned) return;

    if (!VALID_DOMAIN_RE.test(cleaned)) {
      setDomainStatus("invalid");
      setDomainStatusMsg("Geçersiz domain formatı. Örnek: magazaniz.com");
      onDomainSelect?.(null);
      return;
    }

    setDomainStatus("available");
    setDomainStatusMsg(
      `"${cleaned}" alan adı aboneliğinize bağlandı. DNS ayarlarını aşağıdaki talimatlara göre yapılandırın.`
    );
    onDomainSelect?.(cleaned);
  };

  const inputBorderColor =
    domainStatus === "available"
      ? "rgba(34,197,94,0.45)"
      : domainStatus === "taken" || domainStatus === "error"
      ? "rgba(239,68,68,0.45)"
      : domainStatus === "invalid"
      ? "rgba(251,146,60,0.45)"
      : "rgba(255,255,255,0.08)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
      className="max-w-md w-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
        >
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-white leading-tight">
          Siteniz Satışa Hazır! 🚀
        </h2>
      </div>

      <p className="text-slate-400 text-sm mb-6 leading-relaxed pl-15">
        <span className="text-purple-300 font-semibold">{storeName || "Mağazanız"}</span> için
        müşterilerinizden PayTR güvencesiyle anında ödeme almaya başlamak için planınızı seçin.
      </p>

      {/* ── Domain Kurulum Alanı ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-5 rounded-2xl p-4"
        style={{
          background: "rgba(15,23,42,0.55)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Başlık */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}
          >
            <Globe className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Alan Adı (Domain) Kurulumu</h3>
        </div>

        {/* ── Segmented Tab Toggle ── */}
        <div
          className="relative flex p-1 rounded-xl mb-4"
          style={{ background: "rgba(0,0,0,0.28)" }}
        >
          {/* Kayan arka plan */}
          <motion.div
            className="absolute inset-y-1 rounded-lg pointer-events-none"
            animate={{ x: domainMode === "new" ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            style={{
              width: "calc(50% - 4px)",
              left: "4px",
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.12) 100%)",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          />
          {TABS.map((tab) => {
            const Icon = tab.Icon;
            const active = domainMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className="relative flex-1 flex flex-col items-center py-2 px-1 rounded-lg z-10 transition-colors duration-200"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: active ? "#c084fc" : "#475569" }}
                  />
                  <span
                    className="text-[11px] font-bold leading-none"
                    style={{ color: active ? "#e2e8f0" : "#475569" }}
                  >
                    {tab.label}
                  </span>
                </div>
                <span
                  className="text-[9px] leading-none"
                  style={{ color: active ? "#94a3b8" : "#334155" }}
                >
                  {tab.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab İçeriği ── */}
        <AnimatePresence mode="wait">
          {domainMode === "new" ? (
            /* ── Tab 1: Yeni Domain Al ── */
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-slate-500 text-[11px] mb-2.5">
                İstediğiniz alan adını yazın; müsaitse planınıza dahil olarak ücretsiz kaydedilecek.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => {
                      setDomainInput(e.target.value);
                      if (domainStatus !== "idle") resetDomain(true);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleDomainCheck()}
                    placeholder="tasarimcicek.com"
                    className="w-full rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none text-xs transition-all"
                    style={{
                      background: "rgba(15,23,42,0.7)",
                      border: `1px solid ${inputBorderColor}`,
                    }}
                  />
                </div>
                <motion.button
                  onClick={domainStatus === "available" ? () => resetDomain() : handleDomainCheck}
                  disabled={isDomainChecking || (!domainInput.trim() && domainStatus !== "available")}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 flex-shrink-0 disabled:opacity-40 transition-all"
                  style={
                    domainStatus === "available"
                      ? {
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#f87171",
                        }
                      : {
                          background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
                          boxShadow: "0 2px 12px rgba(14,165,233,0.3)",
                        }
                  }
                >
                  {isDomainChecking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : domainStatus === "available" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {domainStatus === "available" ? "Temizle" : "Sorgula"}
                </motion.button>
              </div>

              {/* Durum mesajı */}
              <AnimatePresence>
                {domainStatus !== "idle" && domainStatus !== "checking" && domainStatusMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="mt-2.5 overflow-hidden"
                  >
                    {(() => {
                      const s = STATUS_STYLE[domainStatus];
                      if (!s) return null;
                      const { Icon } = s;
                      return (
                        <div
                          className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                          style={{ background: s.bg, border: `1px solid ${s.border}` }}
                        >
                          <Icon
                            className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                            style={{ color: s.textColor }}
                          />
                          <p className="text-xs leading-relaxed" style={{ color: s.textColor }}>
                            {domainStatusMsg}
                          </p>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Akıllı Alternatif Öneriler ── */}
              <AnimatePresence>
                {domainStatus === "taken" && alternatives.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: 6, height: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="mt-3 overflow-hidden"
                  >
                    <p
                      className="text-[9px] font-bold tracking-widest uppercase mb-2"
                      style={{ color: "#64748b" }}
                    >
                      Bunlar Müsait:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {alternatives.map((alt) => (
                        <motion.button
                          key={alt}
                          onClick={() => {
                            setDomainInput(alt);
                            setAlternatives([]);
                            setDomainStatus("available");
                            setDomainStatusMsg(
                              `Tebrikler! "${alt}" boşta ve planınıza dahil olarak ücretsiz kaydedilecek.`
                            );
                            onDomainSelect?.(alt);
                          }}
                          whileHover={{ scale: 1.06, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold font-mono transition-all duration-200"
                          style={{
                            background: "rgba(34,197,94,0.06)",
                            border: "1px solid rgba(34,197,94,0.28)",
                            color: "#4ade80",
                            boxShadow: "0 0 0 0 rgba(34,197,94,0)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow =
                              "0 0 12px rgba(34,197,94,0.18)";
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(34,197,94,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow =
                              "0 0 0 0 rgba(34,197,94,0)";
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(34,197,94,0.06)";
                          }}
                        >
                          {alt}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* ── Tab 2: Mevcut Domainimi Bağla (BYOD) ── */
            <motion.div
              key="byod"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-slate-500 text-[11px] mb-2.5">
                GoDaddy, IHS veya Namecheap&apos;ten aldığınız alan adını mağazanıza bağlayın.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Plug className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => {
                      setDomainInput(e.target.value);
                      if (domainStatus !== "idle") resetDomain(true);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleByodConnect()}
                    placeholder="siteniz.com"
                    className="w-full rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none text-xs transition-all"
                    style={{
                      background: "rgba(15,23,42,0.7)",
                      border: `1px solid ${inputBorderColor}`,
                    }}
                  />
                </div>
                <motion.button
                  onClick={domainStatus === "available" ? () => resetDomain() : handleByodConnect}
                  disabled={!domainInput.trim() && domainStatus !== "available"}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 flex-shrink-0 disabled:opacity-40 transition-all"
                  style={
                    domainStatus === "available"
                      ? {
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#f87171",
                        }
                      : {
                          background: "linear-gradient(135deg, #7C3AED, #a855f7)",
                          boxShadow: "0 2px 12px rgba(124,58,237,0.35)",
                        }
                  }
                >
                  {domainStatus === "available" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" />
                  )}
                  {domainStatus === "available" ? "Değiştir" : "Bağla"}
                </motion.button>
              </div>

              {/* Durum mesajı (başarı / hata) */}
              <AnimatePresence>
                {domainStatus !== "idle" && domainStatusMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="mt-2.5 overflow-hidden"
                  >
                    {(() => {
                      const s = STATUS_STYLE[domainStatus];
                      if (!s) return null;
                      const { Icon } = s;
                      return (
                        <div
                          className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                          style={{ background: s.bg, border: `1px solid ${s.border}` }}
                        >
                          <Icon
                            className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                            style={{ color: s.textColor }}
                          />
                          <p className="text-xs leading-relaxed" style={{ color: s.textColor }}>
                            {domainStatusMsg}
                          </p>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── DNS Yapılandırma Bilgi Kutusu ── */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-3 rounded-xl p-3"
                style={{
                  background: "rgba(99,102,241,0.07)",
                  border: "1px solid rgba(99,102,241,0.18)",
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-indigo-300 text-[10px] font-bold tracking-widest uppercase mb-1.5">
                      DNS Yapılandırması
                    </p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Alan adınızı başarıyla bağlamak için, domain sağlayıcınızın (GoDaddy, IHS,
                      Namecheap vb.) kontrol panelinden DNS{" "}
                      <span className="text-white font-semibold">&apos;A Kaydı&apos; (A Record)</span>{" "}
                      değerini{" "}
                      <code
                        className="text-white font-mono rounded px-1.5 py-0.5 text-[10px]"
                        style={{ background: "rgba(99,102,241,0.25)" }}
                      >
                        76.76.21.21
                      </code>{" "}
                      olarak yönlendirmeniz yeterlidir. Bağlantı{" "}
                      <span className="text-amber-300 font-semibold">24 saat</span> içinde otomatik
                      aktifleşecektir.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Plan cards */}
      <div className="space-y-3 mb-6">
        {/* Yearly — featured */}
        <motion.button
          onClick={() => setSelectedPlan("yearly")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full text-left rounded-2xl border-2 p-4 relative overflow-hidden transition-all duration-200"
          style={
            selectedPlan === "yearly"
              ? {
                  borderColor: "rgba(168,85,247,0.7)",
                  background:
                    "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(99,102,241,0.08) 100%)",
                  boxShadow: "0 0 0 1px rgba(168,85,247,0.2), 0 4px 24px rgba(168,85,247,0.15)",
                }
              : {
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(15,23,42,0.5)",
                }
          }
        >
          <div
            className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#fff" }}
          >
            <Crown className="w-3 h-3" />
            POPÜLER
          </div>

          <div className="flex items-start gap-3 pr-20">
            <div
              className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={
                selectedPlan === "yearly"
                  ? { borderColor: "#a855f7", background: "#a855f7" }
                  : { borderColor: "rgba(255,255,255,0.2)" }
              }
            >
              {selectedPlan === "yearly" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-white font-bold text-lg">5.999 TL</span>
                <span className="text-slate-400 text-sm">/Yıl</span>
                <span className="text-slate-500 line-through text-xs">8.388 TL</span>
              </div>
              <p className="text-purple-300 font-semibold text-sm mt-0.5">Yıllık Plan</p>
              <div className="mt-2 space-y-1">
                {FEATURES_YEARLY.map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-300 text-xs">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 text-xs font-semibold">
                  2 Ay Hediye + Ücretsiz .com Alan Adı
                </span>
              </div>
            </div>
          </div>
        </motion.button>

        {/* Monthly */}
        <motion.button
          onClick={() => setSelectedPlan("monthly")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200"
          style={
            selectedPlan === "monthly"
              ? {
                  borderColor: "rgba(168,85,247,0.7)",
                  background: "rgba(168,85,247,0.08)",
                  boxShadow: "0 0 0 1px rgba(168,85,247,0.2)",
                }
              : {
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(15,23,42,0.5)",
                }
          }
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={
                selectedPlan === "monthly"
                  ? { borderColor: "#a855f7", background: "#a855f7" }
                  : { borderColor: "rgba(255,255,255,0.2)" }
              }
            >
              {selectedPlan === "monthly" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-white font-bold text-lg">699 TL</span>
                <span className="text-slate-400 text-sm">/Ay</span>
              </div>
              <p className="text-slate-300 font-semibold text-sm mt-0.5">Aylık Plan</p>
              <div className="mt-2 space-y-1">
                {FEATURES_MONTHLY.map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 text-xs">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {/* CTA */}
      <motion.button
        onClick={() => onSubscribe(selectedPlan)}
        disabled={isLoading}
        whileHover={isLoading ? {} : { scale: 1.02 }}
        whileTap={isLoading ? {} : { scale: 0.98 }}
        className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 relative overflow-hidden disabled:opacity-80"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #a855f7 50%, #ec4899 100%)",
          backgroundSize: "200% 100%",
          boxShadow: isLoading
            ? "none"
            : "0 0 0 2px rgba(168,85,247,0.3), 0 8px 32px rgba(168,85,247,0.45), 0 0 60px rgba(168,85,247,0.2)",
        }}
      >
        {!isLoading && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              width: "60%",
            }}
          />
        )}
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Ödeme İşleniyor...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Aboneliği Başlat ve Yayınla</span>
          </>
        )}
      </motion.button>

      {/* Footer trust */}
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Globe className="w-3 h-3 text-green-500" />
          <span>256-bit SSL Şifreli</span>
        </div>
        <span className="text-slate-700 text-xs">·</span>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <CreditCard className="w-3 h-3 text-blue-400" />
          <span>PayTR Güvenceli</span>
        </div>
        <span className="text-slate-700 text-xs">·</span>
        <span className="text-slate-500 text-xs">İstediğiniz zaman iptal</span>
      </div>
    </motion.div>
  );
}
