"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import MarketingNavbar from "@/components/MarketingNavbar";
import SiteFooter from "@/components/SiteFooter";
import { TOOLS_MENU_ITEMS } from "@/components/ToolsMenu";
import { L, D, BODY_FONT, DISPLAY_FONT } from "@/lib/theme";

export default function AraclarPage() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("sv-dark") === "true") setIsDark(true); } catch { /* SSR */ }
  }, []);

  const c = isDark ? D : L;
  const bodyFont = BODY_FONT;
  const displayFont = DISPLAY_FONT;

  return (
    <div style={{ background: c.bg, minHeight: "100vh", transition: "background-color 0.4s ease" }}>
      <MarketingNavbar />

      <section className="pt-20 pb-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-4" style={{ color: c.sectionLabel, fontFamily: bodyFont }}>
            Optiefy Araçları
          </p>
          <h1 style={{ fontFamily: displayFont, fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 400, letterSpacing: "-0.02em", color: c.text, lineHeight: 1.15 }}>
            Mağazanızı büyütmek için ücretsiz araçlar
          </h1>
          <p className="mt-4 text-base" style={{ color: c.textMuted, fontFamily: bodyFont }}>
            Domain aramaktan SEO analizine kadar, e-ticaret yolculuğunuzun her adımında yanınızdayız.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS_MENU_ITEMS.map(({ title, desc, href, icon: Icon, badge, disabled }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-2xl p-6 flex flex-col"
              style={{ background: c.bgCard, border: `1.5px solid ${c.border}`, boxShadow: c.cardShadow }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: isDark ? "rgba(255,255,255,0.06)" : c.accentSoft }}>
                  <Icon className="w-5 h-5" style={{ color: c.accent }} />
                </div>
                {badge && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                    style={{
                      color: disabled ? c.textSubtle : "#16A34A",
                      background: disabled ? (isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6") : (isDark ? "rgba(34,197,94,0.12)" : "#F0FDF4"),
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold mb-1.5" style={{ color: c.text, fontFamily: bodyFont }}>{title}</h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: c.textMuted, fontFamily: bodyFont }}>{desc}</p>
              {disabled ? (
                <span className="mt-5 text-sm font-medium opacity-50" style={{ color: c.textMuted, fontFamily: bodyFont }}>Yakında kullanıma açılacak</span>
              ) : (
                <Link href={href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity" style={{ color: c.accent, fontFamily: bodyFont }}>
                  Aracı Kullan <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-10 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left"
          style={{ background: isDark ? "rgba(168,85,247,0.08)" : c.accentSoft, border: `1px solid ${isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.15)"}` }}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: c.accent }} />
            <p className="text-sm font-medium" style={{ color: c.text, fontFamily: bodyFont }}>
              Mağazanızı 30 saniyede yayına alın — fotoğraf yükleyin, gerisini yapay zeka halletsin.
            </p>
          </div>
          <Link href="/login?tab=register" className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap" style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont }}>
              Ücretsiz Başla <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
