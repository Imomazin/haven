"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RoleSwitcher } from "./role-switcher";

type Item = { href: string; label: string; match?: string[] };

// Primary global navigation. Reference/secondary destinations live under "More".
const PRIMARY: Item[] = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/place", label: "Places" },
  { href: "/properties", label: "Homes" },
  { href: "/households", label: "Households" },
  { href: "/risk-queue", label: "Risk" },
  { href: "/cases", label: "Intervention", match: ["/cases", "/interventions"] },
  { href: "/analytics", label: "Intelligence", match: ["/analytics", "/governance"] },
  { href: "/ecosystem", label: "Ecosystem", match: ["/ecosystem", "/ecosystem-demo"] },
];

const MORE: Item[] = [
  { href: "/interventions", label: "Interventions" },
  { href: "/governance", label: "Governance" },
  { href: "/ecosystem-demo", label: "Guided ecosystem demo" },
  { href: "/methodology", label: "Methodology" },
  { href: "/simulator", label: "Risk Simulator" },
  { href: "/demo", label: "Guided demo" },
  { href: "/about", label: "About" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md border border-terracotta-400/40 bg-terracotta-500 font-display text-lg font-semibold text-white">H</span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-white">Haven</span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-ink-200 sm:block">Housing intelligence</span>
      </span>
    </Link>
  );
}

function isActive(pathname: string, item: Item): boolean {
  const targets = item.match ?? [item.href];
  return targets.some((t) => (t === "/" ? pathname === "/" : pathname === t || pathname.startsWith(t + "/")));
}

export function TopNav({ role }: { role: string }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(false);
  const moreActive = MORE.some((m) => isActive(pathname, m));

  const linkCls = (active: boolean) =>
    `relative rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${active ? "text-white after:absolute after:inset-x-2.5 after:-bottom-[11px] after:h-0.5 after:rounded-full after:bg-terracotta-400" : "text-ink-100/80 hover:bg-white/5 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 bg-ink-900">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 sm:px-6">
        <Wordmark />
        <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-ink-100/80 xl:inline-flex">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage-400" /> Inverclyde portfolio
        </span>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex">
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(pathname, item) ? "page" : undefined} className={linkCls(isActive(pathname, item))}>
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <button
              onClick={() => setMore((v) => !v)}
              onBlur={() => setTimeout(() => setMore(false), 150)}
              aria-expanded={more}
              className={linkCls(moreActive) + " inline-flex items-center gap-1"}
            >
              More <span aria-hidden className="text-[9px]">▼</span>
            </button>
            {more && (
              <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-white/10 bg-ink-900 py-1 shadow-lg">
                {MORE.map((m) => (
                  <Link key={m.href} href={m.href} className={`block px-3 py-2 text-sm ${isActive(pathname, m) ? "bg-white/10 text-white" : "text-ink-100/85 hover:bg-white/5 hover:text-white"}`}>
                    {m.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right: role switcher (desktop) */}
        <div className="ml-auto hidden items-center lg:flex">
          <div className="w-44"><RoleSwitcher current={role} dark /></div>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(true)} className="ml-auto rounded-md border border-white/20 px-3 py-1.5 text-sm text-white lg:hidden" aria-label="Open menu" aria-expanded={open}>
          Menu
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-ink-900">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Wordmark />
              <button onClick={() => setOpen(false)} className="rounded-md border border-white/20 px-2 py-1 text-sm text-white" aria-label="Close menu">✕</button>
            </div>
            <nav aria-label="Primary" className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {[...PRIMARY, ...MORE].map((item) => (
                <Link key={item.href + item.label} href={item.href} onClick={() => setOpen(false)} className={`block rounded-md px-3 py-2 text-sm ${isActive(pathname, item) ? "bg-white/10 font-medium text-white" : "text-ink-100/85 hover:bg-white/5 hover:text-white"}`}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-white/10 p-3">
              <RoleSwitcher current={role} dark />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
