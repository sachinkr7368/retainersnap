import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RunChecksButton } from "@/components/run-checks";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary } from "@/components/styles";
import { generateReport } from "@/lib/actions/reports";
import { loadSiteMetrics } from "@/lib/data";
import { formatDate, formatRatio, formatWhen, periodLabel, periodStartIso, platformLabel } from "@/lib/format";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { CheckRun, Client, Site } from "@/lib/types";

export const metadata: Metadata = { title: "Site" };

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { data, error } = await admin.from("sites").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const site = data as Site;
  const period = periodStartIso();
  const [{ data: client }, metrics, { data: runs, error: runsError }] = await Promise.all([
    admin.from("clients").select("id, name").eq("id", site.client_id).maybeSingle(),
    loadSiteMetrics(site.id, period),
    admin
      .from("check_runs")
      .select("id, kind, ok, status_code, latency_ms, expires_at, created_at")
      .eq("site_id", site.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  if (runsError) throw new Error(runsError.message);
  const clientRow = client as Pick<Client, "id" | "name"> | null;

  return (
    <div className="grid max-w-3xl gap-8">
      <header>
        <Link href={clientRow ? `/app/clients/${clientRow.id}` : "/app"} className="text-sm text-muted underline">
          {clientRow?.name ?? "Dashboard"}
        </Link>
        <h1 className="mt-3 font-serif text-4xl">{site.hostname}</h1>
        <p className="mt-2 text-sm text-muted">
          {platformLabel(site.platform)} ·{" "}
          <a href={site.url} className="underline" rel="noreferrer">
            {site.url}
          </a>
        </p>
      </header>

      {query.error === "report" ? (
        <p className="text-sm text-clay">The report could not be created. Try again in a moment.</p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Uptime this month", formatRatio(metrics.uptimeRatio)],
          ["SSL through", formatDate(metrics.sslExpiresAt)],
          ["Domain through", formatDate(metrics.domainExpiresAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-card px-4 py-3">
            <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
            <p className="mt-1 font-serif text-2xl">{value}</p>
          </div>
        ))}
      </section>
      <p className="text-sm text-muted">
        PageSpeed {metrics.performance ?? "—"} · crawl {metrics.pagesCrawled} pages · broken {metrics.broken.length}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <RunChecksButton siteId={site.id} />
        <form action={generateReport}>
          <input type="hidden" name="site_id" value={site.id} />
          <SubmitButton className={buttonSecondary} pendingLabel="Opening…">
            {`Report for ${periodLabel(period)}`}
          </SubmitButton>
        </form>
      </div>
      <p className="text-sm text-muted">
        Run checks queues uptime, SSL, domain, PageSpeed, and the crawl. One click finishes the first few. PageSpeed
        and the crawl continue on the next click, or on the five-minute cron.
      </p>

      <section>
        <h2 className="font-serif text-2xl">Latest checks</h2>
        {(runs ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted">No results yet. Last uptime attempt: {formatWhen(site.last_uptime_at)}.</p>
        ) : (
          <ul className="mt-3 grid gap-2 text-sm">
            {(runs as Pick<CheckRun, "id" | "kind" | "ok" | "status_code" | "expires_at" | "created_at">[]).map((run) => (
              <li key={run.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-line bg-card px-3 py-2">
                <span>
                  {run.kind} · {run.ok ? "ok" : "failed"}
                  {run.status_code ? ` · ${run.status_code}` : ""}
                  {run.expires_at ? ` · through ${formatDate(run.expires_at)}` : ""}
                </span>
                <span className="text-muted">{formatWhen(run.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(site.alert_down_at || site.alert_ssl_at || site.alert_domain_at) && (
        <p className="text-sm text-clay">
          An alert email was sent
          {site.alert_down_at ? ` for downtime at ${formatWhen(site.alert_down_at)}` : ""}
          {site.alert_ssl_at ? ` for SSL at ${formatWhen(site.alert_ssl_at)}` : ""}
          {site.alert_domain_at ? ` for the domain at ${formatWhen(site.alert_domain_at)}` : ""}. The same kind waits 24
          hours before another email.
        </p>
      )}
    </div>
  );
}
