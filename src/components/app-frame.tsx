"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "./topnav";

// The landing cover ("/") renders full-bleed with its own header + footer.
// Every other route gets the application chrome: top nav, utility strip,
// constrained main column and the standard footer.
export function AppFrame({
  role,
  roleLabel,
  roleShort,
  envLabel,
  demo,
  children,
}: {
  role: string;
  roleLabel: string;
  roleShort: string;
  envLabel?: string;
  demo: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;

  return (
    <>
      <TopNav role={role} />
      <div className="border-b border-graphite-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <p className="text-xs text-graphite-500">
            <span className="font-medium text-ink-800">{roleLabel}</span>
            <span className="hidden sm:inline"> · {roleShort}</span>
          </p>
          <p className="flex items-center gap-2 text-[11px] text-graphite-400">
            {envLabel && <span className="rounded border border-graphite-200 px-1.5 py-0.5 uppercase tracking-wide">{envLabel}</span>}
            {demo && <span className="rounded border border-graphite-200 px-1.5 py-0.5">Demo data</span>}
            <span className="hidden md:inline">Synthetic data · decision-support, not clinical advice</span>
          </p>
        </div>
      </div>

      <main id="main" className="mx-auto max-w-[1280px] px-4 py-7 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="mx-auto max-w-[1280px] px-4 pb-10 pt-4 text-xs text-graphite-400 sm:px-6 lg:px-8">
        Haven · CivTech 12.6 demonstrator with Cloch Housing Association · Ambidexters Ltd × The DataKirk SCIO. All data is
        synthetic. Not a clinical decision system. Integrations simulated. No endorsement by Cloch or CivTech implied.
      </footer>
    </>
  );
}
