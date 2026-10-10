import type { Role } from "@/lib/data";
import { query } from "@/lib/db";

export type DbUser = {
  id: string;
  phone: string;
  name: string;
  role: Role;
  state: string;
  district: string;
  block: string | null;
  language: string;
  preferred_channel: string;
  is_verified: boolean;
  created_at: Date;
};

export type ApiUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  state: string;
  district: string;
  block: string | null;
  language: string;
  isVerified: boolean;
  createdAt: string;
};

export function toApiUser(user: DbUser): ApiUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    state: user.state,
    district: user.district,
    block: user.block,
    language: user.language,
    isVerified: user.is_verified,
    createdAt: user.created_at.toISOString(),
  };
}

const COLUMNS = `id, phone, name, role, state, district, block, language,
  preferred_channel, is_verified, created_at`;

export async function getUserByPhone(phone: string): Promise<DbUser | null> {
  const rows = await query<DbUser>(
    `select ${COLUMNS} from users where phone = $1 limit 1`,
    [phone],
  );
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const rows = await query<DbUser>(
    `select ${COLUMNS} from users where id = $1 limit 1`,
    [id],
  );
  return rows[0] ?? null;
}

export type NewUser = {
  phone: string;
  name: string;
  role: Role;
  state: string;
  district: string;
  block?: string;
  language?: string;
};

export async function createUser(input: NewUser): Promise<DbUser> {
  const rows = await query<DbUser>(
    `insert into users (phone, name, role, state, district, block, language, is_verified)
     values ($1, $2, $3, $4, $5, $6, $7, true)
     on conflict (phone) do update set
       name = excluded.name,
       role = excluded.role,
       state = excluded.state,
       district = excluded.district,
       block = excluded.block,
       language = excluded.language,
       is_verified = true,
       updated_at = now()
     returning ${COLUMNS}`,
    [
      input.phone,
      input.name,
      input.role,
      input.state,
      input.district,
      input.block ?? null,
      input.language ?? "en",
    ],
  );
  return rows[0];
}
