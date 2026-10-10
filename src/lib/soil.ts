/** Soil & nutrient advisory — deterministic rules table (numeric guidance comes
 *  from here, never the LLM; gpt-4o mini only narrates later). Tuned for the
 *  acidic hill soils of the North-East. */

export type NutrientStatus = "low" | "ok" | "high";

export type SoilInput = {
  ph: number;
  n: number; // kg/ha available nitrogen
  p: number; // kg/ha available phosphorus
  k: number; // kg/ha available potassium
  oc: number; // organic carbon %
};

export type Gauge = {
  key: keyof SoilInput;
  label: string;
  value: number;
  unit: string;
  optimal: [number, number];
  status: NutrientStatus;
  note: string;
};

export type Practice = {
  title: string;
  detail: string;
  dosage: string;
  kind: "organic" | "mineral";
  costPerHa: number;
};

export type SoilAdvisory = {
  gauges: Gauge[];
  practices: Practice[];
  tasks: string[];
  costTotal: number;
  summary: string;
  score: number; // 0–100 soil health
};

export const SOIL_DEFAULTS: SoilInput = { ph: 5.2, n: 240, p: 18, k: 120, oc: 0.55 };

function status(v: number, [lo, hi]: [number, number]): NutrientStatus {
  if (v < lo) return "low";
  if (v > hi) return "high";
  return "ok";
}

const RANGES: Record<keyof SoilInput, [number, number]> = {
  ph: [5.5, 6.5],
  n: [280, 560],
  p: [22, 50],
  k: [130, 280],
  oc: [0.75, 2.5],
};

const LABEL: Record<keyof SoilInput, { label: string; unit: string }> = {
  ph: { label: "pH (acidity)", unit: "" },
  n: { label: "Available N", unit: "kg/ha" },
  p: { label: "Available P", unit: "kg/ha" },
  k: { label: "Available K", unit: "kg/ha" },
  oc: { label: "Organic carbon", unit: "%" },
};

export function soilGauges(input: SoilInput): Gauge[] {
  return (Object.keys(RANGES) as (keyof SoilInput)[]).map((key) => {
    const optimal = RANGES[key];
    const st = status(input[key], optimal);
    const note =
      st === "ok"
        ? "In the healthy band for NER upland soils."
        : st === "low"
          ? key === "ph"
            ? "Below 5.5 — free aluminium can lock up phosphate."
            : "Deficient — yields respond well to correction this season."
          : key === "ph"
            ? "Too alkaline for these crops — favour acidifying organic matter."
            : "Above requirement — skip this input this season to cut cost.";
    return { key, label: LABEL[key].label, value: input[key], unit: LABEL[key].unit, optimal, status: st, note };
  });
}

export function soilAdvisory(input: SoilInput, district: string): SoilAdvisory {
  const gauges = soilGauges(input);
  const practices: Practice[] = [];

  if (input.ph < 5.5) {
    practices.push({
      title: "Apply agricultural lime (dolomite)",
      detail: "Split-apply before the sowing rains; re-test pH after one season. Raises pH and unlocks P.",
      dosage: `${((5.8 - input.ph) * 2).toFixed(1)} t/ha (split in two doses)`,
      kind: "mineral",
      costPerHa: 5600,
    });
  } else if (input.ph > 6.8) {
    practices.push({
      title: "Acidify with organic matter",
      detail: "Add pine-leaf compost / FYM and avoid liming; gypsum only if sodium is also high.",
      dosage: "2 t/ha compost, no lime",
      kind: "organic",
      costPerHa: 2400,
    });
  }

  if (input.oc < 0.75) {
    practices.push({
      title: "Build organic carbon",
      detail: "Well-rotted FYM/vermicompost plus a green-manure (sunhemp) cover crop before the next cycle.",
      dosage: "2.5 t/ha FYM + 20 kg/ha sunhemp seed",
      kind: "organic",
      costPerHa: 4200,
    });
  }

  if (input.n < 280) {
    practices.push({
      title: "Split-dress nitrogen",
      detail: "Two splits (tillering + panicle/branching). Pair with bio-fertiliser to cut losses.",
      dosage: `${Math.max(10, Math.round((360 - input.n) * 0.16))} kg urea/ha, in 2 splits`,
      kind: "mineral",
      costPerHa: 1900,
    });
  }

  if (input.p < 22) {
    practices.push({
      title: "Correct phosphorus",
      detail: "Rock phosphate (with FYM) on acidic plots releases slowly; band-place rather than broadcast.",
      dosage: "50 kg/ha rock phosphate + FYM",
      kind: "mineral",
      costPerHa: 2600,
    });
  }

  if (input.k < 130) {
    practices.push({
      title: "Top up potassium",
      detail: "Muriate of potash at the fruiting stage improves size and keeping quality.",
      dosage: "40 kg MOP/ha",
      kind: "mineral",
      costPerHa: 1700,
    });
  }

  if (practices.length === 0) {
    practices.push({
      title: "Maintain the balance",
      detail: "No correction needed. Keep the organic cycle going and re-test after harvest.",
      dosage: "1.5 t/ha FYM maintenance",
      kind: "organic",
      costPerHa: 1800,
    });
  }

  const tasks = [
    "Re-test soil after the current crop (1 test / 2 years).",
    input.ph < 5.5 ? "Apply lime at least 3 weeks before sowing." : "Keep rows mulched to protect topsoil.",
    "Split nitrogen — never apply the full dose at once on hill slopes.",
    "Compost plot residue away from the drainage line.",
  ];

  const costTotal = practices.reduce((s, p) => s + p.costPerHa, 0);
  const okCount = gauges.filter((g) => g.status === "ok").length;
  const score = Math.round((okCount / gauges.length) * 100);

  const lows = gauges.filter((g) => g.status === "low").map((g) => g.label);
  const summary =
    lows.length === 0
      ? `Your ${district} plot is in good nutrient balance. Keep the organic cycle going and re-test after harvest.`
      : `Key gaps in ${district}: ${lows.join(", ")}. Correcting these this season is the cheapest yield gain available — roughly ₹${costTotal.toLocaleString("en-IN")}/ha of inputs.`;

  return { gauges, practices, tasks, costTotal, summary, score };
}

export const SOIL_TEST_CENTERS: Record<string, string> = {
  "Kamrup Metro": "Assam Soil Testing Lab, Khanapara, Guwahati",
  Jorhat: "Krishi Vigyan Kendra Soil Lab, Jorhat",
  Dibrugarh: "Dibrugarh Soil Testing Centre, Chowkidinghee",
  Nagaon: "Nagaon District Soil Lab, Amolapatty",
  Cachar: "Barak Valley Soil Lab, Silchar",
  "East Khasi Hills": "ICAR Soil Lab, Umiam (Barapani)",
  "Ri-Bhoi": "KVK Ri-Bhoi Soil Testing Unit, Nongpoh",
  "Jaintia Hills": "Jowai Soil Testing Centre",
  "Papum Pare": "Arunachal Soil Lab, Naharlagun",
  "West Siang": "Aalo Soil & Water Testing Lab",
  "Lower Subansiri": "Ziro KVK Soil Lab",
  Kohima: "Nagaland Soil Testing Lab, Kohima",
  Dimapur: "Dimapur Soil Testing Centre",
  Mokokchung: "Mokokchung KVK Soil Lab",
  "Imphal West": "Manipur Soil Testing Lab, Imphal",
  Thoubal: "Thoubal Soil Testing Unit",
  Churachandpur: "Churachandpur KVK Soil Lab",
  Aizawl: "Mizoram Soil Testing Centre, Aizawl",
  Lunglei: "Lunglei Soil & Water Lab",
  Champhai: "Champhai KVK Soil Lab",
  "West Tripura": "Tripura Soil Testing Lab, Agartala",
  Dhalai: "Dhalai Soil Testing Unit, Ambassa",
  Gomati: "Gomati KVK Soil Lab, Udaipur",
  "East Sikkim": "Sikkim Soil Testing Lab, Gangtok",
  "West Sikkim": "Gyalshing Soil Testing Centre",
  "North Sikkim": "Mangan Soil & Water Lab",
};

export function centerFor(district: string): string {
  return SOIL_TEST_CENTERS[district] ?? "Nearest KVK soil testing laboratory";
}

export function nutrientStatusMeta(s: NutrientStatus): { label: string; cls: string } {
  switch (s) {
    case "low":
      return { label: "Low", cls: "bg-red-600 text-white" };
    case "ok":
      return { label: "Balanced", cls: "bg-forest-600 text-white" };
    case "high":
      return { label: "High", cls: "bg-gold-500 text-ink-900" };
  }
}