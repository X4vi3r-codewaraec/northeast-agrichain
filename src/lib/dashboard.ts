/** Role-aware dashboard summary — deterministic demo data keyed by role +
 *  district. The live version merges weather, alerts, listings and shipments. */

import type { IconName } from "@/components/icons";
import type { Role } from "@/lib/data";

export type DashboardKpi = {
  label: string;
  value: string;
  sub: string;
  icon: IconName;
  href: string;
};

export type DashboardSummary = {
  greeting: string;
  advisoryTitle: string;
  advisory: string[];
  kpis: DashboardKpi[];
  activity: { when: string; text: string }[];
  quickActions: { label: string; href: string; icon: IconName }[];
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dashboardSummary(role: Role, district: string, name: string): DashboardSummary {
  const seed = hashStr(district + role);
  const diagnoses = 3 + (seed % 6);
  const inTransit = 1 + (seed % 4);
  const listings = 2 + (seed % 5);
  const riskScore = 30 + (seed % 45);

  const advisories: Record<Role, string[]> = {
    farmer: [
      `Overcast with 60% rain chance in ${district} over the next 48 h — hold urea top-dressing until it clears.`,
      "Turmeric rhizome-rot risk is elevated after last week's showers: check drainage in low patches.",
      "King Chilli is trading above its fair band at the nearest mandi — a good 7-day window for graded lots.",
    ],
    fpo: [
      `3 pooled loads on the ${district} corridor are within 60% capacity — one more lot splits freight further.`,
      "Two of your member listings are Grade-A certified and currently beating the mandi reference by 3.8%.",
      "Credit readiness for the FPO improved after last quarter's on-time escrow settlements.",
    ],
    buyer: [
      `4 new certified lots match your preferences in ${district} and neighbouring blocks.`,
      "Lakadong Turmeric supply is tightening — lock forward contracts before the festival peak.",
      "One supplier's trace-to-farm and diagnosis log are fully clean and ready for onboarding.",
    ],
    transporter: [
      `A landslide advisory touches the hill corridor near ${district} — plan the NH diversion window.`,
      "Cold-chain ambient on your last two runs stayed within 2 °C of setpoint — no spoilage claims.",
      "Two pooled pickups are pending assignment in your queue this morning.",
    ],
    admin: [
      `Pest pressure is climbing in 3 districts this week — review the surveillance table below.`,
      "Rainfall anomaly suggests flood-watch for river-adjacent clusters; publish advisories early.",
      "5 verification requests are pending — 3 with complete documents.",
    ],
  };

  const kpis: Record<Role, DashboardKpi[]> = {
    farmer: [
      { label: "Weather risk", value: `${riskScore}`, sub: "district index / 100", icon: "cloudRain", href: "/weather" },
      { label: "Diagnoses this week", value: `${diagnoses}`, sub: "photos analysed", icon: "scanPlus", href: "/diagnose" },
      { label: "Active listings", value: `${listings}`, sub: "in marketplace", icon: "store", href: "/marketplace" },
      { label: "In-transit shipments", value: `${inTransit}`, sub: "being tracked", icon: "truck", href: "/shipments" },
    ],
    fpo: [
      { label: "Bulk listings live", value: `${listings + 4}`, sub: "this week", icon: "store", href: "/marketplace" },
      { label: "Pooled queues", value: `${2 + (seed % 3)}`, sub: "awaiting vehicles", icon: "truck", href: "/shipments" },
      { label: "Avg premium vs mandi", value: "+3.8%", sub: "graded lots", icon: "chart", href: "/prices" },
      { label: "Member revenue sold", value: "₹4.2L", sub: "escrow-settled", icon: "coin", href: "/credit" },
    ],
    buyer: [
      { label: "Matching lots", value: `${4 + (seed % 6)}`, sub: "certified & in radius", icon: "store", href: "/marketplace" },
      { label: "Open orders", value: `${1 + (seed % 3)}`, sub: "escrow-held", icon: "shield", href: "/marketplace" },
      { label: "Tracked shipments", value: `${inTransit}`, sub: "en route to you", icon: "truck", href: "/shipments" },
      { label: "Price alerts", value: `${2 + (seed % 4)}`, sub: "armed", icon: "radio", href: "/prices" },
    ],
    transporter: [
      { label: "Assigned routes", value: `${2 + (seed % 4)}`, sub: "today", icon: "route", href: "/shipments" },
      { label: "Cold-chain units", value: `${1 + (seed % 3)}`, sub: "active", icon: "truck", href: "/map" },
      { label: "Road closures", value: `${seed % 3}`, sub: "on your corridors", icon: "radio", href: "/alerts" },
      { label: "On-time rate", value: "94%", sub: "last 30 days", icon: "check", href: "/shipments" },
    ],
    admin: [
      { label: "Districts tracked", value: "26", sub: "across 8 states", icon: "mapPin", href: "/admin" },
      { label: "Active alerts", value: `${3 + (seed % 4)}`, sub: "published", icon: "radio", href: "/alerts" },
      { label: "Pending verifications", value: "5", sub: "FPOs & buyers", icon: "users", href: "/admin" },
      { label: "Pest alerts", value: `${2 + (seed % 3)}`, sub: "elevated districts", icon: "scanPlus", href: "/admin" },
    ],
  };

  const activity: Record<Role, { when: string; text: string }[]> = {
    farmer: [
      { when: "2 h ago", text: "Diagnosis on King Chilli completed — 'Powdery mildew' with 82% confidence." },
      { when: "Yesterday", text: "Cold storage booking confirmed near Jorhat for 1.2 t." },
      { when: "2 days ago", text: "Price alert armed for Lakadong Turmeric above ₹640/kg." },
    ],
    fpo: [
      { when: "1 h ago", text: "New pooled shipment opened on the Silchar corridor (2 lots joined)." },
      { when: "Yesterday", text: "Grade-A certification uploaded for a 3.2 t turmeric lot." },
      { when: "2 days ago", text: "Escrow released for a Joha Rice export order." },
    ],
    buyer: [
      { when: "40 min ago", text: "3 new certified lots matched your preference (Mokokchung, Champhai)." },
      { when: "Yesterday", text: "Escrow order placed for 1.8 t King Chilli — awaiting dispatch." },
      { when: "3 days ago", text: "Supplier trace-to-farm report downloaded for audit." },
    ],
    transporter: [
      { when: "30 min ago", text: "Ambient excursion logged on unit AS-01-X-4821 (+2.4 °C briefly)." },
      { when: "2 h ago", text: "New pooled pickup assigned: Nagaon → Guwahati hub." },
      { when: "Yesterday", text: "Proof-of-delivery uploaded for SH-NER-4662." },
    ],
    admin: [
      { when: "18 min ago", text: "Flood alert published for Cachar river-adjacent clusters." },
      { when: "1 h ago", text: "Pest surveillance updated — fall armyworm trending up in 2 districts." },
      { when: "Yesterday", text: "Verified Ziro Kiwi Collective (FPO)." },
    ],
  };

  const quickActions: Record<Role, { label: string; href: string; icon: IconName }[]> = {
    farmer: [
      { label: "Diagnose a crop", href: "/diagnose", icon: "scanPlus" },
      { label: "Check the forecast", href: "/weather", icon: "cloudRain" },
      { label: "Book a shipment", href: "/shipments/new", icon: "truck" },
      { label: "Ask the assistant", href: "/assistant", icon: "sparkles" },
    ],
    fpo: [
      { label: "Create a listing", href: "/marketplace/new", icon: "store" },
      { label: "Open a pooled load", href: "/shipments/new", icon: "truck" },
      { label: "See price trends", href: "/prices", icon: "chart" },
      { label: "Credit readiness", href: "/credit", icon: "coin" },
    ],
    buyer: [
      { label: "Browse marketplace", href: "/marketplace", icon: "store" },
      { label: "Track shipments", href: "/shipments", icon: "truck" },
      { label: "Price intelligence", href: "/prices", icon: "chart" },
      { label: "Ask the assistant", href: "/assistant", icon: "sparkles" },
    ],
    transporter: [
      { label: "Plan a route", href: "/map", icon: "route" },
      { label: "Open shipments", href: "/shipments", icon: "truck" },
      { label: "Road alerts", href: "/alerts", icon: "radio" },
      { label: "Find storage", href: "/map", icon: "building" },
    ],
    admin: [
      { label: "Publish an alert", href: "/admin", icon: "radio" },
      { label: "Verification queue", href: "/admin", icon: "users" },
      { label: "Surveillance", href: "/admin", icon: "scanPlus" },
      { label: "Full alert board", href: "/alerts", icon: "cloudRain" },
    ],
  };

  return {
    greeting: `Namaskar, ${name.split(" ")[0]}`,
    advisoryTitle: "Today's advisory",
    advisory: advisories[role],
    kpis: kpis[role],
    activity: activity[role],
    quickActions: quickActions[role],
  };
}