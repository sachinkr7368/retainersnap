import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms";
import { MarketingFrame } from "@/components/marketing";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <MarketingFrame>
      <section className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-serif text-4xl">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          <Link href="/login" className="text-moss underline">
            Back to sign in
          </Link>
        </p>
        <div className="mt-8">
          <ResetPasswordForm />
        </div>
      </section>
    </MarketingFrame>
  );
}
