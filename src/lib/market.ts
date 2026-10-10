/** B2B marketplace listings (demo seed — served by the FastAPI service +
 *  PostGIS search once live). */

import { CROPS } from "@/lib/data";

export type ListingGrade = "A" | "B" | "C";

/** Resolve a listing/crop id to its real photo asset in /public/crops. */
export function cropImage(cropId: string): string {
  return CROPS.find((c) => c.id === cropId)?.image ?? `/crops/${cropId}.jpg`;
}

export type Listing = {
  id: string;
  cropId: string;
  cropName: string;
  local: string;
  qtyT: number;
  pricePerKg: number;
  grade: ListingGrade;
  organic: boolean;
  giCert: boolean;
  state: string;
  district: string;
  seller: string;
  sellerRole: "FPO" | "Farmer group" | "Processor";
  rating: number;
  harvestDaysAgo: number;
  grad: string; // tailwind gradient for the image placeholder
  traceToFarm: boolean;
  deliveryWindow: string;
};

export const GRADE_LABEL: Record<ListingGrade, string> = {
  A: "Grade A",
  B: "Grade B",
  C: "Grade C",
};

export const LISTINGS: Listing[] = [
  {
    id: "LS-1102",
    cropId: "king-chilli",
    cropName: "King Chilli",
    local: "Bhut Jolokia",
    qtyT: 1.8,
    pricePerKg: 248,
    grade: "A",
    organic: true,
    giCert: true,
    state: "Nagaland",
    district: "Mokokchung",
    seller: "Mokokchung Chilli FPO",
    sellerRole: "FPO",
    rating: 4.6,
    harvestDaysAgo: 2,
    grad: "from-gold-300 via-gold-400 to-clay-500",
    traceToFarm: true,
    deliveryWindow: "48 h, pooled",
  },
  {
    id: "LS-1098",
    cropId: "lakadong-turmeric",
    cropName: "Lakadong Turmeric",
    local: "Lakadong",
    qtyT: 3.2,
    pricePerKg: 640,
    grade: "A",
    organic: true,
    giCert: true,
    state: "Meghalaya",
    district: "East Khasi Hills",
    seller: "Jaintia Turmeric Co-op",
    sellerRole: "FPO",
    rating: 4.8,
    harvestDaysAgo: 5,
    grad: "from-amber-200 to-gold-600",
    traceToFarm: true,
    deliveryWindow: "72 h, cold chain",
  },
  {
    id: "LS-1091",
    cropId: "joha-rice",
    cropName: "Joha Rice",
    local: "Joha",
    qtyT: 8.0,
    pricePerKg: 108,
    grade: "A",
    organic: false,
    giCert: true,
    state: "Assam",
    district: "Jorhat",
    seller: "Jorhat Aromatic Rice FPO",
    sellerRole: "FPO",
    rating: 4.4,
    harvestDaysAgo: 8,
    grad: "from-sand-200 to-gold-300",
    traceToFarm: true,
    deliveryWindow: "5 d, ambient",
  },
  {
    id: "LS-1086",
    cropId: "mizo-ginger",
    cropName: "Mizo Ginger",
    local: "Aliaw Adu",
    qtyT: 2.5,
    pricePerKg: 121,
    grade: "B",
    organic: true,
    giCert: false,
    state: "Mizoram",
    district: "Champhai",
    seller: "Champhai Growers Circle",
    sellerRole: "Farmer group",
    rating: 4.1,
    harvestDaysAgo: 3,
    grad: "from-clay-100 to-clay-400",
    traceToFarm: true,
    deliveryWindow: "48 h, cold chain",
  },
  {
    id: "LS-1079",
    cropId: "large-cardamom",
    cropName: "Large Cardamom",
    local: "Bara Elaichi",
    qtyT: 0.9,
    pricePerKg: 1150,
    grade: "A",
    organic: false,
    giCert: true,
    state: "Sikkim",
    district: "East Sikkim",
    seller: "Sikkim Spice Exchange",
    sellerRole: "Processor",
    rating: 4.7,
    harvestDaysAgo: 6,
    grad: "from-emerald-200 to-forest-600",
    traceToFarm: true,
    deliveryWindow: "72 h, cure-room ready",
  },
  {
    id: "LS-1072",
    cropId: "queen-pineapple",
    cropName: "Queen Pineapple",
    local: "Queen Pine",
    qtyT: 6.5,
    pricePerKg: 44,
    grade: "A",
    organic: true,
    giCert: true,
    state: "Tripura",
    district: "West Tripura",
    seller: "Agartala Queen Pine Union",
    sellerRole: "FPO",
    rating: 4.3,
    harvestDaysAgo: 1,
    grad: "from-yellow-200 to-gold-400",
    traceToFarm: true,
    deliveryWindow: "24 h, ripening centre",
  },
  {
    id: "LS-1066",
    cropId: "kiwi",
    cropName: "Kiwi",
    local: "Keiwi",
    qtyT: 1.1,
    pricePerKg: 272,
    grade: "B",
    organic: false,
    giCert: false,
    state: "Arunachal Pradesh",
    district: "West Siang",
    seller: "Aalo Valley Horti Group",
    sellerRole: "Farmer group",
    rating: 4.0,
    harvestDaysAgo: 4,
    grad: "from-lime-200 to-emerald-500",
    traceToFarm: true,
    deliveryWindow: "72 h, cold chain",
  },
  {
    id: "LS-1059",
    cropId: "king-chilli",
    cropName: "King Chilli",
    local: "Naga Mircha",
    qtyT: 0.4,
    pricePerKg: 232,
    grade: "C",
    organic: false,
    giCert: true,
    state: "Manipur",
    district: "Thoubal",
    seller: "Thoubal Spice Producers",
    sellerRole: "Farmer group",
    rating: 3.9,
    harvestDaysAgo: 2,
    grad: "from-gold-200 to-clay-400",
    traceToFarm: false,
    deliveryWindow: "48 h, pooled",
  },
];

export function listingById(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}

/* ------------------------------------------------------------------ */
/* Listing detail — trace-to-farm panel data                          */
/* ------------------------------------------------------------------ */

const ISSUE_POOL = [
  "Powdery mildew",
  "Anthracnose (fruit rot)",
  "Fall armyworm damage",
  "Nutrient deficiency (N / Fe yellowing)",
  "Rice leaf blast",
  "Chilli leaf curl virus",
];

export type FarmTrace = {
  listing: Listing;
  polygon: [number, number][]; // SVG-normalised farm polygon (0–100)
  soilHistory: { season: string; ph: number; organicCarbon: number }[];
  organicHistory: { year: string; certified: boolean; note: string }[];
  diagnosisLog: { when: string; issue: string; confidence: number }[];
  certifications: string[];
  priceSeries: number[];
  rainfallMm: number[];
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function listingTrace(id: string): FarmTrace | undefined {
  const listing = listingById(id);
  if (!listing) return undefined;
  const r = rng(hashSeed(id));

  const polygon: [number, number][] = [];
  let a = 30 + r() * 20;
  const rad = 16 + r() * 8;
  for (let i = 0; i < 6; i++) {
    a += (Math.PI * 2) / 6;
    const jitter = 0.82 + r() * 0.36;
    polygon.push([50 + Math.cos(a) * rad * jitter, 50 + Math.sin(a) * rad * jitter]);
  }

  const seasons = ["2024 Kharif", "2025 Kharif", "2026 Kharif"];
  const soilHistory = seasons.map((season) => ({
    season,
    ph: Math.round((5.1 + r() * 1.0) * 10) / 10,
    organicCarbon: Math.round((0.5 + r() * 0.7) * 100) / 100,
  }));

  const startYear = 2023;
  const organicHistory = [0, 1, 2, 3].map((i) => ({
    year: String(startYear + i),
    certified: listing.organic ? i >= 1 : i >= 2,
    note: i === 0 ? "Transition year — no synthetic inputs" : listing.organic ? "Certified organic cycle" : "In-conversion to organic",
  }));

  const logCount = 2 + Math.floor(r() * 3);
  const diagnosisLog = Array.from({ length: logCount }).map((_, i) => ({
    when: `${8 + i * 6} days ago`,
    issue: ISSUE_POOL[(hashSeed(id + i) % ISSUE_POOL.length)],
    confidence: Math.round((0.66 + r() * 0.3) * 100) / 100,
  }));

  const certifications = [
    listing.giCert ? "GI tag verified (source district)" : "GI pending",
    listing.organic ? "Organic Mission NE certified" : "Conventional (integrated pest management)",
    "Trace-to-farm polygon on file",
    "Zero middleman chain — direct from farm",
  ];

  const priceSeries: number[] = [];
  let price = listing.pricePerKg * 0.9;
  for (let i = 0; i < 30; i++) {
    price = Math.max(listing.pricePerKg * 0.7, price + (r() - 0.45) * listing.pricePerKg * 0.03);
    priceSeries.push(Math.round(price));
  }

  const rainfallMm = Array.from({ length: 12 }).map(() => Math.round(r() * 320));

  return { listing, polygon, soilHistory, organicHistory, diagnosisLog, certifications, priceSeries, rainfallMm };
}

export function polygonsToSvgPoints(poly: [number, number][]): string {
  return poly.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}