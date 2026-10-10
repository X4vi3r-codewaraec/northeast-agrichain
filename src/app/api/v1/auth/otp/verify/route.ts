import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthConfigured } from "@/lib/auth/config";
import { setAuthCookies } from "@/lib/auth/cookies";
import { clientMeta, jsonError, jsonOk, notConfigured } from "@/lib/auth/http";
import { issueSession } from "@/lib/auth/session";
import { createUser, getUserByPhone, toApiUser } from "@/lib/auth/users";
import { isDbConfigured } from "@/lib/db";

const roleEnum = z.enum([
  "farmer",
  "fpo",
  "buyer",
  "transporter",
  "admin",
]);

const profileSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(120),
  role: roleEnum,
  state: z.string().min(2).max(80),
  district: z.string().min(1).max(80),
  block: z.string().max(80).optional(),
  language: z.string().min(2).max(8).optional(),
});

const schema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
  code: z.string().regex(/^\d{6}$/, "Enter any 6-digit code."),
  profile: profileSchema.optional(),
});

/**
 * Hackathon mode: any 6-digit `code` is accepted — no stored OTP is checked.
 * If the phone is known, the user is signed in; otherwise a profile is required
 * to create the account.
 */
export async function POST(request: NextRequest) {
  if (!isAuthConfigured() || !isDbConfigured()) return notConfigured();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "invalid_request",
      parsed.error.issues[0]?.message ?? "Invalid request.",
      400,
    );
  }

  const phone = `+91${parsed.data.phone}`;
  let user = await getUserByPhone(phone);
  let created = false;

  if (!user) {
    if (!parsed.data.profile) {
      return jsonError(
        "registration_required",
        "No account found for this number. Please create an account.",
        409,
      );
    }
    user = await createUser({ phone, ...parsed.data.profile });
    created = true;
  }

  const tokens = await issueSession(user, clientMeta(request));
  const response = jsonOk({ user: toApiUser(user), created });
  setAuthCookies(response, tokens);
  return response;
}
