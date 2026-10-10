import type { Metadata } from "next";
import DiagnoseFlow from "@/components/diagnose/diagnose-flow";

export const metadata: Metadata = {
  title: "AI Crop Diagnosis — Northeast AgriChain",
  description:
    "Snap a photo of a diseased leaf and get an instant GPT-4o mini diagnosis with organic and chemical remedies for NER specialty crops.",
};

export default function DiagnosePage() {
  return <DiagnoseFlow />;
}