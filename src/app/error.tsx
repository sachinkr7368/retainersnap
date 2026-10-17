"use client";

import { SiteFrame } from "@/components/site-chrome";
import { buttonClass } from "@/components/styles";

export default function PageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <SiteFrame>
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="font-serif text-4xl">Something went wrong</h1>
        <p className="mt-3 text-muted">The page failed to load. Try it again.</p>
        <button type="button" onClick={() => reset()} className={`${buttonClass} mt-6`}>
          Try again
        </button>
      </main>
    </SiteFrame>
  );
}
