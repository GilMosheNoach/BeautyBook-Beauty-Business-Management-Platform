import type { Metadata, Viewport } from "next";
import "./globals.css";
import { appUrl } from "@/lib/url";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "BeautyBook — ניהול תורים לקוסמטיקאיות", template: "%s · BeautyBook" },
  description: "דף הזמנת תורים אישי, יומן וניהול לקוחות לקוסמטיקאיות ובעלות עסקי יופי.",
  applicationName: "BeautyBook",
  openGraph: { type: "website", locale: "he_IL", siteName: "BeautyBook" },
  // Set GOOGLE_SITE_VERIFICATION to the code Google Search Console gives you.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700&family=Heebo:wght@200;300;400;500&family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap"
        />
      </head>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
