import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import trainingJournalLogo from "../../public/training-journal-logo.png";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import PageContainer from "@/components/PageContainer";
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
      { url: "/favicon/favicon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-black/favicon.ico", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon-black/favicon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
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
        <div className={styles.pageRoot}>
          <header className={styles.header}>
            <PageContainer className={styles.headerInner}>
              <Link href="/" className={styles.brand}>
                <Image
                  src={trainingJournalLogo}
                  alt="Training Journal"
                  width={187}
                  height={43}
                  className={styles.brandLogo}
                  priority
                />
              </Link>
              <div className={styles.headerActions}>
                <Link
                  href="/completed-exercises/new"
                  className={styles.logExerciseButton}
                  aria-label="Log exercise"
                >
                  <span aria-hidden="true">+</span>
                </Link>
                <AuthButton />
              </div>
            </PageContainer>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
