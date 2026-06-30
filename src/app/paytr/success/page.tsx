"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

// PayTR bu sayfaya ödeme sonrasında yönlendirir (iFrame içinde).
// postMessage ile üst sayfaya (CheckoutModal) başarı sinyali gönderilir.
export default function PayTRSuccessPage() {
  useEffect(() => {
    try {
      window.parent.postMessage({ paytr: "success" }, "*");
    } catch {
      // iFrame dışında açılmışsa sessizce geç
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Ödeme Başarılı</h1>
      <p className="text-sm text-gray-500 max-w-xs">
        Ödemeniz onaylandı. Sipariş detaylarınız e-posta adresinize gönderilecek.
      </p>
    </div>
  );
}
