"use client";

import { LANGUAGES } from "@/lib/data";
import type { Role } from "@/lib/data";
import { fetchMe, logoutRequest, type ApiUser } from "./auth-api";

export type Session = {
  id?: string;
  name: string;
  phone?: string;
  role: Role;
  state: string;
  district: string;
  block?: string;
  lang: string;
  langCode?: string;
};

const KEY = "ac_session";

/** Default landing page for each role. */
export function roleHome(role: Role): string {
  switch (role) {
    case "buyer":
      return "/marketplace";
    case "transporter":
      return "/shipments";
    case "admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  // Best-effort server-side revoke; the cookie is what actually matters.
  void logoutRequest().catch(() => undefined);
}

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}

export function toSession(user: ApiUser): Session {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    state: user.state,
    district: user.district,
    block: user.block ?? undefined,
    lang: languageName(user.language),
    langCode: user.language,
  };
}

/** Reconcile the localStorage mirror with the server session. */
export async function syncSession(): Promise<Session | null> {
  try {
    const { user } = await fetchMe();
    if (!user) {
      if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
      return null;
    }
    const session = toSession(user);
    saveSession(session);
    return session;
  } catch {
    return getSession();
  }
}
