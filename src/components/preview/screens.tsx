import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { BrandForm, ClientForm, InviteForm, SiteForm } from "@/components/forms";
import { HealthTool } from "@/components/health-tool";
import { MarketingFrame } from "@/components/marketing";
import { PaidChoice, PlanChoice } from "@/components/plan-choices";
import { PlanGrid } from "@/components/plan-grid";
import { ReportDocument } from "@/components/report-document";
import { buttonClass, buttonSecondary } from "@/components/styles";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { previewAction } from "@/lib/actions/preview";
import type { PreviewShotId } from "@/lib/fixtures/catalog";
import {
  fixtureBilling,
  fixtureClient,
  fixtureHealth,
  fixtureMemberships,
  fixtureReport,
  fixtureSite,
  fixtureWorkspace,
} from "@/lib/fixtures/data";
import { formatWhen, periodLabel } from "@/lib/format";


function Frame({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <AppShell
      workspace={fixtureWorkspace}
      memberships={fixtureMemberships}
      billing={fixtureBilling}
      email="ada@north.studio"
      navPath={path}
    >
      {children}
    </AppShell>
  );
}

function ComponentsShot() {
  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-6 py-16">
      <header>
        <h1 className="font-serif text-4xl">Components</h1>
        <p className="mt-2 text-sm text-muted">Shared controls used across the product.</p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="moss">Moss</Button>
        <Badge>Studio</Badge>
        <Badge variant="line">Draft</Badge>
      </div>
      <Card className="grid gap-3 p-5">
        <Input placeholder="https://client.framer.app" aria-label="Sample URL" />
        <Alert>Something needs a correction.</Alert>
        <Alert tone="success">Saved.</Alert>
      </Card>
      <PlanGrid
        actions={{
          free: <PlanChoice label="Current plan" />,
          solo: <PaidChoice plan="solo" emphasis={false} yearly yearlyLabel="$190 yearly" owner current={false} />,
          studio: <PaidChoice plan="studio" emphasis yearly yearlyLabel="$490 yearly" owner current />,
        }}
      />
    </main>
  );
}

function DashboardShot() {
  return (
    <Frame path="/app">
      <div className="grid gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.16em] text-muted uppercase">{periodLabel("2026-10-01")}</p>
            <h1 className="font-serif text-4xl">{fixtureWorkspace.name}</h1>
            <p className="mt-2 text-sm text-muted">1 of {fixtureBilling.limits.sites} sites · 1 client</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/preview/new-client" className={buttonClass}>
              Add a client
            </Link>
            <Link href="/preview/new-site" className={buttonSecondary}>
              Add a site
            </Link>
          </div>
        </header>
        <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
          Studio trial, {fixtureBilling.trialDaysLeft} days left. After that the workspace is Free unless you subscribe.
        </p>
        <section>
          <h2 className="font-serif text-2xl">Sites</h2>
          <ul className="mt-3 grid gap-2">
            <li>
              <Link href="/preview/site" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-card px-4 py-3">
                <span>
                  <span className="font-medium">{fixtureSite.hostname}</span>
                  <span className="ml-2 text-sm text-muted">{fixtureClient.name}</span>
                </span>
                <span className="text-sm text-muted">Uptime {formatWhen(fixtureSite.last_uptime_at)}</span>
              </Link>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Recent reports</h2>
          <Link href="/preview/report" className="mt-3 block rounded-2xl border border-line bg-card px-4 py-3">
            <span className="text-xs tracking-wide text-muted uppercase">October 2026 · draft</span>
            <p className="mt-1 line-clamp-2 text-sm">{fixtureReport.summary}</p>
          </Link>
        </section>
      </div>
    </Frame>
  );
}

function ClientsShot() {
  return (
    <Frame path="/app/clients">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Clients</h1>
          <p className="mt-2 text-sm text-muted">The people who receive the monthly report.</p>
        </div>
        <Link href="/preview/new-client" className={buttonClass}>
          Add client
        </Link>
      </header>
      <ul className="mt-8 grid gap-2">
        <li>
          <Link href="/preview/client" className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
            <span>
              <span className="font-medium">{fixtureClient.name}</span>
              <span className="ml-2 text-sm text-muted">{fixtureClient.contact_email}</span>
            </span>
            <span className="text-sm text-muted">1 site</span>
          </Link>
        </li>
      </ul>
    </Frame>
  );
}

function ClientShot() {
  return (
    <Frame path="/app/clients">
      <div className="grid max-w-3xl gap-10">
        <div>
          <Link href="/preview/clients" className="text-sm text-muted underline">
            Clients
          </Link>
          <h1 className="mt-3 font-serif text-4xl">{fixtureClient.name}</h1>
        </div>
        <ClientForm
          action={previewAction}
          defaults={{ name: fixtureClient.name, contact_email: fixtureClient.contact_email ?? "" }}
          clientId={fixtureClient.id}
          submit="Save changes"
        />
      </div>
    </Frame>
  );
}

function NewClientShot() {
  return (
    <Frame path="/app/clients">
      <div className="max-w-lg">
        <h1 className="font-serif text-4xl">New client</h1>
        <div className="mt-6">
          <ClientForm action={previewAction} defaults={{ name: "", contact_email: "" }} />
        </div>
      </div>
    </Frame>
  );
}

function NewSiteShot() {
  return (
    <Frame path="/app">
      <div className="max-w-lg">
        <h1 className="font-serif text-4xl">New site</h1>
        <p className="mt-2 text-sm text-muted">1 of 50 sites on Studio.</p>
        <div className="mt-6">
          <SiteForm
            action={previewAction}
            clients={[{ id: fixtureClient.id, name: fixtureClient.name }]}
            defaults={{ client_id: fixtureClient.id, url: "https://harbor.example", platform: "framer" }}
          />
        </div>
      </div>
    </Frame>
  );
}

function SiteShot() {
  return (
    <Frame path="/app">
      <div className="grid max-w-3xl gap-8">
        <header>
          <p className="text-sm text-muted">{fixtureClient.name}</p>
          <h1 className="mt-3 font-serif text-4xl">{fixtureSite.hostname}</h1>
          <p className="mt-2 text-sm text-muted">Framer · {fixtureSite.url}</p>
        </header>
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ["Uptime this month", "99.5%"],
            ["SSL through", "1 Apr 2027"],
            ["Domain through", "1 Aug 2027"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-line bg-card px-4 py-3">
              <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
              <p className="mt-1 font-serif text-2xl">{value}</p>
            </div>
          ))}
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="inline-flex h-11 items-center justify-center rounded-full bg-moss px-4 text-sm font-medium text-paper">
            Run checks now
          </button>
          <button type="button" className={buttonSecondary}>
            Report for October 2026
          </button>
        </div>
      </div>
    </Frame>
  );
}

function ReportsShot() {
  return (
    <Frame path="/app/reports">
      <h1 className="font-serif text-4xl">Reports</h1>
      <p className="mt-2 text-sm text-muted">One draft per site per month. Publish it to turn on the share link.</p>
      <ul className="mt-8 grid gap-2">
        <li>
          <Link href="/preview/report" className="block rounded-2xl border border-line bg-card px-4 py-3">
            <span className="text-xs tracking-wide text-muted uppercase">October 2026 · draft</span>
            <p className="mt-1 line-clamp-2 text-sm">{fixtureReport.summary}</p>
          </Link>
        </li>
      </ul>
    </Frame>
  );
}

function ReportShot() {
  return (
    <main className="px-4 py-10">
      <ReportDocument report={fixtureReport} />
    </main>
  );
}

function BillingShot() {
  return (
    <Frame path="/app/billing">
      <div className="max-w-4xl">
        <h1 className="font-serif text-4xl">Billing</h1>
        <p className="mt-2 text-sm text-muted">Current plan: Studio. Studio trial, 10 days left.</p>
        <div className="mt-8">
          <PlanGrid
            actions={{
              free: <PlanChoice label="Included" />,
              solo: <PaidChoice plan="solo" emphasis={false} yearly yearlyLabel="$190 yearly" owner current={false} />,
              studio: <PaidChoice plan="studio" emphasis yearly yearlyLabel="$490 yearly" owner current />,
            }}
          />
        </div>
      </div>
    </Frame>
  );
}

function SettingsShot() {
  return (
    <Frame path="/app/settings">
      <div className="grid max-w-2xl gap-12">
        <header>
          <h1 className="font-serif text-4xl">Settings</h1>
          <p className="mt-2 text-sm text-muted">Studio · reports can live at north-studio.retainersnap.com after the wildcard DNS is on.</p>
        </header>
        <section>
          <h2 className="font-serif text-2xl">Brand</h2>
          <div className="mt-4">
            <BrandForm
              action={previewAction}
              defaults={{
                name: fixtureWorkspace.name,
                slug: fixtureWorkspace.slug,
                brand_color: fixtureWorkspace.brand_color,
                report_footer: fixtureWorkspace.report_footer ?? "",
              }}
            />
          </div>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Seats</h2>
          <div className="mt-4">
            <InviteForm action={previewAction} />
          </div>
        </section>
      </div>
    </Frame>
  );
}

function HealthShot() {
  return (
    <MarketingFrame>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl">Site health</h1>
        <p className="mt-2 text-sm text-muted">A finished check, using mock numbers.</p>
        <div className="mt-8">
          <HealthTool initialUrl="https://harbor.example" initialReport={fixtureHealth} />
        </div>
      </section>
    </MarketingFrame>
  );
}

function EmptyShot() {
  return (
    <Frame path="/app">
      <h1 className="font-serif text-4xl">Empty states</h1>
      <div className="mt-8 grid gap-6">
        <EmptyState
          title="No sites yet"
          body="Add a client, then a public URL. Checks queue in the background. The first report can go out the same day."
          action={
            <Link href="/preview/new-client" className={buttonClass}>
              Add the first client
            </Link>
          }
        />
        <EmptyState title="No reports yet" body="Open a site and generate this month’s report. The summary is filled from the checks." />
      </div>
    </Frame>
  );
}

const shots: Record<PreviewShotId, () => React.ReactNode> = {
  components: ComponentsShot,
  dashboard: DashboardShot,
  clients: ClientsShot,
  client: ClientShot,
  "new-client": NewClientShot,
  "new-site": NewSiteShot,
  site: SiteShot,
  reports: ReportsShot,
  report: ReportShot,
  billing: BillingShot,
  settings: SettingsShot,
  health: HealthShot,
  empty: EmptyShot,
};

export function PreviewShot({ id }: { id: PreviewShotId }) {
  const Shot = shots[id];
  return <Shot />;
}
