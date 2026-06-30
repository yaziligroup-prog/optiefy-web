"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight,
  AlertCircle, CheckCircle,
} from "lucide-react";
import OptiefyIcon from "@/components/OptiefyIcon";
import { createClient } from "@/utils/supabase/client";

// ─── Palette (matches main page) ───────────────────────────────────────────────

const L = {
  bg:          "#FFFFFF",
  text:        "#1A1A1A",
  textMuted:   "#6B7280",
  textSubtle:  "#9CA3AF",
  border:      "#E5E5E5",
  inputBg:     "#F5F5F5",
  accent:      "#7C3AED",
  accentSoft:  "#F3F0FF",
  cardBg:      "#FFFFFF",
  ctaBg:       "#111111",
  ctaText:     "#FFFFFF",
};

const D = {
  bg:          "#0A0A0A",
  text:        "#F5F5F4",
  textMuted:   "#9CA3AF",
  textSubtle:  "#6B7280",
  border:      "rgba(255,255,255,0.08)",
  inputBg:     "rgba(255,255,255,0.05)",
  accent:      "#A855F7",
  accentSoft:  "rgba(168,85,247,0.10)",
  cardBg:      "#1C1C1C",
  ctaBg:       "#F5F5F4",
  ctaText:     "#111111",
};

type CP = typeof L;

// ─── Brand icons ────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon({ isDark }: { isDark: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill={isDark ? "#111111" : "#FFFFFF"}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.3C79.6 728.4 24 582.7 24 440.8c0-230.6 155.6-353.4 304.3-353.4 81.5 0 149.5 53.9 200.9 53.9 49.1 0 127.5-56.8 216.6-56.8zm-130.5-93.3c37.6-43.7 63.9-104.5 63.9-165.3 0-8.4-.6-16.8-2-24.6-60.3 2.5-133 40.8-175.3 89.9-34.3 38.6-66.2 99.4-66.2 161.1 0 9 1.3 18 2 20.9 3.9.6 10.3 1.3 16.8 1.3 54.5 0 123.1-36.9 160.8-83.3z"/>
    </svg>
  );
}

// ─── Main content (inside Suspense for useSearchParams) ─────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeName = searchParams.get("storeName") ?? "";
  const fromBuilder = searchParams.get("from") === "builder";
  const errorParam = searchParams.get("error");

  const [isDark, setIsDark]     = useState(false);
  const [tab, setTab]           = useState<"login" | "register">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError]       = useState<string | null>(
    errorParam === "auth_failed" ? "Kimlik doğrulama başarısız. Lütfen tekrar deneyin." : null
  );
  const [success, setSuccess]   = useState<string | null>(null);

  const [supabase] = useState(() => createClient());

  const c: CP  = isDark ? D : L;
  const tr: React.CSSProperties = { transition: "background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease" };
  const displayFont = "var(--font-display), Georgia, 'Times New Roman', serif";
  const bodyFont    = "var(--font-body), system-ui, -apple-system, sans-serif";

  useEffect(() => {
    try {
      if (localStorage.getItem("sv-dark") === "true") setIsDark(true);
    } catch { /* SSR */ }
  }, []);

  // If already authenticated, go straight to panel
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/panel");
    });
  }, [supabase, router]);

  const afterAuthUrl = storeName
    ? `/build?storeName=${encodeURIComponent(storeName)}`
    : fromBuilder
    ? "/build"
    : "/panel";

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    setError(null);
    const redirectTo =
      `${window.location.origin}/auth/callback?next=${encodeURIComponent(afterAuthUrl)}`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (err) {
      setError(err.message);
      setOauthLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (tab === "register" && password !== confirmPw) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    if (tab === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(
          err.message === "Invalid login credentials"
            ? "E-posta veya şifre hatalı."
            : err.message
        );
        setLoading(false);
        return;
      }
      router.push(afterAuthUrl);
    } else {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(afterAuthUrl)}`,
          data: storeName ? { store_name: storeName } : undefined,
        },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setSuccess("Hesabınız oluşturuldu! E-postanıza gelen doğrulama linkine tıklayın.");
      setLoading(false);
    }
  };

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    setError(null);
    setSuccess(null);
  };

  const inputStyle: React.CSSProperties = {
    ...tr,
    background:   c.inputBg,
    border:       `1.5px solid ${c.border}`,
    color:        c.text,
    borderRadius: "12px",
    padding:      "12px 16px",
    fontSize:     "14px",
    width:        "100%",
    outline:      "none",
    fontFamily:   bodyFont,
  };

  return (
    <div
      style={{ ...tr, background: c.bg, minHeight: "100vh", fontFamily: bodyFont }}
      className="flex flex-col items-center justify-center px-4 py-16"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}
        >
          <OptiefyIcon size={15} color="white" />
        </div>
        <span
          className="font-semibold text-base tracking-tight group-hover:opacity-70 transition-opacity"
          style={{ color: c.text, fontFamily: bodyFont, ...tr }}
        >
          Optiefy
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-3xl p-8 sm:p-10"
          style={{
            ...tr,
            background:  c.cardBg,
            border:      `1px solid ${c.border}`,
            boxShadow:   isDark
              ? "0 24px 80px rgba(0,0,0,0.6)"
              : "0 2px 40px rgba(0,0,0,0.06)",
          }}
        >
          {/* Heading */}
          <div className="mb-7">
            {storeName && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
                style={{ ...tr, background: c.accentSoft, color: c.accent }}
              >
                <Sparkles className="w-3 h-3" />
                <span>&ldquo;{storeName}&rdquo; için mağaza oluşturuluyor</span>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              <motion.h1
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                style={{
                  fontFamily:    displayFont,
                  fontSize:      "1.9rem",
                  fontWeight:    400,
                  lineHeight:    1.15,
                  letterSpacing: "-0.015em",
                  color:         c.text,
                  marginBottom:  "0.4rem",
                  ...tr,
                }}
              >
                {tab === "login"
                  ? "Hesabınıza giriş yapın"
                  : "Ücretsiz hesap oluşturun"}
              </motion.h1>
            </AnimatePresence>
            <p className="text-sm" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>
              {tab === "login"
                ? "Mağazanızı yönetmek için giriş yapın."
                : "Dakikalar içinde e-ticaret mağazanızı yayına alın."}
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <motion.button
              whileHover={{ opacity: 0.88 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium"
              style={{
                ...tr,
                background: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
                border:     `1.5px solid ${isDark ? "rgba(255,255,255,0.14)" : "#E5E5E5"}`,
                color:      c.text,
                fontFamily: bodyFont,
                cursor:     oauthLoading ? "wait" : "pointer",
              }}
            >
              {oauthLoading === "google" ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: `${c.textSubtle}40`, borderTopColor: c.textSubtle }}
                />
              ) : (
                <GoogleIcon />
              )}
              Google ile Devam Et
            </motion.button>

            <motion.button
              whileHover={{ opacity: 0.88 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOAuth("apple")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium"
              style={{
                ...tr,
                background: isDark ? "#EBEBEB" : "#111111",
                color:      isDark ? "#111111" : "#FFFFFF",
                fontFamily: bodyFont,
                cursor:     oauthLoading ? "wait" : "pointer",
              }}
            >
              {oauthLoading === "apple" ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor:    isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.2)",
                    borderTopColor: isDark ? "#111" : "white",
                  }}
                />
              ) : (
                <AppleIcon isDark={isDark} />
              )}
              Apple ile Devam Et
            </motion.button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ ...tr, background: c.border }} />
            <span className="text-xs font-medium" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
              veya e-posta ile
            </span>
            <div className="flex-1 h-px" style={{ ...tr, background: c.border }} />
          </div>

          {/* Tabs */}
          <div
            className="flex p-1 rounded-xl mb-6"
            style={{ ...tr, background: isDark ? "rgba(255,255,255,0.05)" : "#F3F3F1", border: `1px solid ${c.border}` }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="relative flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ color: tab === t ? c.text : c.textSubtle, fontFamily: bodyFont, zIndex: 1, ...tr }}
              >
                {tab === t && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.10)" : "#FFFFFF",
                      boxShadow:  "0 1px 4px rgba(0,0,0,0.08)",
                      zIndex:     -1,
                    }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">
                  {t === "login" ? "Giriş Yap" : "Kayıt Ol"}
                </span>
              </button>
            ))}
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#EF4444", fontFamily: bodyFont }}>
                  {error}
                </p>
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#22C55E", fontFamily: bodyFont }}>
                  {success}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {/* Email */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: c.textMuted, fontFamily: bodyFont }}
              >
                E-posta
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: c.textSubtle }}
                />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: "40px" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: c.textMuted, fontFamily: bodyFont }}
              >
                Şifre
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: c.textSubtle }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: "40px", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: c.textSubtle }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            <AnimatePresence>
              {tab === "register" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="pt-0.5">
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: c.textMuted, fontFamily: bodyFont }}
                    >
                      Şifre Tekrar
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: c.textSubtle }}
                      />
                      <input
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Şifrenizi tekrar girin"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: "40px" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ opacity: 0.85 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
              style={{
                ...tr,
                marginTop:  "0.5rem",
                background: c.ctaBg,
                color:      c.ctaText,
                fontFamily: bodyFont,
                cursor:     loading ? "wait" : "pointer",
              }}
            >
              {loading ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: `${c.ctaText}30`, borderTopColor: c.ctaText }}
                />
              ) : (
                <>
                  {tab === "login" ? "Giriş Yap" : "Hesap Oluştur"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch tab hint */}
          <p className="text-center text-xs mt-5" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
            {tab === "login" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
            <button
              onClick={() => switchTab(tab === "login" ? "register" : "login")}
              className="font-semibold hover:opacity-70 transition-opacity"
              style={{ color: c.textMuted }}
            >
              {tab === "login" ? "Kayıt olun" : "Giriş yapın"}
            </button>
          </p>
        </div>

        {/* Back link */}
        <p className="text-center text-xs mt-6" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
          <Link href="/" className="hover:opacity-70 transition-opacity" style={{ color: c.textSubtle }}>
            ← Ana sayfaya dön
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
