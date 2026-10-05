import Link from "next/link";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-navy-500">
        <li>
          <Link href="/" className="hover:text-teal-700 hover:underline">Overview</Link>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span aria-hidden className="text-navy-300">/</span>
            {it.href ? (
              <Link href={it.href} className="hover:text-teal-700 hover:underline">{it.label}</Link>
            ) : (
              <span className="font-medium text-navy-700" aria-current="page">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
