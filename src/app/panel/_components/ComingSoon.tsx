"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { usePanelTheme, PANEL_DISPLAY_FONT, PANEL_BODY_FONT } from "../_lib/theme";

export default function ComingSoon({
  icon: Icon, title, description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const { c } = usePanelTheme();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
          {title}
        </h1>
        <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{description}</p>
      </motion.div>

      {/* Empty / coming soon state */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.45 }}
        className="rounded-3xl flex flex-col items-center justify-center text-center px-6"
        style={{ background: c.cardBg, border: `1px dashed ${c.border}`, minHeight: "60vh" }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: c.accentSoft }}>
          <Icon className="w-7 h-7" style={{ color: c.accent }} />
        </div>
        <h2 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.6rem", fontWeight: 400, color: c.text, marginBottom: "0.5rem" }}>
          Çok yakında
        </h2>
        <p className="text-sm max-w-sm leading-relaxed mb-6" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          Bu modül üzerinde çalışıyoruz. {title} özelliği yakında bu panelde sizi karşılayacak.
        </p>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{ background: c.cardBgSoft, border: `1px solid ${c.border}` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />
          <span className="text-xs font-semibold" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Geliştirme aşamasında</span>
        </div>
      </motion.div>
    </div>
  );
}
