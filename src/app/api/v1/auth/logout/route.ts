import type { NextRequest } from "next/server";
import { REFRESH_COOKIE } from "@/lib/auth/config";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { jsonOk } from "@/lib/auth/http";
import { revokeSessionByRefresh } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(REFRESH_COOKIE)?.value;
  if (token) {
    try {
      await revokeSessionByRefresh(token);
    } catch {
      // Best-effort revoke; clearing cookies below is what matters.
    }
  }

  const response = jsonOk({ ok: true });
  clearAuthCookies(response);
  return response;
}
