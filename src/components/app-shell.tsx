import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { signOut } from "@/lib/actions/auth";
import { setWorkspace } from "@/lib/actions/settings";
import type { BillingState, Membership } from "@/lib/session";
import type { Workspace } from "@/lib/types";

export function AppShell({
  workspace,
  memberships,
  billing,
  email,
  navPath,
  children,
}: {
  workspace: Workspace;
  memberships: Membership[];
  billing: BillingState;
  email: string;
  navPath?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
      <aside className="no-print border-b border-line md:border-r md:border-b-0">
        <div className="px-5 py-5">
          <Link href="/app" className="font-serif text-xl">
            RetainerSnap
          </Link>
          <p className="mt-1 text-sm text-muted">{workspace.name}</p>
        </div>
        {memberships.length > 1 ? (
          <form action={setWorkspace} className="px-5 pb-4">
            <label className="grid gap-1 text-xs text-muted">
              Workspace
              <select name="workspace_id" defaultValue={workspace.id} className="rounded-lg border border-line bg-card px-2 py-1 text-sm text-ink">
                {memberships.map((member) => (
                  <option key={member.workspace.id} value={member.workspace.id}>
                    {member.workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="mt-2 text-xs text-moss underline">
              Switch
            </button>
          </form>
        ) : null}
        <AppNav currentPath={navPath} />
        <div className="mx-4 mb-5 rounded-2xl border border-line bg-card p-4 text-sm">
          <p className="font-medium">{billing.limits.name}</p>
          <p className="mt-1 text-muted">
            {billing.limits.sites} sites · {billing.limits.seats} {billing.limits.seats === 1 ? "seat" : "seats"}
          </p>
          {billing.trialDaysLeft != null ? (
            <p className="mt-2 text-moss">Studio trial · {billing.trialDaysLeft} days left</p>
          ) : null}
          <Link href="/app/billing" className="mt-3 inline-block text-moss underline">
            {billing.plan === "free" ? "Upgrade" : "Manage plan"}
          </Link>
          <p className="mt-3 truncate text-xs text-muted">{email}</p>
          <form action={signOut}>
            <button type="submit" className="mt-2 text-xs text-muted underline">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="px-5 py-8 md:px-10">{children}</div>
    </div>
  );
}
