import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold text-navy-800">{children}</h2>
      {sub && <p className="text-sm text-navy-500">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-navy-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "critical" | "high" | "moderate" | "low" | "teal";
}) {
  const toneRing: Record<string, string> = {
    default: "border-navy-100",
    critical: "border-red-300",
    high: "border-orange-300",
    moderate: "border-amber-300",
    low: "border-teal-300",
    teal: "border-teal-300",
  };
  const toneText: Record<string, string> = {
    default: "text-navy-900",
    critical: "text-red-900",
    high: "text-orange-900",
    moderate: "text-amber-800",
    low: "text-teal-800",
    teal: "text-teal-800",
  };
  return (
    <div className={`card border-l-4 ${toneRing[tone]} p-4`}>
      <div className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneText[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-navy-500">{hint}</div>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-navy-100 bg-white">
      <table className="min-w-full divide-y divide-navy-100">{children}</table>
    </div>
  );
}

export function Definition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-navy-50 py-2 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm font-medium text-navy-500">{term}</dt>
      <dd className="text-sm text-navy-900 sm:text-right">{children}</dd>
    </div>
  );
}

export function LinkButton({ href, children, variant = "secondary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "teal" }) {
  const cls = variant === "primary" ? "btn-primary" : variant === "teal" ? "btn-teal" : "btn-secondary";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Meter({ value, max = 100, ariaLabel }: { value: number; max?: number; ariaLabel: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = value >= 75 ? "bg-red-500" : value >= 50 ? "bg-orange-500" : value >= 25 ? "bg-amber-500" : "bg-teal-500";
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-navy-100"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
    >
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Prototype({ children = "Prototype response rule" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[11px] font-medium text-navy-600">
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-navy-200 bg-white p-8 text-center text-sm text-navy-500">{children}</div>;
}
