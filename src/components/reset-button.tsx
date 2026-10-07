"use client";

import { useState, useTransition } from "react";
import { resetDemo } from "@/app/actions";

export function ResetButton() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) return <span className="text-sm font-medium text-ink-700">Demo data restored to seed state.</span>;

  if (!confirming) {
    return (
      <button className="btn-secondary" onClick={() => setConfirming(true)}>
        Reset demo data…
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-sm text-graphite-600">This restores the deterministic seed and discards demo edits. Sure?</span>
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await resetDemo();
            setDone(true);
          })
        }
      >
        {pending ? "Resetting…" : "Yes, reset"}
      </button>
      <button className="btn-secondary" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </button>
    </span>
  );
}
