"use client";

import { buttonClass } from "@/components/styles";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-4xl">This page failed</h1>
      <p className="mt-3 text-muted">This page did not load. Try again in a moment.</p>
      <button type="button" onClick={() => reset()} className={`${buttonClass} mt-6`}>
        Try again
      </button>
    </div>
  );
}
