import Link from "next/link";
import { HealthTool } from "@/components/health-tool";
import { MarketingFrame } from "@/components/marketing";
import { buttonClass, buttonSecondary } from "@/components/styles";

const checks = [
  ["Uptime", "A scheduled GET, with an email if the site stays down."],
  ["SSL expiry", "Public certificate logs, alerted inside 14 days."],
  ["Domain expiry", "RDAP, alerted inside 30 days."],
  ["PageSpeed", "Performance, SEO, accessibility, and Core Web Vitals, once a month."],
  ["Broken links", "A same-site crawl, capped at 50 pages."],
  ["Work done", "What you fixed, plus priced recommendations the client can say yes to."],
];

export default function HomePage() {
  return (
    <MarketingFrame>
      <section data-band="hero" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <p className="text-xs font-medium tracking-[0.18em] text-moss uppercase">For Framer, Webflow, and Next.js retainers</p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">Monthly reports that keep the retainer.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Freelancers and small studios send one branded page each month: the site was up, the certificate is fine, the
          work you did, and what to buy next. Clients paying $300–800 a month can see why.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className={`${buttonClass} w-full sm:w-auto`}>
            Start the 14-day Studio trial
          </Link>
          <Link href="/demo" className={`${buttonSecondary} w-full sm:w-auto`}>
            See a sample report
          </Link>
        </div>
        <p className="mt-3 text-sm text-muted">No card. Free plan stays at 2 sites.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16" id="check">
        <div className="rounded-3xl border border-line bg-card p-6 md:p-8">
          <h2 className="font-serif text-3xl">Check a site, no account</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Paste a public URL. You get PageSpeed, SSL, and domain expiry. Then save it to a workspace if you want the
            monthly letter.
          </p>
          <div className="mt-6">
            <HealthTool />
          </div>
        </div>
      </section>

      <section data-band="checks" className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        {checks.map(([title, body]) => (
          <article key={title} className="h-full rounded-2xl border border-line bg-card px-5 py-5">
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="font-serif text-4xl">A report, not another dashboard login for the client</h2>
        <ol data-band="steps" className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1. Add the site", "URL plus a platform tag. Framer, Webflow, or Next.js. No platform login."],
            ["2. Let the checks run", "Uptime, SSL, and domain on a schedule. PageSpeed and a 50-page crawl each month."],
            ["3. Send the link", "Your logo and colour. Print to PDF. A line for the work, and a price for what is next."],
          ].map(([title, body]) => (
            <li key={title} className="h-full rounded-2xl border border-line px-5 py-5">
              <h3 className="font-serif text-2xl">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="font-serif text-4xl">Questions</h2>
        <div className="mt-6 grid gap-4">
          <article className="rounded-2xl border border-line bg-card px-5 py-5">
            <h3 className="font-medium">Do I connect Webflow or Framer?</h3>
            <p className="mt-2 text-sm text-muted">
              No. RetainerSnap checks the public URL. It does not ask for a Webflow or Framer login, and it does not
              publish to those sites.
            </p>
          </article>
          <article className="rounded-2xl border border-line bg-card px-5 py-5">
            <h3 className="font-medium">What does the free plan include?</h3>
            <p className="mt-2 text-sm text-muted">
              Two sites, forever, with “Powered by RetainerSnap” on the report. Solo ($19/month) removes that line and
              covers 15 sites. Studio ($49/month) covers 50 sites, 3 seats, and a report host on your slug.
            </p>
          </article>
          <article className="rounded-2xl border border-line bg-card px-5 py-5">
            <h3 className="font-medium">Who is this for?</h3>
            <p className="mt-2 text-sm text-muted">
              Freelancers and studios who already bill a maintenance retainer and need a monthly artifact the client
              will actually open. A ManageWP-style report, aimed at Framer, Webflow, and Next.js.
            </p>
          </article>
        </div>
      </section>
    </MarketingFrame>
  );
}
