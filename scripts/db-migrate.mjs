// Applies db/schema.sql to the configured Postgres database.
// Usage: npm run db:migrate
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { loadEnv, migrationConnectionString, sslFor } from "./_env.mjs";

loadEnv();

const cs = migrationConnectionString();
if (!cs) {
  console.error(
    "✗ Missing POSTGRES_URL / DATABASE_URL. Create .env.local (copy .env.example).",
  );
  process.exit(1);
}

const statements = readFileSync(resolve(process.cwd(), "db/schema.sql"), "utf8")
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

const client = new Client({ connectionString: cs, ssl: sslFor(cs) });

try {
  await client.connect();
  await client.query("begin");
  for (const statement of statements) {
    await client.query(statement);
  }
  await client.query("commit");
  console.log(`✓ Schema applied (${statements.length} statements).`);
} catch (error) {
  try {
    await client.query("rollback");
  } catch {
    // ignore rollback failures
  }
  console.error(
    "✗ Migration failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
