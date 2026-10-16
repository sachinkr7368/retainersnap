import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { buttonClass } from "@/components/styles";
import { signOut } from "@/lib/actions/auth";
import { missingCoreEnv } from "@/lib/env";
import { getMember } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (missingCoreEnv().length > 0) redirect("/setup");

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/app");

  const member = await getMember();
  if (!member) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-serif text-4xl">No workspace on this account</h1>
        <p className="mt-4 text-muted">
          Signup should create one automatically. Run <code>supabase/migrations/0001_init.sql</code> in the Supabase SQL
          editor, then create the account again. If you were invited, open the invite link while signed in.
        </p>
        <div className="mt-6 flex gap-4">
          <form action={signOut}>
            <button type="submit" className={buttonClass}>
              Sign out
            </button>
          </form>
          <Link href="/" className="self-center text-sm text-muted underline">
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      workspace={member.workspace}
      memberships={member.memberships}
      billing={member.billing}
      email={member.user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
