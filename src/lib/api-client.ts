import { isApiFailure, isApiSuccess } from "@/lib/api-result";

export async function readApi<T>(
  response: Response,
): Promise<{ ok: true; data: T } | { ok: false; message: string; status: number }> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (response.ok && isApiSuccess<T>(body)) return { ok: true, data: body.data };
  if (isApiFailure(body)) return { ok: false, message: body.error.message, status: response.status };
  return { ok: false, message: "The request failed.", status: response.status };
}
