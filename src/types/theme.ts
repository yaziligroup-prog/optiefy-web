export type ThemeId = "luxury" | "modern" | "artisan" | "dynamic" | "corporate";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  shortName: string;
  bgColor: string;
  headerBg: string;
  bannerBg: string;
  galleryBg: string;
  accentColor: string;
  accentGlow: string;
  primaryBtn: string;
  secondaryBtn: string;
  fontFamily: string;
  fontFamilySans: string;
  titleColor: string;
  textColor: string;
  subtleText: string;
  priceColor: string;
  dotColor: string;
  ringColor: string;
  cardBg: string;
  footerBg: string;
  discountBg: string;
  discountText: string;
  discountBorder: string;
  featureIconColor: string;
  storeTagColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;

  // ─── Buton & Sepet mimarisi (tema karakterini taşıyan tokenlar) ───
  btnRadius: string;          // Tüm aksiyon butonlarının köşe yarıçapı
  ghostBorder: string;        // "Sepete Ekle" (Ghost) çerçeve rengi
  ghostBorderWidth: string;   // Ghost çerçeve kalınlığı
  ghostText: string;          // Ghost metin rengi
  ghostHoverBg: string;       // Ghost hover arka planı (örn. dinamik temada neon)
  ghostHoverText: string;     // Ghost hover metin rengi
  solidBtn: string;           // "Hemen Al" / "Ödemeye Geç" dolu buton arka planı
  solidBtnText: string;       // Dolu buton metin rengi
  cartBg: string;             // Sepet çekmecesi panel arka planı
  cartBlur: string;           // Sepet paneli backdrop-filter (glassmorphism için)
  cartBackdrop: string;       // Sepet arkasındaki overlay rengi
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  // ═══ TEMA 1 — Sessiz Lüks ═══════════════════════════════════════════════════
  luxury: {
    id: "luxury",
    name: "Sessiz Lüks",
    shortName: "Lüks",
    bgColor: "#FDFAF6",
    headerBg: "#FDFAF6",
    bannerBg: "linear-gradient(90deg, #8B7355 0%, #C9A84C 50%, #8B7355 100%)",
    galleryBg: "linear-gradient(160deg, #FAF7F2 0%, #F5EFE6 50%, #FAF2E8 100%)",
    accentColor: "#C9A84C",
    accentGlow: "rgba(201,168,76,0.18)",
    primaryBtn: "#1C1C1C",
    secondaryBtn: "linear-gradient(135deg, #8B7355 0%, #C9A84C 100%)",
    fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
    fontFamilySans: '"Cormorant Garamond", Georgia, serif',
    titleColor: "#1C1C1C",
    textColor: "#3D3D3D",
    subtleText: "#7A7A7A",
    priceColor: "#1C1C1C",
    dotColor: "#C9A84C",
    ringColor: "#C9A84C",
    cardBg: "#F5EFE6",
    footerBg: "#1C1C1C",
    discountBg: "#FEF9EC",
    discountText: "#92660A",
    discountBorder: "#F5D98B",
    featureIconColor: "#C9A84C",
    storeTagColor: "#8B7355",
    borderColor: "#E8DDD0",
    badgeBg: "rgba(201,168,76,0.12)",
    badgeText: "#8B7355",
    badgeBorder: "rgba(201,168,76,0.35)",
    btnRadius: "9999px",
    ghostBorder: "#1C1C1C",
    ghostBorderWidth: "1.5px",
    ghostText: "#1C1C1C",
    ghostHoverBg: "#1C1C1C",
    ghostHoverText: "#FDFAF6",
    solidBtn: "linear-gradient(135deg, #8B7355 0%, #C9A84C 100%)",
    solidBtnText: "#FFFFFF",
    cartBg: "#FDFAF6",
    cartBlur: "none",
    cartBackdrop: "rgba(28,28,28,0.32)",
  },

  // ═══ TEMA 2 — Minimalist Tech (Apple) ═══════════════════════════════════════
  modern: {
    id: "modern",
    name: "Minimalist Tech",
    shortName: "Tech",
    bgColor: "#FFFFFF",
    headerBg: "#FFFFFF",
    bannerBg: "linear-gradient(90deg, #1D1D1F 0%, #434344 50%, #1D1D1F 100%)",
    galleryBg: "linear-gradient(160deg, #FBFBFD 0%, #F5F5F7 50%, #FBFBFD 100%)",
    accentColor: "#0071E3",
    accentGlow: "rgba(0,113,227,0.16)",
    primaryBtn: "#0A0A0A",
    secondaryBtn: "#0071E3",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontFamilySans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    titleColor: "#1D1D1F",
    textColor: "#1D1D1F",
    subtleText: "#86868B",
    priceColor: "#1D1D1F",
    dotColor: "#0071E3",
    ringColor: "#0071E3",
    cardBg: "#F5F5F7",
    footerBg: "#0A0A0A",
    discountBg: "#EFF6FF",
    discountText: "#1D4ED8",
    discountBorder: "#BFDBFE",
    featureIconColor: "#0071E3",
    storeTagColor: "#0071E3",
    borderColor: "#E8E8ED",
    badgeBg: "rgba(0,113,227,0.10)",
    badgeText: "#0071E3",
    badgeBorder: "rgba(0,113,227,0.30)",
    btnRadius: "9999px",
    ghostBorder: "#D2D2D7",
    ghostBorderWidth: "1px",
    ghostText: "#1D1D1F",
    ghostHoverBg: "#F5F5F7",
    ghostHoverText: "#1D1D1F",
    solidBtn: "#0A0A0A",
    solidBtnText: "#FFFFFF",
    cartBg: "rgba(255,255,255,0.72)",
    cartBlur: "blur(28px)",
    cartBackdrop: "rgba(0,0,0,0.18)",
  },

  // ═══ TEMA 3 — Artisan (Doğal / Bohem) ═══════════════════════════════════════
  artisan: {
    id: "artisan",
    name: "Artisan",
    shortName: "Artisan",
    bgColor: "#FBF7F0",
    headerBg: "#FBF7F0",
    bannerBg: "linear-gradient(90deg, #7C7A4F 0%, #A89A5B 50%, #7C7A4F 100%)",
    galleryBg: "linear-gradient(160deg, #F5EDE0 0%, #EFE6D5 50%, #F7F0E3 100%)",
    accentColor: "#A65A37",
    accentGlow: "rgba(166,90,55,0.18)",
    primaryBtn: "#5C4A38",
    secondaryBtn: "linear-gradient(135deg, #A65A37 0%, #C2854D 100%)",
    fontFamily: '"Lora", Georgia, "Times New Roman", serif',
    fontFamilySans: '"Inter", "Helvetica Neue", sans-serif',
    titleColor: "#3D3326",
    textColor: "#5C4F3D",
    subtleText: "#9B8B73",
    priceColor: "#3D3326",
    dotColor: "#A65A37",
    ringColor: "#A65A37",
    cardBg: "#F1E8D8",
    footerBg: "#3D3326",
    discountBg: "#F5EDDD",
    discountText: "#8A5A2B",
    discountBorder: "#E0CBA8",
    featureIconColor: "#7C7A4F",
    storeTagColor: "#A65A37",
    borderColor: "#E5D9C5",
    badgeBg: "rgba(166,90,55,0.12)",
    badgeText: "#8A5A2B",
    badgeBorder: "rgba(166,90,55,0.30)",
    btnRadius: "14px",
    ghostBorder: "#A65A37",
    ghostBorderWidth: "1.5px",
    ghostText: "#5C4A38",
    ghostHoverBg: "#EFE3D0",
    ghostHoverText: "#5C4A38",
    solidBtn: "linear-gradient(135deg, #A65A37 0%, #C2854D 100%)",
    solidBtnText: "#FBF7F0",
    cartBg: "#F5EDE0",
    cartBlur: "none",
    cartBackdrop: "rgba(61,51,38,0.32)",
  },

  // ═══ TEMA 4 — Dinamik (Street / GenZ) ═══════════════════════════════════════
  dynamic: {
    id: "dynamic",
    name: "Dinamik",
    shortName: "Dinamik",
    bgColor: "#FFFFFF",
    headerBg: "#FFFFFF",
    bannerBg: "linear-gradient(90deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)",
    galleryBg: "linear-gradient(160deg, #F4F4F2 0%, #ECECEA 50%, #F4F4F2 100%)",
    accentColor: "#E5005A",
    accentGlow: "rgba(229,0,90,0.20)",
    primaryBtn: "#0A0A0A",
    secondaryBtn: "#0A0A0A",
    fontFamily: '"Anton", "Space Grotesk", Impact, sans-serif',
    fontFamilySans: '"Space Grotesk", "DM Sans", sans-serif',
    titleColor: "#0A0A0A",
    textColor: "#1A1A1A",
    subtleText: "#666666",
    priceColor: "#0A0A0A",
    dotColor: "#E5005A",
    ringColor: "#0A0A0A",
    cardBg: "#F4F4F2",
    footerBg: "#0A0A0A",
    discountBg: "#FFE8F0",
    discountText: "#C30049",
    discountBorder: "#FFB3CF",
    featureIconColor: "#E5005A",
    storeTagColor: "#E5005A",
    borderColor: "#E0E0E0",
    badgeBg: "#D4FF00",
    badgeText: "#0A0A0A",
    badgeBorder: "#0A0A0A",
    btnRadius: "3px",
    ghostBorder: "#0A0A0A",
    ghostBorderWidth: "2.5px",
    ghostText: "#0A0A0A",
    ghostHoverBg: "#D4FF00",
    ghostHoverText: "#0A0A0A",
    solidBtn: "#0A0A0A",
    solidBtnText: "#D4FF00",
    cartBg: "#FFFFFF",
    cartBlur: "none",
    cartBackdrop: "rgba(0,0,0,0.45)",
  },

  // ═══ TEMA 5 — Klasik Kurumsal (Güven) ═══════════════════════════════════════
  corporate: {
    id: "corporate",
    name: "Klasik Kurumsal",
    shortName: "Kurumsal",
    bgColor: "#FFFFFF",
    headerBg: "#FFFFFF",
    bannerBg: "linear-gradient(90deg, #1E3A8A 0%, #2563EB 50%, #1E3A8A 100%)",
    galleryBg: "linear-gradient(160deg, #F8FAFC 0%, #EFF4FB 50%, #F8FAFC 100%)",
    accentColor: "#1D4ED8",
    accentGlow: "rgba(29,78,216,0.16)",
    primaryBtn: "#1E3A8A",
    secondaryBtn: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
    fontFamily: '"Roboto", "Open Sans", Arial, sans-serif',
    fontFamilySans: '"Roboto", "Open Sans", Arial, sans-serif',
    titleColor: "#0F2C5C",
    textColor: "#334155",
    subtleText: "#64748B",
    priceColor: "#1E3A8A",
    dotColor: "#2563EB",
    ringColor: "#2563EB",
    cardBg: "#F8FAFC",
    footerBg: "#0F2C5C",
    discountBg: "#EFF6FF",
    discountText: "#1D4ED8",
    discountBorder: "#BFDBFE",
    featureIconColor: "#2563EB",
    storeTagColor: "#1D4ED8",
    borderColor: "#E2E8F0",
    badgeBg: "rgba(37,99,235,0.10)",
    badgeText: "#1D4ED8",
    badgeBorder: "rgba(37,99,235,0.30)",
    btnRadius: "8px",
    ghostBorder: "#1D4ED8",
    ghostBorderWidth: "1.5px",
    ghostText: "#1D4ED8",
    ghostHoverBg: "#EFF6FF",
    ghostHoverText: "#1D4ED8",
    solidBtn: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
    solidBtnText: "#FFFFFF",
    cartBg: "#FFFFFF",
    cartBlur: "none",
    cartBackdrop: "rgba(15,44,92,0.40)",
  },
};
