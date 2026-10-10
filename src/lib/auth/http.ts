import { NextResponse } from "next/server";

export type JsonRecord = Record<string, unknown>;

export function jsonOk<T extends JsonRecord>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  extra: JsonRecord = {},
): NextResponse {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

export function notConfigured(): NextResponse {
  return jsonError(
    "auth_not_configured",
    "Authentication is not configured on this deployment. Set POSTGRES_URL and AUTH_SECRET.",
    503,
  );
}

export function clientMeta(request: Request): { device: string; ip: string } {
  const ua = request.headers.get("user-agent") ?? "";
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  return { device: ua.slice(0, 200), ip: ip.slice(0, 64) };
}
