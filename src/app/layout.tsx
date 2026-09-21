import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { DisclaimerBar, Footer } from "@/components/disclaimer";

export const metadata: Metadata = {
  title: "Haven — Housing risk & intervention platform",
  description:
    "Haven turns fragmented housing data into risk, priority and recommended action for social housing teams. CivTech 12.6 demonstrator. Synthetic data only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const envLabel = process.env.NEXT_PUBLIC_ENV_LABEL;
  return (
    <html lang="en-GB">
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <DisclaimerBar />
        <Nav />
        {envLabel && (
          <div className="bg-navy-800 py-1 text-center text-[11px] text-teal-200">Environment: {envLabel}</div>
        )}
        <main id="main" className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
