import Link from "next/link";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-graphite-500">
        <li><Link href="/" className="hover:text-ink-700 hover:underline">Overview</Link></li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span aria-hidden className="text-graphite-300">/</span>
            {it.href ? (
              <Link href={it.href} className="hover:text-ink-700 hover:underline">{it.label}</Link>
            ) : (
              <span className="font-medium text-ink-800" aria-current="page">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
