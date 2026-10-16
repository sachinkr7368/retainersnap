"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver, type UseFormReturn } from "react-hook-form";
import type { ZodType } from "zod";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { initialActionState, type ActionState } from "@/lib/types";

export function SchemaForm<T extends FieldValues>({
  schema,
  action,
  defaultValues,
  submit,
  pendingLabel,
  className = "grid gap-4",
  submitClassName,
  hidden,
  children,
}: {
  schema: ZodType<T>;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues: DefaultValues<T>;
  submit: string;
  pendingLabel?: string;
  className?: string;
  submitClassName?: string;
  hidden?: Record<string, string>;
  children: (form: UseFormReturn<T>) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues,
  });

  useEffect(() => {
    if (!state.fieldErrors) return;
    for (const [name, message] of Object.entries(state.fieldErrors)) {
      form.setError(name as Path<T>, { type: "server", message });
    }
  }, [state, form]);

  function onValid(values: T) {
    const data = new FormData();
    if (hidden) {
      for (const [key, value] of Object.entries(hidden)) data.set(key, value);
    }
    for (const [key, value] of Object.entries(values)) {
      if (value == null) continue;
      data.set(key, typeof value === "string" ? value : String(value));
    }
    formAction(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onValid)} className={className} noValidate>
      {children(form)}
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}
      <SubmitButton pending={pending} pendingLabel={pendingLabel} className={submitClassName}>
        {submit}
      </SubmitButton>
    </form>
  );
}
