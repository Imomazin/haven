import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AppFrame } from "@/components/app-frame";
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
      <head>
        {/* Without JS, scroll-reveal content must still be visible. */}
        <noscript><style>{".reveal{opacity:1 !important;transform:none !important}"}</style></noscript>
      </head>
      <body className="min-h-screen bg-limestone-50 text-graphite-800">
        <a href="#main" className="skip-link">Skip to main content</a>
        <AppFrame role={role.id} roleLabel={role.label} roleShort={role.short} envLabel={envLabel} demo={!hasDb()}>
          {children}
        </AppFrame>
      </body>
    </html>
  );
}
