/** Demo shipment records. Numbers (ETA, shelf-life) are deterministic code —
 *  the FastAPI service will own tracking + pooling suggestions later. */

import { districtGeo, DISTRICT_COORDS } from "@/lib/geo";
import { haversineKm } from "@/lib/logistics";

export type ShipmentStatus = "booked" | "picked" | "in-transit" | "delivered";

export type RouteHealth = "good" | "delayed" | "alert";

export type DemoShipment = {
  id: string;
  cropId: string;
  cropName: string;
  qtyT: number;
  origin: string;
  dest: string;
  transporter: string;
  vehicle: string;
  status: ShipmentStatus;
  etaMin: number; // remaining transit time
  ambientC: number;
  coldChain: boolean;
  routeHealth: RouteHealth;
  pooled: number; // farmers pooling into this vehicle (1 = solo)
  driverName: string;
  phone: string;
};

export const STATUS_ORDER: ShipmentStatus[] = ["booked", "picked", "in-transit", "delivered"];

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  booked: "Booked",
  picked: "Picked up",
  "in-transit": "In transit",
  delivered: "Delivered",
};

export const ROUTE_HEALTH_META: Record<RouteHealth, { label: string; cls: string }> = {
  good: { label: "Clear corridor", cls: "bg-forest-600" },
  delayed: { label: "Delay ahead", cls: "bg-yellow-500" },
  alert: { label: "Closure alert", cls: "bg-red-600" },
};

export const DEMO_SHIPMENTS: DemoShipment[] = [
  {
    id: "SH-NER-4821",
    cropId: "king-chilli",
    cropName: "King Chilli",
    qtyT: 1.2,
    origin: "Nagaon",
    dest: "Guwahati Cold Chain Hub",
    transporter: "Hillside Express",
    vehicle: "Refrigerated 9t · AS-01-X-4821",
    status: "in-transit",
    etaMin: 95,
    ambientC: 24,
    coldChain: true,
    routeHealth: "good",
    pooled: 3,
    driverName: "R. Das",
    phone: "+91 70000 48210",
  },
  {
    id: "SH-NER-4790",
    cropId: "mizo-ginger",
    cropName: "Mizo Ginger",
    qtyT: 2.4,
    origin: "Aizawl",
    dest: "Silchar Perishable Store",
    transporter: "Mizoram Coop Trucking",
    vehicle: "Covered 12t · MZ-01-C-4790",
    status: "in-transit",
    etaMin: 210,
    ambientC: 27,
    coldChain: false,
    routeHealth: "delayed",
    pooled: 2,
    driverName: "L. Hmar",
    phone: "+91 70000 47905",
  },
  {
    id: "SH-NER-4755",
    cropId: "joha-rice",
    cropName: "Joha Rice",
    qtyT: 5.0,
    origin: "Jorhat",
    dest: "Jorhat Agro Godown",
    transporter: "Brahmaputra Logistics",
    vehicle: "Truck 16t · AS-05-Z-4755",
    status: "picked",
    etaMin: 40,
    ambientC: 26,
    coldChain: false,
    routeHealth: "good",
    pooled: 1,
    driverName: "K. Gohain",
    phone: "+91 70000 47558",
  },
  {
    id: "SH-NER-4731",
    cropId: "large-cardamom",
    cropName: "Large Cardamom",
    qtyT: 0.6,
    origin: "East Sikkim",
    dest: "Gangtok Cardamom Cure & Store",
    transporter: "Sikkim Hill Carriers",
    vehicle: "Pickup 3t · SK-01-B-4731",
    status: "booked",
    etaMin: 320,
    ambientC: 20,
    coldChain: false,
    routeHealth: "alert",
    pooled: 4,
    driverName: "P. Bhutia",
    phone: "+91 70000 47311",
  },
  {
    id: "SH-NER-4662",
    cropId: "queen-pineapple",
    cropName: "Queen Pineapple",
    qtyT: 3.1,
    origin: "West Tripura",
    dest: "Agartala Banana Ripening Centre",
    transporter: "Tripura Horti Haul",
    vehicle: "Ambient 10t · TR-03-P-4662",
    status: "delivered",
    etaMin: 0,
    ambientC: 28,
    coldChain: false,
    routeHealth: "good",
    pooled: 5,
    driverName: "S. Majumder",
    phone: "+91 70000 46623",
  },
];

export function shipmentById(id: string): DemoShipment | undefined {
  return DEMO_SHIPMENTS.find((s) => s.id === id);
}

/* ------------------------------------------------------------------ */
/* Pooling wizard engine — mirrors `POST /shipments/pool/suggest`      */
/* ------------------------------------------------------------------ */

export type PoolPartner = {
  farmer: string;
  district: string;
  qtyT: number;
  pickup: string;
};

export type PoolSuggestion = {
  poolId: string;
  matchCount: number;
  combinedQtyT: number;
  soloFreight: number; // ₹
  pooledFreight: number; // ₹ (your share)
  savingsPct: number;
  partners: PoolPartner[];
  vehicleHint: string;
  routeKm: number;
  terrainNote: string;
};

const PARTNER_FARMERS = [
  "Ranjit Bora", "Mamoni Kalita", "Lalsangma Darlong", "T. Zeliang",
  "Phurpa Tamang", "Kongkan Panging", "Lalrinmawia", "Sarabjit Singh",
  "Dhananjay Rabha", "Ngurthangpuii", "Bidyananda Das", "Pema Choden",
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Your floor freight for the leg; `cold` inflates the per-tonne-km rate. */
export function freightEstimate(km: number, qtyT: number, cold: boolean, climbM: number): number {
  const base = 900;
  const perTonneKm = (13 + climbM / 120) * (cold ? 1.55 : 1);
  return Math.round(base + perTonneKm * km * qtyT);
}

export function suggestPool(opts: {
  origin: string;
  dest: string;
  qtyT: number;
  cold: boolean;
}): PoolSuggestion {
  const { origin, dest, qtyT, cold } = opts;
  const a = districtGeo(origin);
  const b = districtGeo(dest);
  const km = a && b ? Math.round(haversineKm(a, b) * 1.35) : 0;
  const climbM = a && b ? Math.max(0, b.elevation - a.elevation) : 0;

  const rand = mulberry32(hashStr(`${origin}|${dest}|${qtyT.toFixed(1)}`));
  const matchCount = 1 + Math.floor(rand() * 4); // 1–4 neighbours

  const districtPool = Object.keys(DISTRICT_COORDS).filter((d) => d !== origin && d !== dest);
  const partners: PoolPartner[] = [];
  for (let i = 0; i < matchCount; i++) {
    const district = districtPool[Math.floor(rand() * districtPool.length)];
    const farmer = PARTNER_FARMERS[Math.floor(rand() * PARTNER_FARMERS.length)];
    const pQty = Math.round((qtyT * (0.35 + rand() * 1.1)) * 10) / 10;
    const pickupIdx = Math.floor(rand() * 3);
    partners.push({
      farmer,
      district,
      qtyT: pQty,
      pickup: `${pickupIdx === 0 ? "same run" : `day +${pickupIdx}`}`,
    });
  }

  const combinedQtyT = Math.round((qtyT + partners.reduce((s, p) => s + p.qtyT, 0)) * 10) / 10;
  const soloFreight = freightEstimate(km, qtyT, cold, climbM);
  const vehicleCost = freightEstimate(km, combinedQtyT, cold, climbM) * 0.82; // bulk share
  const pooledFreight = Math.round((vehicleCost * qtyT) / combinedQtyT);
  const savingsPct = Math.round(((1 - pooledFreight / soloFreight) * 1000)) / 10;

  const vehicleHint =
    combinedQtyT <= 2.5
      ? "Covered pickup 3t"
      : combinedQtyT <= 8
        ? cold
          ? "Refrigerated 9t"
          : "Covered 9t"
        : cold
          ? "Refrigerated 16t"
          : "Open-floor 16t";

  return {
    poolId: `POOL-${String(hashStr(`${origin}${dest}`) % 9000 + 1000)}`,
    matchCount,
    combinedQtyT,
    soloFreight,
    pooledFreight,
    savingsPct,
    partners,
    vehicleHint,
    routeKm: km,
    terrainNote:
      climbM > 500
        ? `Hill sector: ~${climbM}m of climbing — pooled rigs carry the grade better than solo pickups.`
        : "Mostly lowland sector — a single pooled rig is easy to arrange on this corridor.",
  };
}

/* ------------------------------------------------------------------ */
/* Shipment detail — tracking, ambient log, proof-of-delivery         */
/* ------------------------------------------------------------------ */

export type ShipmentTrack = {
  shipment: DemoShipment;
  polyline: [number, number][]; // SVG-normalised 0–100
  stops: { label: string; detail: string; done: boolean; current: boolean }[];
  ambientLog: { t: string; tempC: number; humidity: number }[];
  pod: boolean;
  spoilageReported: boolean;
  narration: string[];
};

export function shipmentTrack(id: string): ShipmentTrack | undefined {
  const shipment = shipmentById(id);
  if (!shipment) return undefined;
  const r = mulberry32(hashStr(id));

  const polyline: [number, number][] = [];
  let x = 8;
  let y = 78;
  for (let i = 0; i <= 6; i++) {
    polyline.push([x, y]);
    x += 14 + r() * 3;
    y -= 9 + r() * 6;
    if (y < 14) y = 18;
  }

  const statusIdx = STATUS_ORDER.indexOf(shipment.status);
  const stopLabels: { label: string; detail: string }[] = [
    { label: "Booked", detail: `${shipment.origin} · load accepted` },
    { label: "Picked up", detail: `Loaded at ${shipment.origin}` },
    { label: "In transit", detail: `${shipment.routeHealth === "alert" ? "Rerouted via diversion" : "On corridor"}` },
    { label: "Delivered", detail: shipment.dest },
  ];
  const stops = stopLabels.map((s, i) => ({
    ...s,
    done: i < statusIdx || shipment.status === "delivered",
    current: i === statusIdx && shipment.status !== "delivered",
  }));

  const ambientLog = Array.from({ length: 8 }).map((_, i) => {
    const base = shipment.coldChain ? 4 : 26;
    const wobble = (r() - 0.5) * (shipment.coldChain ? 2.4 : 5);
    return {
      t: `+${i * 4}h`,
      tempC: Math.round((base + wobble) * 10) / 10,
      humidity: Math.round((shipment.coldChain ? 82 : 64) + (r() - 0.5) * 12),
    };
  });

  const narration: string[] = [];
  if (shipment.routeHealth === "alert") {
    narration.push("A closure/landslide advisory touches this corridor — the driver is on the NH diversion, adding roughly +45 min.");
    narration.push("Cold-chain is holding on the detour; keep unloading bay time short at arrival.");
  } else if (shipment.routeHealth === "delayed") {
    narration.push("Moderate delay from a check-post queue; ambient stayed within tolerance for the cargo class.");
  } else {
    narration.push("Clear corridor and steady progress — this load is trending on time to the destination.");
  }
  if (!shipment.coldChain && shipment.ambientC > 27) {
    narration.push("Ambient cargo in warm conditions: prioritise early arrival to protect shelf life.");
  }

  return {
    shipment,
    polyline,
    stops,
    ambientLog,
    pod: shipment.status === "delivered",
    spoilageReported: false,
    narration,
  };
}

export function trackPolylinePoints(poly: [number, number][]): string {
  return poly.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}