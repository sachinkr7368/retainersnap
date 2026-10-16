import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SiteForm } from "@/components/forms";
import { buttonClass } from "@/components/styles";
import { workspaceClients, workspaceSites } from "@/lib/data";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "New site" };

export default async function NewSitePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; client?: string }>;
}) {
  const params = await searchParams;
  const { workspace, billing } = await requireMember();
  const [clients, sites] = await Promise.all([workspaceClients(workspace.id), workspaceSites(workspace.id)]);
  const atLimit = sites.length >= billing.limits.sites;

  return (
    <div className="max-w-lg">
      <Link href="/app" className="text-sm text-muted underline">
        Dashboard
      </Link>
      <h1 className="mt-3 font-serif text-4xl">New site</h1>
      <p className="mt-2 text-sm text-muted">
        {sites.length} of {billing.limits.sites} sites on {billing.limits.name}.
      </p>
      {clients.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Add a client first"
            body="Sites belong to a client, because the report is addressed to them."
            action={
              <Link href="/app/clients/new" className={buttonClass}>
                Add a client
              </Link>
            }
          />
        </div>
      ) : atLimit ? (
        <div className="mt-6">
          <EmptyState
            title="Site limit reached"
            body={`${billing.limits.name} includes ${billing.limits.sites} sites. Upgrade to add another, or remove one you no longer report on.`}
            action={
              <Link href="/app/billing" className={buttonClass}>
                View plans
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6">
          <SiteForm
            clients={clients.map((client) => ({ id: client.id, name: client.name }))}
            defaults={{
              client_id: params.client ?? "",
              url: params.url ?? "",
              platform: "framer",
            }}
          />
        </div>
      )}
    </div>
  );
}
