/** Static content for the public marketing site + shared lookups. */

import type { IconName } from "@/components/icons";

export type Role = "farmer" | "fpo" | "buyer" | "transporter" | "admin";

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  {
    id: "farmer",
    label: "Farmer",
    blurb: "Weather, diagnosis & fair prices in your language.",
  },
  {
    id: "fpo",
    label: "FPO / Producer org",
    blurb: "Bulk listings, pooled transport & credit-ready profiles.",
  },
  {
    id: "buyer",
    label: "Buyer / Retailer",
    blurb: "Verified NER produce with trace-to-farm proof.",
  },
  {
    id: "transporter",
    label: "Logistics",
    blurb: "Terrain-aware routes, cold-chain & pooled loads.",
  },
  {
    id: "admin",
    label: "Govt / Extension",
    blurb: "Regional dashboards, alerts & verification.",
  },
];

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "as", name: "অসমীয়া (Assamese)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "kha", name: "Khasi" },
  { code: "mzo", name: "Mizo" },
];

export const NER_STATES: { id: string; name: string; districts: string[] }[] = [
  {
    id: "as",
    name: "Assam",
    districts: ["Kamrup Metro", "Jorhat", "Dibrugarh", "Nagaon", "Cachar"],
  },
  {
    id: "ml",
    name: "Meghalaya",
    districts: ["East Khasi Hills", "Ri-Bhoi", "Jaintia Hills"],
  },
  {
    id: "ar",
    name: "Arunachal Pradesh",
    districts: ["Papum Pare", "West Siang", "Lower Subansiri"],
  },
  {
    id: "nl",
    name: "Nagaland",
    districts: ["Kohima", "Dimapur", "Mokokchung"],
  },
  {
    id: "mn",
    name: "Manipur",
    districts: ["Imphal West", "Thoubal", "Churachandpur"],
  },
  {
    id: "mz",
    name: "Mizoram",
    districts: ["Aizawl", "Lunglei", "Champhai"],
  },
  {
    id: "tr",
    name: "Tripura",
    districts: ["West Tripura", "Dhalai", "Gomati"],
  },
  {
    id: "sk",
    name: "Sikkim",
    districts: ["East Sikkim", "West Sikkim", "North Sikkim"],
  },
];

export type Crop = {
  id: string;
  name: string;
  local: string;
  region: string;
  fact: string;
  grad: string; // tailwind gradient classes
  accent: string;
};

export const CROPS: Crop[] = [
  {
    id: "king-chilli",
    name: "King Chilli",
    local: "Bhut Jolokia",
    region: "Nagaland · Assam · Manipur",
    fact: "1.1M SHU heat · GI-tagged",
    grad: "from-gold-300 via-gold-400 to-clay-500",
    accent: "text-clay-600",
  },
  {
    id: "lakadong-turmeric",
    name: "Lakadong Turmeric",
    local: "Lakadong",
    region: "Meghalaya",
    fact: "7–9% curcumin · highest in the world",
    grad: "from-amber-200 to-gold-600",
    accent: "text-gold-700",
  },
  {
    id: "queen-pineapple",
    name: "Queen Pineapple",
    local: "Queen Pine",
    region: "Tripura",
    fact: "GI-tagged · twice the Vitamin C",
    grad: "from-yellow-200 to-gold-400",
    accent: "text-gold-700",
  },
  {
    id: "large-cardamom",
    name: "Large Cardamom",
    local: "Bara Elaichi",
    region: "Sikkim",
    fact: "GI-tagged · Himalayan spice",
    grad: "from-emerald-200 to-forest-600",
    accent: "text-forest-700",
  },
  {
    id: "joha-rice",
    name: "Joha Rice",
    local: "Joha",
    region: "Assam",
    fact: "GI-tagged · aromatic short-grain",
    grad: "from-sand-200 to-gold-300",
    accent: "text-gold-800",
  },
  {
    id: "assam-tea",
    name: "Assam Tea",
    local: "Chah",
    region: "Assam",
    fact: "World’s largest tea-growing region",
    grad: "from-forest-300 to-forest-700",
    accent: "text-forest-800",
  },
  {
    id: "kiwi",
    name: "Kiwi",
    local: "Keiwi",
    region: "Arunachal · Meghalaya",
    fact: "Cool-climate superfruit",
    grad: "from-lime-200 to-emerald-500",
    accent: "text-emerald-700",
  },
  {
    id: "mizo-ginger",
    name: "Mizo Ginger",
    local: "Aliaw Adu",
    region: "Mizoram",
    fact: "High oleoresin, prized for oils",
    grad: "from-clay-100 to-clay-400",
    accent: "text-clay-600",
  },
];

export type Module = {
  id: string;
  icon: IconName;
  title: string;
  tagline: string;
  points: string[];
};

export const MODULES: Module[] = [
  {
    id: "climate",
    icon: "cloudRain",
    title: "Climate Resiliency & Weather",
    tagline: "Know before it rains. Act before it floods.",
    points: [
      "7-day block-level microclimate forecasts",
      "Flash-flood, landslide & frost early warnings",
      "Sowing calendar with indigenous wisdom (ITK)",
    ],
  },
  {
    id: "ai-crop",
    icon: "scanPlus",
    title: "AI Crop Protection",
    tagline: "Snap a leaf. Get a diagnosis. Treat it right.",
    points: [
      "GPT-4o mini vision diagnosis in 3 taps",
      "Organic + chemical remedies with dosage",
      "Specialty registry: chilli, turmeric, cardamom…",
    ],
  },
  {
    id: "logistics",
    icon: "truck",
    title: "Terrain Logistics & Cold Chain",
    tagline: "Hills can’t stop your harvest anymore.",
    points: [
      "Nearest cold storage with live capacity",
      "Elevation-aware routes, closure alerts built in",
      "Pooled shipping that cuts freight per kilo",
    ],
  },
  {
    id: "trade",
    icon: "coin",
    title: "Direct Trade & FinTech",
    tagline: "From field to buyer — no middlemen, no defaults.",
    points: [
      "B2B marketplace with trace-to-farm proof",
      "Live mandi vs eNAM price trends",
      "Alternative credit scoring + escrow payments",
    ],
  },
];

export const STATS: { value: string; label: string; sub: string }[] = [
  { value: "8", label: "NER states", sub: "Assam to Sikkim, districts deep" },
  { value: "12+", label: "specialty crops", sub: "GI-tagged & high-value" },
  { value: "60+", label: "storage facilities", sub: "cold storages & godowns" },
  { value: "6", label: "languages + voice", sub: "spoken advisories included" },
  { value: "5", label: "roles, one platform", sub: "farmer to government" },
];

export type Persona = {
  icon: IconName;
  title: string;
  desc: string;
  tags: string[];
};

export const PERSONAS: Persona[] = [
  {
    icon: "seedling",
    title: "Farmers & FPOs",
    desc: "Actionable advisory, fair prices and loan-ready profiles — even on a shared 2G phone.",
    tags: ["Low-bandwidth", "Voice in local language", "Zero paperwork"],
  },
  {
    icon: "truck",
    title: "Logistics & Storage",
    desc: "Real-time capacity and terrain-aware routes across monsoon corridors.",
    tags: ["Cold-chain telemetry", "Landslide alerts", "Pooled loads"],
  },
  {
    icon: "store",
    title: "Buyers & Retailers",
    desc: "Direct procurement of verified NER produce with trace-to-farm proof.",
    tags: ["Organic certified", "Delivery windows", "Escrow secured"],
  },
  {
    icon: "coin",
    title: "FinTech & Insurers",
    desc: "Climate-risk scores, yield estimates and index-based claim settlement.",
    tags: ["NDVI/EVI signals", "Weather-index payouts", "Underwriting data"],
  },
  {
    icon: "building",
    title: "Government & Extension",
    desc: "District heat-maps for outbreaks, floods and price anomalies.",
    tags: ["Regional dashboards", "Alert publishing", "Surveillance"],
  },
];

export type TickerItem = {
  crop: string;
  price: string;
  change: string;
  up: boolean;
};

export const TICKER: TickerItem[] = [
  { crop: "King Chilli", price: "₹ 240/kg", change: "+6.2%", up: true },
  { crop: "Lakadong Turmeric", price: "₹ 620/kg", change: "+3.1%", up: true },
  { crop: "Queen Pineapple", price: "₹ 42/kg", change: "-1.4%", up: false },
  { crop: "Large Cardamom", price: "₹ 1,140/kg", change: "+2.8%", up: true },
  { crop: "Joha Rice", price: "₹ 105/kg", change: "+0.9%", up: true },
  { crop: "Assam Tea", price: "₹ 185/kg", change: "-0.6%", up: false },
  { crop: "Mizo Ginger", price: "₹ 118/kg", change: "+4.5%", up: true },
  { crop: "Kiwi", price: "₹ 260/kg", change: "+1.7%", up: true },
];