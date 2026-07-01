"use client";

/**
 * Yasal doküman görünümü — mağazanın temasıyla (renk, font, theme_settings)
 * giydirilmiş, dükkan adına özel sözleşme sayfası.
 */

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ScrollText } from "lucide-react";
import { THEMES, type ThemeId } from "@/types/theme";
import type { Store } from "@/types/store";
import type { LegalDoc } from "@/lib/legalTemplates";
import { applyThemeSettings, getLayout } from "../../StoreView";

export default function LegalView({ store, doc }: { store: Store; doc: LegalDoc }) {
  const themeId: ThemeId =
    store.theme && THEMES[store.theme as ThemeId] ? (store.theme as ThemeId) : "modern";
  const ts     = store.theme_settings ?? null;
  const t      = applyThemeSettings(THEMES[themeId], ts);
  const layout = getLayout(themeId);

  // Vitrin içi link tabanı — StoreView ile aynı çözümleme
  const pathname = usePathname() ?? "";
  const base     = pathname.startsWith("/store/") ? pathname.split("/").slice(0, 3).join("/") : "";
  const homeHref = base || "/";

  const titleFont =
    layout === "luxury" ? '"DM Serif Display", Georgia, serif'
    : layout === "artisan" ? '"Lora", Georgia, serif'
    : t.fontFamily;

  return (
    <div className="min-h-screen" style={{ background: t.bgColor, fontFamily: t.fontFamilySans }}>

      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background: `${t.headerBg}f2`, backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${t.borderColor}`,
        }}
      >
        <a href={homeHref} className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-60"
          style={{ color: t.textColor }}>
          <ArrowLeft className="w-4 h-4" />
          Mağazaya Dön
        </a>
        {ts?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ts.logo_url} alt={store.store_name} className="h-7 w-auto object-contain absolute left-1/2 -translate-x-1/2" />
        ) : (
          <a href={homeHref}
            className="text-[15px] font-black tracking-[0.3em] uppercase absolute left-1/2 -translate-x-1/2"
            style={{ color: t.titleColor, fontFamily: t.fontFamily, textDecoration: "none" }}>
            {store.store_name}
          </a>
        )}
        <span className="w-24" aria-hidden />
      </header>

      {/* Doküman */}
      <main className="max-w-3xl mx-auto px-6 md:px-10 py-14 md:py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>

          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${t.accentColor}14` }}>
              <ScrollText className="w-4 h-4" style={{ color: t.accentColor }} />
            </div>
            <p className="text-[11px] font-black tracking-[0.3em] uppercase" style={{ color: t.accentColor }}>
              Yasal Bilgilendirme
            </p>
          </div>

          <h1
            className="leading-[1.12] tracking-tight mb-6"
            style={{ color: t.titleColor, fontFamily: titleFont, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: layout === "tech" ? 800 : 400 }}
          >
            {doc.title}
          </h1>

          <p className="text-[15px] leading-[1.85] mb-10" style={{ color: t.textColor }}>
            {doc.intro}
          </p>

          <div className="h-px w-full mb-10" style={{ background: t.borderColor }} />

          <div className="space-y-9">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-base font-bold mb-2.5" style={{ color: t.titleColor, fontFamily: t.fontFamilySans }}>
                  {section.heading}
                </h2>
                <p className="text-sm leading-[1.85]" style={{ color: t.textColor }}>
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-14 px-5 py-4 rounded-2xl text-xs leading-relaxed"
            style={{ background: t.cardBg, border: `1px solid ${t.borderColor}`, color: t.subtleText }}>
            Bu doküman {store.store_name} adına otomatik olarak oluşturulmuştur. Sorularınız için
            mağaza iletişim kanallarını kullanabilirsiniz. Son güncelleme: 2026
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-10 text-center" style={{ background: t.footerBg }}>
        <p className="text-xs font-black tracking-[0.3em] uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.85)", fontFamily: t.fontFamily }}>
          {store.store_name}
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          © 2026 {store.store_name}. Tüm Hakları Saklıdır.
        </p>
      </footer>
    </div>
  );
}
