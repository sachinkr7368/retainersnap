import type { ZodError } from "zod";
import type { ActionState } from "@/lib/types";

export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function invalidAction(error: ZodError): ActionState {
  return { error: "", ok: "", fieldErrors: fieldErrorsFrom(error) };
}

export function fail(message: string): ActionState {
  return { error: message, ok: "" };
}

export function succeed(message: string): ActionState {
  return { error: "", ok: message };
}
