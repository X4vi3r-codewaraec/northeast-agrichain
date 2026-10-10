/** Yield forecasting — deterministic regression-style band (the model later only
 *  narrates it, per the hard rule that numbers are code-computed). */

import { districtGeo } from "@/lib/geo";

export type YieldBand = {
  expected: number; // tonnes
  low: number;
  high: number;
  perHaExpected: number;
  confidence: number; // 0–1
  usesDistrictAverage: boolean;
  factors: { label: string; effectPct: number; note: string }[];
  explanation: string;
};

/** Baseline potential yield, tonnes per hectare under good management. */
export const YIELD_BASE: Record<string, number> = {
  "joha-rice": 3.2,
  "king-chilli": 1.6,
  "lakadong-turmeric": 6.5,
  "queen-pineapple": 18,
  "large-cardamom": 0.9,
  "assam-tea": 2.1,
  kiwi: 9,
  "mizo-ginger": 7.5,
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function yieldForecast(opts: {
  cropId: string;
  areaHa: number;
  district: string;
  rainfallPct: number; // −50..+50 deviation from normal
  irrigation: number; // 0 (rainfed) .. 1 (full)
  organic: boolean;
  seasonsHistory: number; // seasons of on-platform data (0..4)
}): YieldBand {
  const { cropId, areaHa, district, rainfallPct, irrigation, organic, seasonsHistory } = opts;
  const base = YIELD_BASE[cropId] ?? 3;
  const geo = districtGeo(district);
  const elevation = geo?.elevation ?? 150;

  // Rainfall response is a bell: too little or too much both hurt.
  const rainEffect = rainfallPct >= 0 ? -(rainfallPct - 15) * 0.5 : rainfallPct * 0.85;

  const irrigationEffect = irrigation * 12; // up to +12%
  const organicEffect = organic ? 7 : 0;
  const terrainEffect = elevation > 1200 ? -4 : elevation < 60 ? 3 : 0; // higher blocks slightly cooler/slower

  const districtSeed = (hashStr(district + cropId) % 11) - 5; // −5..+5
  const totalPct = rainEffect + irrigationEffect + organicEffect + terrainEffect + districtSeed;
  const perHaExpected = (base * (1 + totalPct / 100));
  const expected = Math.max(0, perHaExpected * areaHa);

  const spread = 0.16 + (elevation > 1200 ? 0.05 : 0) + (rainfallPct > 40 || rainfallPct < -30 ? 0.06 : 0);
  const low = expected * (1 - spread);
  const high = expected * (1 + spread);
  const usesDistrictAverage = seasonsHistory < 2;
  const confidence = Math.min(0.9, 0.45 + seasonsHistory * 0.11 + (usesDistrictAverage ? 0 : 0.05));

  const factors = [
    {
      label: "Rainfall vs normal",
      effectPct: Math.round(rainEffect * 10) / 10,
      note: rainfallPct >= 0 ? `${rainfallPct}% excess vs normal` : `${Math.abs(rainfallPct)}% deficit vs normal`,
    },
    { label: "Irrigation cover", effectPct: Math.round(irrigationEffect * 10) / 10, note: irrigation > 0.5 ? "Assured" : "Mostly rainfed" },
    { label: "Organic practice", effectPct: organicEffect, note: organic ? "Certified organic cycle" : "Conventional" },
    { label: "Block terrain", effectPct: terrainEffect, note: `${district} · ~${elevation} m` },
    { label: "District history", effectPct: districtSeed, note: "Multi-season district average" },
  ];

  const explanation = usesDistrictAverage
    ? `Based on district average for ${district} — fewer than 2 seasons of your farm data. Expected ${expected.toFixed(1)} t (±${Math.round(spread * 100)}%) this season.`
    : `Your own farm history (${seasonsHistory} seasons) plus this season's weather puts ${expected.toFixed(1)} t in the expected band, from a potential of ${(base * areaHa).toFixed(1)} t.`;

  return {
    expected: Math.round(expected * 10) / 10,
    low: Math.round(low * 10) / 10,
    high: Math.round(high * 10) / 10,
    perHaExpected: Math.round(perHaExpected * 100) / 100,
    confidence,
    usesDistrictAverage,
    factors,
    explanation,
  };
}

/** Bars for the "contributing factors" panel (signed, −30..+30 capped). */
export function factorBarWidth(effectPct: number): number {
  return Math.min(100, (Math.abs(effectPct) / 30) * 100);
}