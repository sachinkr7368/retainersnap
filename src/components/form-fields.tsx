"use client";

import { useState } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { inputClass } from "@/components/styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { userMessage } from "@/lib/user-message";
import { passwordRules } from "@/lib/validators";
import { cn } from "@/lib/utils";

function messageOf<T extends FieldValues>(form: UseFormReturn<T>, name: FieldPath<T>) {
  const message = form.formState.errors[name]?.message;
  return typeof message === "string" ? userMessage(message, "Check this field.") : "";
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

function EyeIcon({ slashed }: { slashed: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      {slashed ? <path d="M5 19 19 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /> : null}
    </svg>
  );
}

export function PasswordField<T extends FieldValues>({
  form,
  name,
  label,
  autoComplete,
  showRules = false,
}: {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  autoComplete?: string;
  showRules?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const fieldId = String(name);
  const message = messageOf(form, name);
  const value = String(form.watch(name) ?? "");
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(message)}
          className="pr-12"
          {...form.register(name)}
        />
        <button
          type="button"
          className="absolute top-0 right-0 inline-flex h-11 w-11 items-center justify-center text-muted hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon slashed={visible} />
        </button>
      </div>
      {message ? <p className="text-sm text-clay">{message}</p> : null}
      {showRules ? (
        <ul className="grid gap-1 text-sm">
          {passwordRules.map((rule) => {
            const met = rule.test(value);
            return (
              <li key={rule.id} className={met ? "text-moss" : "text-muted"}>
                <span className="sr-only">{met ? "Met. " : "Still needed. "}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      ) : null}
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
