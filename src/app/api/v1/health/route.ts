import { connection } from "next/server";
import { AI_MODEL, isAiConfigured } from "@/lib/openai";
import { isAuthConfigured } from "@/lib/auth/config";
import { isDbConfigured, query } from "@/lib/db";

export async function GET() {
  await connection();
  let reachable = false;
  let error: string | null = null;
  if (isDbConfigured()) {
    try {
      await query("select 1");
      reachable = true;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "unknown error";
    }
  }

  return Response.json({
    ok: true,
    db: { configured: isDbConfigured(), reachable, error },
    auth: { configured: isAuthConfigured(), mode: "phone + any 6-digit code" },
    ai: { configured: isAiConfigured(), model: AI_MODEL },
  });
}
