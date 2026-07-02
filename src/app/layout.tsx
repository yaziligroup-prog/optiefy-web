import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

// Durable.co tipografi eşleşmesi:
// Başlıklar — Reckless muadili Fraunces (yumuşak, sıcak serif)
// Gövde — Matter muadili Hanken Grotesk (yumuşak humanist grotesk)
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

// Viewport: cihaz genişliğine tam otur, kullanıcı zoom'una izin ver
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Optiefy — Eksiksiz E-Ticaret Altyapı Platformu",
  description:
    "Yapay zeka destekli vitrin, PayTR ödeme entegrasyonu ve otomatik SEO. 30 saniyede profesyonel e-ticaret mağazanızı yayına alın.",
  keywords: "e-ticaret, online mağaza, yapay zeka, ai vitrin, optiefy, e-ticaret altyapısı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${hankenGrotesk.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
