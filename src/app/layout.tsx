import type { Metadata } from "next";
import { Hanken_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "FraudFenceAI — Fraud and AML risk platform", template: "%s · FraudFenceAI" },
  description:
    "Screen transactions in real time, rate customer risk, check watchlists and work cases with an AI investigator. Built for lean risk teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
