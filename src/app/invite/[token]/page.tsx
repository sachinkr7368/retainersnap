import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFrame } from "@/components/marketing";
import { SubmitButton } from "@/components/submit-button";
import { buttonClass } from "@/components/styles";
import { acceptInvite } from "@/lib/actions/settings";
import { hasPublicSupabase } from "@/lib/env";
import { userMessage } from "@/lib/user-message";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Invite" };

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const next = `/invite/${token}`;

  let email: string | null = null;
  if (hasPublicSupabase()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  return (
    <MarketingFrame>
      <section className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-serif text-4xl">Join a workspace</h1>
        <p className="mt-3 text-muted">Accepting uses the email on your account. It has to match the invite.</p>
        {query.error ? (
          <p className="mt-4 text-sm text-clay">{userMessage(query.error, "The invite could not be accepted.")}</p>
        ) : null}
        {email ? (
          <form action={acceptInvite} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <p className="text-sm text-muted">Signed in as {email}</p>
            <div className="mt-4">
              <SubmitButton pendingLabel="Joining…">Accept invite</SubmitButton>
            </div>
          </form>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/login?next=${encodeURIComponent(next)}`} className={buttonClass}>
              Sign in to accept
            </Link>
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-sm text-moss underline">
              Create an account
            </Link>
          </div>
        )}
      </section>
    </MarketingFrame>
  );
}
