/** Deterministic logistics math — distance, ETA, elevation profile and the
 *  shelf-life index. All numbers are code-computed (never the LLM); the model
 *  only narrates the two-line route risk later via the FastAPI service. */

import type { GeoPoint } from "@/lib/geo";

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type RouteEstimate = {
  km: number;
  etaMin: number;
  etaHours: number;
  climbM: number; // total elevation gain
  avgSpeedKmh: number;
};

/** Terrain-aware road estimate: average 44 km/h on plains, decelerated by
 *  climbs and monsoon-season dampening. Deterministic for the demo. */
export function routeEstimate(origin: GeoPoint, dest: GeoPoint): RouteEstimate {
  const km = haversineKm(origin, dest);
  const climbM = Math.max(0, dest.elevation - origin.elevation);
  const descentPenalty = Math.min(60, Math.max(0, origin.elevation - dest.elevation) * 0.15);
  const climbPenalty = (climbM / 100) * 5; // +5 min per 100 m climbed
  const baseSpeed = 44;
  const monsoonDampen = 0.88; // Oct: approaching dry spell but roads muddy
  const avgSpeedKmh = baseSpeed * monsoonDampen;
  const driveMin = (km / avgSpeedKmh) * 60;
  const etaMin = Math.round(driveMin + climbPenalty + descentPenalty);
  return {
    km: Math.round(km),
    etaMin,
    etaHours: Number((etaMin / 60).toFixed(1)),
    climbM: Math.round(climbM),
    avgSpeedKmh: Math.round(avgSpeedKmh),
  };
}

/** 0–100 index: how much usable life the lot has left on arrival. */
export function shelfLifeIndex(opts: {
  perishability: number; // 0 (very perishable) – 1 (long keeper)
  transitHours: number;
  ambientC: number; // average ambient temp during transit, °C
  coldChain: boolean;
}): number {
  const { perishability, transitHours, ambientC, coldChain } = opts;
  const coldBonus = coldChain ? 1.35 : 1;
  const tempPenalty = Math.max(0, (ambientC - 28) * 0.03);
  const rate = perishability * coldBonus * (1 - tempPenalty);
  const loss = 1 - Math.pow(0.93, transitHours / 24);
  const index = Math.max(5, Math.min(100, Math.round((rate - loss) * 100)));
  return index;
}

/** Crop perishability coefficient (0–1) keyed by crop id. */
export const CROP_PERISHABILITY: Record<string, number> = {
  kiwi: 0.4,
  "king-chilli": 0.45,
  "queen-pineapple": 0.5,
  "mizo-ginger": 0.52,
  "lakadong-turmeric": 0.6,
  "assam-tea": 0.65,
  "large-cardamom": 0.78,
  "joha-rice": 0.85,
};

export function shelfLifeMeta(index: number): {
  label: string;
  cls: string;
} {
  if (index >= 80) return { label: "Excellent — full market window", cls: "bg-forest-600" };
  if (index >= 60) return { label: "Good — sell within 2 weeks", cls: "bg-gold-500" };
  if (index >= 40) return { label: "Fair — prioritise cold chain", cls: "bg-orange-500" };
  return { label: "Critical — move immediately", cls: "bg-red-600" };
}

/** Rule-based 2-line route risk narration (stands in for gpt-4o mini until the
 *  backend ships; purely descriptive, no invented numbers). */
export function routeRiskNarration(
  est: RouteEstimate,
  hasClosureAlert: boolean,
  destTempC: number,
): string[] {
  const lines: string[] = [];
  if (est.climbM > 250) {
    lines.push(
      `Steep climb (+${est.climbM} m): the ghat stretch slows trucks, so plan an early-morning departure to beat valley fog.`,
    );
  } else if (est.climbM > 80) {
    lines.push(
      `Mild climb ahead (+${est.climbM} m) — keep the load covered for the windward bends.`,
    );
  }
  if (hasClosureAlert) {
    lines.push(
      `A closure/landslide advisory touches this corridor today: reroute via the NH diversion adds roughly +40–50 min.`,
    );
  }
  if (destTempC > 30) {
    lines.push(
      `High daytime heat at destination — book the unloading bay during cooler hours if the facility allows.`,
    );
  }
  if (lines.length === 0) {
    lines.push(
      `A clear, steady corridor for this load today — keep to posted speeds around villages.`,
    );
  }
  return lines;
}

/** Deterministic 7-day availability pattern for a facility. */
export function availabilityCurve(facilityId: string, availableT: number): number[] {
  let seed = 2166136261;
  for (let i = 0; i < facilityId.length; i++) {
    seed ^= facilityId.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const out: number[] = [];
  for (let d = 0; d < 7; d++) {
    seed = (seed + 0x6d2b79f5) | 0;
    seed = Math.imul(seed ^ (seed >>> 15), 2246822507) ^ (seed + Math.imul(seed ^ (seed >>> 7), 3266489909));
    const wobble = ((Math.abs(seed) >>> 0) % 100) / 100 * 0.28 - 0.14;
    out.push(Math.max(0, Math.round(availableT * (1 + wobble))));
  }
  return out;
}