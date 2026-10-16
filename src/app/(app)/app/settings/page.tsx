import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { BrandForm, InviteForm, PasswordForm } from "@/components/forms";
import { revokeInvite, uploadLogo } from "@/lib/actions/settings";
import { formatDate } from "@/lib/format";
import { requireMember } from "@/lib/session";
import { createAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Settings" };

type InviteRow = {
  id: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
};

export default async function SettingsPage() {
  const { workspace, role, billing } = await requireMember();
  const admin = createAdmin();
  const { data, error } = await admin
    .from("workspace_invites")
    .select("id, email, expires_at, accepted_at")
    .eq("workspace_id", workspace.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const invites = (data ?? []) as InviteRow[];

  return (
    <div className="grid max-w-2xl gap-12">
      <header>
        <h1 className="font-serif text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          {billing.limits.name}
          {billing.limits.slugHost ? ` · reports can live at ${workspace.slug}.retainersnap.com after the wildcard DNS is on.` : ""}
          {billing.limits.branding ? "" : " · reports show Powered by RetainerSnap until you upgrade."}
        </p>
      </header>

      <section>
        <h2 className="font-serif text-2xl">Brand</h2>
        <div className="mt-4">
          <BrandForm
            defaults={{
              name: workspace.name,
              slug: workspace.slug,
              brand_color: workspace.brand_color,
              report_footer: workspace.report_footer ?? "",
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Logo</h2>
        {workspace.logo_url ? (
          // User upload. Plain img avoids the image optimizer on Workers.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={workspace.logo_url} alt="" className="mt-3 h-12 w-auto object-contain" />
        ) : (
          <p className="mt-2 text-sm text-muted">No logo yet. The studio name is used in its place.</p>
        )}
        <div className="mt-4">
          <ActionForm action={uploadLogo} submit="Upload logo" pendingLabel="Uploading…">
            <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" />
          </ActionForm>
        </div>
        <p className="mt-2 text-xs text-muted">PNG, JPEG, or WebP. 1 MB maximum. Free plans still print the watermark.</p>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Password</h2>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Seats</h2>
        <p className="mt-2 text-sm text-muted">
          {billing.limits.seats} {billing.limits.seats === 1 ? "seat" : "seats"} on this plan. Studio includes 3.
        </p>
        {role === "owner" ? (
          <div className="mt-4">
            <InviteForm />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Only the owner can invite people.</p>
        )}
        {invites.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No open invites.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                <span>
                  {invite.email}
                  <span className="ml-2 text-muted">expires {formatDate(invite.expires_at)}</span>
                </span>
                {role === "owner" ? (
                  <form action={revokeInvite}>
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <button type="submit" className="text-xs text-clay underline">
                      Revoke
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
