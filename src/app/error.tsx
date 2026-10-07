"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface for diagnostics; in production this would go to an error tracker.
    console.error(error);
  }, [error]);

  const isDbConfig = /DATABASE_URL/.test(error.message);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-risk-high-700">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-graphite-600">
        {isDbConfig
          ? "The database connection is not configured. Set DATABASE_URL (see .env.example) and seed the database."
          : "An unexpected error occurred while rendering this page."}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={reset} className="btn-primary">Try again</button>
      </div>
    </div>
  );
}
