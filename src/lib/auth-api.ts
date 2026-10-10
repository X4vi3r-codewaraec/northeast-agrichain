"use client";

import type { Role } from "@/lib/data";
import { apiFetch } from "./api-client";

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

export type ApiProfile = {
  name: string;
  role: Role;
  state: string;
  district: string;
  block?: string;
  language?: string;
};

/** Step 1 — validate the number. Any 6-digit code works at verify time. */
export function requestOtp(phone: string) {
  return apiFetch<{ sent: boolean; demo: boolean }>(
    "/api/v1/auth/otp/request",
    { method: "POST", body: JSON.stringify({ phone }) },
  );
}

/** Step 2 — sign in, or create the account when `profile` is supplied. */
export function verifyOtp(input: {
  phone: string;
  code: string;
  profile?: ApiProfile;
}) {
  return apiFetch<{ user: ApiUser; created: boolean }>(
    "/api/v1/auth/otp/verify",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function fetchMe() {
  return apiFetch<{ user: ApiUser | null; configured: boolean }>(
    "/api/v1/auth/me",
    { method: "GET", cache: "no-store" },
  );
}

export function refreshSession() {
  return apiFetch<{ user: ApiUser }>("/api/v1/auth/refresh", {
    method: "POST",
  });
}

export function logoutRequest() {
  return apiFetch<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST" });
}
