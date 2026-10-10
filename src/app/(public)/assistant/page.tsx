import type { Metadata } from "next";
import AssistantChat from "@/components/assistant/assistant-chat";

export const metadata: Metadata = {
  title: "Agri Assistant — Northeast AgriChain",
  description:
    "Voice-first GPT-4o mini assistant for NER farming: sowing, weather, crop diagnosis, prices, storage, shipments and credit.",
};

export default function AssistantPage() {
  return <AssistantChat />;
}