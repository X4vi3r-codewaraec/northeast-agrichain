/** Weather-index micro-insurance — policies, claim wizard state machine and
 *  deterministic loss/payout math (never LLM-generated). */

import { INDEX_POLICIES, type IndexPolicy } from "@/lib/credit";

export type ClaimEvent = "flood" | "frost" | "hail" | "drought";

export const CLAIM_EVENT_LABEL: Record<ClaimEvent, string> = {
  flood: "Flash flood",
  frost: "Frost",
  hail: "Hailstorm",
  drought: "Drought / rain deficit",
};

export type Policy = IndexPolicy & {
  id: string;
  sumInsured: number; // ₹ total for the farm
  premium: number; // ₹ paid
  status: "active" | "expiring" | "expired";
  validUntil: string; // human label, no Date
};

export const POLICIES: Policy[] = [
  { ...INDEX_POLICIES[0], id: "POL-2201", sumInsured: 76000, premium: 3192, status: "active", validUntil: "31 March 2027" },
  { ...INDEX_POLICIES[1], id: "POL-2187", sumInsured: 42000, premium: 2100, status: "active", validUntil: "30 June 2027" },
  { ...INDEX_POLICIES[2], id: "POL-2140", sumInsured: 52000, premium: 2392, status: "expiring", validUntil: "15 December 2026" },
];

export type LossEstimate = {
  affectedHa: number;
  yieldLossPct: number;
  grossPayable: number;
  deductible: number;
  netPayable: number;
  triggered: boolean;
  narrative: string;
};

/** Objective loss estimate from the index trigger + reported severity. */
export function estimateClaim(opts: {
  policy: Policy;
  areaHa: number;
  event: ClaimEvent;
  severityPct: number; // reported intensity 0–100
  indexDeviation: number; // index departure beyond trigger, 0–100
}): LossEstimate {
  const { policy, areaHa, event, severityPct, indexDeviation } = opts;
  const triggered = indexDeviation >= 10;
  const eventWeight =
    event === "flood" ? 1.15 : event === "hail" ? 1.05 : event === "frost" ? 0.95 : 0.9;
  const yieldLossPct = Math.min(95, Math.round(((indexDeviation * 0.7 + severityPct * 0.3) * eventWeight)));
  const affectedHa = Math.round(areaHa * Math.min(1, indexDeviation / 60) * 10) / 10;
  const perHa = policy.sumAssuredPerHa;
  const grossPayable = Math.round((perHa * affectedHa * yieldLossPct) / 100);
  const deductible = Math.round(perHa * affectedHa * 0.1); // 10% standard deductible
  const netPayable = triggered ? Math.max(0, grossPayable - deductible) : 0;

  const narrative = triggered
    ? `The ${CLAIM_EVENT_LABEL[event].toLowerCase()} index crossed its trigger by ${indexDeviation} points for your polygon. ${affectedHa} ha affected, ${yieldLossPct}% assessed yield loss — a net ₹${netPayable.toLocaleString("en-IN")} payout after the standard 10% deductible. Money lands in your linked account with no field inspection.`
    : `The index has not crossed the trigger for this event and window (departure ${indexDeviation} points). No payout is due — you can refile when a qualifying event is recorded.`;

  return { affectedHa, yieldLossPct, grossPayable, deductible, netPayable, triggered, narrative };
}

export type ClaimStatus = "submitted" | "verified" | "settled";

export const CLAIM_STATUS_ORDER: ClaimStatus[] = ["submitted", "verified", "settled"];

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  submitted: "Submitted",
  verified: "Index verified",
  settled: "Settled",
};

export type DemoClaim = {
  id: string;
  crop: string;
  event: ClaimEvent;
  filedOn: string; // human label
  status: ClaimStatus;
  amount: number;
};

export const DEMO_CLAIMS: DemoClaim[] = [
  { id: "CLM-77241", crop: "Joha Rice", event: "drought", filedOn: "12 Sep 2026", status: "settled", amount: 12350 },
  { id: "CLM-77108", crop: "King Chilli", event: "flood", filedOn: "02 Aug 2026", status: "verified", amount: 8400 },
  { id: "CLM-76980", crop: "Large Cardamom", event: "hail", filedOn: "21 Jul 2026", status: "submitted", amount: 0 },
];

export function claimStatusMeta(s: ClaimStatus): { label: string; cls: string } {
  switch (s) {
    case "submitted":
      return { label: CLAIM_STATUS_LABEL.submitted, cls: "bg-gold-500 text-ink-900" };
    case "verified":
      return { label: CLAIM_STATUS_LABEL.verified, cls: "bg-sky-600 text-white" };
    case "settled":
      return { label: CLAIM_STATUS_LABEL.settled, cls: "bg-forest-600 text-white" };
  }
}