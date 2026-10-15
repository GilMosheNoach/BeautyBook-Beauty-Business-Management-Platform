import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BeautyBook — ניהול תורים לקוסמטיקאיות", template: "%s · BeautyBook" },
  description: "דף הזמנת תורים אישי, יומן וניהול לקוחות לקוסמטיקאיות ובעלות עסקי יופי.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#cc2d63",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
