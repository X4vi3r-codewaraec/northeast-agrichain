import type { NextRequest } from "next/server";
import { isAuthConfigured, REFRESH_COOKIE } from "@/lib/auth/config";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { clientMeta, jsonError, jsonOk, notConfigured } from "@/lib/auth/http";
import { rotateSession } from "@/lib/auth/session";
import { toApiUser } from "@/lib/auth/users";
import { isDbConfigured } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!isAuthConfigured() || !isDbConfigured()) return notConfigured();

  const token = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) return jsonError("no_session", "Not signed in.", 401);

  const rotated = await rotateSession(token, clientMeta(request));
  if (!rotated) {
    const response = jsonError(
      "invalid_session",
      "Your session has expired. Please sign in again.",
      401,
    );
    clearAuthCookies(response);
    return response;
  }

  const response = jsonOk({ user: toApiUser(rotated.user) });
  setAuthCookies(response, rotated.tokens);
  return response;
}
