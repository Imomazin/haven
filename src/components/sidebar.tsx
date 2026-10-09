"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { RoleSwitcher } from "./role-switcher";

type Item = { href: string; label: string; icon: IconName };
const GROUPS: { heading: string; items: Item[] }[] = [
  {
    heading: "Portfolio",
    items: [
      { href: "/", label: "Situation room", icon: "overview" },
      { href: "/place", label: "Neighbourhoods", icon: "place" },
      { href: "/risk-queue", label: "Risk Queue", icon: "queue" },
    ],
  },
  {
    heading: "Records",
    items: [
      { href: "/households", label: "Households", icon: "household" },
      { href: "/properties", label: "Properties", icon: "property" },
    ],
  },
  {
    heading: "Delivery",
    items: [
      { href: "/cases", label: "Cases", icon: "case" },
      { href: "/interventions", label: "Interventions", icon: "intervention" },
    ],
  },
  {
    heading: "Intelligence",
    items: [
      { href: "/analytics", label: "Insights", icon: "analytics" },
      { href: "/governance", label: "Governance", icon: "governance" },
    ],
  },
  {
    heading: "Ecosystem",
    items: [
      { href: "/ecosystem", label: "Integrations", icon: "ecosystem" },
      { href: "/ecosystem-demo", label: "Guided ecosystem", icon: "demo" },
    ],
  },
  {
    heading: "Reference",
    items: [
      { href: "/methodology", label: "Methodology", icon: "methodology" },
      { href: "/simulator", label: "Risk Simulator", icon: "simulator" },
      { href: "/demo", label: "Guided Demo", icon: "demo" },
      { href: "/about", label: "About", icon: "about" },
    ],
  },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md border border-terracotta-400/40 bg-terracotta-500 font-display text-lg font-semibold text-white">H</span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-white">Haven</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-200">Housing intelligence</span>
      </span>
    </Link>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scroll-y">
      {GROUPS.map((g) => (
        <div key={g.heading}>
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-300/80">{g.heading}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const I = Icon[item.icon];
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      active ? "bg-white/10 font-medium text-white shadow-[inset_2px_0_0_0_#cc7249]" : "text-ink-100/90 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <I className={active ? "text-terracotta-300" : "text-ink-300 group-hover:text-ink-100"} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Foot({ role }: { role: string }) {
  return (
    <div className="border-t border-white/10 px-3 py-3">
      <div className="rounded-md bg-white/5 p-2.5">
        <RoleSwitcher current={role} dark />
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink-900 lg:flex">
        <div className="border-b border-white/10 px-4 py-4"><Wordmark /></div>
        <NavList pathname={pathname} />
        <Foot role={role} />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink-900 px-4 py-3 lg:hidden">
        <Wordmark />
        <button onClick={() => setOpen(true)} className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white" aria-label="Open menu" aria-expanded={open}>
          Menu
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-ink-900">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Wordmark />
              <button onClick={() => setOpen(false)} className="rounded-md border border-white/20 px-2 py-1 text-sm text-white" aria-label="Close menu">✕</button>
            </div>
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            <Foot role={role} />
          </div>
        </div>
      )}
    </>
  );
}
