import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-ink-700">Not found</p>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">We couldn&apos;t find that record</h1>
      <p className="mt-2 text-sm text-graphite-600">
        The property, household or case reference may be wrong, or it isn&apos;t in the current demo dataset.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="btn-primary">Back to overview</Link>
        <Link href="/risk-queue" className="btn-secondary">Open risk queue</Link>
      </div>
    </div>
  );
}
