import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
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
      <body className={`${dmSerifDisplay.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
