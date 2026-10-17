"use client";

import { useState } from "react";
import { buttonSecondary } from "@/components/styles";
import { safeNext } from "@/lib/urls";
import { userMessage } from "@/lib/user-message";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

export function GoogleSignInButton({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn() {
    setError("");
    setPending(true);
    const destination = safeNext(next);
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ next: destination, origin: window.location.origin }),
    });
    const body = (await response.json().catch(() => null)) as
      | { ok: true; data: { url: string } }
      | { ok: false; error?: { message?: string } }
      | null;
    if (!body?.ok || !body.data?.url.startsWith("https://accounts.google.com/")) {
      setError(body && !body.ok ? userMessage(body.error?.message, "Google sign-in is not available yet. Use email and password.") : "Google sign-in is not available yet. Use email and password.");
      setPending(false);
      return;
    }
    window.location.assign(body.data.url);
  }

  return (
    <div className="grid gap-2">
      <button type="button" className={`${buttonSecondary} w-full gap-2`} onClick={signIn} disabled={pending}>
        <GoogleMark />
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
