import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { buttonClass } from "@/components/styles";
import { periodLabel } from "@/lib/format";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { MonthlyReport } from "@/lib/types";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { data, error } = await admin
    .from("monthly_reports")
    .select("id, period_start, status, summary, site_id, share_token, created_at")
    .eq("workspace_id", workspace.id)
    .order("period_start", { ascending: false });
  if (error) throw new Error(error.message);
  const reports = (data ?? []) as Pick<MonthlyReport, "id" | "period_start" | "status" | "summary" | "share_token">[];

  return (
    <div>
      <h1 className="font-serif text-4xl">Reports</h1>
      <p className="mt-2 text-sm text-muted">One draft per site per month. Publish it to turn on the share link.</p>
      {reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No reports yet"
            body="Open a site and generate this month’s report. The summary is filled from the checks."
            action={
              <Link href="/app" className={buttonClass}>
                Go to sites
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-2">
          {reports.map((report) => (
            <li key={report.id}>
              <Link href={`/app/reports/${report.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3">
                <span className="text-xs tracking-wide text-muted uppercase">
                  {periodLabel(report.period_start)} · {report.status}
                </span>
                <p className="mt-1 line-clamp-2 text-sm">{report.summary || "Empty summary"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
