// Seeds a few demo accounts (one per role). Safe to re-run.
// Usage: npm run db:seed
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

/** Demo logins: use the phone number + any 6-digit code. */
const users = [
  { phone: "+919876543210", name: "Demo Farmer", role: "farmer", state: "Assam", district: "Jorhat", language: "en" },
  { phone: "+919876500001", name: "Naga Farmers FPO", role: "fpo", state: "Nagaland", district: "Kohima", language: "en" },
  { phone: "+919876500002", name: "Guwahati Fresh Retail", role: "buyer", state: "Assam", district: "Kamrup", language: "en" },
  { phone: "+919876500003", name: "Hill Logistics", role: "transporter", state: "Meghalaya", district: "East Khasi Hills", language: "en" },
  { phone: "+919876500004", name: "State Extension Admin", role: "admin", state: "Assam", district: "Kamrup", language: "en" },
];

const client = new Client({ connectionString: cs, ssl: sslFor(cs) });

try {
  await client.connect();
  for (const u of users) {
    await client.query(
      `insert into users (phone, name, role, state, district, language, is_verified)
       values ($1, $2, $3, $4, $5, $6, true)
       on conflict (phone) do update set
         name = excluded.name,
         role = excluded.role,
         state = excluded.state,
         district = excluded.district,
         language = excluded.language,
         is_verified = true,
         updated_at = now()`,
      [u.phone, u.name, u.role, u.state, u.district, u.language],
    );
  }
  console.log(`✓ Seeded ${users.length} demo accounts (phone + any 6-digit code).`);
  for (const u of users) {
    console.log(`   ${u.role.padEnd(12)} ${u.phone.replace("+91", "")}  ${u.name}`);
  }
} catch (error) {
  console.error("✗ Seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
