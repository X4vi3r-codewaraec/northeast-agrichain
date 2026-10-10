import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  isAuthConfigured,
} from "@/lib/auth/config";
import { verifyAccessToken } from "@/lib/auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/weather",
  "/alerts",
  "/diagnose",
  "/soil",
  "/yield",
  "/map",
  "/shipments",
  "/credit",
  "/insurance",
  "/assistant",
  "/admin",
  "/settings",
];

const ADMIN_ONLY = ["/admin"];

/**
 * Next 16 proxy (previously `middleware`). Guards app routes using the access
 * cookie. Fails open when auth is not configured so the local demo still works.
 */
export async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const payload = accessToken ? await verifyAccessToken(accessToken) : null;

  if (!payload) {
    // A refresh cookie may still be valid (access tokens are short-lived).
    if (request.cookies.get(REFRESH_COOKIE)?.value) return NextResponse.next();

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  const needsAdmin = ADMIN_ONLY.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (needsAdmin && payload.role !== "admin") {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = "/403";
    forbiddenUrl.search = "";
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/weather/:path*",
    "/alerts/:path*",
    "/diagnose/:path*",
    "/soil/:path*",
    "/yield/:path*",
    "/map/:path*",
    "/shipments/:path*",
    "/credit/:path*",
    "/insurance/:path*",
    "/assistant/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
