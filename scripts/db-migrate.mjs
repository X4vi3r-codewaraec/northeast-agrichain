// Applies db/schema.sql to the configured Postgres database.
// Usage: npm run db:migrate
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { connectionString, loadEnv, sslFor } from "./_env.mjs";

loadEnv();

const cs = connectionString();
if (!cs) {
  console.error(
    "✗ Missing POSTGRES_URL / DATABASE_URL. Create .env.local (copy .env.example).",
  );
  process.exit(1);
}

const client = new Client({ connectionString: cs, ssl: sslFor(cs) });

try {
  await client.connect();
  const sql = readFileSync(resolve(process.cwd(), "db/schema.sql"), "utf8");
  await client.query(sql);
  console.log("✓ Schema applied to the database.");
} catch (error) {
  console.error("✗ Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
