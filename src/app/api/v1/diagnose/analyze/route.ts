import type { NextRequest } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE, isAuthConfigured } from "@/lib/auth/config";
import { jsonError, jsonOk } from "@/lib/auth/http";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { isSupportedImage, visionDiagnosis } from "@/lib/diagnose/vision";
import { isAiConfigured } from "@/lib/openai";

const schema = z.object({
  image: z.string().min(32, "A leaf photo is required."),
  cropId: z.string().min(1).max(60),
  part: z.enum(["leaf", "fruit", "stem", "whole"]),
  district: z.string().min(1).max(80),
  thumbnail: z.string().max(20_000).optional(),
});

/**
 * Vision crop diagnosis. The client pre-processes the photo; gpt-4o mini reads
 * the symptoms and picks the issue from the crop's catalog, while every number
 * (confidence, severity, dosage, waiting/revisit days) is computed in code.
 * The client falls back to the on-device engine on any error.
 */
export async function POST(request: NextRequest) {
  if (!isAiConfigured()) {
    return jsonError(
      "ai_not_configured",
      "AI diagnosis is not enabled on this deployment.",
      503,
    );
  }

  // Auth gate (fails open when the deployment has no auth configured).
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload && isAuthConfigured()) {
    return jsonError("unauthorized", "Please sign in to use AI diagnosis.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "invalid_request",
      parsed.error.issues[0]?.message ?? "Invalid request.",
      400,
    );
  }

  const { image, cropId, part, district, thumbnail } = parsed.data;
  if (!isSupportedImage(image)) {
    return jsonError(
      "invalid_image",
      "Use a JPG, PNG or WebP close-up under 1.5 MB.",
      400,
    );
  }

  try {
    const result = await visionDiagnosis({ imageDataUrl: image, cropId, part, district, thumbnail });
    return jsonOk(result);
  } catch (error) {
    console.error("[diagnose] vision request failed:", error);
    return jsonError(
      "ai_error",
      "The vision model is unavailable right now. Please try again.",
      502,
    );
  }
}
