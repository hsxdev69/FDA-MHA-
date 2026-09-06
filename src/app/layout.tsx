import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins, Inter } from "next/font/google";
import TopBar from "@/components/top-bar";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { LanguageProvider } from "@/context/language-context";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maha FDA — Citizen Complaint Portal",
  description:
    "Official citizen complaint portal of the Food and Drug Administration, Maharashtra.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen font-body antialiased">
        <LanguageProvider>
          <div className="flex min-h-screen flex-col">
            {/* Indian Tricolor ribbon — 4px top bar */}
            <div className="bg-tricolor h-1" aria-hidden="true" />

            {/* Top utility bar (font size + active language switcher) */}
            <TopBar />

            {/* Official Header with emblem + ministry */}
            <Header />

            {/* Main content */}
            <main className="flex-1">{children}</main>

            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
