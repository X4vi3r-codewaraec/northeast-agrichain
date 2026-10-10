import { Pool, type PoolClient, type QueryResultRow } from "pg";

/** Values that can be bound as SQL parameters. */
export type SqlParam = string | number | boolean | Date | null | undefined;

let pool: Pool | null = null;

export class DbNotConfiguredError extends Error {
  constructor() {
    super(
      "Database is not configured. Set POSTGRES_URL (Vercel Postgres) or DATABASE_URL.",
    );
    this.name = "DbNotConfiguredError";
  }
}

function connectionString(): string | undefined {
  const raw =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  return raw ? sanitizeConnectionString(raw) : undefined;
}

/**
 * node-postgres has no channel binding, and we set TLS explicitly, so drop the
 * `channel_binding` / `sslmode` query params that Neon adds.
 */
function sanitizeConnectionString(value: string): string {
  return value
    .replace(/([?&])(channel_binding|sslmode)=[^&]*/g, "$1")
    .replace(/\?&/g, "?")
    .replace(/&&/g, "&")
    .replace(/[?&]$/g, "");
}

export function isDbConfigured(): boolean {
  return Boolean(connectionString());
}

function getPool(): Pool {
  if (pool) return pool;
  const cs = connectionString();
  if (!cs) throw new DbNotConfiguredError();

  const isLocal = /(^|@)(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(cs);
  pool = new Pool({
    connectionString: cs,
    // Managed Postgres (Vercel/Neon) requires TLS; local dev usually does not.
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: Number(process.env.PG_POOL_MAX ?? 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (error) => {
    console.error("[db] idle client error", error);
  });
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
