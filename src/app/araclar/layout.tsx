import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Araçlar | Optiefy",
  description: "Optiefy'ın mağaza sahipleri için sunduğu ücretsiz araçlar: domain sorgulama ve kayıt, logo oluşturma, SEO analizi ve daha fazlası.",
};

export default function AraclarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
