"use client";

import { useRef } from "react";
import { setRole } from "@/app/actions";
import { ROLES } from "@/lib/roles";

export function RoleSwitcher({ current, dark = false }: { current: string; dark?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={setRole} className="space-y-1">
      <label htmlFor="role-select" className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-ink-300" : "text-graphite-500"}`}>
        Signed in as
      </label>
      <select
        id="role-select"
        name="role"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className={
          dark
            ? "w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white focus:border-terracotta-300"
            : "input w-full py-1.5 text-sm"
        }
      >
        {ROLES.map((r) => (
          <option key={r.id} value={r.id} className="text-graphite-900">{r.label}</option>
        ))}
      </select>
      <noscript><button className="btn-secondary py-1 text-xs">Switch</button></noscript>
    </form>
  );
}
