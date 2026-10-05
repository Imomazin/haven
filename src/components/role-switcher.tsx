"use client";

import { useRef } from "react";
import { setRole } from "@/app/actions";
import { ROLES } from "@/lib/roles";

export function RoleSwitcher({ current }: { current: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={setRole} className="flex items-center gap-2">
      <label htmlFor="role-select" className="text-xs font-medium text-navy-500">Viewing as</label>
      <select
        id="role-select"
        name="role"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className="input py-1 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>
      <noscript>
        <button className="btn-secondary py-1 text-xs">Switch</button>
      </noscript>
    </form>
  );
}
