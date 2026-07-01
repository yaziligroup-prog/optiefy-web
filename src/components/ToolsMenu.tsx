"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, Palette, BarChart3 } from "lucide-react";
import type { CP } from "@/lib/theme";

export type ToolMenuItem = {
  title: string;
  desc: string;
  href: string;
  icon: typeof Globe;
  badge?: string;
  disabled?: boolean;
};

export const TOOLS_MENU_ITEMS: ToolMenuItem[] = [
  {
    title: "Domain Sorgulama & Kayıt",
    desc: "Mağazanız için uygun alan adını saniyeler içinde bulun.",
    href: "/araclar/domain-sorgulama",
    icon: Globe,
    badge: "Popüler",
  },
  {
    title: "Logo Oluşturucu",
    desc: "Yapay zeka ile markanıza özel logo tasarımları üretin.",
    href: "#",
    icon: Palette,
    badge: "Yakında",
    disabled: true,
  },
  {
    title: "SEO Analiz Aracı",
    desc: "Vitrininizin arama motoru performansını ölçün.",
    href: "#",
    icon: BarChart3,
    badge: "Yakında",
    disabled: true,
  },
];

export function ToolsDropdownPanel({
  c, isDark, bodyFont, className = "",
}: {
  c: CP;
  isDark: boolean;
  bodyFont: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`absolute left-0 top-full mt-2 w-[21rem] rounded-2xl overflow-hidden z-50 ${className}`}
      style={{ background: c.bgCard, border: `1px solid ${c.border}`, boxShadow: c.cardShadowHover }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
          Optiefy Araçları
        </p>
      </div>
      <div className="py-1.5">
        {TOOLS_MENU_ITEMS.map(({ title, desc, href, icon: Icon, badge, disabled }) => {
          const content = (
            <div className="flex items-start gap-3 px-4 py-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : c.accentSoft }}
              >
                <Icon className="w-4 h-4" style={{ color: c.accent }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: c.text, fontFamily: bodyFont }}>{title}</p>
                  {badge && (
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        color: disabled ? c.textSubtle : "#16A34A",
                        background: disabled ? (isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6") : (isDark ? "rgba(34,197,94,0.12)" : "#F0FDF4"),
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: c.textMuted, fontFamily: bodyFont }}>{desc}</p>
              </div>
            </div>
          );
          return disabled ? (
            <div key={title} className="cursor-not-allowed opacity-55">{content}</div>
          ) : (
            <Link key={title} href={href} className="block transition-opacity hover:opacity-70">
              {content}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
