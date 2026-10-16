import { userMessage } from "@/lib/user-message";

export type ApiErrorBody = {
  ok: false;
  error: { code: string; message: string };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export type ApiResult<T> = ApiSuccessBody<T> | ApiErrorBody;

export function isApiSuccess<T>(value: unknown): value is ApiSuccessBody<T> {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { ok?: unknown }).ok === true &&
      "data" in value,
  );
}

export function isApiFailure(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") return false;
  const error = (value as { error?: unknown }).error;
  return Boolean(
    (value as { ok?: unknown }).ok === false &&
      error &&
      typeof error === "object" &&
      typeof (error as { message?: unknown }).message === "string" &&
      typeof (error as { code?: unknown }).code === "string",
  );
}

export function publicMessage(error: unknown, fallback: string): string {
  return userMessage(error, fallback);
}
