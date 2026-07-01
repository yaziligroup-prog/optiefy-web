"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import OptiefyIcon from "@/components/OptiefyIcon";
import { ToolsDropdownPanel } from "@/components/ToolsMenu";
import { L, D, BODY_FONT } from "@/lib/theme";
import { createClient } from "@/utils/supabase/client";

const NAV_LINKS = [
  { label: "Özellikler",   id: "ozellikler" },
  { label: "Fiyatlandırma", id: "fiyatlandirma" },
];

export default function MarketingNavbar() {
  const router = useRouter();
  const [isDark, setIsDark]       = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [user, setUser]           = useState<User | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem("sv-dark") === "true") setIsDark(true); } catch { /* SSR */ }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const toggleDark = () => setIsDark((d) => {
    const next = !d;
    try { localStorage.setItem("sv-dark", String(next)); } catch { /* */ }
    return next;
  });

  const handleAnchorClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileOpen(false);
    setToolsOpen(false);
    if (window.location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(`/#${id}`);
    }
  };

  const c  = isDark ? D : L;
  const tr: React.CSSProperties = { transition: "background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease" };
  const bodyFont = BODY_FONT;

  return (
    <motion.header
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="sticky top-0 left-0 right-0 z-50"
      style={{
        ...tr,
        background: scrolled ? c.headerBg : c.bg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${scrolled ? c.border : "transparent"}`,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
            <OptiefyIcon size={13} color="white" />
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: c.text, fontFamily: bodyFont, ...tr }}>Optiefy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, id }) => (
            <Link key={label} href={`/#${id}`} onClick={(e) => handleAnchorClick(e, id)} className="text-sm hover:opacity-60 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
              {label}
            </Link>
          ))}

          <div className="relative">
            <button
              onClick={() => setToolsOpen((o) => !o)}
              className="flex items-center gap-1 text-sm hover:opacity-60 transition-opacity"
              style={{ color: c.textMuted, fontFamily: bodyFont }}
            >
              Araçlar
              <ChevronDown className="w-3.5 h-3.5" style={{ transform: toolsOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
            </button>
            <AnimatePresence>
              {toolsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setToolsOpen(false)} />
                  <ToolsDropdownPanel c={c} isDark={isDark} bodyFont={bodyFont} />
                </>
              )}
            </AnimatePresence>
          </div>

          <Link href="/blog" className="text-sm hover:opacity-60 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={toggleDark}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ ...tr, background: isDark ? "rgba(255,255,255,0.06)" : "#F0F0EE", border: `1px solid ${c.border}` }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={isDark ? "sun" : "moon"} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 20, opacity: 0 }} transition={{ duration: 0.18 }}>
                {isDark ? <Sun className="w-3.5 h-3.5" style={{ color: "#FB923C" }} /> : <Moon className="w-3.5 h-3.5" style={{ color: c.textMuted }} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link href="/panel">
                <motion.span
                  whileHover={{ opacity: 0.82 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}
                >
                  Panele Git <ArrowRight className="w-3.5 h-3.5" />
                </motion.span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm px-3 py-1.5 rounded-lg hover:opacity-60 transition-opacity font-medium" style={{ color: c.textMuted, fontFamily: bodyFont, ...tr }}>
                  Giriş Yap
                </Link>
                <Link href="/login?tab=register">
                  <motion.span
                    whileHover={{ opacity: 0.82 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, ...tr }}
                  >
                    Ücretsiz Başla
                  </motion.span>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ ...tr, background: isDark ? "rgba(255,255,255,0.06)" : "#F0F0EE", border: `1px solid ${c.border}` }}
            aria-label="Menü"
          >
            {mobileOpen ? <X className="w-4 h-4" style={{ color: c.text }} /> : <Menu className="w-4 h-4" style={{ color: c.text }} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: `1px solid ${c.border}`, background: c.bg }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, id }) => (
                <Link key={label} href={`/#${id}`} onClick={(e) => handleAnchorClick(e, id)} className="py-2.5 text-sm font-medium" style={{ color: c.text, fontFamily: bodyFont }}>
                  {label}
                </Link>
              ))}
              <p className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSubtle, fontFamily: bodyFont }}>Araçlar</p>
              {TOOLS_ITEMS_FOR_MOBILE.map(({ title, href, disabled }) => (
                disabled ? (
                  <span key={title} className="py-2 text-sm opacity-50" style={{ color: c.textMuted, fontFamily: bodyFont }}>{title} · Yakında</span>
                ) : (
                  <Link key={title} href={href} onClick={() => setMobileOpen(false)} className="py-2 text-sm font-medium" style={{ color: c.text, fontFamily: bodyFont }}>
                    {title}
                  </Link>
                )
              ))}
              <Link href="/blog" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-medium border-t mt-1 pt-3" style={{ color: c.text, fontFamily: bodyFont, borderColor: c.border }}>
                Blog
              </Link>

              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
                {user ? (
                  <Link href="/panel" onClick={() => setMobileOpen(false)} className="flex-1">
                    <span className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont }}>
                      Panele Git <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium" style={{ color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: bodyFont }}>
                      Giriş Yap
                    </Link>
                    <Link href="/login?tab=register" onClick={() => setMobileOpen(false)} className="flex-1">
                      <span className="inline-flex w-full items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont }}>
                        Ücretsiz Başla
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

const TOOLS_ITEMS_FOR_MOBILE = [
  { title: "Domain Sorgulama & Kayıt", href: "/araclar/domain-sorgulama", disabled: false },
  { title: "Logo Oluşturucu",          href: "#",                         disabled: true },
  { title: "SEO Analiz Aracı",         href: "#",                         disabled: true },
];
