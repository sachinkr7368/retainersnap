import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { buttonClass, buttonSecondary } from "@/components/styles";
import { workspaceClients, workspaceSites } from "@/lib/data";
import { formatWhen, periodLabel, periodStartIso } from "@/lib/format";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { MonthlyReport } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { workspace, billing } = await requireMember();
  const [sites, clients, reportsResult] = await Promise.all([
    workspaceSites(workspace.id),
    workspaceClients(workspace.id),
    createAdmin()
      .from("monthly_reports")
      .select("id, period_start, status, summary, site_id, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (reportsResult.error) throw new Error(reportsResult.error.message);
  const reports = (reportsResult.data ?? []) as Pick<MonthlyReport, "id" | "period_start" | "status" | "summary" | "site_id">[];
  const atLimit = sites.length >= billing.limits.sites;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted uppercase">{periodLabel(periodStartIso())}</p>
          <h1 className="font-serif text-4xl">{workspace.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {sites.length} of {billing.limits.sites} sites · {clients.length} {clients.length === 1 ? "client" : "clients"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/app/clients/new" className={buttonClass}>
            Add a client
          </Link>
          <Link href="/app/sites/new" className={buttonSecondary}>
            Add a site
          </Link>
        </div>
      </header>

      {atLimit ? (
        <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
          This plan is full. <Link href="/app/billing" className="text-moss underline">Upgrade</Link> to add another site.
        </p>
      ) : null}
      {billing.trialDaysLeft != null ? (
        <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
          Studio trial, {billing.trialDaysLeft} days left. After that the workspace is Free unless you subscribe.
        </p>
      ) : null}

      {sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          body="Add a client, then a public URL. Checks queue in the background. The first report can go out the same day."
          action={
            <Link href="/app/clients/new" className={buttonClass}>
              Add the first client
            </Link>
          }
        />
      ) : (
        <section>
          <h2 className="font-serif text-2xl">Sites</h2>
          <ul className="mt-3 grid gap-2">
            {sites.map((site) => (
              <li key={site.id}>
                <Link href={`/app/sites/${site.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-card px-4 py-3">
                  <span>
                    <span className="font-medium">{site.hostname}</span>
                    <span className="ml-2 text-sm text-muted">{site.clients?.name}</span>
                  </span>
                  <span className="text-sm text-muted">Uptime {formatWhen(site.last_uptime_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Recent reports</h2>
          <Link href="/app/reports" className="text-sm text-moss underline">
            All reports
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Generate one from a site page after the checks have something to say.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {reports.map((report) => (
              <li key={report.id}>
                <Link href={`/app/reports/${report.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3">
                  <span className="text-xs tracking-wide text-muted uppercase">
                    {periodLabel(report.period_start)} · {report.status}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm">{report.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
