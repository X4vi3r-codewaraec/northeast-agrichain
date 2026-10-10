/** Credit & weather-index insurance — deterministic scoring + payout math.
 *  Scores/number are code-computed; the LLM (later) only narrates. */

import { districtGeo } from "@/lib/geo";
import { DISTRICT_COORDS } from "@/lib/geo";

export type ClimateRiskLevel = "low" | "medium" | "high";

export function climateRiskScore(district: string): {
  score: number; // 0–100 (higher = riskier)
  level: ClimateRiskLevel;
  factors: { label: string; contribution: number }[];
} {
  const geo = districtGeo(district);
  const elevation = geo?.elevation ?? 120;
  const factors: { label: string; contribution: number }[] = [];

  // Elevation bands: river-valley plots flood more; high plateaus face frost.
  const floodRisk = elevation < 60 ? 40 : elevation < 200 ? 22 : 8;
  factors.push({ label: "Flood / river-valley exposure", contribution: floodRisk });

  const frostRisk = elevation > 1400 ? 26 : elevation > 700 ? 14 : 4;
  factors.push({ label: "Frost risk (elevation)", contribution: frostRisk });

  const monsoonHeavy =
    district === "Cachar" || district === "Dhalai" || district === "Kamrup Metro" ? 16 : 8;
  factors.push({ label: "Monsoon intensity", contribution: monsoonHeavy });

  const soilWash = elevation > 1000 ? 12 : 6;
  factors.push({ label: "Soil wash / slope runoff", contribution: soilWash });

  const score = Math.min(95, Math.round(floodRisk + frostRisk + monsoonHeavy + soilWash + 4));
  const level: ClimateRiskLevel = score >= 60 ? "high" : score >= 35 ? "medium" : "low";
  return { score, level, factors };
}

export type CreditBand = {
  eligible: boolean;
  approvedLakh: number; // in lakh ₹
  ratePct: number;
  tenureMonths: number;
  needs: string[];
};

export function creditAssessment(district: string, incomeAssumed = 6.5): CreditBand {
  const risk = climateRiskScore(district);
  const baseCap = risk.score >= 60 ? 4 : risk.score >= 35 ? 8 : 12;
  // Keep numbers deterministic: approved = f(cap, income)
  const approvedLakh = Math.max(1, Math.round(baseCap * 0.6 + incomeAssumed * 0.35));
  const ratePct = risk.score >= 70 ? 11.5 : risk.score >= 35 ? 9.5 : 8.0;
  const eligible = incomeAssumed >= 3;
  const needs: string[] = [];
  if (risk.factors[0]?.contribution >= 30) needs.push("Flood-proofing spend on the block (drainage, raised storage)");
  if (risk.factors[1]?.contribution >= 20) needs.push("Frost covers for high-valley seedbeds");
  if (approvedLakh < 3) needs.push("Build an 18-month yield/diagnosis history on the platform to unlock top-ups");
  return {
    eligible,
    approvedLakh,
    ratePct,
    tenureMonths: 24,
    needs: needs.length ? needs : ["Farmer-friendly KCC-linked top-up available at renewal"],
  };
}

export type IndexPolicy = {
  cropId: string;
  cropName: string;
  premiumPct: number; // of sum assured
  sumAssuredPerHa: number; // ₹
  trigger: string;
  payoutUnitPerHa: number;
};

export const INDEX_POLICIES: IndexPolicy[] = [
  { cropId: "joha-rice", cropName: "Joha Rice", premiumPct: 4.2, sumAssuredPerHa: 38000, trigger: "Rainfall deficit > 35% in Aug–Sep (block rainfall index)", payoutUnitPerHa: 2750 },
  { cropId: "king-chilli", cropName: "King Chilli", premiumPct: 5.0, sumAssuredPerHa: 42000, trigger: "Rainfall excess > 60% over 3-day window during flowering", payoutUnitPerHa: 3100 },
  { cropId: "large-cardamom", cropName: "Large Cardamom", premiumPct: 4.6, sumAssuredPerHa: 52000, trigger: "Windstorm > 55 km/h in harvest months (station index)", payoutUnitPerHa: 3850 },
];

export function payoutEstimate(policy: IndexPolicy, deviation: number): number {
  // deviation: percentage points beyond trigger (0 → no payout). Deterministic.
  const beyond = Math.max(0, deviation);
  return Math.round((policy.payoutUnitPerHa * beyond) / 10);
}

export function premiumEstimate(policy: IndexPolicy, hectares: number): number {
  return Math.round((policy.sumAssuredPerHa * hectares * policy.premiumPct) / 100);
}

export function riskMeta(level: ClimateRiskLevel): { label: string; cls: string } {
  switch (level) {
    case "low":
      return { label: "Low climate risk", cls: "bg-forest-600" };
    case "medium":
      return { label: "Medium climate risk", cls: "bg-gold-500" };
    case "high":
      return { label: "High climate risk", cls: "bg-red-600" };
  }
}

export function hasCoords(district: string): boolean {
  return district in DISTRICT_COORDS;
}