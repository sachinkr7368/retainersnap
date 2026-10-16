"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { buttonClass, inputClass } from "@/components/styles";
import { readApi } from "@/lib/api-client";
import { formatDate, formatDurationMs } from "@/lib/format";
import type { HealthResponse } from "@/lib/health-types";

async function checkSite(url: string): Promise<HealthResponse> {
  const response = await fetch("/api/health", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const result = await readApi<HealthResponse>(response);
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

export function HealthTool({
  initialUrl = "",
  initialReport = null,
}: {
  initialUrl?: string;
  initialReport?: HealthResponse | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const mutation = useMutation({ mutationFn: checkSite });
  const report = mutation.data ?? initialReport;
  const error = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(url);
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <label className="sr-only" htmlFor="health-url">
          Site URL
        </label>
        <input
          id="health-url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://client.framer.app"
          className={`${inputClass} h-11 min-w-0 sm:flex-1`}
          required
        />
        <button type="submit" disabled={mutation.isPending} className={`${buttonClass} w-full shrink-0 sm:w-auto`}>
          {mutation.isPending ? "Checking…" : "Check this site"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-clay">
          {error}
        </p>
      ) : null}
      {report ? (
        <div className="mt-6 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Tile label="Uptime" value={report.uptime.ok ? `Up · ${report.uptime.statusCode}` : "Down"} detail={report.uptime.error} />
            <Tile label="SSL" value={report.ssl.expiresAt ? formatDate(report.ssl.expiresAt) : "Unknown"} detail={report.ssl.error} />
            <Tile
              label="Domain"
              value={report.domain.expiresAt ? formatDate(report.domain.expiresAt) : "Unknown"}
              detail={report.domain.registrar || report.domain.error}
            />
            <Tile
              label="Mobile performance"
              value={report.pagespeed.performance == null ? "—" : String(report.pagespeed.performance)}
              detail={
                report.pagespeed.error ||
                `SEO ${report.pagespeed.seo ?? "—"} · A11y ${report.pagespeed.accessibility ?? "—"} · LCP ${formatDurationMs(report.pagespeed.lcpMs)}`
              }
            />
          </div>
          <div className="rounded-2xl bg-ink px-5 py-4 text-paper">
            <p className="font-serif text-2xl">Put this on your letterhead every month.</p>
            <p className="mt-1 text-sm text-paper/80">
              Free accounts watch 2 sites and send a report. The 14-day Studio trial needs no card.
            </p>
            <Link
              href={`/signup?next=${encodeURIComponent(`/app/sites/new?url=${encodeURIComponent(report.url)}`)}`}
              className="mt-4 inline-flex h-11 items-center rounded-full bg-paper px-4 text-sm font-medium text-ink"
            >
              Save this site and start the trial
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
    </div>
  );
}
