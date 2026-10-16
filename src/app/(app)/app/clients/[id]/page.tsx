import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ClientForm } from "@/components/forms";
import { buttonClass } from "@/components/styles";
import { updateClient } from "@/lib/actions/clients";
import { workspaceSites } from "@/lib/data";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";
import type { Client } from "@/lib/types";

export const metadata: Metadata = { title: "Client" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireMember();
  const admin = createAdmin();
  const { data, error } = await admin.from("clients").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const client = data as Client;
  const sites = (await workspaceSites(workspace.id)).filter((site) => site.client_id === client.id);

  return (
    <div className="grid max-w-3xl gap-10">
      <div>
        <Link href="/app/clients" className="text-sm text-muted underline">
          Clients
        </Link>
        <h1 className="mt-3 font-serif text-4xl">{client.name}</h1>
      </div>
      <ClientForm
        action={updateClient}
        defaults={{ name: client.name, contact_email: client.contact_email ?? "" }}
        clientId={client.id}
        submit="Save changes"
        pendingLabel="Saving…"
      />
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Sites</h2>
          <Link href={`/app/sites/new?client=${client.id}`} className={buttonClass}>
            Add site
          </Link>
        </div>
        {sites.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No sites for this client" body="Add the public URL you maintain for them." />
          </div>
        ) : (
          <ul className="mt-4 grid gap-2">
            {sites.map((site) => (
              <li key={site.id}>
                <Link href={`/app/sites/${site.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3">
                  <span className="font-medium">{site.hostname}</span>
                  <span className="ml-2 text-sm text-muted">{site.platform}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
