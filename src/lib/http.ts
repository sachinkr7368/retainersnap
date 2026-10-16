import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiSuccessBody } from "@/lib/api-result";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccessBody<T>, { status });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } } satisfies ApiErrorBody, { status });
}
