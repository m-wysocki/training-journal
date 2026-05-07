import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import styles from "./layout.module.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Training Journal",
  description: "Training Journal App",
  manifest: "/favicon/site.webmanifest",
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className={styles.RootLayoutPageRoot}>
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
