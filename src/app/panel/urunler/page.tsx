"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ExternalLink, Copy, CheckCheck, Check, Package, Sparkles,
  Crown, Globe, Palette, ArrowRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Toast from "@/components/Toast";
import type { Store } from "@/types/store";
import { THEMES, type ThemeId } from "@/types/theme";
import {
  usePanelTheme, PANEL_DISPLAY_FONT, PANEL_BODY_FONT, type PanelPalette,
} from "../_lib/theme";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function UrunlerPage() {
  const { c, isDark } = usePanelTheme();

  const [stores, setStores]         = useState<Store[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [toastMsg, setToastMsg]     = useState("");
  const [showToast, setShowToast]   = useState(false);

  // ── Supabase: mağazaları çek (eski mimariden korundu) ──
  const fetchStores = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stores")
      .select(
        "id, created_at, store_name, product_price, product_image_base64, selected_plan, status, seo_title, description, features, image_urls, custom_domain, theme"
      )
      .order("created_at", { ascending: false });
    if (!error && data) setStores(data as Store[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  // ── Tema değiştirme (eski mimariden korundu) ──
  const handleThemeChange = useCallback(async (storeId: string, themeId: ThemeId) => {
    setUpdatingId(storeId);
    const supabase = createClient();
    const { error } = await supabase.from("stores").update({ theme: themeId }).eq("id", storeId);
    if (error) {
      setToastMsg("Tema güncellenirken bir hata oluştu.");
    } else {
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, theme: themeId } : s)));
      setToastMsg(`✅ Tema "${THEMES[themeId].name}" olarak güncellendi!`);
    }
    setShowToast(true);
    setUpdatingId(null);
  }, []);

  const handleCopy = (store: Store) => {
    const slug = slugify(store.store_name);
    const url = store.custom_domain ? `www.${store.custom_domain}` : `optiefy.com/${slug}`;
    navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    setCopiedId(store.id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Toast message={toastMsg} show={showToast} onHide={() => setShowToast(false)} />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
      >
        <div>
          <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
            Katalog ve Vitrin Yönetimi
          </h1>
          <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
            {loading ? "Yükleniyor..." : `${stores.length} aktif vitrin · AI ile üretilen tüm mağazalarınız`}
          </p>
        </div>

        <Link href="/">
          <motion.span
            whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
            style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}
          >
            <Plus className="w-4 h-4" /> Yeni Vitrin Üret
          </motion.span>
        </Link>
      </motion.div>

      {/* ── States ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
              <div className="h-44 animate-pulse" style={{ background: c.hover }} />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded-lg animate-pulse" style={{ background: c.hover }} />
                <div className="h-3 w-1/2 rounded-lg animate-pulse" style={{ background: c.hover }} />
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <EmptyState c={c} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {stores.map((store, i) => (
            <StoreCard
              key={store.id}
              store={store}
              index={i}
              c={c}
              isDark={isDark}
              updating={updatingId === store.id}
              copied={copiedId === store.id}
              onThemeChange={handleThemeChange}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Store card ─────────────────────────────────────────────────────────────────

function StoreCard({
  store, index, c, isDark, updating, copied, onThemeChange, onCopy,
}: {
  store: Store;
  index: number;
  c: PanelPalette;
  isDark: boolean;
  updating: boolean;
  copied: boolean;
  onThemeChange: (storeId: string, themeId: ThemeId) => void;
  onCopy: (store: Store) => void;
}) {
  const slug = slugify(store.store_name);
  const displayImage = store.image_urls?.[0] ?? store.product_image_base64;
  const hasAI = !!(store.seo_title || store.description);
  const currentTheme = (store.theme ?? "modern") as ThemeId;
  const storeUrl = store.custom_domain ? `www.${store.custom_domain}` : `optiefy.com/${slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      className="rounded-2xl overflow-hidden flex flex-col group"
      style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
    >
      {/* Görsel */}
      <div className="relative h-44 overflow-hidden" style={{ background: isDark ? "#0F0F0F" : "#F4F4F2" }}>
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={store.seo_title ?? store.store_name}
            className="w-full h-full object-contain p-5 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12" style={{ color: c.textSubtle }} />
          </div>
        )}

        {/* Durum */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.92)", border: `1px solid ${c.border}`, backdropFilter: "blur(8px)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: store.status === "active" ? "#22C55E" : "#F59E0B" }} />
          <span className="text-[11px] font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
            {store.status === "active" ? "Yayında" : "Bekliyor"}
          </span>
        </div>

        {/* Plan */}
        <div className="absolute top-3 right-3">
          {store.selected_plan === "yearly" ? (
            <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.35)" }}>
              <Crown className="w-3 h-3" style={{ color: "#D97706" }} />
              <span className="text-[10px] font-bold tracking-wide" style={{ color: "#B45309" }}>YILLIK</span>
            </div>
          ) : (
            <div className="rounded-full px-2 py-1" style={{ background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.92)", border: `1px solid ${c.border}` }}>
              <span className="text-[10px] font-bold tracking-wide" style={{ color: c.textMuted }}>AYLIK</span>
            </div>
          )}
        </div>

        {/* AI rozeti */}
        {hasAI && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
            <Sparkles className="w-2.5 h-2.5 text-white" />
            <span className="text-white text-[9px] font-bold">AI İçerik</span>
          </div>
        )}
      </div>

      {/* Gövde */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="font-semibold text-[15px] leading-snug line-clamp-2" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
            {store.seo_title ?? store.store_name}
          </h3>
          <span className="text-sm font-bold whitespace-nowrap flex-shrink-0" style={{ color: c.accentText, fontFamily: PANEL_BODY_FONT }}>
            {store.product_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </span>
        </div>

        <div className="flex items-center gap-1 mb-2">
          {store.custom_domain && <Globe className="w-3 h-3 flex-shrink-0" style={{ color: "#16A34A" }} />}
          <p className="text-xs font-mono truncate" style={{ color: store.custom_domain ? "#16A34A" : c.textSubtle }}>{storeUrl}</p>
        </div>

        {store.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
            {store.description}
          </p>
        )}

        <p className="text-[11px] mb-4" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
          Oluşturuldu: {new Date(store.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* ── Tema seçici ── */}
        <div className="mt-auto pt-3" style={{ borderTop: `1px solid ${c.borderSoft}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Vitrin Teması</span>
            </div>
            <span className="text-[11px] font-semibold" style={{ color: c.accentText, fontFamily: PANEL_BODY_FONT }}>
              {THEMES[currentTheme].shortName}
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1.5 mb-3 px-0.5">
            {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
              const th = THEMES[tid];
              const active = currentTheme === tid;
              return (
                <motion.button
                  key={tid}
                  onClick={() => !updating && !active && onThemeChange(store.id, tid)}
                  whileHover={{ y: updating ? 0 : -2 }} whileTap={{ scale: 0.97 }}
                  disabled={updating}
                  title={th.name}
                  className="relative flex-shrink-0 disabled:opacity-50"
                  style={{ width: 64 }}
                >
                  {/* Mini vitrin önizlemesi (Shopify tema mağazası tarzı) */}
                  <div
                    className="rounded-lg overflow-hidden mb-1.5"
                    style={{
                      aspectRatio: "3 / 4",
                      border: `2px solid ${active ? th.accentColor : c.border}`,
                      boxShadow: active ? `0 4px 14px ${th.accentGlow}` : "none",
                    }}
                  >
                    <div className="w-full h-full flex flex-col p-1.5" style={{ background: th.bgColor }}>
                      <div className="h-1 rounded-full mb-1" style={{ width: "60%", background: th.titleColor }} />
                      <div className="flex-1 rounded" style={{ background: th.galleryBg }} />
                      <div className="h-2 mt-1.5" style={{ background: th.solidBtn, borderRadius: th.btnRadius === "9999px" ? "9999px" : "2px" }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-center font-semibold truncate" style={{ color: active ? th.accentColor : c.textMuted, fontFamily: PANEL_BODY_FONT }}>
                    {th.shortName}
                  </p>
                  {active && (
                    <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: th.accentColor }}>
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* ── Aksiyonlar ── */}
          <div className="flex items-center gap-2">
            <Link href={`/panel/${store.id}`} className="flex-1">
              <span className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}>
                Vitrini Görüntüle <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </Link>
            <AnimatePresence mode="wait">
              <motion.button
                key={copied ? "copied" : "copy"}
                initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.15 }}
                onClick={() => onCopy(store)}
                title="Vitrin bağlantısını kopyala"
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: copied ? "rgba(34,197,94,0.12)" : c.hover, border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : c.border}` }}
              >
                {copied
                  ? <CheckCheck className="w-4 h-4" style={{ color: "#16A34A" }} />
                  : <Copy className="w-4 h-4" style={{ color: c.textMuted }} />}
              </motion.button>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ c }: { c: PanelPalette }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}
      className="rounded-3xl flex flex-col items-center justify-center text-center px-6"
      style={{ background: c.cardBg, border: `1px dashed ${c.border}`, minHeight: "58vh" }}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          <Package className="w-9 h-9 text-white" />
        </div>
        <motion.div
          animate={{ rotate: [0, 12, 0], y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: c.shadow }}
        >
          <Sparkles className="w-4 h-4" style={{ color: "#7C3AED" }} />
        </motion.div>
      </div>

      <h2 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "1.8rem", fontWeight: 400, color: c.text, marginBottom: "0.6rem" }}>
        Henüz bir vitrin oluşturmadınız
      </h2>
      <p className="text-sm max-w-sm leading-relaxed mb-7" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
        İlk ürününüzü ekleyerek başlayın. Tek bir fotoğraf yükleyin, yapay zeka saniyeler içinde profesyonel vitrininizi oluştursun.
      </p>

      <Link href="/">
        <motion.span
          whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold"
          style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT, boxShadow: c.shadowMd }}
        >
          <Sparkles className="w-4 h-4" /> İlk Vitrini Oluştur <ArrowRight className="w-4 h-4" />
        </motion.span>
      </Link>
    </motion.div>
  );
}
