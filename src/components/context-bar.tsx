import { cookies } from "next/headers";
import { getRole, ROLE_COOKIE } from "@/lib/roles";
import { RoleSwitcher } from "./role-switcher";

export async function ContextBar() {
  const jar = await cookies();
  const role = getRole(jar.get(ROLE_COOKIE)?.value);
  return (
    <div className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <p className="text-xs text-navy-500">
          <span className="font-semibold text-navy-700">{role.label}</span>
          <span className="hidden sm:inline"> · {role.short}</span>
          <span className="ml-2 text-navy-400">role-tailored view (demonstration — not enforced access control)</span>
        </p>
        <RoleSwitcher current={role.id} />
      </div>
    </div>
  );
}
