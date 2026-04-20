import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className={styles.pageRoot}>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link href="/" className={styles.brand}>
                <span className={styles.brandMark}>TJ</span>
                <span className={styles.brandText}>Training Journal</span>
              </Link>
              <div className={styles.headerActions}>
                <AuthButton />
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
