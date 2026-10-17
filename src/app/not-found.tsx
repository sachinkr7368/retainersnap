import Link from "next/link";
import { MarketingFrame } from "@/components/marketing";
import { buttonClass } from "@/components/styles";

export default function NotFound() {
  return (
    <MarketingFrame>
      <main className="mx-auto max-w-xl px-6 py-24">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">404</p>
        <h1 className="mt-3 font-serif text-4xl">That page is not here</h1>
        <p className="mt-3 text-muted">The report may still be a draft, or the link may have changed.</p>
        <Link href="/" className={`${buttonClass} mt-6`}>
          Back home
        </Link>
      </main>
    </MarketingFrame>
  );
}
