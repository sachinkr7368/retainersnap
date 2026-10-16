"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { initialActionState, type ActionState } from "@/lib/types";

export function ActionForm({
  action,
  submit,
  pendingLabel,
  children,
  className = "grid gap-4",
  submitClassName,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submit: string;
  pendingLabel?: string;
  children: React.ReactNode;
  className?: string;
  submitClassName?: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}
      <SubmitButton pendingLabel={pendingLabel} className={submitClassName}>
        {submit}
      </SubmitButton>
    </form>
  );
}
