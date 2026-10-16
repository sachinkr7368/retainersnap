"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/styles";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = buttonClass,
  pending: pendingOverride,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  pending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingOverride ?? formPending;
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
