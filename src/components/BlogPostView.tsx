"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarketingNavbar from "@/components/MarketingNavbar";
import SiteFooter from "@/components/SiteFooter";
import type { BlogPost } from "@/lib/blogPosts";
import { L, D, BODY_FONT, DISPLAY_FONT } from "@/lib/theme";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPostView({ post }: { post: BlogPost }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("sv-dark") === "true") setIsDark(true); } catch { /* SSR */ }
  }, []);

  const c = isDark ? D : L;
  const bodyFont = BODY_FONT;
  const displayFont = DISPLAY_FONT;

  return (
    <div style={{ background: c.bg, minHeight: "100vh", transition: "background-color 0.4s ease" }}>
      <MarketingNavbar />

      <div className="max-w-2xl mx-auto px-6 pt-6">
        <Link href="/blog" className="flex w-fit items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: c.textMuted, fontFamily: bodyFont }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Tüm Yazılar
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-4">
        <div className="h-48 rounded-2xl relative overflow-hidden" style={{ background: post.gradient }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 60%)" }} />
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-6 pb-24">
        <div className="rounded-2xl p-8 mt-6" style={{ background: c.bgCard, border: `1.5px solid ${c.border}`, boxShadow: c.cardShadow }}>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ color: c.accent, background: c.accentSoft, fontFamily: bodyFont }}>
            {post.category}
          </span>

          <h1 className="mt-4 mb-3" style={{ fontFamily: displayFont, fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", fontWeight: 400, letterSpacing: "-0.015em", color: c.text, lineHeight: 1.2 }}>
            {post.title}
          </h1>

          <p className="text-xs mb-8" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
            {formatDate(post.date)} · {post.readTime}
          </p>

          <div className="space-y-4">
            {post.content.map((paragraph, i) => (
              <p key={i} className="text-[15px] leading-relaxed" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
