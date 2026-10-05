"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/risk-queue", label: "Risk Queue", icon: "queue" },
  { href: "/properties", label: "Properties", icon: "property" },
  { href: "/households", label: "Households", icon: "household" },
  { href: "/cases", label: "Cases", icon: "case" },
  { href: "/interventions", label: "Interventions", icon: "intervention" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/governance", label: "Governance", icon: "governance" },
  { href: "/methodology", label: "Methodology", icon: "methodology" },
  { href: "/simulator", label: "Simulator", icon: "simulator" },
  { href: "/demo", label: "Demo", icon: "demo" },
  { href: "/about", label: "About", icon: "about" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-navy-800 bg-gradient-to-r from-navy-900 to-navy-800 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-teal-400 font-bold text-navy-900 shadow">H</span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">Haven</span>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-teal-200 sm:inline">Housing risk &amp; intervention</span>
          </span>
        </Link>
        <button
          className="rounded-md border border-navy-600 px-3 py-1.5 text-sm lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="main-nav"
        >
          Menu
        </button>
        <nav id="main-nav" aria-label="Primary" className={`${open ? "block" : "hidden"} absolute left-0 right-0 top-full border-b border-navy-800 bg-navy-900 px-4 pb-3 lg:static lg:block lg:border-0 lg:bg-transparent lg:p-0`}>
          <ul className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-0.5">
            {NAV.map((item) => {
              const I = Icon[item.icon];
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-teal-400 text-navy-900" : "text-navy-100 hover:bg-navy-700/70"
                    }`}
                  >
                    <I className={active ? "text-navy-900" : "text-teal-300"} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
