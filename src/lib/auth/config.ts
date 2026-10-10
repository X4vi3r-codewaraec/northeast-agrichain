/** Shared auth configuration. Safe to import from the Node proxy and route handlers. */

export const ACCESS_COOKIE = "nac_at";
export const REFRESH_COOKIE = "nac_rt";

export const ACCESS_TTL_SECONDS = 60 * 15; // 15 minutes
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Secret used to sign access tokens (falls back to JWT_SECRET). */
export function authSecret(): string | undefined {
  return process.env.AUTH_SECRET || process.env.JWT_SECRET || undefined;
}

/** Secret used to sign refresh tokens (falls back to the access secret). */
export function refreshSecret(): string | undefined {
  return process.env.AUTH_REFRESH_SECRET || authSecret();
}

export function isAuthConfigured(): boolean {
  return Boolean(authSecret());
}

export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}
