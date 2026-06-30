"use client";

import { useEffect } from "react";
import { XCircle } from "lucide-react";

// PayTR başarısız ödeme sonrası bu sayfaya yönlendirir.
export default function PayTRFailPage() {
  useEffect(() => {
    try {
      window.parent.postMessage({ paytr: "fail" }, "*");
    } catch {
      // iFrame dışında açılmışsa sessizce geç
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Ödeme Başarısız</h1>
      <p className="text-sm text-gray-500 max-w-xs">
        Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya farklı bir kart kullanın.
      </p>
      <button
        onClick={() => {
          try { window.parent.postMessage({ paytr: "retry" }, "*"); } catch { /* ignore */ }
        }}
        className="mt-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
