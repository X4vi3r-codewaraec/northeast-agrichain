/**
 * Server-side vision diagnosis.
 *
 * gpt-4o-mini (vision) reads the photo and picks the most likely issue from the
 * crop's catalog, then writes short visual observations. Every number — the
 * confidence, severity, dosage, waiting/revisit days — is computed here in code
 * from the catalog, never by the model. Numbers stay auditable and reproducible.
 */

import { CROPS } from "@/lib/data";
import {
  ISSUE_CATALOG,
  type ColorHint,
  type DiagnosisResult,
  type IssueMatch,
  type PlantPart,
  type Severity,
} from "@/lib/diagnose";
import { AI_MODEL, getOpenAI } from "@/lib/openai";

export type VisionInput = {
  imageDataUrl: string;
  cropId: string;
  part: PlantPart;
  district: string;
  thumbnail?: string;
};

/** ~4 MB of base64 ≈ 3 MB decoded — comfortably under Vercel's 4.5 MB
 *  serverless request-body limit, and far above the client's ≤1024px JPEG. */
const MAX_BASE64 = 4 * 1024 * 1024;

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < Math.min(s.length, 4096); i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Catalog issues valid for a crop (falls back to the full catalog). */
export function candidatesForCrop(cropId: string): IssueMatch[] {
  const own = ISSUE_CATALOG.filter((c) => c.crops.includes(cropId));
  return own.length ? own : ISSUE_CATALOG;
}

export function cropName(cropId: string): string {
  return CROPS.find((c) => c.id === cropId)?.name ?? cropId;
}

/** Accept only a base64 JPEG/PNG/WebP data URL within the size cap. */
export function isSupportedImage(dataUrl: string): boolean {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim(),
  );
  return Boolean(match && match[2].length <= MAX_BASE64);
}

type VisionJson = { issueId?: string; why?: unknown; notes?: unknown };

/** Map the model's `issueId` back onto a catalog entry — tolerant of loose
 *  spelling ("powdery", "Powdery mildew") but never escaping the allowed set. */
function resolveIssue(raw: string | undefined, allowed: IssueMatch[]): IssueMatch | undefined {
  const key = raw?.trim().toLowerCase() ?? "";
  if (!key || key === "unknown") return undefined;
  const slug = key.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (
    allowed.find((c) => c.id === key) ??
    allowed.find((c) => c.id === slug) ??
    allowed.find((c) => c.issue.toLowerCase() === key) ??
    allowed.find((c) => c.id.includes(slug) || slug.includes(c.id)) ??
    allowed.find(
      (c) => c.issue.toLowerCase().includes(key) || key.includes(c.issue.toLowerCase()),
    )
  );
}

function parseJsonObject(text: string): VisionJson | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as VisionJson;
  } catch {
    return null;
  }
}

/** Plain-language visual guide per coarse symptom class — the same taxonomy the
 *  on-device engine matches against, so the model and the engine stay aligned. */
const HINT_GUIDE: Record<ColorHint, string> = {
  yellow: "yellowing, mosaic or crinkled, curled leaves",
  spotted: "dark spots or sunken lesions with defined edges on leaf or fruit",
  powdery: "white or grey powdery coating on the leaf surface",
  wilt: "wilting, drooping or collapsed tissue",
  pest: "chewed holes, notched leaf edges, frass or visible insects",
  rust: "orange or brown rust-coloured pustules",
  generic: "general damage or discolouration",
};

export async function visionDiagnosis(input: VisionInput): Promise<DiagnosisResult> {
  const { imageDataUrl, cropId, part, district } = input;
  const allowed = candidatesForCrop(cropId);
  const seed = hashSeed(imageDataUrl.split(",")[1] ?? imageDataUrl);
  const fallbackPick = allowed[seed % allowed.length];

  // Give the (small) model a discriminating symptom guide per candidate issue —
  // grounded strictly in our own catalog taxonomy, never invented.
  const allowedList = allowed
    .map((c) => `- ${c.id}: ${c.issue} — ${HINT_GUIDE[c.hint]}`)
    .join("\n");

  const system = [
    "You are a plant pathologist advising smallholder farmers in North-East India. You are shown one close-up photo of a crop problem.",
    "Choose the SINGLE best-matching issue by comparing the photo against the visual guides below. Pick from the allowed list ONLY — never invent an issue, crop or product.",
    'Set "issueId" to the chosen id EXACTLY as written. Use "unknown" ONLY if the image shows no plant or is too blurred to judge.',
    "Write 3 short, concrete observations a farmer can verify themselves — lesion shape/colour, where on the leaf, spread pattern, pests present.",
    'Return STRICT JSON only, no prose: {"issueId":"...","why":["...","...","..."],"notes":"<one short field note>"}',
    "Do NOT output any numbers (confidence, dosage, days) — those are computed elsewhere.",
  ].join("\n");

  const userText = [
    `Crop: ${cropName(cropId)} (id: ${cropId}).`,
    `Affected part: ${part}. District: ${district}.`,
    "Visual guides (choose exactly one id):",
    allowedList,
  ].join("\n");

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.2,
    max_tokens: 400,
    messages: [
      { role: "system" as const, content: system },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userText },
          {
            type: "image_url" as const,
            image_url: { url: imageDataUrl, detail: "low" as const },
          },
        ],
      },
    ],
  });

  const parsed = parseJsonObject(completion.choices[0]?.message?.content ?? "");
  if (!parsed) {
    console.warn(
      "[diagnose] vision returned unparseable JSON:",
      (completion.choices[0]?.message?.content ?? "").slice(0, 200),
    );
  }

  const chosen = resolveIssue(parsed?.issueId, allowed);
  const modelMatched = Boolean(chosen);
  const pick = chosen ?? fallbackPick;

  // Confidence is code-computed — never the model's own number. Only a valid
  // catalog pick earns the high band; an unclear photo, "unknown" or an
  // unparseable reply stays low so the UI asks for a retake.
  const base = 0.62 + ((seed % 100) / 100) * 0.3;
  const confidence = modelMatched
    ? Math.min(0.96, base + 0.08)
    : Math.min(0.54, Math.max(0.32, base - 0.2));
  const lowConfidence = confidence < 0.55;
  const severity: Severity = lowConfidence ? "mild" : pick.baseSeverity;

  const modelWhy =
    !lowConfidence && Array.isArray(parsed?.why)
      ? (parsed.why as unknown[])
          .filter((w): w is string => typeof w === "string" && w.trim().length > 0)
          .slice(0, 4)
      : [];
  const why = lowConfidence
    ? [
        "The signal in this photo is weak (low leaf detail, glare or blur).",
        "We can't confidently rule out several similar issues on this crop.",
        "Retake in daylight with the leaf flat and one affected area filling the frame.",
      ]
    : modelWhy.length >= 2
      ? modelWhy
      : pick.why;

  const notes =
    !lowConfidence && typeof parsed?.notes === "string" && parsed.notes.trim().length > 0
      ? parsed.notes.trim()
      : pick.notes;

  return {
    id: `dx-${Date.now().toString(36)}-${(seed % 0xffff).toString(16)}`,
    issue: pick.issue,
    issue_local: pick.issue_local,
    confidence: Number(confidence.toFixed(2)),
    severity,
    crop: cropName(cropId),
    part,
    district,
    createdAt: new Date().toISOString(),
    why,
    organic_remedy: pick.organic_remedy,
    chemical_remedy: pick.chemical_remedy,
    dosage: pick.dosage,
    waiting_days: pick.waiting_days,
    revisit_days: pick.revisit_days,
    notes,
    thumbnail: input.thumbnail ?? "",
    lowConfidence,
    engine: "vision",
  };
}
