"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/risk-queue", label: "Risk Queue" },
  { href: "/properties", label: "Properties" },
  { href: "/households", label: "Households" },
  { href: "/cases", label: "Cases" },
  { href: "/interventions", label: "Interventions" },
  { href: "/analytics", label: "Analytics" },
  { href: "/governance", label: "Governance" },
  { href: "/methodology", label: "Methodology" },
  { href: "/demo", label: "Demo" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-navy-800 bg-navy-900 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-teal-500 font-bold text-navy-900">H</span>
          <span className="text-lg font-bold tracking-tight">Haven</span>
          <span className="hidden text-xs font-medium text-teal-200 sm:inline">Housing risk &amp; intervention</span>
        </Link>
        <button
          className="rounded-md border border-navy-700 px-3 py-1.5 text-sm lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="main-nav"
        >
          Menu
        </button>
        <nav id="main-nav" aria-label="Primary" className={`${open ? "block" : "hidden"} absolute left-0 right-0 top-full border-b border-navy-800 bg-navy-900 px-4 pb-3 lg:static lg:block lg:border-0 lg:p-0`}>
          <ul className="flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive(item.href) ? "bg-teal-500 text-navy-900" : "text-navy-100 hover:bg-navy-800"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
