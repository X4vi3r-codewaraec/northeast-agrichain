import type { NextRequest } from "next/server";
import { z } from "zod";
import { isAuthConfigured } from "@/lib/auth/config";
import { jsonError, jsonOk, notConfigured } from "@/lib/auth/http";
import { isDbConfigured } from "@/lib/db";

const schema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
});

/**
 * Hackathon mode: there is no SMS provider. We only validate the number.
 * Any 6-digit code is accepted at the verify step.
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

  return jsonOk({ sent: true, demo: true });
}
