import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Optiefy",
  description: "Yapay zeka destekli e-ticaret, domain seçim stratejileri ve PayTR ödeme altyapısı üzerine yazılar.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
