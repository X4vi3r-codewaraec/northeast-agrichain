"use client";

import type { AssistantAction } from "@/lib/assistant";
import { apiFetch } from "./api-client";

export type AssistantChatTurn = { role: "user" | "assistant"; text: string };

export type AssistantChatResponse = {
  text: string;
  actions: AssistantAction[];
  intent: string;
  source: "ai" | "rules";
  model: string;
};

/** Ask the grounded server assistant (gpt-4o mini). Throws on any failure. */
export function chatWithAssistant(input: {
  message: string;
  history?: AssistantChatTurn[];
}) {
  return apiFetch<AssistantChatResponse>("/api/v1/assistant/chat", {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
}
