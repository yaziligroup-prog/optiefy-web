"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe, Check, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import MarketingNavbar from "@/components/MarketingNavbar";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/utils/supabase/client";
import { L, D, BODY_FONT, DISPLAY_FONT } from "@/lib/theme";

type TldOption = { tld: string; raw: number };

const TLD_CATALOG: TldOption[] = [
  { tld: ".com",    raw: 10 },
  { tld: ".net",    raw: 12 },
  { tld: ".org",    raw: 11 },
  { tld: ".io",     raw: 35 },
  { tld: ".co",     raw: 25 },
  { tld: ".xyz",    raw: 2  },
  { tld: ".shop",   raw: 4  },
  { tld: ".store",  raw: 5  },
  { tld: ".app",    raw: 14 },
  { tld: ".biz",    raw: 9  },
  { tld: ".info",   raw: 5  },
  { tld: ".online", raw: 3  },
];

type DomainResult = { tld: string; price: number; available: boolean; status: string };

type CheckResponse = { available?: boolean; status?: string };

async function checkOneDomain(domain: string): Promise<CheckResponse> {
  const res = await fetch("/api/domain/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  return (await res.json()) as CheckResponse;
}

export default function DomainSorgulamaPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [isDark, setIsDark] = useState(false);
  const [query, setQuery]   = useState("");
  const [results, setResults]       = useState<DomainResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [chosenDomain, setChosenDomain] = useState("");
  const [searchedName, setSearchedName] = useState("");

  useEffect(() => {
    try { if (localStorage.getItem("sv-dark") === "true") setIsDark(true); } catch { /* SSR */ }
  }, []);

  const c = isDark ? D : L;
  const bodyFont = BODY_FONT;
  const displayFont = DISPLAY_FONT;

  const handleSearch = async () => {
    const cleaned  = query.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    const baseName = cleaned.split(".")[0].replace(/[^a-z0-9-]/g, "");
    if (!baseName) { setError("Lütfen bir mağaza veya marka adı girin."); return; }

    setIsSearching(true); setError(null); setResults([]); setChosenDomain(""); setSearchedName(baseName);

    try {
      const outcomes = await Promise.allSettled(
        TLD_CATALOG.map(async ({ tld, raw }) => {
          const data = await checkOneDomain(`${baseName}${tld}`);
          return {
            tld,
            price: Math.round(raw * 1.15 * 100) / 100,
            available: !!data.available,
            status: data.status ?? "error",
          } satisfies DomainResult;
        })
      );
      setResults(
        outcomes.map((o, i) =>
          o.status === "fulfilled"
            ? o.value
            : { tld: TLD_CATALOG[i].tld, price: Math.round(TLD_CATALOG[i].raw * 1.15 * 100) / 100, available: false, status: "error" }
        )
      );
    } catch {
      setError("Sorgu sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseThisDomain = async (fullDomain: string) => {
    setChosenDomain(fullDomain);
    try {
      sessionStorage.setItem("optiefy_store_data", JSON.stringify({
        photoBase64: null, photoPreviewUrl: null, description: "", price: "", currency: "TRY", domain: fullDomain,
      }));
    } catch { /* */ }
    const { data: { session } } = await supabase.auth.getSession();
    router.push(session?.user ? "/build" : "/login?from=builder");
  };

  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.04)" : "#F5F5F5",
    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E5E5"}`,
    color: c.text,
    borderRadius: "12px",
    padding: "13px 16px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: bodyFont,
  };

  return (
    <div style={{ background: c.bg, minHeight: "100vh", transition: "background-color 0.4s ease" }}>
      <MarketingNavbar />

      <section className="pt-16 pb-10 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold"
            style={{ background: isDark ? "rgba(168,85,247,0.12)" : c.accentSoft, color: c.accent, fontFamily: bodyFont }}
          >
            <Globe className="w-3.5 h-3.5" /> Ücretsiz Araç
          </div>
          <h1 style={{ fontFamily: displayFont, fontSize: "clamp(2rem, 4.5vw, 2.75rem)", fontWeight: 400, letterSpacing: "-0.02em", color: c.text, lineHeight: 1.15 }}>
            Domain Sorgulama & Kayıt
          </h1>
          <p className="mt-4 text-base" style={{ color: c.textMuted, fontFamily: bodyFont }}>
            Mağazanız için uygun alan adını gerçek zamanlı DNS sorgusuyla saniyeler içinde bulun.
          </p>
        </div>
      </section>

      <section className="px-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="mağazanızın-adı"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !isSearching) void handleSearch(); }}
              style={inputStyle}
            />
            <motion.button
              type="button"
              whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
              disabled={isSearching}
              onClick={() => void handleSearch()}
              className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl text-sm font-semibold flex-shrink-0 whitespace-nowrap"
              style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont, opacity: isSearching ? 0.6 : 1 }}
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity={0.75} />
                  </svg>
                  Sorgulanıyor
                </>
              ) : (
                <><Search className="w-3.5 h-3.5" /> Sorgula</>
              )}
            </motion.button>
          </div>
          {error && <p className="mt-2.5 text-xs font-medium" style={{ color: "#EF4444", fontFamily: bodyFont }}>{error}</p>}
          <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" /> Gerçek zamanlı DNS sorgusu ile kontrol edilir — sahte veri kullanılmaz.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ border: `1.5px solid ${c.border}`, background: c.bgCard }}
              >
                {results.map(({ tld, price, available }, i) => {
                  const fullDomain = `${searchedName}${tld}`;
                  const isChosen = chosenDomain === fullDomain;
                  return (
                    <div
                      key={tld}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                      style={{
                        borderTop: i > 0 ? `1px solid ${c.border}` : "none",
                        background: isChosen ? (isDark ? "rgba(34,197,94,0.08)" : "#F0FDF4") : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: available ? "#22C55E" : "#F87171" }} />
                        <span className="text-sm font-semibold truncate" style={{ color: c.text, fontFamily: bodyFont }}>
                          {searchedName}<span style={{ color: available ? c.text : c.textSubtle, fontWeight: 400 }}>{tld}</span>
                        </span>
                      </div>
                      {available ? (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#16A34A", fontFamily: bodyFont }}>
                            ${price.toFixed(2)}<span style={{ color: c.textSubtle, fontWeight: 400 }}>/yıl</span>
                          </span>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => void handleUseThisDomain(fullDomain)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white whitespace-nowrap"
                            style={{ background: isChosen ? "#16A34A" : "linear-gradient(135deg,#7C3AED,#9333EA)", fontFamily: bodyFont }}
                          >
                            {isChosen ? "✓ Seçildi" : "Bu Alan Adını Seç"}
                          </motion.button>
                        </div>
                      ) : (
                        <span className="text-xs flex-shrink-0 font-medium" style={{ color: "#F87171", fontFamily: bodyFont }}>Alınamaz</span>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {chosenDomain && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
                style={{ background: isDark ? "rgba(168,85,247,0.08)" : c.accentSoft, border: `1px solid ${isDark ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.15)"}` }}
              >
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" style={{ color: "#16A34A" }} />
                  <p className="text-sm font-medium" style={{ color: c.text, fontFamily: bodyFont }}>
                    <strong>{chosenDomain}</strong> seçildi — mağazanızı kurarken bu alan adını bağlayacağız.
                  </p>
                </div>
                <motion.button
                  whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                  onClick={() => void handleUseThisDomain(chosenDomain)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap flex-shrink-0"
                  style={{ background: c.ctaBg, color: c.ctaText, fontFamily: bodyFont }}
                >
                  Mağazanı Kur <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {results.length === 0 && !isSearching && (
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              {[
                { icon: Zap, title: "Anlık Sonuç", desc: "12 farklı uzantıda saniyeler içinde müsaitlik kontrolü." },
                { icon: ShieldCheck, title: "Gerçek DNS Verisi", desc: "Simülasyon değil, canlı DNS sorgusu ile doğrulanmış sonuç." },
                { icon: Globe, title: "Tek Adımda Bağlantı", desc: "Seçtiğiniz alan adı mağaza kurulumunda otomatik bağlanır." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl p-5" style={{ background: c.bgCard, border: `1px solid ${c.border}` }}>
                  <Icon className="w-5 h-5 mb-3" style={{ color: c.accent }} />
                  <p className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: bodyFont }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: c.textMuted, fontFamily: bodyFont }}>{desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
