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
} from "lucide-react";
import OptiefyIcon from "@/components/OptiefyIcon";
import {
  PanelThemeProvider, usePanelTheme, PANEL_BODY_FONT,
} from "./_lib/theme";

// ─── Navigation model ───────────────────────────────────────────────────────────

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

// ─── Shell (chrome) ─────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { c, isDark, toggle } = usePanelTheme();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const displayName = user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split("@")[0]
    ?? "Kullanıcı";
  const avatarInitial = displayName[0]?.toUpperCase() ?? "K";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Mağaza vitrin önizlemesi (/panel/{uuid}) → chrome'suz, tam ekran render et
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Menü</p>
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{ color: active ? c.navActiveTxt : c.textMuted, fontFamily: PANEL_BODY_FONT }}
            >
              {active && (
                <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl" style={{ background: c.navActive }} transition={spring} />
              )}
              <Icon className="w-[18px] h-[18px] relative z-10 flex-shrink-0" style={{ color: active ? c.navActiveTxt : c.textSubtle }} />
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

      {/* ─── Desktop sidebar (fixed) ─── */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 z-40 flex-col"
        style={{ ...tr, background: c.sidebarBg, borderRight: `1px solid ${c.border}` }}>
        {SidebarBody}
      </aside>

      {/* ─── Mobile sidebar (drawer) ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={spring}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col"
              style={{ background: c.sidebarBg, borderRight: `1px solid ${c.border}` }}
            >
              {SidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main column ─── */}
      <div className="lg:pl-64 min-w-0 overflow-x-hidden">

        {/* Topbar */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6"
          style={{ ...tr, background: c.topbarBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${c.border}` }}
        >
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.hover, color: c.textMuted }}>
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textSubtle }} />
              <input
                type="text"
                placeholder="Sipariş veya müşteri ara..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none"
                style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Dark toggle */}
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}>
              <AnimatePresence mode="wait">
                <motion.div key={isDark ? "sun" : "moon"} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 20, opacity: 0 }} transition={{ duration: 0.18 }}>
                  {isDark ? <Sun className="w-4 h-4" style={{ color: "#FB923C" }} /> : <Moon className="w-4 h-4" style={{ color: c.textMuted }} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Bell */}
            <button className="w-9 h-9 rounded-lg flex items-center justify-center relative"
              style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}>
              <Bell className="w-4 h-4" style={{ color: c.textMuted }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#EF4444", boxShadow: `0 0 0 2px ${c.topbarBg}` }} />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg" style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>{avatarInitial}</div>
                <span className="hidden sm:block text-sm font-medium" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-40 py-1"
                      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadowMd }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                        <p className="text-sm font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{displayName}</p>
                        <p className="text-xs" style={{ color: c.textSubtle }}>{user?.email ?? ""}</p>
                      </div>
                      {[
                        { icon: UserIcon,   label: "Profilim" },
                        { icon: CreditCard, label: "Faturalandırma" },
                        { icon: Settings,   label: "Hesap Ayarları" },
                      ].map(({ icon: Icon, label }) => (
                        <button key={label} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70 transition-opacity" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                          <Icon className="w-4 h-4" style={{ color: c.textSubtle }} /> {label}
                        </button>
                      ))}
                      <div style={{ borderTop: `1px solid ${c.borderSoft}` }}>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:opacity-70 transition-opacity"
                          style={{ color: "#EF4444", fontFamily: PANEL_BODY_FONT }}
                        >
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
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelThemeProvider>
      <Shell>{children}</Shell>
    </PanelThemeProvider>
  );
}
