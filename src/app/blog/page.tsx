"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import MarketingNavbar from "@/components/MarketingNavbar";
import SiteFooter from "@/components/SiteFooter";
import { BLOG_POSTS } from "@/lib/blogPosts";
import { L, D, BODY_FONT, DISPLAY_FONT } from "@/lib/theme";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPage() {
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

      <section className="pt-20 pb-14 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-4" style={{ color: c.sectionLabel, fontFamily: bodyFont }}>
            Optiefy Blog
          </p>
          <h1 style={{ fontFamily: displayFont, fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 400, letterSpacing: "-0.02em", color: c.text, lineHeight: 1.15 }}>
            E-ticaret, domain ve ödeme üzerine yazılar
          </h1>
          <p className="mt-4 text-base" style={{ color: c.textMuted, fontFamily: bodyFont }}>
            Mağazanızı büyütmenize yardımcı olacak rehberler ve sektör analizleri.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <Link href={`/blog/${post.slug}`} className="block h-full rounded-2xl overflow-hidden group"
                style={{ background: c.bgCard, border: `1.5px solid ${c.border}`, boxShadow: c.cardShadow }}>
                <div className="h-32 relative" style={{ background: post.gradient }}>
                  <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 60%)" }} />
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full text-white"
                    style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }}>
                    {post.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col">
                  <p className="text-xs mb-2" style={{ color: c.textSubtle, fontFamily: bodyFont }}>
                    {formatDate(post.date)} · {post.readTime}
                  </p>
                  <h2 className="text-base font-semibold leading-snug mb-2" style={{ color: c.text, fontFamily: bodyFont }}>
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: c.textMuted, fontFamily: bodyFont }}>
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto group-hover:opacity-70 transition-opacity" style={{ color: c.accent, fontFamily: bodyFont }}>
                    Devamını Oku <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
