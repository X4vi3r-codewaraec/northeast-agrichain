/** Government / extension analytics — deterministic district + state signals
 *  (pest outbreaks, flood clusters, price anomalies, storage utilisation). The
 *  live version reads PostGIS + telemetry via the FastAPI service. */

import { NER_STATES } from "@/lib/data";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function spread(seed: number, min: number, max: number): number {
  return min + ((seed % 1000) / 1000) * (max - min);
}

export type StateHeat = {
  id: string;
  name: string;
  pestIndex: number; // 0–100
  floodClusters: number;
  priceAnomalyPct: number; // signed
  storageUtilPct: number;
};

export function stateHeat(): StateHeat[] {
  return NER_STATES.map((s) => {
    const seed = hashStr(s.id);
    return {
      id: s.id,
      name: s.name,
      pestIndex: Math.round(spread(seed, 12, 88)),
      floodClusters: Math.round(spread(seed >> 3, 0, 9)),
      priceAnomalyPct: Math.round(spread(seed >> 5, -18, 22) * 10) / 10,
      storageUtilPct: Math.round(spread(seed >> 7, 35, 96)),
    };
  });
}

export type DiseaseSurveillance = {
  district: string;
  state: string;
  issue: string;
  cases: number;
  trend: "up" | "flat" | "down";
};

const SURVEILLANCE_ISSUES = [
  "Rice leaf blast",
  "Bacterial leaf blight",
  "Fall armyworm",
  "Anthracnose (fruit rot)",
  "Rhizome rot",
  "Chilli leaf curl virus",
  "Tea blister blight",
  "Powdery mildew",
];

export function diseaseSurveillance(): DiseaseSurveillance[] {
  const out: DiseaseSurveillance[] = [];
  for (const s of NER_STATES) {
    for (const d of s.districts) {
      const seed = hashStr(d);
      out.push({
        district: d,
        state: s.name,
        issue: SURVEILLANCE_ISSUES[seed % SURVEILLANCE_ISSUES.length],
        cases: Math.round(spread(seed >> 2, 4, 73)),
        trend: seed % 3 === 0 ? "up" : seed % 3 === 1 ? "flat" : "down",
      });
    }
  }
  return out.sort((a, b) => b.cases - a.cases).slice(0, 10);
}

export type VerificationItem = {
  id: string;
  name: string;
  kind: "FPO" | "Farmer" | "Buyer";
  district: string;
  submitted: string;
  docsReady: boolean;
};

export const VERIFICATION_QUEUE: VerificationItem[] = [
  { id: "V-3312", name: "Barak Valley Organic FPO", kind: "FPO", district: "Cachar", submitted: "1 day ago", docsReady: true },
  { id: "V-3307", name: "Ri-Bhoi Ginger Growers", kind: "FPO", district: "Ri-Bhoi", submitted: "2 days ago", docsReady: false },
  { id: "V-3301", name: "Tezpur Fresh Retail Pvt Ltd", kind: "Buyer", district: "Nagaon", submitted: "3 days ago", docsReady: true },
  { id: "V-3296", name: "Ziro Kiwi Collective", kind: "FPO", district: "Lower Subansiri", submitted: "4 days ago", docsReady: true },
  { id: "V-3288", name: "Nongpoh Spice Traders", kind: "Buyer", district: "Ri-Bhoi", submitted: "5 days ago", docsReady: false },
];

export type AuditEntry = {
  actor: string;
  action: string;
  target: string;
  when: string;
};

export const AUDIT_LOG: AuditEntry[] = [
  { actor: "District Officer, Cachar", action: "Published flood alert", target: "ALR-4471", when: "18 min ago" },
  { actor: "Admin (Agri dept)", action: "Verified FPO", target: "V-3296 Ziro Kiwi Collective", when: "2 h ago" },
  { actor: "Admin (Agri dept)", action: "Suspended listing", target: "LS-1042 (unverified grade)", when: "Yesterday" },
  { actor: "District Officer, East Sikkim", action: "Published landslide alert", target: "ALR-4468", when: "Yesterday" },
  { actor: "Admin (Agri dept)", action: "Approved insurance product", target: "POL template · cardamom hail", when: "3 days ago" },
];

export function heatMeta(pestIndex: number): { label: string; cls: string } {
  if (pestIndex >= 70) return { label: "High alert", cls: "bg-red-600" };
  if (pestIndex >= 45) return { label: "Watch", cls: "bg-orange-500" };
  if (pestIndex >= 25) return { label: "Elevated", cls: "bg-gold-500" };
  return { label: "Calm", cls: "bg-forest-600" };
}