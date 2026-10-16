import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { buttonClass } from "@/components/styles";
import { workspaceClients, workspaceSites } from "@/lib/data";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const { workspace } = await requireMember();
  const [clients, sites] = await Promise.all([workspaceClients(workspace.id), workspaceSites(workspace.id)]);
  const counts = new Map<string, number>();
  for (const site of sites) counts.set(site.client_id, (counts.get(site.client_id) ?? 0) + 1);

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Clients</h1>
          <p className="mt-2 text-sm text-muted">The people who receive the monthly report.</p>
        </div>
        <Link href="/app/clients/new" className={buttonClass}>
          Add client
        </Link>
      </header>
      {clients.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No clients yet"
            body="A client holds one or more sites. The report is addressed to them."
            action={
              <Link href="/app/clients/new" className={buttonClass}>
                Add a client
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-2">
          {clients.map((client) => (
            <li key={client.id}>
              <Link href={`/app/clients/${client.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
                <span>
                  <span className="font-medium">{client.name}</span>
                  {client.contact_email ? <span className="ml-2 text-sm text-muted">{client.contact_email}</span> : null}
                </span>
                <span className="text-sm text-muted">{counts.get(client.id) ?? 0} sites</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
