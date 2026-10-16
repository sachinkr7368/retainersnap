import type { Metadata } from "next";
import Link from "next/link";
import { LoginPasswordForm, MagicLinkForm } from "@/components/forms";
import { MarketingFrame } from "@/components/marketing";
import { safeNext } from "@/lib/urls";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const banner =
    params.error === "callback"
      ? "That sign-in link could not be confirmed. Request a new one."
      : params.error === "workspace"
        ? "This account is not attached to a studio yet. Sign up again, or use the invite link you were sent."
        : "";

  return (
    <MarketingFrame>
      <section className="mx-auto grid max-w-md gap-10 px-6 py-16">
        <div>
          <h1 className="font-serif text-4xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted">
            New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-moss underline">Create an account</Link>
          </p>
        </div>
        {banner ? <p className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-clay">{banner}</p> : null}
        <div className="grid gap-3">
          <LoginPasswordForm next={next} />
          <Link href="/forgot-password" className="text-sm text-muted underline">
            Forgot password
          </Link>
        </div>
        <div>
          <h2 className="font-serif text-2xl">Email me a link</h2>
          <div className="mt-4">
            <MagicLinkForm next={next} />
          </div>
        </div>
      </section>
    </MarketingFrame>
  );
}
