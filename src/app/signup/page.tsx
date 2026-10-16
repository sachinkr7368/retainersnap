import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/forms";
import { MarketingFrame } from "@/components/marketing";
import { safeNext } from "@/lib/urls";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  return (
    <MarketingFrame>
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-serif text-4xl">Create your studio</h1>
        <p className="mt-2 text-sm text-muted">
          14 days of Studio, no card. Already registered?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-moss underline">
            Sign in
          </Link>
        </p>
        <div className="mt-8">
          <SignupForm next={next} />
        </div>
      </section>
    </MarketingFrame>
  );
}
