"use client";

import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  domain: string;
}

export default function StoreNotFound({ domain }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Optiefy</span>
      </div>

      {/* Main content */}
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-white/5 mb-0 leading-none select-none">
          404
        </div>
        <div className="-mt-4 mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">
            Bu vitrin henüz hazır değil
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            <span className="text-violet-400 font-medium">{domain}</span> adresi şu an aktif bir mağazaya bağlı değil ya da mağaza henüz yayınlanmamış.
          </p>
        </div>

        {/* DNS propagation note */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left">
          <p className="text-white/40 text-sm leading-relaxed">
            🕐 Yeni bir domain bağladıysanız DNS yayılımı <strong className="text-white/60">24 saate</strong> kadar sürebilir. Biraz bekleyip tekrar deneyin.
          </p>
        </div>

        {/* CTA */}
        <a
          href="https://optiefy.com"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:gap-3"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" }}
        >
          Kendi vitrinini oluştur
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Footer */}
      <p className="mt-16 text-white/20 text-xs">
        Optiefy ile güçlendirildi
      </p>
    </div>
  );
}
