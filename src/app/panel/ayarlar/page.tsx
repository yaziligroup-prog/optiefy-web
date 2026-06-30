"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User, Lock, Store, CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
  ExternalLink, RefreshCw, Trash2, Shield, Truck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import {
  usePanelTheme, PANEL_BODY_FONT, PANEL_DISPLAY_FONT, type PanelPalette,
} from "../_lib/theme";
import type { Store as StoreType } from "@/types/store";

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

// ─── StoresSection ────────────────────────────────────────────────────────────────

function StoresSection({ c }: { c: PanelPalette }) {
  const [stores,  setStores]  = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  const STATUS_COLOR: Record<string, string> = {
    active: "#059669", inactive: "#6B7280", draft: "#D97706", suspended: "#DC2626",
  };
  const STATUS_LABEL: Record<string, string> = {
    active: "Aktif", inactive: "Pasif", draft: "Taslak", suspended: "Askıya Alındı",
  };

  const fetchStores = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
    if (data) setStores(data as StoreType[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

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
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Store className="w-8 h-8 mb-3" style={{ color: c.textSubtle }} />
          <p className="text-sm" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Henüz mağaza oluşturmadınız.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {stores.map((store) => {
            const statusColor = STATUS_COLOR[store.status ?? "inactive"] ?? "#6B7280";
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
                <a
                  href={`/panel/${store.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ ...tr, background: c.hover, border: `1px solid ${c.border}` }}
                  title="Mağazayı Görüntüle"
                >
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: c.textMuted }} />
                </a>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px]" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
        {stores.length} mağaza · Yeni mağaza oluşturmak için Ürün Kataloğu sayfasını kullanın.
      </p>
    </section>
  );
}

// ─── ShippingSection ──────────────────────────────────────────────────────────────

function ShippingSection({ c }: { c: PanelPalette }) {
  const [stores,    setStores]    = useState<StoreType[]>([]);
  const [storeId,   setStoreId]   = useState<string>("");
  const [fee,       setFee]       = useState<string>("");
  const [threshold, setThreshold] = useState<string>("");
  const [saving,    setSaving]    = useState(false);
  const [fb,        setFb]        = useState<FeedbackState>(null);
  const tr: React.CSSProperties = { transition: "background-color 0.3s, color 0.3s, border-color 0.3s" };

  const fetchStores = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const list = data as StoreType[];
      setStores(list);
      setStoreId(list[0].id);
      setFee(String(list[0].shipping_fee ?? 0));
      setThreshold(list[0].free_shipping_threshold != null ? String(list[0].free_shipping_threshold) : "");
    }
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  useEffect(() => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;
    setFee(String(store.shipping_fee ?? 0));
    setThreshold(store.free_shipping_threshold != null ? String(store.free_shipping_threshold) : "");
  }, [storeId, stores]);

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    setFb(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("stores")
      .update({
        shipping_fee:           parseFloat(fee) || 0,
        free_shipping_threshold: threshold.trim() !== "" ? parseFloat(threshold) : null,
      })
      .eq("id", storeId);
    if (error) setFb({ type: "error", message: error.message });
    else {
      setFb({ type: "success", message: "Kargo ayarları kaydedildi." });
      setStores((prev) =>
        prev.map((s) =>
          s.id === storeId
            ? {
                ...s,
                shipping_fee:           parseFloat(fee) || 0,
                free_shipping_threshold: threshold.trim() !== "" ? parseFloat(threshold) : null,
              }
            : s,
        ),
      );
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
          {stores.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium block" style={{ color: c.textMuted, fontFamily: PANEL_BODY_FONT }}>Mağaza</label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none max-w-sm"
                style={{ ...tr, background: c.inputBg, border: `1px solid ${c.border}`, color: c.text, fontFamily: PANEL_BODY_FONT }}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <ShippingSection c={c} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
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
