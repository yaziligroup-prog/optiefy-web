"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ─── Panel palettes ────────────────────────────────────────────────────────────
// Light = kurumsal varsayılan (Durable estetiği). Dark = zarif gece modu.

export const PANEL_LIGHT = {
  appBg:        "#F7F7F5",
  sidebarBg:    "#FFFFFF",
  topbarBg:     "rgba(255,255,255,0.82)",
  cardBg:       "#FFFFFF",
  cardBgSoft:   "#FAFAF9",
  border:       "#EAEAE8",
  borderSoft:   "#F0F0EE",
  text:         "#1A1A1A",
  textMuted:    "#6B7280",
  textSubtle:   "#9CA3AF",
  accent:       "#7C3AED",
  accentSoft:   "#F3F0FF",
  accentText:   "#6D28D9",
  hover:        "#F4F4F2",
  navActive:    "#F3F0FF",
  navActiveTxt: "#6D28D9",
  inputBg:      "#F5F5F3",
  shadow:       "0 1px 2px rgba(0,0,0,0.04)",
  shadowMd:     "0 4px 16px rgba(0,0,0,0.05)",
  ctaBg:        "#111111",
  ctaText:      "#FFFFFF",
};

export const PANEL_DARK: typeof PANEL_LIGHT = {
  appBg:        "#0A0A0A",
  sidebarBg:    "#111111",
  topbarBg:     "rgba(17,17,17,0.82)",
  cardBg:       "#1A1A1A",
  cardBgSoft:   "#161616",
  border:       "rgba(255,255,255,0.08)",
  borderSoft:   "rgba(255,255,255,0.05)",
  text:         "#F5F5F4",
  textMuted:    "#9CA3AF",
  textSubtle:   "#6B7280",
  accent:       "#A855F7",
  accentSoft:   "rgba(168,85,247,0.12)",
  accentText:   "#C084FC",
  hover:        "rgba(255,255,255,0.04)",
  navActive:    "rgba(168,85,247,0.14)",
  navActiveTxt: "#C084FC",
  inputBg:      "rgba(255,255,255,0.05)",
  shadow:       "0 1px 3px rgba(0,0,0,0.5)",
  shadowMd:     "0 8px 32px rgba(0,0,0,0.5)",
  ctaBg:        "#F5F5F4",
  ctaText:      "#111111",
};

export type PanelPalette = typeof PANEL_LIGHT;

export const PANEL_DISPLAY_FONT = "var(--font-display), Georgia, 'Times New Roman', serif";
export const PANEL_BODY_FONT    = "var(--font-body), system-ui, -apple-system, sans-serif";

// ─── Context ────────────────────────────────────────────────────────────────────

type PanelThemeCtx = { isDark: boolean; toggle: () => void; c: PanelPalette };

const Ctx = createContext<PanelThemeCtx | null>(null);

export function PanelThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem("sv-dark") === "true") setIsDark(true); } catch { /* SSR */ }
  }, []);

  const toggle = () =>
    setIsDark((d) => {
      const next = !d;
      try { localStorage.setItem("sv-dark", String(next)); } catch { /* ignore */ }
      return next;
    });

  const c = isDark ? PANEL_DARK : PANEL_LIGHT;

  return <Ctx.Provider value={{ isDark, toggle, c }}>{children}</Ctx.Provider>;
}

export function usePanelTheme(): PanelThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePanelTheme, PanelThemeProvider içinde kullanılmalıdır.");
  return ctx;
}
