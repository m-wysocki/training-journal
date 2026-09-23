import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import styles from "./layout.module.scss";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f9f9f7",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "Training Journal",
  description: "Training Journal App",
  applicationName: "Training Journal",
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Training Journal",
    startupImage: [
      {
        url: "/splash/apple-splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/apple-splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    shortcut: "/favicon/favicon.ico",
    icon: [
      { url: "/favicon/favicon.ico", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-black/favicon.ico", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon-black/favicon-96x96.png", sizes: "96x96", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-black/apple-touch-icon.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={quicksand.variable}>
        <div className={styles.RootLayoutPageRoot}>
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
