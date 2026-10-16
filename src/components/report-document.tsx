import { formatCls, formatDate, formatDurationMs, formatMoney, formatRatio, platformLabel } from "@/lib/format";
import type { BrokenLink, ReportItem } from "@/lib/types";

export type ReportView = {
  studioName: string;
  logoUrl: string | null;
  color: string;
  watermark: boolean;
  footer: string | null;
  clientName: string;
  hostname: string;
  url: string;
  platform: string;
  period: string;
  summary: string;
  uptimeRatio: number | null;
  sslExpiresAt: string | null;
  domainExpiresAt: string | null;
  registrar: string | null;
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  broken: BrokenLink[];
  pagesCrawled: number;
  items: ReportItem[];
};

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value ?? "—"}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-line">
        <div className="h-1.5 rounded-full" style={{ width: `${value ?? 0}%`, background: "currentColor" }} />
      </div>
    </div>
  );
}

export function ReportDocument({ report }: { report: ReportView }) {
  const work = report.items.filter((item) => item.kind === "work_done");
  const next = report.items.filter((item) => item.kind === "recommendation");
  return (
    <article className="report-sheet mx-auto max-w-3xl rounded-3xl border border-line bg-card px-6 py-8 shadow-sm md:px-10 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          {report.logoUrl ? (
            // Logos are user uploads. A plain img avoids the image optimizer on Workers.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.logoUrl} alt="" className="mb-3 h-10 w-auto object-contain" />
          ) : (
            <p className="font-serif text-2xl" style={{ color: report.color }}>
              {report.studioName}
            </p>
          )}
          <p className="mt-4 text-xs tracking-[0.16em] text-muted uppercase">{report.period}</p>
          <h1 className="mt-1 font-serif text-4xl leading-tight">{report.clientName}</h1>
          <p className="mt-2 text-sm text-muted">
            {report.hostname} · {platformLabel(report.platform)}
          </p>
        </div>
        <p className="rounded-full px-3 py-1 text-xs font-medium text-paper" style={{ background: report.color }}>
          Maintenance report
        </p>
      </header>

      <p className="mt-6 text-lg leading-relaxed">{report.summary}</p>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Uptime", formatRatio(report.uptimeRatio)],
          ["SSL through", formatDate(report.sslExpiresAt)],
          ["Domain through", formatDate(report.domainExpiresAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line px-4 py-3">
            <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
            <p className="mt-1 font-serif text-2xl">{value}</p>
          </div>
        ))}
      </section>
      {report.registrar ? <p className="mt-2 text-sm text-muted">Registrar: {report.registrar}</p> : null}

      <section className="mt-8" style={{ color: report.color }}>
        <h2 className="font-serif text-2xl text-ink">PageSpeed, mobile</h2>
        <div className="mt-4 grid gap-4">
          <Score label="Performance" value={report.performance} />
          <Score label="SEO" value={report.seo} />
          <Score label="Accessibility" value={report.accessibility} />
          <Score label="Best practices" value={report.bestPractices} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm text-ink">
          <div>
            <dt className="text-muted">LCP</dt>
            <dd>{formatDurationMs(report.lcpMs)}</dd>
          </div>
          <div>
            <dt className="text-muted">INP</dt>
            <dd>{formatDurationMs(report.inpMs)}</dd>
          </div>
          <div>
            <dt className="text-muted">CLS</dt>
            <dd>{formatCls(report.cls)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Broken links</h2>
        <p className="mt-1 text-sm text-muted">{report.pagesCrawled} pages crawled, same site only, cap of 50.</p>
        {report.broken.length === 0 ? (
          <p className="mt-3 text-sm">None in the latest crawl.</p>
        ) : (
          <ul className="mt-3 grid gap-2 text-sm">
            {report.broken.map((link) => (
              <li key={link.url} className="break-all rounded-lg bg-paper px-3 py-2">
                {link.url}
                <span className="ml-2 text-clay">{link.status ?? link.error ?? "failed"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Work done</h2>
        {work.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing logged for this month yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {work.map((item) => (
              <li key={item.id}>
                <p className="font-medium">{item.title}</p>
                {item.body ? <p className="text-sm text-muted">{item.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">Recommended next</h2>
        {next.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No priced recommendations yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {next.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line px-4 py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.body ? <p className="text-sm text-muted">{item.body}</p> : null}
                </div>
                {item.price_cents != null ? (
                  <p className="font-serif text-xl whitespace-nowrap">{formatMoney(item.price_cents)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 border-t border-line pt-4 text-sm text-muted">
        {report.watermark ? (
          <p>
            Powered by{" "}
            <a href="https://retainersnap.com" className="underline">
              RetainerSnap
            </a>
          </p>
        ) : (
          <p>{report.footer || report.studioName}</p>
        )}
      </footer>
    </article>
  );
}
