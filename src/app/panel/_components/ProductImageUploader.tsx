"use client";

/**
 * Shopify tarzı çoklu ürün görseli yöneticisi.
 *
 * - Noktalı çerçeveli drag & drop alanı (tıkla-seç de çalışır)
 * - Küçük kare thumbnail'ler; ilk sıradaki = "Ana Görsel" (cover)
 * - Hover'da Sil / Değiştir; sürükleyerek yeniden sıralama
 * - Supabase Storage'a /api/products/upload üzerinden yükler
 */

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Trash2, RefreshCw, Loader2, Plus, Star } from "lucide-react";
import { PANEL_BODY_FONT, type PanelPalette } from "../_lib/theme";

const MAX_IMAGES = 8;
const MAX_SIZE = 8 * 1024 * 1024;

type UploadingItem = { id: string; previewUrl: string };

interface Props {
  images: string[];
  /** Fonksiyonel güncelleme — eşzamanlı upload'larda stale state'i önler */
  onImagesChange: (updater: (prev: string[]) => string[]) => void;
  storeId: string | null;
  c: PanelPalette;
  isDark: boolean;
  onError: (msg: string) => void;
}

export default function ProductImageUploader({
  images, onImagesChange, storeId, c, isDark, onError,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const uploadOne = useCallback(async (file: File): Promise<string | null> => {
    if (!storeId) return null;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("storeId", storeId);
    try {
      const res = await fetch("/api/products/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        onError(json?.error ?? "Görsel yüklenemedi.");
        return null;
      }
      return (json?.url as string) ?? null;
    } catch {
      onError("Görsel yüklenirken bağlantı hatası oluştu.");
      return null;
    }
  }, [storeId, onError]);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    if (!storeId) { onError("Görsel yüklemek için önce bir mağaza seçin."); return; }

    const files = Array.from(fileList).filter((f) => {
      if (!f.type.startsWith("image/")) { onError(`"${f.name}" bir görsel dosyası değil.`); return false; }
      if (f.size > MAX_SIZE) { onError(`"${f.name}" 8MB sınırını aşıyor.`); return false; }
      return true;
    });
    if (!files.length) return;

    const replaceIndex = replaceIndexRef.current;
    replaceIndexRef.current = null;

    // Değiştirme modunda tek dosya işlenir
    if (replaceIndex !== null) {
      const item: UploadingItem = { id: crypto.randomUUID(), previewUrl: URL.createObjectURL(files[0]) };
      setUploading((prev) => [...prev, item]);
      const url = await uploadOne(files[0]);
      setUploading((prev) => prev.filter((u) => u.id !== item.id));
      URL.revokeObjectURL(item.previewUrl);
      if (url) {
        onImagesChange((prev) => prev.map((img, i) => (i === replaceIndex ? url : img)));
      }
      return;
    }

    const room = MAX_IMAGES - images.length - uploading.length;
    if (room <= 0) { onError(`En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz.`); return; }
    const batch = files.slice(0, room);

    const items = batch.map((f) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(f),
      file: f,
    }));
    setUploading((prev) => [...prev, ...items.map(({ id, previewUrl }) => ({ id, previewUrl }))]);

    await Promise.all(items.map(async (it) => {
      const url = await uploadOne(it.file);
      setUploading((prev) => prev.filter((u) => u.id !== it.id));
      URL.revokeObjectURL(it.previewUrl);
      if (url) onImagesChange((prev) => [...prev, url]);
    }));
  }, [storeId, images.length, uploading.length, uploadOne, onImagesChange, onError]);

  const handleDelete = useCallback((index: number) => {
    const url = images[index];
    onImagesChange((prev) => prev.filter((_, i) => i !== index));
    // Storage temizliği — arka planda, hata görmezden gelinir
    if (storeId && url?.includes("/store-images/")) {
      fetch("/api/products/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, storeId }),
      }).catch(() => {});
    }
  }, [images, storeId, onImagesChange]);

  const handleReorder = useCallback((from: number, to: number) => {
    if (from === to) return;
    onImagesChange((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, [onImagesChange]);

  const openPicker = (replaceIndex: number | null = null) => {
    replaceIndexRef.current = replaceIndex;
    if (fileRef.current) {
      fileRef.current.multiple = replaceIndex === null;
      fileRef.current.click();
    }
  };

  const hasImages = images.length > 0 || uploading.length > 0;

  return (
    <div>
      <input
        ref={fileRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Boş durum — büyük drop zone */}
      {!hasImages && (
        <div
          onClick={() => openPicker()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
          }}
          className="rounded-2xl flex flex-col items-center justify-center py-10 px-4 text-center cursor-pointer transition-colors"
          style={{
            border: `2px dashed ${dragOver ? "#7C3AED" : c.border}`,
            background: dragOver
              ? (isDark ? "rgba(124,58,237,0.08)" : "#FAF5FF")
              : (isDark ? "rgba(255,255,255,0.02)" : "#FAFAF9"),
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: c.text, fontFamily: PANEL_BODY_FONT }}>
            Görselleri sürükleyip bırakın
          </p>
          <p className="text-xs" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            veya <span style={{ color: "#7C3AED", fontWeight: 600 }}>bilgisayardan seçin</span> · JPG, PNG, WebP · max 8MB
          </p>
        </div>
      )}

      {/* Thumbnail grid */}
      {hasImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            // Dosya bırakıldıysa yükle (thumbnail reorder drop'ları dataTransfer.files boş gelir)
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
          }}
          className="rounded-2xl p-3 transition-colors"
          style={{
            border: `2px dashed ${dragOver ? "#7C3AED" : c.border}`,
            background: dragOver ? (isDark ? "rgba(124,58,237,0.08)" : "#FAF5FF") : "transparent",
          }}
        >
          <div className="flex flex-wrap gap-2.5">
            {images.map((url, i) => (
              <Thumb
                key={url}
                url={url} index={i} c={c} isDark={isDark}
                isCover={i === 0}
                onDelete={() => handleDelete(i)}
                onReplace={() => openPicker(i)}
                onDragStartThumb={() => { dragIndexRef.current = i; }}
                onDropThumb={() => {
                  if (dragIndexRef.current !== null) handleReorder(dragIndexRef.current, i);
                  dragIndexRef.current = null;
                }}
              />
            ))}

            {/* Yüklenmekte olanlar */}
            {uploading.map((u) => (
              <div key={u.id} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: `1px solid ${c.border}`, background: isDark ? "#111" : "#F4F4F2" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.previewUrl} alt="" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              </div>
            ))}

            {/* Ekle karesi */}
            {images.length + uploading.length < MAX_IMAGES && (
              <button type="button" onClick={() => openPicker()}
                className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors"
                style={{ border: `2px dashed ${c.border}`, color: c.textSubtle }}>
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-semibold" style={{ fontFamily: PANEL_BODY_FONT }}>Ekle</span>
              </button>
            )}
          </div>

          <p className="text-[11px] mt-2.5" style={{ color: c.textSubtle, fontFamily: PANEL_BODY_FONT }}>
            İlk görsel <span style={{ fontWeight: 700 }}>Ana Görsel</span> olarak vitrinde kullanılır — sürükleyerek sıralayın.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tek thumbnail ────────────────────────────────────────────────────────────

function Thumb({
  url, index, isCover, c, isDark, onDelete, onReplace, onDragStartThumb, onDropThumb,
}: {
  url: string; index: number; isCover: boolean; c: PanelPalette; isDark: boolean;
  onDelete: () => void; onReplace: () => void;
  onDragStartThumb: () => void; onDropThumb: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isRemote = url.startsWith("http");

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(index));
        onDragStartThumb();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDropThumb(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-grab active:cursor-grabbing"
      style={{
        border: isCover ? "2px solid #7C3AED" : `1px solid ${c.border}`,
        background: isDark ? "#111" : "#F4F4F2",
      }}
    >
      {isRemote ? (
        <Image src={url} alt="" width={160} height={160}
          className="w-full h-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      )}

      {/* Ana görsel rozeti */}
      {isCover && (
        <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)", fontFamily: PANEL_BODY_FONT }}>
          <Star className="w-2.5 h-2.5 fill-white" /> Ana
        </span>
      )}

      {/* Hover aksiyonları */}
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center gap-1.5"
            style={{ background: "rgba(0,0,0,0.5)" }}>
            <button type="button" title="Değiştir" onClick={onReplace}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/90 hover:bg-white">
              <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
            </button>
            <button type="button" title="Sil" onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/90 hover:bg-white">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
