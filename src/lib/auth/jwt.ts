import { SignJWT, jwtVerify } from "jose";
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  authSecret,
  refreshSecret,
} from "./config";

export type TokenType = "access" | "refresh";

export type AppTokenPayload = {
  sub: string;
  sid: string;
  role?: string;
  typ: TokenType;
};

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(input: {
  sub: string;
  sid: string;
  role: string;
}): Promise<string> {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new SignJWT({ sid: input.sid, role: input.role, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secretKey(secret));
}

export async function signRefreshToken(input: {
  sub: string;
  sid: string;
}): Promise<string> {
  const secret = refreshSecret();
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new SignJWT({ sid: input.sid, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SECONDS}s`)
    .sign(secretKey(secret));
}

async function verify(
  token: string,
  secret: string | undefined,
  expected: TokenType,
): Promise<AppTokenPayload | null> {
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (payload.typ !== expected) return null;
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      sid: payload.sid,
      role: typeof payload.role === "string" ? payload.role : undefined,
      typ: expected,
    };
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string): Promise<AppTokenPayload | null> {
  return verify(token, authSecret(), "access");
}

export function verifyRefreshToken(token: string): Promise<AppTokenPayload | null> {
  return verify(token, refreshSecret(), "refresh");
}
