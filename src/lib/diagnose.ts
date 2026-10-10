/** AI Crop Diagnosis — demo engine + image pre-processing.
 *
 *  Mirrors the FastAPI `POST /diagnose` contract from PLAN §5 (model
 *  `gpt-4o-mini`, temperature 0.2, strict JSON schema). Until the backend
 *  ships, a deterministic on-device engine returns the same schema from the
 *  photo's colour signature + crop context. All numbers are code-computed —
 *  the model (later) only fills the text fields.
 */

export const DIAGNOSE_MODEL = "gpt-4o-mini";

export type PlantPart = "leaf" | "fruit" | "stem" | "whole";

export type Severity = "mild" | "moderate" | "severe";

export type DiagnosisResult = {
  id: string;
  issue: string;
  issue_local: string;
  confidence: number; // 0–1
  severity: Severity;
  crop: string;
  part: PlantPart;
  district: string;
  createdAt: string; // ISO
  why: string[];
  organic_remedy: string;
  chemical_remedy: string;
  dosage: string;
  waiting_days: number;
  revisit_days: number;
  notes: string;
  thumbnail: string; // small data URL for history
  lowConfidence: boolean;
  /** Which engine produced the text fields (numbers always come from the catalog). */
  engine?: "vision" | "on-device";
};

export type DiagnosisStage =
  | "idle"
  | "preparing"
  | "context"
  | "vision"
  | "remedy"
  | "done"
  | "failed";

export const STAGE_LABELS: Record<Exclude<DiagnosisStage, "idle" | "done" | "failed">, string> = {
  preparing: "Preparing your photo (compressing for hill bandwidth)…",
  context: "Loading crop + district context…",
  vision: "GPT-4o mini is reading the leaf…",
  remedy: "Matching organic & chemical remedies…",
};

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.8;
const MAX_BYTES = 1.5 * 1024 * 1024;

/** Downsize + re-encode an image per the ≤1.5 MB hill-bandwidth rule. */
export function prepareImage(file: File): Promise<{ dataUrl: string; thumb: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && file.type !== "image/jpeg") {
      reject(new Error("unsupported-format"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const bytes = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
        // small thumbnail for history list
        const tscale = Math.min(1, 96 / w);
        const tc = document.createElement("canvas");
        tc.width = Math.max(1, Math.round(w * tscale));
        tc.height = Math.max(1, Math.round(h * tscale));
        const tctx = tc.getContext("2d");
        if (!tctx) throw new Error("canvas");
        tctx.drawImage(img, 0, 0, tc.width, tc.height);
        const thumb = tc.toDataURL("image/jpeg", 0.7);
        URL.revokeObjectURL(url);
        resolve({ dataUrl, thumb, bytes: Math.min(bytes, MAX_BYTES) });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

export type ColorHint =
  | "yellow"
  | "spotted"
  | "powdery"
  | "wilt"
  | "pest"
  | "rust"
  | "generic";

/** Classify a small canvas' dominant colour signature into a symptom hint. */
function colorHint(image: HTMLImageElement): ColorHint {
  const c = document.createElement("canvas");
  c.width = 24;
  c.height = 24;
  const ctx = c.getContext("2d");
  if (!ctx) return "generic";
  ctx.drawImage(image, 0, 0, 24, 24);
  const d = ctx.getImageData(0, 0, 24, 24).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let lumSum = 0;
  let lumSq = 0;
  let darkPixels = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    lumSum += lum;
    lumSq += lum * lum;
    if (lum < 90) darkPixels++;
  }
  const n = d.length / 4;
  r /= n;
  g /= n;
  b /= n;
  const mean = lumSum / n;
  const std = Math.sqrt(lumSq / n - mean * mean);
  const darkRatio = darkPixels / n;

  if (r > 110 && r > g + 15 && g > b) return "rust";
  if (r > 100 && g > 80 && b < 90 && r - b > 40) return "rust";
  if (g > r && g > b && r > 110 && g - b > 30 && mean > 120) return "yellow";
  if (std < 9 && mean > 150) return "yellow";
  if (darkRatio > 0.35) return "wilt";
  if (std < 26) return "powdery";
  if (std > 55) return "pest";
  if (g < 130 && r < 130 && b < 110) return "wilt";
  return "spotted";
}

export type IssueMatch = {
  id: string;
  issue: string;
  issue_local: string;
  crops: string[];
  hint: ColorHint;
  why: string[];
  organic_remedy: string;
  chemical_remedy: string;
  dosage: string;
  waiting_days: number;
  revisit_days: number;
  notes: string;
  baseSeverity: Severity;
};

/** Deterministic issue catalog — the single source of every number the
 *  diagnosis returns (severity, dosage, waiting/revisit days). Shared by the
 *  on-device engine and the server-side vision route. */
export const ISSUE_CATALOG: IssueMatch[] = [
  {
    id: "blast",
    issue: "Rice leaf blast",
    issue_local: "পাতে ধসা / झुलसा रोग",
    crops: ["joha-rice"],
    hint: "spotted",
    why: [
      "Grey-green lesions with dark, diamond-shaped borders typical of Pyricularia oryzae.",
      "Lesion density is highest near the leaf tip — matches early blast spread in humid paddies.",
      "Consistent with recent warm, wet nights favouring spore germination.",
    ],
    organic_remedy: "Spray neem-based botanical (2.5 ml/L) + trichoderma seed-bed drench at 5 g/L.",
    chemical_remedy: "Tricyclazole 75% WP",
    dosage: "0.6 g/L water, two sprays 10 days apart",
    waiting_days: 14,
    revisit_days: 5,
    notes: "Drain field before spraying; avoid nitrogen overload in the current tiller stage.",
    baseSeverity: "moderate",
  },
  {
    id: "blb",
    issue: "Bacterial leaf blight (BLB)",
    issue_local: "জীৱাণু পাত দাহ / जीवाणु झुलसा",
    crops: ["joha-rice"],
    hint: "wilt",
    why: [
      "Wavy yellow-to-white lesions running from the leaf edge — hallmark of Xanthomonas oryzae.",
      "Milk-like bacterial droplets visible on early-morning leaves.",
      "Sporadic outbreak pattern fits the recent rain splash + wind corridor.",
    ],
    organic_remedy: "Copper-soap spray (3 g copper oxychloride + mild soap per L) weekly for 3 rounds.",
    chemical_remedy: "Copper oxychloride 50% WP + streptocycline",
    dosage: "2.5 g + 0.1 g per L, two sprays 12 days apart",
    waiting_days: 21,
    revisit_days: 7,
    notes: "Avoid cutting fresh wounds through the field; disinfect tools between plots.",
    baseSeverity: "severe",
  },
  {
    id: "armyworm",
    issue: "Fall armyworm damage",
    issue_local: "পোৰা খেদা পোক / तना छेदक",
    crops: ["king-chilli", "joha-rice"],
    hint: "pest",
    why: [
      "Irregular window-pane holes with frass — classic small-larvae FAW feeding.",
      "Fresh feeding along the whorl margin suggests an active infestation, not residue.",
      "Shows the V-shaped notch signature along the leaf edge under magnification.",
    ],
    organic_remedy: "Hand-pick egg masses; apply neem-azadirachtin (1500 ppm) 5 ml/L + yellow-sticky traps.",
    chemical_remedy: "Emamectin benzoate 5% SG",
    dosage: "0.4 g/L, one well-timed dusk spray",
    waiting_days: 10,
    revisit_days: 4,
    notes: "Scout 20 plants/acre at dawn; treat again if 20% whorls show fresh damage.",
    baseSeverity: "severe",
  },
  {
    id: "powdery-mildew",
    issue: "Powdery mildew",
    issue_local: "গুড়ি বেমাৰ / करिया रोग",
    crops: ["king-chilli", "mizo-ginger", "kiwi"],
    hint: "powdery",
    why: [
      "White, talcum-like fungal coating across the upper leaf surface.",
      "Patchy distribution on older leaves with curling new growth.",
      "Typical of dry-day/wet-night microclimate common in October hill valleys.",
    ],
    organic_remedy: "Milk spray (1 part milk : 9 parts water) weekly; keep rows airy.",
    chemical_remedy: "Sulfur 80% WG or wettable sulfur",
    dosage: "2 g/L, 2 sprays 10 days apart",
    waiting_days: 7,
    revisit_days: 7,
    notes: "Do not apply sulfur within 14 days of an oil spray or during >32 °C afternoons.",
    baseSeverity: "mild",
  },
  {
    id: "anthracnose",
    issue: "Anthracnose (fruit rot)",
    issue_local: "পচা ফল ৰোগ / एन्थ्राक्नोज़",
    crops: ["king-chilli", "mizo-ginger", "queen-pineapple", "large-cardamom"],
    hint: "spotted",
    why: [
      "Sunken concentric rings on fruit with salmon-pink spore masses in wet weather.",
      "Lesions clustering near the fruit shoulder where water pools.",
      "Chilli wet-monsoon corridor + recent humidity favours Colletotrichum spread.",
    ],
    organic_remedy: "Bordeaux mixture 1% at fruit set; remove and bury infected fruit.",
    chemical_remedy: "Carbendazim 12% + mancozeb 63% WP",
    dosage: "2 g/L at flowering and 15 days later",
    waiting_days: 15,
    revisit_days: 6,
    notes: "Harvest marks the safe window; disinfect baskets between trips.",
    baseSeverity: "moderate",
  },
  {
    id: "leaf-curl",
    issue: "Chilli leaf curl virus",
    issue_local: "পাত মূৰা ভাইৰাছ / पत्ता मरोड़",
    crops: ["king-chilli", "queen-pineapple"],
    hint: "yellow",
    why: [
      "Cupped, crinkled new leaves with yellow mosaic between veins.",
      "Whitefly honeydew flecks on the lower leaf surface.",
      "Spread pattern follows the whitefly migration from the neighbouring plot.",
    ],
    organic_remedy: "Install yellow sticky traps (10/ft²) and a neem-oil 2 ml/L weekly cover spray.",
    chemical_remedy: "Imidacloprid 17.8% SL (vector control)",
    dosage: "0.3 ml/L on the underside of young leaves, 2 sprays",
    waiting_days: 7,
    revisit_days: 7,
    notes: "Rogue heavily infected plants out of the field straight away — the virus is not curable once set.",
    baseSeverity: "severe",
  },
  {
    id: "rhizome-rot",
    issue: "Rhizome rot (soft rot)",
    issue_local: "গুটি পচা / प्रकंद सड़न",
    crops: ["lakadong-turmeric", "mizo-ginger"],
    hint: "wilt",
    why: [
      "Wet, foul-smelling rhizome rot with yellowing leaf tips — Pythium complex.",
      "Damping-off ring visible where the shoot meets the rhizome.",
      "Poorly drained plot + heavy rain window matches the onset pattern.",
    ],
    organic_remedy: "Drench Trichoderma viride (5 g/L) at planting and every 30 days; ridge high.",
    chemical_remedy: "Metalaxyl + mancozeb 72% WP",
    dosage: "2.5 g/L as basin drench, 3 rounds 20 days apart",
    waiting_days: 30,
    revisit_days: 10,
    notes: "Cure planting material in shade for 2 days; discard softened sets immediately.",
    baseSeverity: "severe",
  },
  {
    id: "blister-blight",
    issue: "Tea blister blight",
    issue_local: "চাহ ফুলকা / चाय फफूंद",
    crops: ["assam-tea"],
    hint: "spotted",
    why: [
      "Translucent oil-spot lesions turning pale-gold on young leaves.",
      "Damage concentrated in the fresh pluck — the susceptible leaf stage.",
      "High humidity over the last 72 h matches blister-blight epidemiology.",
    ],
    organic_remedy: "Wider plucking rounds + shaded-row pruning to dry the canopy faster.",
    chemical_remedy: "Copper oxychloride 50% WP",
    dosage: "2 g/L at 10-day intervals during wet weeks",
    waiting_days: 7,
    revisit_days: 5,
    notes: "Pluck and burn severely blighted shoots outside the garden.",
    baseSeverity: "moderate",
  },
  {
    id: "cardamom-virus",
    issue: "Cardamom foorkey (mosaic virus)",
    issue_local: "এলাচি ফুৰকি / इलायची मोज़ेक",
    crops: ["large-cardamom"],
    hint: "yellow",
    why: [
      "Chlorotic mosaic and distorted tillers on young shoots.",
      "Spread clumps along the plantation edge — classic aphid-driven pattern.",
      "New suckers show the most severe symptoms, as expected for early infection.",
    ],
    organic_remedy: "Uproot and burn infected clumps; plant virus-free tissue-culture suckers.",
    chemical_remedy: "Dimethoate 30% EC (aphid vector)",
    dosage: "1.7 ml/L, two sprays 15 days apart",
    waiting_days: 21,
    revisit_days: 12,
    notes: "Cordon off the infected block; no suckers from this clump for planting.",
    baseSeverity: "severe",
  },
  {
    id: "kiwi-canker",
    issue: "Kiwi bacterial canker (PSA)",
    issue_local: "কিৱি কেঙ্কাৰ / कीवी कैंकर",
    crops: ["kiwi"],
    hint: "rust",
    why: [
      "Red-rust exudate oozing from leaf scars — Pseudomonas syringae pv. actinidiae.",
      "Brown angular leaf spots with a pale halo on the current season's growth.",
      "Symptoms intensify after frost or hail damage events.",
    ],
    organic_remedy: "Copper-soap sprays during bud break; sanitise pruning tools in 70% spirit.",
    chemical_remedy: "Copper hydroxide 77% WP",
    dosage: "1.5 g/L at leaf-fall and bud break (3 sprays)",
    waiting_days: 28,
    revisit_days: 14,
    notes: "Prune in dry weather only and remove exuding cankers below the visible margin.",
    baseSeverity: "severe",
  },
  {
    id: "nutrient-yellowing",
    issue: "Nutrient deficiency (N / Fe yellowing)",
    issue_local: "পুষ্টিহীনতা / पोषक तत्व की कमी",
    crops: ["joha-rice", "king-chilli", "kiwi", "queen-pineapple", "assam-tea", "large-cardamom", "lakadong-turmeric", "mizo-ginger"],
    hint: "yellow",
    why: [
      "Uniform interveinal chlorosis starting on the oldest leaves — N deficiency pattern.",
      "Young leaves pale with green veins — iron deficiency on the acidic highland soil.",
      "No pathogen structures seen; pattern is field-wide rather than patchy/localised.",
    ],
    organic_remedy: "Apply well-rotted FYM/vermicompost 2 t/acre + foliar seaweed extract fortnightly.",
    chemical_remedy: "Urea 46% N (N) or Fe-EDTA 12% (Fe)",
    dosage: "N: 15 kg urea/acre split-dressed; Fe: 0.5 g/L foliar, 2 sprays",
    waiting_days: 7,
    revisit_days: 10,
    notes: "Confirm with a soil card before dosing — never blanket-apply iron on acid soils.",
    baseSeverity: "mild",
  },
];

/** Run the demo diagnosis. Deterministic per (image signature, crop, part, district). */
export async function runMockDiagnosis(opts: {
  imageDataUrl: string;
  thumb: string;
  cropId: string;
  cropName: string;
  part: PlantPart;
  district: string;
}): Promise<DiagnosisResult> {
  const { imageDataUrl, thumb, cropId, cropName, part, district } = opts;

  // Hash the image bytes → deterministic seed.
  const byteStr = imageDataUrl.split(",")[1] ?? imageDataUrl;
  let seed = 2166136261;
  for (let i = 0; i < Math.min(byteStr.length, 4096); i++) {
    seed ^= byteStr.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  seed = seed >>> 0;

  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("unreadable"));
    img.src = imageDataUrl;
  });
  const hint = colorHint(img);
  const candidates = ISSUE_CATALOG.filter(
    (c) => c.crops.includes(cropId) && (c.hint === hint || !c.crops.some((x) => x === cropId)),
  ).length
    ? ISSUE_CATALOG.filter((c) => c.crops.includes(cropId) && c.hint === hint)
    : ISSUE_CATALOG.filter((c) => c.crops.includes(cropId));

  const pool = candidates.length ? candidates : [ISSUE_CATALOG[0]];
  const pick = pool[(seed % 97) % pool.length];

  // Confidence: strong hint match boosts it; weak signal lowers it.
  const matched = candidates.length > 0;
  const base = 0.62 + ((seed % 100) / 100) * 0.3;
  const confidence = matched ? Math.min(0.96, base + 0.08) : Math.max(0.4, base - 0.12);
  const lowConfidence = confidence < 0.55;
  const severity = lowConfidence ? "mild" : pick.baseSeverity;

  const why = lowConfidence
    ? [
        "The signal in this photo is weak (low leaf detail, glare or blur).",
        "We can't confidently rule out several similar issues on this crop.",
        "Retake in daylight with the leaf flat and one affected area filling the frame.",
      ]
    : pick.why;

  return {
    id: `dx-${Date.now().toString(36)}-${(seed % 0xffff).toString(16)}`,
    issue: pick.issue,
    issue_local: pick.issue_local,
    confidence: Number(confidence.toFixed(2)),
    severity,
    crop: cropName,
    part,
    district,
    createdAt: new Date().toISOString(),
    why,
    organic_remedy: pick.organic_remedy,
    chemical_remedy: pick.chemical_remedy,
    dosage: pick.dosage,
    waiting_days: pick.waiting_days,
    revisit_days: pick.revisit_days,
    notes: pick.notes,
    thumbnail: thumb,
    lowConfidence,
    engine: "on-device",
  };
}

export function severityMeta(s: Severity) {
  switch (s) {
    case "severe":
      return { label: "Severe — act this week", chip: "bg-red-600 text-white" };
    case "moderate":
      return { label: "Moderate — treat within days", chip: "bg-orange-500 text-white" };
    case "mild":
      return { label: "Mild — monitor", chip: "bg-yellow-400 text-yellow-950" };
  }
}

/* ------------------------------------------------------------------ */
/* Detail by id — deep-linkable result page                            */
/* ------------------------------------------------------------------ */

const DEMO_CONTEXT: { cropId: string; crop: string; district: string }[] = [
  { cropId: "king-chilli", crop: "King Chilli", district: "Mokokchung" },
  { cropId: "joha-rice", crop: "Joha Rice", district: "Jorhat" },
  { cropId: "mizo-ginger", crop: "Mizo Ginger", district: "Champhai" },
  { cropId: "large-cardamom", crop: "Large Cardamom", district: "East Sikkim" },
  { cropId: "lakadong-turmeric", crop: "Lakadong Turmeric", district: "Jaintia Hills" },
  { cropId: "queen-pineapple", crop: "Queen Pineapple", district: "West Tripura" },
  { cropId: "kiwi", crop: "Kiwi", district: "Lower Subansiri" },
];

/** Deterministic diagnosis for any id — lets `/diagnose/[id]` deep-link even
 *  when the on-device history isn't present (e.g. shared links, new device). */
export function diagnosisById(id: string): DiagnosisResult {
  let seed = 2166136261;
  for (let i = 0; i < id.length; i++) {
    seed ^= id.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  seed = seed >>> 0;

  const ctx = DEMO_CONTEXT[seed % DEMO_CONTEXT.length];
  const candidates = ISSUE_CATALOG.filter((c) => c.crops.includes(ctx.cropId));
  const pool = candidates.length ? candidates : ISSUE_CATALOG;
  const pick = pool[(seed >> 3) % pool.length];
  const confidence = Number((0.7 + ((seed >>> 5) % 26) / 100).toFixed(2));
  const part: PlantPart = (["leaf", "fruit", "stem", "whole"] as PlantPart[])[seed % 4];

  return {
    id,
    issue: pick.issue,
    issue_local: pick.issue_local,
    confidence,
    severity: pick.baseSeverity,
    crop: ctx.crop,
    part,
    district: ctx.district,
    createdAt: "2026-10-02T08:30:00.000Z",
    why: pick.why,
    organic_remedy: pick.organic_remedy,
    chemical_remedy: pick.chemical_remedy,
    dosage: pick.dosage,
    waiting_days: pick.waiting_days,
    revisit_days: pick.revisit_days,
    notes: pick.notes,
    thumbnail: "",
    lowConfidence: confidence < 0.55,
    engine: "on-device",
  };
}