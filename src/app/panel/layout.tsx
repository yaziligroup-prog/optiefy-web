"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Store, Settings,
  Search, Bell, Sun, Moon, ChevronDown, Menu,
  LogOut, User as UserIcon, CreditCard, ArrowUpRight,
  Check, Globe, Plus, Zap, Lock, X as XIcon,
} from "lucide-react";
import OptiefyIcon from "@/components/OptiefyIcon";
import {
  PanelThemeProvider, usePanelTheme, PANEL_BODY_FONT, PANEL_DISPLAY_FONT,
} from "./_lib/theme";
import { StoreProvider, useActiveStore } from "./_lib/storeContext";
import { THEMES, type ThemeId } from "@/types/theme";
import NewStoreWizard from "./_components/NewStoreWizard";

// ─── Navigation ──────────────────────────────────────────────────────────────

const NAV = [
  { href: "/panel",            label: "Ana Panel",        icon: LayoutDashboard },
  { href: "/panel/siparisler", label: "Sipariş Yönetimi", icon: ShoppingBag },
  { href: "/panel/urunler",    label: "Ürün Kataloğu",    icon: Package },
  { href: "/panel/musteriler", label: "Müşteriler",       icon: Users },
  { href: "/panel/pazaryeri",  label: "Pazaryeri",        icon: Store },
  { href: "/panel/ayarlar",    label: "Ayarlar",          icon: Settings },
] as const;

const DASHBOARD_ROUTES: string[] = NAV.map((n) => n.href);

const spring = { type: "spring" as const, stiffness: 420, damping: 36 };

// ─── Plan kapısı — kaç ücretsiz mağaza hakkı var ────────────────────────────
// PayTR entegrasyonu hazır olduğunda bu sabit plan verisinden okunacak.
const FREE_STORE_LIMIT = 1; // Ücretsiz planda 1 mağaza; fazlası için upgrade gerekli

// ─── UpgradeGate modal ───────────────────────────────────────────────────────

function UpgradeGate({ open, onClose, storeCount }: { open: boolean; onClose: () => void; storeCount: number }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const PLANS = [
    {
      id: "starter",
      name: "Starter",
      price: "₺199 / ay",
      stores: 3,
      features: ["3 mağazaya kadar", "AI vitrin üretici", "Özel domain", "Kargo entegrasyonu"],
      cta: "Starter'a Geç",
      accent: "#6366F1",
      popular: false,
    },
    {
      id: "growth",
      name: "Growth",
      price: "₺399 / ay",
      stores: 10,
      features: ["10 mağazaya kadar", "Öncelikli AI işlemi", "Pazaryeri entegrasyonu", "Gelişmiş analitik"],
      cta: "Growth'a Geç",
      accent: "#7C3AED",
      popular: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: "₺799 / ay",
      stores: -1,
      features: ["Sınırsız mağaza", "Beyaz etiket", "API erişimi", "Öncelikli destek"],
      cta: "Pro'ya Geç",
      accent: "#EC4899",
      popular: false,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-3xl overflow-hidden relative"
          style={{
            background: "linear-gradient(165deg, #12111A 0%, #0C0B13 100%)",
            border: "1px solid rgba(124,58,237,0.2)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          {/* Dekoratif ışıma */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 70%)" }} />

          {/* Kapatma */}
          <button onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center z-10"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <XIcon className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          </button>

          {/* Header */}
          <div className="px-7 pt-8 pb-6 text-center relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.7rem", fontWeight: 400, color: "#F5F5F4", marginBottom: 8 }}>
              Yeni mağaza hakkı gerekli
            </h2>
            <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>
              Şu an <span className="font-semibold" style={{ color: "#C084FC" }}>{storeCount} mağaza</span> ile ücretsiz planınızı kullanıyorsunuz.
              İkinci mağazanızı açmak için planınızı yükseltin.
            </p>
          </div>

          {/* Plan kartları */}
          <div className="px-5 pb-7 grid grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div key={plan.id}
                className="rounded-2xl p-4 relative flex flex-col"
                style={{
                  background: plan.popular ? `${plan.accent}12` : "rgba(255,255,255,0.04)",
                  border: plan.popular ? `1.5px solid ${plan.accent}50` : "1px solid rgba(255,255,255,0.08)",
                }}>
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: plan.accent, color: "white", boxShadow: `0 4px 12px ${plan.accent}50` }}>
                    En Popüler
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${plan.accent}20` }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: plan.accent }} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#F5F5F4", fontFamily: PANEL_BODY_FONT }}>{plan.name}</p>
                </div>

                <p className="text-lg font-bold mb-3" style={{ color: plan.accent, fontFamily: PANEL_BODY_FONT }}>{plan.price}</p>

                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px]" style={{ color: "#9CA3AF", fontFamily: PANEL_BODY_FONT }}>
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: plan.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: plan.popular ? plan.accent : "rgba(255,255,255,0.06)",
                    color: plan.popular ? "white" : "#9CA3AF",
                    border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.1)",
                    opacity: 0.7, cursor: "not-allowed",
                  }}
                  title="Ödeme sistemi yakında aktif olacak"
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Alt not */}
          <div className="px-7 pb-6 text-center">
            <p className="text-xs" style={{ color: "#6B7280", fontFamily: PANEL_BODY_FONT }}>
              Ödeme sistemi yakında aktif olacak · Şimdilik sihirbazı test edebilirsiniz
            </p>
            <button onClick={onClose}
              className="mt-3 text-xs font-semibold underline underline-offset-2"
              style={{ color: "#A855F7", fontFamily: PANEL_BODY_FONT }}>
              Yine de devam et (test modu)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Bildirim verileri ───────────────────────────────────────────────────────

const MOCK_NOTIFS = [
  { id: "1", title: "Yeni sipariş alındı",   body: "Mağazanızdan 1 yeni sipariş geldi.",            time: "2 dk önce",  read: false },
  { id: "2", title: "Ürün yayına alındı",    body: "Aktif ürününüz canlıda yayında.",               time: "1 sa önce",  read: true  },
  { id: "3", title: "Analitik raporu hazır", body: "Bu haftaki trafik özeti panelde sizi bekliyor.", time: "3 sa önce",  read: true  },
];

// ─── Store Selector ──────────────────────────────────────────────────────────

function StoreSelector({ onNewStore }: { onNewStore: () => void }) {
  const { c, isDark } = usePanelTheme();
  const { stores, activeStore, setActiveStoreId, loading } = useActiveStore();
  const [open, setOpen] = useState(false);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  if (loading || stores.length === 0) {
    return (
      <div className="mx-3 my-2 h-12 rounded-xl animate-pulse" style={{ background: c.hover, border: `1px solid ${c.border}` }} />
    );
  }

  const theme = (activeStore?.theme ?? "artisan") as ThemeId;
  const themeColor = THEMES[theme]?.accentColor ?? "#7C3AED";
  const isLive = activeStore?.status === "active";

  return (
    <div className="relative px-3 py-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
        style={{ ...tr, background: open ? c.hover : c.cardBg, border: `1px solid ${c.border}` }}
      >
        {/* Renk dot */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${themeColor}20`, border: `1px solid ${themeColor}40` }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: themeColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight truncate" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
            {activeStore?.store_name ?? "Mağaza"}
          </p>
          <p className="text-[10px] leading-tight mt-0.5 truncate flex items-center gap-1" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            {isLive
              ? <><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#22C55E" }} /> Yayında</>
              : <><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#F59E0B" }} /> Taslak</>
            }
            {activeStore?.custom_domain && (
              <><span style={{ color: c.border }}>·</span> {activeStore.custom_domain}</>
            )}
          </p>
        </div>

        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform" style={{ color: c.textSubtle, transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[45]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="absolute left-3 right-3 mt-1 rounded-xl overflow-hidden z-[46]"
              style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadowMd }}
            >
              <div className="px-3 py-2" style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                  Mağazalarım · {stores.length}
                </p>
              </div>

              <div className="py-1 max-h-52 overflow-y-auto">
                {stores.map((s) => {
                  const sid = (s.theme ?? "artisan") as ThemeId;
                  const sc  = THEMES[sid]?.accentColor ?? "#7C3AED";
                  const sel = s.id === activeStore?.id;
                  return (
                    <button key={s.id}
                      onClick={() => { setActiveStoreId(s.id); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all"
                      style={{ background: sel ? (isDark ? "rgba(124,58,237,0.1)" : "#FAF5FF") : "transparent" }}
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `${sc}20`, border: `1px solid ${sc}40` }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: sc }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: sel ? "#7C3AED" : c.text, fontFamily: PANEL_BODY_FONT }}>
                          {s.store_name}
                        </p>
                        {s.custom_domain && (
                          <p className="text-[10px] truncate flex items-center gap-1" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                            <Globe className="w-2.5 h-2.5" /> {s.custom_domain}
                          </p>
                        )}
                      </div>
                      {sel && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7C3AED" }} />}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 py-2.5" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
                <button
                  onClick={() => { setOpen(false); onNewStore(); }}
                  className="flex items-center gap-2 text-[11px] font-semibold w-full py-2 rounded-lg px-2.5 transition-all"
                  style={{ color: "#7C3AED", fontFamily: PANEL_BODY_FONT, background: isDark ? "rgba(124,58,237,0.08)" : "#F5F0FF", border: `1px solid ${isDark ? "rgba(124,58,237,0.18)" : "rgba(124,58,237,0.15)"}` }}>
                  <Plus className="w-3.5 h-3.5" /> Yeni Mağaza Ekle
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { c, isDark, toggle } = usePanelTheme();
  const { stores, refreshStores } = useActiveStore();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [wizardOpen,    setWizardOpen]    = useState(false);
  const [upgradeOpen,   setUpgradeOpen]   = useState(false);
  const [user,          setUser]          = useState<User | null>(null);

  // Feature-gate: yeni mağaza açma hakkı kontrolü
  const handleNewStoreRequest = () => {
    if (stores.length >= FREE_STORE_LIMIT) {
      setUpgradeOpen(true);
    } else {
      setWizardOpen(true);
    }
  };

  const handleWizardCreated = async (storeId: string) => {
    await refreshStores(true);
    // Yeni oluşturulan mağazayı aktif seç
    try { localStorage.setItem("sv-active-store", storeId); } catch { /* ignore */ }
    void storeId; // kullanıldığını işaretle
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "Kullanıcı";
  const avatarInitial = displayName[0]?.toUpperCase() ?? "K";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isStorefront = pathname.startsWith("/panel/") && !DASHBOARD_ROUTES.includes(pathname);
  if (isStorefront) return <>{children}</>;

  const tr: React.CSSProperties = { transition: "background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease" };

  const SidebarBody = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${c.borderSoft}`, ...tr }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
          <OptiefyIcon size={15} color="white" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight" style={{ color: c.text, fontFamily: PANEL_BODY_FONT, ...tr }}>Optiefy</span>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
          style={{ background: c.accentSoft, color: c.accentText, ...tr }}>Pro</span>
      </div>

      {/* ── Mağaza Seçici ── */}
      <div style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
        <StoreSelector onNewStore={handleNewStoreRequest} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Menü</p>
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{ color: active ? c.navActiveTxt : c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              {active && (
                <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl"
                  style={{ background: c.navActive }} transition={spring} />
              )}
              <Icon className="w-[18px] h-[18px] relative z-10 flex-shrink-0"
                style={{ color: active ? c.navActiveTxt : c.textSubtle }} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card */}
      <div className="p-3 flex-shrink-0">
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)" }}>
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <p className="text-white font-semibold text-sm mb-1 relative">Büyüme Planı</p>
          <p className="text-white/70 text-xs leading-relaxed mb-3 relative">Pazaryeri entegrasyonu ve sınırsız AI ile satışlarını katla.</p>
          <button className="relative w-full py-2 rounded-lg bg-white text-[#7C3AED] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors">
            Yükselt <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ ...tr, background: c.appBg, minHeight: "100vh", fontFamily: PANEL_BODY_FONT, overflowX: "hidden", maxWidth: "100vw" }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 z-40 flex-col"
        style={{ ...tr, background: c.sidebarBg, borderRight: `1px solid ${c.border}` }}>
        {SidebarBody}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={spring}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col"
              style={{ background: c.sidebarBg, borderRight: `1px solid ${c.border}` }}>
              {SidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64 min-w-0 overflow-x-hidden">

        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6"
          style={{ ...tr, background: c.topbarBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${c.border}` }}>

          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.hover, color: c.textMuted }}>
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textSubtle }} />
              <input type="text" placeholder="Sipariş veya müşteri ara..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none"
                style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }} />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">

            {/* Dark toggle */}
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}>
              <AnimatePresence mode="wait">
                <motion.div key={isDark ? "sun" : "moon"}
                  initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 20, opacity: 0 }}
                  transition={{ duration: 0.18 }}>
                  {isDark ? <Sun className="w-4 h-4" style={{ color: "#FB923C" }} /> : <Moon className="w-4 h-4" style={{ color: c.textMuted }} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Bell — bildirim popoversı */}
            <div className="relative">
              <button onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
                className="w-9 h-9 rounded-lg flex items-center justify-center relative"
                style={{ ...tr, background: notifOpen ? c.accentSoft : c.hover, border: `1px solid ${c.border}` }}>
                <Bell className="w-4 h-4" style={{ color: c.textMuted }} />
                {MOCK_NOTIFS.some((n) => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ background: "#EF4444", boxShadow: `0 0 0 2px ${c.topbarBg}` }} />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-40"
                      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadowMd }}>
                      <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                        <p className="text-sm font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Bildirimler</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#7C3AED20", color: "#7C3AED" }}>
                          {MOCK_NOTIFS.filter((n) => !n.read).length} yeni
                        </span>
                      </div>
                      <div>
                        {MOCK_NOTIFS.map((n, i) => (
                          <div key={n.id} className="px-4 py-3.5 flex items-start gap-3"
                            style={{
                              borderBottom: i < MOCK_NOTIFS.length - 1 ? `1px solid ${c.borderSoft}` : "none",
                              background: n.read ? "transparent" : (isDark ? "rgba(124,58,237,0.06)" : "#FAF5FF"),
                            }}>
                            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: n.read ? c.borderSoft : "#7C3AED" }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold leading-tight" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{n.title}</p>
                              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{n.body}</p>
                              <p className="text-[10px] mt-1" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 text-center" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
                        <button onClick={() => setNotifOpen(false)} className="text-xs font-semibold hover:opacity-70"
                          style={{ color: "#7C3AED", fontFamily: PANEL_BODY_FONT }}>
                          Tümünü okundu işaretle
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg"
                style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>{avatarInitial}</div>
                <span className="hidden sm:block text-sm font-medium" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-40 py-1"
                      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadowMd }}>
                      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                        <p className="text-sm font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{displayName}</p>
                        <p className="text-xs" style={{ color: c.textSubtle }}>{user?.email ?? ""}</p>
                      </div>
                      {[
                        { icon: UserIcon,   label: "Profilim" },
                        { icon: CreditCard, label: "Faturalandırma" },
                        { icon: Settings,   label: "Hesap Ayarları" },
                      ].map(({ icon: Icon, label }) => (
                        <button key={label} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70 transition-opacity"
                          style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                          <Icon className="w-4 h-4" style={{ color: c.textSubtle }} /> {label}
                        </button>
                      ))}
                      <div style={{ borderTop: `1px solid ${c.borderSoft}` }}>
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70 transition-opacity"
                          style={{ color: "#EF4444", fontFamily: PANEL_BODY_FONT }}>
                          <LogOut className="w-4 h-4" /> Çıkış Yap
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ── AI Vitrin Sihirbazı — yeni mağaza modal ── */}
      <NewStoreWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={(id) => { handleWizardCreated(id); setWizardOpen(false); }}
      />

      {/* ── Upgrade Gate — plan yükseltme kapısı ── */}
      <UpgradeGate
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        storeCount={stores.length}
      />
    </div>
  );
}

// ─── Root layout export ──────────────────────────────────────────────────────

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelThemeProvider>
      <StoreProvider>
        <Shell>{children}</Shell>
      </StoreProvider>
    </PanelThemeProvider>
  );
}
