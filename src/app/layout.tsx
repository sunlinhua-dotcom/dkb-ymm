import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ymm.digirepub.com'),
  title: "咩总 - 蝶可变DKB 首席顾问",
  description: "蝶可变DKB医美医院首席顾问总监 - 咩总。为您提供专业的医美整形咨询与实时报价。",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "咩总"
  },
  openGraph: {
    title: "咩总 - 蝶可变DKB 首席顾问",
    description: "蝶可变DKB医美医院首席顾问总监 - 咩总。AI智能面诊，为您提供专业的医美整形咨询。",
    images: ['/opengraph-image.jpg'],
    type: 'website',
  },
  // file-based metadata (icon.jpg, apple-icon.jpg, opengraph-image.jpg) will be automatically picked up
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF8FAB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
