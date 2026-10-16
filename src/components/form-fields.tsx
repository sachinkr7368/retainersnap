"use client";

import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { inputClass } from "@/components/styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function messageOf<T extends FieldValues>(form: UseFormReturn<T>, name: FieldPath<T>) {
  const message = form.formState.errors[name]?.message;
  return typeof message === "string" ? message : "";
}

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  id,
}: {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  id?: string;
}) {
  const fieldId = id ?? String(name);
  const message = messageOf(form, name);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(message)}
        {...form.register(name)}
      />
      {message ? <p className="text-sm text-clay">{message}</p> : null}
    </div>
  );
}

export function TextAreaField<T extends FieldValues>({
  form,
  name,
  label,
  rows = 3,
  placeholder,
}: {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  rows?: number;
  placeholder?: string;
}) {
  const id = String(name);
  const message = messageOf(form, name);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} placeholder={placeholder} aria-invalid={Boolean(message)} {...form.register(name)} />
      {message ? <p className="text-sm text-clay">{message}</p> : null}
    </div>
  );
}

export function SelectField<T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
}: {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = String(name);
  const message = messageOf(form, name);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={cn(inputClass, "h-11")} aria-invalid={Boolean(message)} {...form.register(name)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {message ? <p className="text-sm text-clay">{message}</p> : null}
    </div>
  );
}
