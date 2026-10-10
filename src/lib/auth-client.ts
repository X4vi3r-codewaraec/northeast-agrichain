"use client";

import { useSyncExternalStore } from "react";
import { LANGUAGES } from "@/lib/data";
import type { Role } from "@/lib/data";
import { fetchMe, logoutRequest, refreshSession, type ApiUser } from "./auth-api";

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

/* ------------------------------------------------------------------ */
/* Reactive session store (shared by the header, dashboard, settings)  */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let cached: Session | null = null;
let cacheLoaded = false;

function emit() {
  listeners.forEach((l) => l());
}

function readFromStorage(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Re-read the mirror and notify subscribers (e.g. after a cross-tab change). */
function handleStorage() {
  cached = readFromStorage();
  cacheLoaded = true;
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

/** Stable snapshot for `useSyncExternalStore` (localStorage parsed once). */
function getSnapshot(): Session | null {
  if (!cacheLoaded) {
    cached = readFromStorage();
    cacheLoaded = true;
  }
  return cached;
}

function getServerSnapshot(): Session | null {
  return null;
}

/** Live session for client components — updates on login / logout. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ------------------------------------------------------------------ */
/* Read / write helpers                                                */
/* ------------------------------------------------------------------ */

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
  return getSnapshot();
}

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — keep the in-memory mirror anyway */
  }
  cached = session;
  cacheLoaded = true;
  emit();
}

/** Clear the local mirror only (no server round-trip). */
function clearLocalSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  cached = null;
  cacheLoaded = true;
  emit();
}

export function clearSession() {
  clearLocalSession();
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

/**
 * Reconcile the localStorage mirror with the real server session.
 * - Valid access token → refresh the mirror from `/auth/me`.
 * - Expired access token but a live refresh cookie → rotate, then mirror.
 * - Server says signed-out (configured, no user, no refresh) → clear the mirror.
 * - Auth not configured (demo) or the network is down → trust the mirror.
 */
export async function reconcileSession(): Promise<Session | null> {
  try {
    const { user, configured } = await fetchMe();
    if (user) {
      const session = toSession(user);
      saveSession(session);
      return session;
    }
    if (!configured) return getSnapshot(); // demo mode — keep the local session

    // Access token is missing/expired; the refresh cookie may still be valid.
    try {
      const rotated = await refreshSession();
      if (rotated.user) {
        const session = toSession(rotated.user);
        saveSession(session);
        return session;
      }
    } catch {
      /* no/invalid refresh cookie */
    }

    // The server genuinely has no session for us.
    clearLocalSession();
    return null;
  } catch {
    // Offline / request failed — keep whatever the mirror holds.
    return getSnapshot();
  }
}

/** @deprecated use `reconcileSession` — kept for any older callers. */
export async function syncSession(): Promise<Session | null> {
  return reconcileSession();
}
