"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Store as StoreRow } from "@/types/store";
import {
  User, Lock, Store, CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
  ExternalLink, RefreshCw, Trash2, Shield, Truck, Globe, Copy, Check,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import {
  usePanelTheme, PANEL_BODY_FONT, PANEL_DISPLAY_FONT, type PanelPalette,
} from "../_lib/theme";
import { useActiveStore } from "../_lib/storeContext";

// ─── Types ───────────────────────────────────────────────────────────────────────

type FeedbackState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function sectionCard(c: PanelPalette) {
  return {
    background: c.cardBg,
    border: `1px solid ${c.border}`,
    boxShadow: c.shadow,
  };
}

// ─── FeedbackBanner ──────────────────────────────────────────────────────────────

function FeedbackBanner({ fb }: { fb: FeedbackState }) {
  if (!fb) return null;
  const isOk = fb.type === "success";
  const bg   = isOk ? "#059669" : "#DC2626";
  const Icon = isOk ? CheckCircle : AlertCircle;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm"
      style={{ background: `${bg}15`, border: `1px solid ${bg}40`, color: bg, fontFamily: PANEL_BODY_FONT }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{fb.message}</span>
    </motion.div>
  );
}

// ─── ProfileSection ───────────────────────────────────────────────────────────────

function ProfileSection({ user, c }: { user: SupaUser; c: PanelPalette }) {
  const [name, setName]     = useState((user.user_metadata?.full_name as string) ?? "");
  const [saving, setSaving] = useState(false);
  const [fb, setFb]         = useState<FeedbackState>(null);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setFb(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (error) setFb({ type: "error", message: error.message });
    else setFb({ type: "success", message: "Profiliniz güncellendi." });
    setSaving(false);
  };

  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

  return (
    <section className="rounded-2xl p-6 space-y-5" style={sectionCard(c)}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#7C3AED15", border: "1px solid #7C3AED25" }}>
          <User className="w-4 h-4" style={{ color: "#7C3AED" }} />
        </div>
        <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Profil Bilgileri</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{name || "—"}</p>
          <p className="text-xs mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{user.email}</p>
          <p className="text-[11px] mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            Üyelik: {fmtDate(user.created_at)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Ad Soyad</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adınız ve soyadınız"
          className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none max-w-sm"
          style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>E-posta (değiştirilemez)</label>
        <input
          type="email"
          readOnly
          value={user.email ?? ""}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm max-w-sm cursor-not-allowed opacity-60"
          style={{ ...tr, background: c.hover, border: `1px solid ${c.borderSoft}`, color: c.textMuted, fontFamily: PANEL_BODY_FONT }}
        />
      </div>

      <FeedbackBanner fb={fb} />

      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
        style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Kaydet
      </button>
    </section>
  );
}

// ─── PasswordSection ──────────────────────────────────────────────────────────────

function PasswordSection({ c }: { c: PanelPalette }) {
  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [fb,      setFb]      = useState<FeedbackState>(null);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  const handleChange = async () => {
    if (!next || next.length < 6) { setFb({ type: "error", message: "Şifre en az 6 karakter olmalıdır." }); return; }
    if (next !== confirm)         { setFb({ type: "error", message: "Şifreler eşleşmiyor." }); return; }
    setSaving(true);
    setFb(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setFb({ type: "error", message: "Oturum süresi dolmuş, lütfen yeniden giriş yapın." }); setSaving(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (signInErr) { setFb({ type: "error", message: "Mevcut şifre hatalı." }); setSaving(false); return; }

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) setFb({ type: "error", message: error.message });
    else {
      setFb({ type: "success", message: "Şifreniz başarıyla güncellendi." });
      setCurrent(""); setNext(""); setConfirm("");
    }
    setSaving(false);
  };

  const fields = [
    { label: "Mevcut Şifre",       value: current, set: setCurrent },
    { label: "Yeni Şifre",         value: next,    set: setNext    },
    { label: "Yeni Şifre (Tekrar)", value: confirm, set: setConfirm },
  ];

  return (
    <section className="rounded-2xl p-6 space-y-5" style={sectionCard(c)}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#2563EB15", border: "1px solid #2563EB25" }}>
          <Lock className="w-4 h-4" style={{ color: "#2563EB" }} />
        </div>
        <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Şifre Değiştir</h2>
      </div>

      {fields.map(({ label, value, set }) => (
        <div key={label} className="space-y-1.5">
          <label className="text-xs font-medium block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{label}</label>
          <div className="relative max-w-sm">
            <input
              type={showPw ? "text" : "password"}
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm focus:outline-none"
              style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: c.textSubtle }}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}

      <FeedbackBanner fb={fb} />

      <button
        onClick={handleChange}
        disabled={saving || !current || !next || !confirm}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
        style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        Şifreyi Güncelle
      </button>
    </section>
  );
}

// ─── DeleteStoreModal — GitHub tarzı isim-doğrulamalı güvenli silme onayı ──────────

function DeleteStoreModal({
  store, c, onClose, onDeleted,
}: {
  store: StoreRow;
  c: PanelPalette;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting]       = useState(false);
  const [err, setErr]                 = useState<string | null>(null);

  // Güvenlik kilidi — mağaza adı birebir yazılmadan buton aktifleşmez
  const match = confirmText.trim() === store.store_name;

  const handleDelete = async () => {
    if (!match || deleting) return;
    setDeleting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/stores?id=${encodeURIComponent(store.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error ?? "Silme işlemi başarısız oldu.");
      }
      onDeleted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Silme işlemi başarısız oldu. Lütfen tekrar deneyin.");
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={() => !deleting && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: c.cardBg, border: "1px solid #DC262635", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#DC262615", border: "1px solid #DC262630" }}>
            <Trash2 className="w-5 h-5" style={{ color: "#DC2626" }} />
          </div>
          <div>
            <h3 className="text-base font-bold leading-snug" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
              Mağazayı Kalıcı Olarak Silmek İstediğinize Emin Misiniz?
            </h3>
            <p className="text-xs mt-0.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              {store.store_name}
              {store.custom_domain ? ` · ${store.custom_domain}` : ""}
            </p>
          </div>
        </div>

        <div className="rounded-xl px-4 py-3.5 text-[13px] leading-relaxed"
          style={{ background: "#DC26260D", border: "1px solid #DC262625", color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          <span className="font-bold" style={{ color: "#DC2626" }}>Bu işlem geri alınamaz.</span>{" "}
          Bu mağazayı sildiğinizde mağazaya bağlı tüm ürünler, siparişler, tasarım ayarları ve
          alan adı bağlantıları tamamen silinecek ve web siteniz erişime kapatılacaktır.
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={store.store_name}
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{
              background: c.inputBg,
              border: `1px solid ${match ? "#DC2626" : c.border}`,
              color: c.text,
              fontFamily: PANEL_BODY_FONT,
              transition: "border-color 0.2s",
            }}
          />
          <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            Onaylamak için lütfen mağazanın adını (
            <span className="font-mono font-bold" style={{ color: c.text }}>{store.store_name}</span>
            ) buraya yazın.
          </p>
        </div>

        {err && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
            style={{ background: "#DC262612", border: "1px solid #DC262640", color: "#DC2626", fontFamily: PANEL_BODY_FONT }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {err}
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: PANEL_BODY_FONT }}
          >
            Vazgeç
          </button>
          <button
            onClick={handleDelete}
            disabled={!match || deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: match ? "#DC2626" : `${c.hover}`,
              color: match ? "#FFFFFF" : c.textSubtle,
              border: `1px solid ${match ? "#DC2626" : c.border}`,
              fontFamily: PANEL_BODY_FONT,
              cursor: match && !deleting ? "pointer" : "not-allowed",
              boxShadow: match && !deleting ? "0 6px 20px rgba(220,38,38,0.35)" : "none",
            }}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Siliniyor…" : "Mağazayı Tamamen Sil ve Kapat"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── StoresSection ────────────────────────────────────────────────────────────────

function StoresSection({ c }: { c: PanelPalette }) {
  // Context'ten okur — API route + user_id izolasyonu zaten var
  const { stores, loading, refreshStores } = useActiveStore();
  const fetchStores = useCallback(() => refreshStores(false), [refreshStores]);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  // ── Silme akışı ─────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<StoreRow | null>(null);
  const [removedIds,   setRemovedIds]   = useState<string[]>([]);
  const [toast,        setToast]        = useState<string | null>(null);

  // Silinen mağaza context yenilenmeden (0 gecikme) listeden düşer
  const visibleStores = stores.filter((s) => !removedIds.includes(s.id));

  const handleDeleted = (deleted: StoreRow) => {
    setRemovedIds((prev) => [...prev, deleted.id]);
    setDeleteTarget(null);
    setToast(`"${deleted.store_name}" mağazası başarıyla tamamen silindi`);
    refreshStores(true); // context'i sessizce senkronla (aktif mağaza seçimi dahil)
    setTimeout(() => setToast(null), 4000);
  };

  const STATUS_COLOR: Record<string, string> = {
    active: "#059669", inactive: "#6B7280", draft: "#D97706", suspended: "#DC2626", pending: "#D97706",
  };
  const STATUS_LABEL: Record<string, string> = {
    active: "Yayında", inactive: "Pasif", draft: "Taslak", suspended: "Askıya Alındı", pending: "Taslak",
  };

  return (
    <section className="rounded-2xl p-6 space-y-4" style={sectionCard(c)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#05966915", border: "1px solid #05966925" }}>
            <Store className="w-4 h-4" style={{ color: "#059669" }} />
          </div>
          <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Mağazalarım</h2>
        </div>
        <button onClick={fetchStores} title="Yenile"
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}>
          <RefreshCw className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: c.hover }} />
          ))}
        </div>
      ) : visibleStores.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Store className="w-8 h-8 mb-3" style={{ color: c.textSubtle }} />
          <p className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Henüz mağaza oluşturmadınız.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleStores.map((store) => {
            const statusColor = STATUS_COLOR[store.status ?? "inactive"] ?? "#6B7280";
            // Canlı vitrin köprüsü: custom_domain hem özel alan adlarını (vivinth.com)
            // hem platform subdomain'lerini (magaza.optiefy.com) tutar — varsa doğrudan
            // canlı site açılır; henüz domain bağlanmadıysa gerçek vitrin önizlemesi.
            const storefrontUrl = store.custom_domain
              ? `https://${store.custom_domain}`
              : `/store/preview/${store.id}`;
            return (
              <div key={store.id} className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
                style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
                <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  {store.store_name?.[0]?.toUpperCase() ?? "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{store.store_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                      {STATUS_LABEL[store.status ?? "inactive"] ?? store.status}
                    </span>
                    {store.custom_domain && (
                      <span className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
                        {store.custom_domain}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(store)}
                  title="Mağazayı Kalıcı Olarak Sil"
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105"
                  style={{
                    ...tr,
                    background: "#DC262610",
                    border: "1px solid #DC26262E",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 16px rgba(220,38,38,0.35)"; e.currentTarget.style.background = "#DC262620"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#DC262610"; }}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                </button>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}
                  title={store.custom_domain ? `Canlı vitrini aç: ${store.custom_domain}` : "Vitrin önizlemesini aç"}
                >
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
                </a>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        {visibleStores.length} mağaza · Yeni mağaza oluşturmak için Ürün Kataloğu sayfasını kullanın.
      </p>

      {/* Güvenli silme onay modalı */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteStoreModal
            key={deleteTarget.id}
            store={deleteTarget}
            c={c}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => handleDeleted(deleteTarget)}
          />
        )}
      </AnimatePresence>

      {/* Başarı toast'ı */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 inset-x-0 z-[70] flex justify-center pointer-events-none px-4"
          >
            <div
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium"
              style={{
                background: c.cardBg,
                border: "1px solid #05966940",
                boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
                color: c.text,
                fontFamily: PANEL_BODY_FONT,
              }}
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#059669" }} />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── ShippingSection ──────────────────────────────────────────────────────────────

function ShippingSection({ c }: { c: PanelPalette }) {
  // Context'ten aktif mağaza — user_id izolasyonu API'da
  const { activeStore, stores, refreshStores } = useActiveStore();
  const storeId = activeStore?.id ?? stores[0]?.id ?? "";
  const [fee,       setFee]       = useState<string>("");
  const [threshold, setThreshold] = useState<string>("");
  const [saving,    setSaving]    = useState(false);
  const [fb,        setFb]        = useState<FeedbackState>(null);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  // Aktif mağaza değişince kargo bilgilerini senkronize et
  useEffect(() => {
    const store = activeStore ?? stores[0];
    if (store) {
      setFee(String(store.shipping_fee ?? 0));
      setThreshold(store.free_shipping_threshold != null ? String(store.free_shipping_threshold) : "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore?.id, stores]);

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    setFb(null);
    const res = await fetch("/api/stores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: storeId,
        shipping_fee:            parseFloat(fee) || 0,
        free_shipping_threshold: threshold.trim() !== "" ? parseFloat(threshold) : null,
      }),
    });
    if (!res.ok) setFb({ type: "error", message: "Kargo ayarları kaydedilemedi." });
    else {
      setFb({ type: "success", message: "Kargo ayarları kaydedildi." });
      await refreshStores(true);
    }
    setSaving(false);
  };

  return (
    <section className="rounded-2xl p-6 space-y-5" style={sectionCard(c)}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#0EA5E915", border: "1px solid #0EA5E925" }}>
          <Truck className="w-4 h-4" style={{ color: "#0EA5E9" }} />
        </div>
        <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Kargo Ayarları</h2>
      </div>

      {stores.length === 0 ? (
        <p className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Henüz mağaza yok.</p>
      ) : (
        <>
          {/* Aktif mağaza chip */}
          {activeStore && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: c.cardBgSoft ?? c.hover, border: `1px solid ${c.borderSoft}` }}>
              <span className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Mağaza:</span>
              <span className="text-xs font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>{activeStore.store_name}</span>
              <span className="text-[10px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>(Soldaki seçiciden değiştirebilirsiniz)</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              Sabit Kargo Ücreti (₺) — 0 girerseniz kargo ücretsizdir
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none max-w-sm"
              style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
              Ücretsiz Kargo Eşiği (₺) — boş bırakırsanız eşik uygulanmaz
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Örn: 500"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none max-w-sm"
              style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
            />
            <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Bu tutarın üzerindeki siparişlerde kargo otomatik olarak ücretsiz olur.
            </p>
          </div>

          <FeedbackBanner fb={fb} />

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: c.ctaBg, color: c.ctaText, fontFamily: PANEL_BODY_FONT }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Kaydet
          </button>
        </>
      )}
    </section>
  );
}

// ─── DangerSection ────────────────────────────────────────────────────────────────

// ─── DomainSection ────────────────────────────────────────────────────────────────

interface DnsRecord { type: string; name: string; value: string; note?: string; }
interface DomainResult {
  success: boolean;
  domain: string;
  verified: boolean;
  dnsInstructions: DnsRecord | null;
  verificationRecords: Array<{ type: string; domain: string; value: string }>;
  message: string;
}

function CopyButton({ value, c }: { value: string; c: PanelPalette }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Kopyala"
      className="ml-2 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
      style={{ background: copied ? "#05966920" : c.hover, border: `1px solid ${copied ? "#05966940" : c.border}` }}
    >
      {copied
        ? <Check className="w-3.5 h-3.5" style={{ color: "#059669" }} />
        : <Copy className="w-3.5 h-3.5" style={{ color: c.textSubtle }} />}
    </button>
  );
}

function DnsRow({ record, c }: { record: DnsRecord; c: PanelPalette }) {
  const tr: React.CSSProperties = { transition: "background-color 0.3s, border-color 0.3s" };
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.border}`, ...tr }}>
      <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-wider px-3 py-2"
        style={{ background: c.hover, color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        <span>Tür</span><span>Ad (Name)</span><span>Değer (Value)</span>
      </div>
      <div className="grid grid-cols-3 items-center gap-2 px-3 py-3" style={{ background: c.cardBgSoft }}>
        <span className="text-xs font-black px-2 py-0.5 rounded-md w-fit"
          style={{ background: record.type === "A" ? "#3B82F615" : record.type === "CNAME" ? "#7C3AED15" : "#F59E0B15",
                   color:      record.type === "A" ? "#3B82F6"   : record.type === "CNAME" ? "#7C3AED"   : "#F59E0B",
                   fontFamily: PANEL_BODY_FONT }}>
          {record.type}
        </span>
        <code className="text-xs font-mono" style={{ color: c.text }}>{record.name}</code>
        <div className="flex items-center min-w-0">
          <code className="text-xs font-mono truncate" style={{ color: c.text }}>{record.value}</code>
          <CopyButton value={record.value} c={c} />
        </div>
      </div>
      {record.note && (
        <p className="text-[10px] px-3 pb-2" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>{record.note}</p>
      )}
    </div>
  );
}

function DomainSection({ c }: { c: PanelPalette }) {
  // Context'ten user'ın mağazaları — API izolasyonu zaten sağlandı
  const { stores, activeStore } = useActiveStore();
  const [storeId,   setStoreId]  = useState("");
  const [domain,    setDomain]   = useState("");
  const [loading,   setLoading]  = useState(false);
  const [checking,  setChecking] = useState(false);
  const [result,    setResult]   = useState<DomainResult | null>(null);
  const [fb,        setFb]       = useState<FeedbackState>(null);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  // Aktif mağaza değişince domain alanını senkronize et
  useEffect(() => {
    if (activeStore) {
      setStoreId(activeStore.id);
      setDomain(activeStore.custom_domain ?? "");
    } else if (stores.length > 0) {
      setStoreId(stores[0].id);
      setDomain(stores[0].custom_domain ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore?.id, stores]);

  const handleConnect = async () => {
    if (!domain.trim() || !storeId) {
      setFb({ type: "error", message: "Domain adı ve mağaza seçimi zorunludur." });
      return;
    }
    setLoading(true); setFb(null); setResult(null);
    const res = await fetch("/api/domains/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain.trim(), storeId }),
    });
    const data = await res.json() as DomainResult & { error?: string };
    setLoading(false);
    if (!res.ok || data.error) {
      setFb({ type: "error", message: data.error ?? "Bir hata oluştu." });
    } else {
      setResult(data);
      setFb({ type: "success", message: data.message });
    }
  };

  const handleCheckDns = async () => {
    if (!result?.domain) return;
    setChecking(true);
    await new Promise((r) => setTimeout(r, 1200));
    setChecking(false);
    setFb({ type: "error", message: "DNS henüz yayılmadı. 24–48 saat içinde tekrar kontrol edin." });
  };

  // Build DNS record list from result
  const dnsRecords: DnsRecord[] = result ? [
    { type: "A",     name: "@",   value: "76.76.21.21",         note: "Ana domain (apex) için Vercel A kaydı" },
    { type: "CNAME", name: "www", value: "cname.vercel-dns.com", note: "www subdomain için Vercel CNAME kaydı" },
    ...(result.verificationRecords?.map((v) => ({
      type: "TXT",
      name: v.domain.replace(`.${result.domain}`, "") || "@",
      value: v.value,
      note: "Vercel domain doğrulama kaydı — GoDaddy'de TXT olarak ekleyin",
    })) ?? []),
  ] : [];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: c.inputBg, border: `1px solid ${c.border}`, color: c.text,
    fontFamily: PANEL_BODY_FONT, outline: "none", ...tr,
  };

  return (
    <section className="rounded-2xl p-6 space-y-5" style={sectionCard(c)}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "#7C3AED15", border: "1px solid #7C3AED25" }}>
          <Globe className="w-4 h-4" style={{ color: "#7C3AED" }} />
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>Özel Domain Bağla</h2>
          <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>Kendi alan adınızı mağazanıza yönlendirin</p>
        </div>
      </div>

      <FeedbackBanner fb={fb} />

      {/* Store select */}
      {stores.length > 1 && (
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
            Mağaza
          </label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} style={{ ...inputStyle }}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.store_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Domain input + connect */}
      <div>
        <label className="text-xs font-semibold mb-1.5 block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          Domain Adı
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="vivinth.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", color: "white", fontFamily: PANEL_BODY_FONT, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? "Bağlanıyor…" : "Bağla"}
          </button>
        </div>
      </div>

      {/* DNS Setup Card */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Status banner */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: result.verified ? "#05966912" : "#F59E0B12", border: `1px solid ${result.verified ? "#05966930" : "#F59E0B30"}` }}>
            <div className="flex items-center gap-2">
              {result.verified
                ? <CheckCircle className="w-4 h-4" style={{ color: "#059669" }} />
                : <AlertCircle className="w-4 h-4" style={{ color: "#F59E0B" }} />}
              <span className="text-sm font-semibold" style={{ color: result.verified ? "#059669" : "#B45309", fontFamily: PANEL_BODY_FONT }}>
                {result.verified ? `${result.domain} Vercel'e eklendi ✓` : `DNS yapılandırması bekleniyor`}
              </span>
            </div>
            <button
              onClick={handleCheckDns}
              disabled={checking}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: PANEL_BODY_FONT }}
            >
              {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              DNS Kontrol
            </button>
          </div>

          {/* Step guide */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: c.cardBgSoft, border: `1px solid ${c.borderSoft}` }}>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              GoDaddy DNS Kurulum Adımları
            </p>
            {[
              "GoDaddy → My Products → Domains → vivinth.com → DNS",
              "Aşağıdaki kayıtları ekleyin (varsa eski A/CNAME kayıtlarını silin)",
              "Kaydedin — DNS yayılması 24–48 saat sürebilir",
              "Yayıldıktan sonra yukarıdaki DNS Kontrol butonuna basın",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: "#7C3AED20", color: "#7C3AED" }}>
                  {i + 1}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>{step}</p>
              </div>
            ))}
          </div>

          {/* DNS Records */}
          <div className="space-y-2.5">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
              Eklenecek DNS Kayıtları
            </p>
            {dnsRecords.map((rec, i) => (
              <DnsRow key={i} record={rec} c={c} />
            ))}
          </div>

          {/* Current IP note */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: "#EF444412", border: "1px solid #EF444430" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#B91C1C", fontFamily: PANEL_BODY_FONT }}>
              <strong>Mevcut durum:</strong> vivinth.com şu an <code className="font-mono">23.227.38.32</code> (Shopify) adresine yönleniyor. Yukarıdaki A kayıtlarını Vercel IP&apos;lerine güncelleyinceye kadar site Optiefy&apos;dan açılmaz.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2">
            <a href="https://dcc.godaddy.com/manage/dns" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "#7C3AED15", color: "#7C3AED", border: "1px solid #7C3AED30", fontFamily: PANEL_BODY_FONT, textDecoration: "none" }}>
              <ExternalLink className="w-3 h-3" />
              GoDaddy DNS Paneli
            </a>
            <a href={`https://${result.domain}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: PANEL_BODY_FONT, textDecoration: "none" }}>
              <Globe className="w-3 h-3" />
              {result.domain}&apos;u Aç
            </a>
          </div>
        </motion.div>
      )}

      {/* Help hint */}
      {!result && (
        <div className="flex items-center gap-2 text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          Domain bağladıktan sonra size özel DNS kayıtları burada görünecek.
          <a href="https://dcc.godaddy.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-0.5 hover:opacity-70"
            style={{ color: "#7C3AED", textDecoration: "none" }}>
            GoDaddy&apos;ye git <ChevronRightIcon className="w-3 h-3" />
          </a>
        </div>
      )}
    </section>
  );
}

// ─── DangerSection ────────────────────────────────────────────────────────────────

function DangerSection({ c }: { c: PanelPalette }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <section className="rounded-2xl p-6 space-y-4" style={{ ...sectionCard(c), borderColor: "#DC262630" }}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#DC262615", border: "1px solid #DC262625" }}>
          <Trash2 className="w-4 h-4" style={{ color: "#DC2626" }} />
        </div>
        <h2 className="text-base font-semibold" style={{ color: "#DC2626", fontFamily: PANEL_BODY_FONT }}>Tehlikeli Bölge</h2>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
        Hesabınızı silmek tüm mağazalarınızı, ürünlerinizi ve siparişlerinizi kalıcı olarak kaldırır. Bu işlem geri alınamaz.
      </p>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border"
          style={{ color: "#DC2626", borderColor: "#DC262640", background: "#DC262608", fontFamily: PANEL_BODY_FONT }}
        >
          <Trash2 className="w-4 h-4" />
          Hesabı Sil
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "#DC2626", color: "#FFFFFF", fontFamily: PANEL_BODY_FONT }}
          >
            <Trash2 className="w-4 h-4" />
            Evet, hesabı sil
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: c.hover, color: c.textMuted, border: `1px solid ${c.border}`, fontFamily: PANEL_BODY_FONT }}
          >
            İptal
          </button>
        </div>
      )}
    </section>
  );
}

// ─── AyarlarPage ─────────────────────────────────────────────────────────────────

export default function AyarlarPage() {
  const { c } = usePanelTheme();
  const [user, setUser] = useState<SupaUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: PANEL_DISPLAY_FONT, fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.015em", color: c.text }}>
          Ayarlar
        </h1>
        <p className="text-sm mt-1.5" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>
          Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin.
        </p>
      </motion.div>

      {user ? (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <ProfileSection user={user} c={c} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <PasswordSection c={c} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
            <StoresSection c={c} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
            <ShippingSection c={c} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
            <DomainSection c={c} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
            <DangerSection c={c} />
          </motion.div>
        </>
      ) : (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: c.textSubtle }} />
        </div>
      )}
    </div>
  );
}
