import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, sub, action }: { children: ReactNode; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold text-ink-900">{children}</h2>
        {sub && <p className="mt-0.5 text-xs text-graphite-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-graphite-200/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-[26px] font-semibold leading-tight text-ink-900">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-graphite-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const METRIC_ACCENT: Record<string, string> = {
  default: "text-ink-900",
  critical: "text-risk-critical-700",
  high: "text-risk-high-700",
  moderate: "text-risk-moderate-700",
  low: "text-risk-low-700",
  ink: "text-ink-800",
  teal: "text-ink-800",
};
const METRIC_RAIL: Record<string, string> = {
  default: "border-graphite-200",
  critical: "border-risk-critical-500",
  high: "border-risk-high-500",
  moderate: "border-risk-moderate-500",
  low: "border-risk-low-500",
  ink: "border-ink-700",
  teal: "border-ink-700",
};

export function StatTile({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: keyof typeof METRIC_ACCENT }) {
  return (
    <div className={`panel rail ${METRIC_RAIL[tone]} p-4`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-graphite-500">{label}</div>
      <div className={`mt-1.5 text-[26px] font-semibold leading-none tabular-nums ${METRIC_ACCENT[tone]}`}>{value}</div>
      {hint && <div className="mt-1.5 text-xs text-graphite-500">{hint}</div>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-graphite-200/70 bg-white shadow-subtle">
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  );
}

export function Definition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-graphite-100 py-2 last:border-0">
      <dt className="text-xs text-graphite-500">{term}</dt>
      <dd className="text-right text-sm font-medium text-ink-900">{children}</dd>
    </div>
  );
}

export function LinkButton({ href, children, variant = "secondary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "accent" | "teal" }) {
  const cls = variant === "primary" ? "btn-primary" : variant === "accent" || variant === "teal" ? "btn-accent" : "btn-secondary";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Meter({ value, max = 100, ariaLabel }: { value: number; max?: number; ariaLabel: string }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  const color = value >= 75 ? "bg-risk-critical-500" : value >= 50 ? "bg-risk-high-500" : value >= 25 ? "bg-risk-moderate-500" : "bg-risk-low-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-100" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={ariaLabel}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Segmented distribution bar (e.g. band mix), labelled — not colour-only.
export function SegmentBar({ segments }: { segments: { label: string; value: number; className: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-graphite-100" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
      {segments.map((s) => (
        <div key={s.label} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} title={`${s.label}: ${s.value}`} />
      ))}
    </div>
  );
}

export function Prototype({ children = "Prototype rule" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-graphite-300 bg-limestone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-graphite-600">
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-graphite-300 bg-white/60 p-10 text-center">
      {title && <p className="text-sm font-medium text-ink-900">{title}</p>}
      <p className="mx-auto mt-1 max-w-sm text-sm text-graphite-500">{children}</p>
    </div>
  );
}
