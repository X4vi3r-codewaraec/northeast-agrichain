export type ApiErrorPayload = {
  error?: { code?: string; message?: string };
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** Small fetch wrapper that speaks the `{ error: { code, message } }` envelope. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const payload = body as ApiErrorPayload | null;
    throw new ApiError(
      payload?.error?.message ?? `Request failed (${response.status}).`,
      payload?.error?.code ?? "request_failed",
      response.status,
    );
  }

  return body as T;
}
