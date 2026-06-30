"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, ImagePlus, CheckCircle2 } from "lucide-react";

interface UploadZoneProps {
  onImageSelect: (file: File, preview: string) => void;
  previewUrl: string | null;
}

export default function UploadZone({ onImageSelect, previewUrl }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onImageSelect(file, url);
    },
    [onImageSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <label
      htmlFor="image-upload"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="block cursor-pointer"
    >
      <motion.div
        animate={{
          borderColor: isDragging
            ? "rgba(168, 85, 247, 0.8)"
            : previewUrl
            ? "rgba(34, 197, 94, 0.6)"
            : "rgba(148, 163, 184, 0.3)",
          backgroundColor: isDragging
            ? "rgba(168, 85, 247, 0.05)"
            : previewUrl
            ? "rgba(34, 197, 94, 0.03)"
            : "rgba(15, 23, 42, 0.4)",
          scale: isDragging ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="relative w-full rounded-2xl border-2 border-dashed overflow-hidden"
        style={{ minHeight: "220px" }}
      >
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-56 flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Ürün önizleme"
                className="max-h-52 max-w-full object-contain rounded-xl"
              />
              <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-3 px-4 rounded-b-xl">
                <p className="text-white/90 text-sm font-medium">
                  Fotoğraf seçildi — değiştirmek için tıkla
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-14 px-6"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
                  {isDragging ? (
                    <ImagePlus className="w-8 h-8 text-purple-400" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                {isDragging && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full"
                  />
                )}
              </motion.div>

              <div className="text-center">
                <p className="text-slate-200 font-semibold text-lg">
                  {isDragging ? "Bırakın, yüklüyorum!" : "Ürün fotoğrafını buraya sürükleyin"}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  veya <span className="text-purple-400 font-medium">dosya seçmek için tıklayın</span>
                </p>
                <p className="text-slate-600 text-xs mt-3">
                  JPG, PNG, WEBP — Maksimum 10 MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.12) 0%, transparent 70%)",
            }}
          />
        )}
      </motion.div>

      <input
        id="image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </label>
  );
}
