"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import OptiefyIcon from "@/components/OptiefyIcon";
import { L, D, BODY_FONT } from "@/lib/theme";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Ürün",
    links: [
      { label: "Özellikler", href: "/#ozellikler" },
      { label: "Fiyatlandırma", href: "/#fiyatlandirma" },
      { label: "Araçlar", href: "/araclar" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
      { label: "Gizlilik ve KVKK", href: "/gizlilik-ve-kvkk" },
      { label: "İptal ve İade", href: "/iptal-ve-iade" },
    ],
  },
];

export default function SiteFooter() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("sv-dark") === "true") setIsDark(true); } catch { /* SSR */ }
  }, []);
  const c = isDark ? D : L;
  const bodyFont = BODY_FONT;

  return (
    <footer style={{ background: c.bgSoft, borderTop: `1px solid ${c.border}` }}>
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)" }}>
              <OptiefyIcon size={13} color="white" />
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: c.text, fontFamily: bodyFont }}>Optiefy</span>
          </Link>
          <p className="text-xs leading-relaxed" style={{ color: c.textMuted, fontFamily: bodyFont }}>
            Türkiye&apos;nin amatör ve Instagram satıcıları için yapay zeka destekli e-ticaret vitrin platformu.
          </p>
        </div>
        {COLUMNS.map(({ title, links }) => (
          <div key={title}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: c.textSubtle, fontFamily: bodyFont }}>{title}</p>
            <div className="flex flex-col gap-2.5">
              {links.map((l) => (
                <Link key={l.label} href={l.href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <p className="text-xs" style={{ color: c.textSubtle, fontFamily: bodyFont }}>© 2026 Optiefy · YAZILI GROUP DIŞ TİCARET LİMİTED ŞİRKETİ</p>
      </div>
    </footer>
  );
}
