/**
 * Deterministic grounding for the assistant. Every number the model is allowed
 * to quote comes from here — computed by the same engines the modules use, so
 * the LLM never invents scores, prices, ETAs or amounts.
 *
 * Server-only (imported by the chat route). Never throws: on any failure it
 * returns an empty string so the reply gracefully degrades to narration only.
 */

import { CATEGORY_LABEL, generateAlerts } from "@/lib/alerts";
import {
  INDEX_POLICIES,
  climateRiskScore,
  creditAssessment,
  premiumEstimate,
} from "@/lib/credit";
import type { Role } from "@/lib/data";
import { dashboardSummary } from "@/lib/dashboard";
import { FACILITIES, FACILITY_TYPE_LABEL } from "@/lib/facilities";
import { buildPriceProfiles, signalMeta } from "@/lib/prices";
import { fetchWeather } from "@/lib/weather";

export type FactsUser = {
  name: string;
  role: Role;
  state: string;
  district: string;
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function priceFacts(): string[] {
  const profiles = buildPriceProfiles(new Date()).slice(0, 5);
  const lines = profiles.map(
    (p) =>
      `- ${p.cropName}: today ${inr(p.priceToday)}/kg, 7-day ${p.trend7Pct >= 0 ? "+" : ""}${p.trend7Pct}%, ` +
      `fair band ${inr(p.fairValueBand[0])}–${inr(p.fairValueBand[1])}/kg, signal "${signalMeta(p.signal).label}", ` +
      `mandi ${inr(p.mandiPrice)} vs eNAM ${inr(p.eNamPrice)}.`,
  );
  return ["Crop price snapshot (₹/kg):", ...lines];
}

async function weatherFacts(user: FactsUser): Promise<string[]> {
  const report = await fetchWeather(user.district);
  const lines: string[] = [];
  const c = report.current;
  if (c) {
    lines.push(
      `- Now: ${c.temp}°C (feels ${c.feelsLike}°), ${c.weatherLabel.toLowerCase()}, ` +
        `humidity ${c.humidity}%, wind ${c.windKmh} km/h.`,
    );
    const nextRain = report.hourly.find((h) => h.precipProb >= 60);
    if (nextRain) {
      lines.push(`- Rain likely around ${nextRain.hourLabel} (${nextRain.precipProb}% chance).`);
    }
  }
  lines.push(
    ...report.days.slice(0, 4).map(
      (d) =>
        `- ${d.dayLabel}: ${d.tempMin}–${d.tempMax}°C, ${d.weatherLabel}, ` +
        `rain ${d.precipProb}% (${d.precipMm} mm), wind ${d.windKmh} km/h`,
    ),
  );
  return [`Weather for ${report.district} (source: ${report.source}):`, ...lines];
}

function mapFacts(user: FactsUser): string[] {
  const nearby = FACILITIES.filter((f) => f.district === user.district);
  const inState = FACILITIES.filter(
    (f) => f.state === user.state && f.district !== user.district,
  );
  const picked = [...nearby, ...inState].slice(0, 4);
  const list = (picked.length ? picked : FACILITIES.slice(0, 4)).map(
    (f) =>
      `- ${f.name} — ${FACILITY_TYPE_LABEL[f.type]}, ${f.district} (${f.state}); ` +
      `${f.availableT}/${f.capacityT} t free at ${inr(f.rate)}/t/day, rating ${f.rating}/5, ${f.tempC}.`,
  );
  return [`Storage & facility options (${FACILITIES.length} on the map):`, ...list];
}

function creditFacts(user: FactsUser): string[] {
  const risk = climateRiskScore(user.district);
  const band = creditAssessment(user.district);
  const lines = [
    `- Climate risk score for ${user.district}: ${risk.score}/100 (${risk.level}).`,
    `- Indicative credit: eligible ${band.eligible ? "yes" : "no"}, approval band up to ` +
      `${inr(band.approvedLakh * 100000)} at ${band.ratePct}% for ${band.tenureMonths} months.`,
  ];
  const policy = INDEX_POLICIES[0];
  if (policy) {
    lines.push(
      `- Index insurance example — ${policy.cropName}: premium ${inr(premiumEstimate(policy, 1))}/ha ` +
        `for ${inr(policy.sumAssuredPerHa)}/ha cover; trigger: ${policy.trigger}.`,
    );
  }
  if (band.needs[0]) lines.push(`- Requirement noted: ${band.needs[0]}.`);
  return ["Credit & insurance inputs:", ...lines];
}

function alertFacts(user: FactsUser): string[] {
  const all = generateAlerts();
  const relevant = all.filter(
    (a) => a.districts.includes(user.district) || a.state.includes(user.state),
  );
  const picked = (relevant.length ? relevant : all).slice(0, 4);
  const lines = picked.map(
    (a) =>
      `- [${a.severity.toUpperCase()}] ${a.title} — ${CATEGORY_LABEL[a.category]}, ` +
      `districts: ${a.districts.join(", ")}. ${a.body}`,
  );
  return ["Active early warnings:", ...lines];
}

function generalFacts(user: FactsUser): string[] {
  const summary = dashboardSummary(user.role, user.district, user.name);
  const lines = summary.kpis.slice(0, 4).map((k) => `- ${k.label}: ${k.value} (${k.sub})`);
  return [`Dashboard KPIs — ${titleCase(user.role)} in ${user.district}:`, ...lines];
}

/** Best-effort facts for the detected intent. Always resolves to a string. */
export async function buildFacts(intent: string, user: FactsUser): Promise<string> {
  try {
    switch (intent) {
      case "prices":
        return priceFacts().join("\n");
      case "weather":
        return (await weatherFacts(user)).join("\n");
      case "map":
        return mapFacts(user).join("\n");
      case "credit":
        return creditFacts(user).join("\n");
      case "alerts":
        return alertFacts(user).join("\n");
      default:
        return generalFacts(user).join("\n");
    }
  } catch {
    return "";
  }
}
