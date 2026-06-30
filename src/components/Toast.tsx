"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, show, onHide, duration = 3500 }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [show, onHide, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl border max-w-sm w-[90vw]"
          style={{
            background: "rgba(15,23,42,0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderColor: "rgba(168,85,247,0.25)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-white text-sm font-medium flex-1 leading-snug">{message}</p>
          <button
            onClick={onHide}
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
