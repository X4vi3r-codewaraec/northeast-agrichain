import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { REFRESH_TTL_SECONDS } from "./config";
import { sha256Hex } from "./crypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";
import { getUserById, type DbUser } from "./users";

export type SessionMeta = { device?: string; ip?: string };

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

export async function issueSession(
  user: DbUser,
  meta: SessionMeta,
): Promise<IssuedTokens> {
  const sid = randomUUID();
  const refreshToken = await signRefreshToken({ sub: user.id, sid });
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  await query(
    `insert into sessions (id, user_id, refresh_hash, device, ip, expires_at)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      sid,
      user.id,
      sha256Hex(refreshToken),
      meta.device ?? null,
      meta.ip ?? null,
      expiresAt,
    ],
  );

  const accessToken = await signAccessToken({
    sub: user.id,
    sid,
    role: user.role,
  });
  return { accessToken, refreshToken, expiresAt };
}

export async function rotateSession(
  refreshToken: string,
  meta: SessionMeta,
): Promise<{ user: DbUser; tokens: IssuedTokens } | null> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return null;

  const rows = await query<{
    id: string;
    user_id: string;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `select id, user_id, expires_at, revoked_at
       from sessions
      where refresh_hash = $1
      limit 1`,
    [sha256Hex(refreshToken)],
  );
  const session = rows[0];
  if (!session || session.revoked_at || session.expires_at.getTime() <= Date.now()) {
    return null;
  }

  await query(`update sessions set revoked_at = now() where id = $1`, [
    session.id,
  ]);

  const user = await getUserById(session.user_id);
  if (!user) return null;

  const tokens = await issueSession(user, meta);
  return { user, tokens };
}

export async function revokeSessionByRefresh(refreshToken: string): Promise<void> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return;
  await query(
    `update sessions set revoked_at = now()
      where refresh_hash = $1 and revoked_at is null`,
    [sha256Hex(refreshToken)],
  );
}
