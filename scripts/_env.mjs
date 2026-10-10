import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Minimal .env loader (no dependency) so scripts work without `--env-file`. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

/** node-postgres has no channel binding — drop params Neon adds. */
function sanitize(value) {
  if (!value) return value;
  return value
    .replace(/([?&])(channel_binding|sslmode)=[^&]*/g, "$1")
    .replace(/\?&/g, "?")
    .replace(/&&/g, "&")
    .replace(/[?&]$/g, "");
}

/** Runtime connection string (pooled is fine for the app). */
export function connectionString() {
  return sanitize(
    process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING,
  );
}

/** Migrations prefer the direct (unpooled) connection on Neon. */
export function migrationConnectionString() {
  return sanitize(
    process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL,
  );
}

export function sslFor(connectionStringValue) {
  const isLocal = /(^|@)(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(
    connectionStringValue,
  );
  return isLocal ? undefined : { rejectUnauthorized: false };
}
