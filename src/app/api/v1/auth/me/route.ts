import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { ACCESS_COOKIE, isAuthConfigured } from "@/lib/auth/config";
import { jsonOk } from "@/lib/auth/http";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getUserById, toApiUser } from "@/lib/auth/users";
import { isDbConfigured } from "@/lib/db";

export async function GET(request: NextRequest) {
  await connection();
  if (!isAuthConfigured() || !isDbConfigured()) {
    return jsonOk({ user: null, configured: false });
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return jsonOk({ user: null, configured: true });

  const payload = await verifyAccessToken(token);
  if (!payload) return jsonOk({ user: null, configured: true });

  const user = await getUserById(payload.sub);
  return jsonOk({ user: user ? toApiUser(user) : null, configured: true });
}
