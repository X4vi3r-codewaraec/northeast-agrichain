import type { NextRequest } from "next/server";
import { z } from "zod";
import { actionsForIntent, detectIntent } from "@/lib/assistant";
import { buildFacts } from "@/lib/assistant/context";
import { ACCESS_COOKIE, isAuthConfigured } from "@/lib/auth/config";
import { jsonError, jsonOk } from "@/lib/auth/http";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getUserById } from "@/lib/auth/users";
import { LANGUAGES, type Role } from "@/lib/data";
import { AI_MODEL, getOpenAI, isAiConfigured } from "@/lib/openai";

const schema = z.object({
  message: z.string().min(1, "Ask a question first.").max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(2000),
      }),
    )
    .max(12)
    .optional(),
});

type ChatUser = {
  name: string;
  role: Role;
  state: string;
  district: string;
  language: string;
};

// Fallback context for the offline/demo path where auth is not configured.
const GUEST: ChatUser = {
  name: "there",
  role: "farmer",
  state: "Assam",
  district: "Jorhat",
  language: "en",
};

function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}

/** Resolve the signed-in user for personalised grounding, or null. */
async function resolveUser(request: NextRequest): Promise<ChatUser | null> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  const dbUser = await getUserById(payload.sub);
  if (!dbUser) return null;
  return {
    name: dbUser.name,
    role: dbUser.role,
    state: dbUser.state,
    district: dbUser.district,
    language: dbUser.language,
  };
}

/**
 * Grounded assistant reply. The intent router + deterministic engines compute
 * the facts (prices, weather, risk, facilities); gpt-4o mini only narrates them
 * and never invents numbers. Falls back to the client rule engine on any error.
 */
export async function POST(request: NextRequest) {
  if (!isAiConfigured()) {
    return jsonError(
      "ai_not_configured",
      "The AI assistant is not enabled on this deployment.",
      503,
    );
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

  const user = (await resolveUser(request)) ?? (isAuthConfigured() ? null : GUEST);
  if (!user) {
    return jsonError("unauthorized", "Please sign in to use the assistant.", 401);
  }

  const { history } = parsed.data;
  const message = parsed.data.message.trim();
  if (!message) {
    return jsonError("invalid_request", "Ask a question first.", 400);
  }

  const intent = detectIntent(message);
  const facts = await buildFacts(intent, user);

  const system = [
    "You are the Northeast AgriChain assistant for farmers, FPOs, buyers, transporters and admins across North-East India.",
    "Answer in 2 to 4 short sentences. Warm, concrete, plain language for low-literacy users. No markdown, no bullet points, no emoji, no headings.",
    "",
    "HARD RULES:",
    "- Never invent numbers (prices, scores, ETAs, amounts, distances, rates, dosages). You may ONLY quote numbers that appear in FACTS below. If a figure is needed but missing, say the app will show the exact number and point the user to the right module.",
    "- Never claim you performed an action; you only explain and route.",
    "- Stay strictly on North-East India agriculture, climate, storage, logistics, marketplace, credit and insurance. Politely decline anything else and offer a farming-related alternative.",
    "",
    `Reply language: ${languageName(user.language)}.`,
    `User: ${user.name} (role: ${user.role}), located in ${user.district}, ${user.state}.`,
    "",
    "FACTS (deterministic, code-computed — safe to quote verbatim):",
    facts || "(no specific figures available for this question)",
    "",
    "Modules the user can open: Weather & Climate, AI Crop Diagnosis, Price Intelligence, Facilities Map, Shipments, Early Alerts, Marketplace, Credit & Insurance.",
  ].join("\n");

  const messages = [
    { role: "system" as const, content: system },
    ...(history ?? []).map((turn) =>
      turn.role === "user"
        ? { role: "user" as const, content: turn.text }
        : { role: "assistant" as const, content: turn.text },
    ),
    { role: "user" as const, content: message },
  ];

  try {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.4,
      max_tokens: 320,
      messages,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return jsonError("ai_error", "The assistant returned an empty reply. Please try again.", 502);
    }
    return jsonOk({
      text,
      actions: actionsForIntent(intent),
      intent,
      source: "ai",
      model: AI_MODEL,
    });
  } catch (error) {
    console.error("[assistant] OpenAI request failed:", error);
    return jsonError(
      "ai_error",
      "The assistant is unavailable right now. Please try again.",
      502,
    );
  }
}
