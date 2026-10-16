import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { missingCoreEnv } from "@/lib/env";
import { createAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PLANS, resolvePlan, subscriptionGrants } from "@/lib/plans";
import type { MemberRole, SubscriptionRow, Workspace } from "@/lib/types";

const WORKSPACE_COOKIE = "rs_workspace";

export type Membership = {
  role: MemberRole;
  workspace: Workspace;
};

export type BillingState = {
  plan: keyof typeof PLANS;
  limits: (typeof PLANS)[keyof typeof PLANS];
  subscription: SubscriptionRow | null;
  granting: SubscriptionRow | null;
  trialDaysLeft: number | null;
};

type MembershipQueryRow = {
  role: MemberRole;
  created_at: string;
  workspaces: Workspace | Workspace[] | null;
};

function asWorkspace(value: Workspace | Workspace[] | null): Workspace | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function setWorkspaceCookie(workspaceId: string) {
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function loadBilling(workspace: Workspace): Promise<BillingState> {
  const admin = createAdmin();
  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "id, workspace_id, provider, provider_customer_id, provider_subscription_id, plan, interval, status, current_period_end, cancel_at_period_end, updated_at",
    )
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const subscriptions = (data ?? []) as SubscriptionRow[];
  const granting =
    subscriptions.find((sub) =>
      subscriptionGrants({ status: sub.status, currentPeriodEnd: sub.current_period_end }),
    ) ?? null;
  const plan = resolvePlan({
    trialEndsAt: workspace.trial_ends_at,
    subscription: granting
      ? {
          plan: granting.plan,
          status: granting.status,
          currentPeriodEnd: granting.current_period_end,
        }
      : null,
  });
  const trialMs = new Date(workspace.trial_ends_at).getTime() - Date.now();
  const trialDaysLeft = !granting && trialMs > 0 ? Math.ceil(trialMs / 86_400_000) : null;
  return {
    plan,
    limits: PLANS[plan],
    subscription: subscriptions[0] ?? null,
    granting,
    trialDaysLeft,
  };
}

export async function getMember() {
  if (missingCoreEnv().length > 0) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, created_at, workspaces(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const memberships: Membership[] = [];
  for (const row of (data ?? []) as MembershipQueryRow[]) {
    const workspace = asWorkspace(row.workspaces);
    if (!workspace) continue;
    memberships.push({ role: row.role, workspace });
  }
  if (memberships.length === 0) return null;

  const store = await cookies();
  const wanted = store.get(WORKSPACE_COOKIE)?.value;
  const current = memberships.find((member) => member.workspace.id === wanted) ?? memberships[0];
  const billing = await loadBilling(current.workspace);
  return { user, memberships, ...current, billing, supabase };
}

export async function requireMember(nextPath?: string) {
  if (missingCoreEnv().length > 0) redirect("/setup");
  const member = await getMember();
  if (member) return member;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/login?error=workspace");
  const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  redirect(`/login${next}`);
}
