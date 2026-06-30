"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function RedirectScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#030712" }}
    >
      {/* Radial glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(168,85,247,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Moving grid lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "60px 60px"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="relative"
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
          </div>
          {/* Pulse rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-3xl border-2 border-green-500/30"
              animate={{ scale: 1 + i * 0.3, opacity: [0.5, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>

        {/* Text block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-semibold tracking-wider uppercase">
            <CheckCircle2 className="w-4 h-4" />
            Ödeme Onaylandı
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Yönetim Paneline
            <br />
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #a855f7, #6366f1, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Yönlendiriliyorsunuz
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Mağazanız birkaç saniye içinde yayına alınıyor...
          </p>
        </motion.div>

        {/* Animated progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-64"
        >
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #a855f7, #6366f1, #3b82f6)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Arrow indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 text-slate-500 text-sm"
        >
          <span>panel.optiefy.com</span>
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
