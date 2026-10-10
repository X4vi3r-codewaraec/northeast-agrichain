import OpenAI from "openai";

export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

let client: OpenAI | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Lazily construct the OpenAI client so the key is never needed at build time. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  if (!client) client = new OpenAI({ apiKey });
  return client;
}
