// Elegant, understated data-provenance marker. Shows which source system a
// datum came from so officers can trust — and challenge — the information.
// Used sparingly, never as decoration.

export function SourceBadge({ source, reference, at }: { source: string; reference?: string | null; at?: string | null }) {
  const title = [source, reference, at ? `received ${at}` : null].filter(Boolean).join(" · ");
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-graphite-200/80 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-graphite-500"
      title={title}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden className="shrink-0 text-terracotta-500">
        <circle cx="4" cy="4" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {source}
      {reference && <span className="font-normal normal-case text-graphite-400">· {reference}</span>}
    </span>
  );
}
