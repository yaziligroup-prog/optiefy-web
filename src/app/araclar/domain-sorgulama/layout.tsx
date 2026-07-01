import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domain Sorgulama & Kayıt | Optiefy Araçları",
  description: "Mağazanız için uygun alan adını gerçek zamanlı DNS sorgusuyla saniyeler içinde bulun. .com, .shop, .store ve daha fazla uzantıda arama yapın.",
};

export default function DomainSorgulamaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
