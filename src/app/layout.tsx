import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { getRole, ROLE_COOKIE } from "@/lib/roles";
import { hasDb } from "@/db/view-types";

export const metadata: Metadata = {
  title: "Haven — Housing intelligence platform",
  description:
    "Haven turns fragmented housing data into risk, priority and recommended action for social housing teams. CivTech 12.6 demonstrator. Synthetic data only.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const role = getRole(jar.get(ROLE_COOKIE)?.value);
  const envLabel = process.env.NEXT_PUBLIC_ENV_LABEL;

  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-limestone-50 text-graphite-800">
        <a href="#main" className="skip-link">Skip to main content</a>
        <Sidebar role={role.id} />
        <div className="lg:pl-60">
          {/* Utility strip: role context + synthetic-data notice */}
          <div className="flex items-center justify-between gap-3 border-b border-graphite-200/70 bg-white/80 px-4 py-2 backdrop-blur sm:px-6">
            <p className="text-xs text-graphite-500">
              <span className="font-medium text-ink-800">{role.label}</span>
              <span className="hidden sm:inline"> · {role.short}</span>
            </p>
            <p className="flex items-center gap-2 text-[11px] text-graphite-400">
              {envLabel && <span className="rounded border border-graphite-200 px-1.5 py-0.5 uppercase tracking-wide">{envLabel}</span>}
              {!hasDb() && <span className="rounded border border-graphite-200 px-1.5 py-0.5">Demo data</span>}
              <span className="hidden md:inline">Synthetic data · decision-support, not clinical advice</span>
            </p>
          </div>

          <main id="main" className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="mx-auto max-w-[1200px] px-4 pb-10 pt-4 text-xs text-graphite-400 sm:px-6 lg:px-8">
            Haven · CivTech 12.6 demonstrator with Cloch Housing Association · Ambidexters Ltd × The DataKirk SCIO. All data is
            synthetic. Not a clinical decision system. Integrations simulated. No endorsement by Cloch or CivTech implied.
          </footer>
        </div>
      </body>
    </html>
  );
}
