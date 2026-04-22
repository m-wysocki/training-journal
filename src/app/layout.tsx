import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
                  src="/training-journal-logo.png"
                  alt="Training Journal"
                  width={220}
                  height={50}
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
