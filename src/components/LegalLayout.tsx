import Link from "next/link";
import OptiefyIcon from "@/components/OptiefyIcon";

interface Section {
  title: string;
  content: React.ReactNode;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: Section[];
}

export default function LegalLayout({ title, subtitle, updatedAt, sections }: LegalLayoutProps) {
  const bodyFont = "var(--font-body), system-ui, -apple-system, sans-serif";
  const displayFont = "var(--font-display), Georgia, serif";

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: bodyFont }}>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,250,248,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "linear-gradient(135deg,#7C3AED,#6366F1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <OptiefyIcon size={12} color="white" />
            </div>
            <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, color: "#111111", letterSpacing: "-0.01em" }}>Optiefy</span>
          </Link>
          <Link href="/" style={{ fontFamily: bodyFont, fontSize: 13, color: "#9CA3AF", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "linear-gradient(180deg,rgba(124,58,237,0.04) 0%,transparent 100%)", borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <p style={{ fontFamily: bodyFont, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7C3AED", marginBottom: 12 }}>
            Optiefy Hukuki Belgeler
          </p>
          <h1 style={{ fontFamily: displayFont, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.015em", color: "#111111", marginBottom: 12 }}>
            {title}
          </h1>
          <p style={{ fontFamily: bodyFont, fontSize: 14, color: "#6B7280", marginBottom: 8 }}>{subtitle}</p>
          <p style={{ fontFamily: bodyFont, fontSize: 12, color: "#9CA3AF" }}>Son güncelleme: {updatedAt}</p>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>
        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: bodyFont, fontSize: 15, fontWeight: 700, color: "#111111",
              marginBottom: 14, paddingBottom: 10,
              borderBottom: "1px solid rgba(0,0,0,0.07)",
            }}>
              {i + 1}. {section.title}
            </h2>
            <div style={{ fontFamily: bodyFont, fontSize: 14, lineHeight: 1.8, color: "#374151" }}>
              {section.content}
            </div>
          </div>
        ))}

        {/* Company stamp */}
        <div style={{
          marginTop: 56, padding: "24px 28px",
          background: "rgba(124,58,237,0.04)",
          border: "1px solid rgba(124,58,237,0.12)",
          borderRadius: 16,
        }}>
          <p style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Hizmet Sağlayıcı
          </p>
          <p style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: "#111111", marginBottom: 4 }}>
            YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ
          </p>
          <p style={{ fontFamily: bodyFont, fontSize: 13, color: "#6B7280" }}>
            Optiefy Platformu · optiefy.com
          </p>
          <p style={{ fontFamily: bodyFont, fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            E-posta: <a href="mailto:info@optiefy.com" style={{ color: "#7C3AED", textDecoration: "none" }}>info@optiefy.com</a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "24px", background: "#FAFAF8" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: bodyFont, fontSize: 12, color: "#9CA3AF" }}>© 2026 Optiefy · YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
              { label: "Gizlilik ve KVKK", href: "/gizlilik-ve-kvkk" },
              { label: "İptal ve İade", href: "/iptal-ve-iade" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontFamily: bodyFont, fontSize: 12, color: "#9CA3AF", textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
