import type { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SECONDS,
  REFRESH_COOKIE,
  REFRESH_TTL_SECONDS,
  isProd,
} from "./config";

export type TokenPair = { accessToken: string; refreshToken: string };

export function setAuthCookies(response: NextResponse, tokens: TokenPair): void {
  const secure = isProd();
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: REFRESH_TTL_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  const secure = isProd();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    });
  }
}
