"use client";

import type { DiagnosisResult, PlantPart } from "@/lib/diagnose";
import { apiFetch } from "./api-client";

/** Read a leaf photo with gpt-4o mini vision. Throws on any failure so the
 *  caller can fall back to the deterministic on-device engine. */
export function analyzeDiagnosis(input: {
  image: string;
  cropId: string;
  part: PlantPart;
  district: string;
  thumbnail?: string;
}) {
  return apiFetch<DiagnosisResult>("/api/v1/diagnose/analyze", {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
}
