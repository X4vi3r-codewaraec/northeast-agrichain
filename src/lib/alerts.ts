/** Deterministic early-warning feed. Mirrors what the FastAPI alert service
 *  will emit (IMD/NDMA feeds + crowd-sourced reports); the demo generator
 *  keeps dates relative to "now" so the board always looks live. */

export type Severity = "red" | "orange" | "yellow";

export type AlertCategory =
  | "flood"
  | "landslide"
  | "frost"
  | "storm"
  | "pest"
  | "market";

export type NacAlert = {
  id: string;
  severity: Severity;
  category: AlertCategory;
  title: string;
  body: string;
  districts: string[];
  state: string;
  startsInHours: number; // from "now", negative means already live
  lastsHours: number;
  source: string;
  actions: string[];
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; chip: string; card: string; bar: string; order: number }
> = {
  red: {
    label: "Red · Take action",
    chip: "bg-red-600 text-white",
    card: "border-red-200 bg-red-50/60",
    bar: "bg-red-600",
    order: 0,
  },
  orange: {
    label: "Orange · Be prepared",
    chip: "bg-orange-500 text-white",
    card: "border-orange-200 bg-orange-50/50",
    bar: "bg-orange-500",
    order: 1,
  },
  yellow: {
    label: "Yellow · Stay informed",
    chip: "bg-yellow-400 text-yellow-950",
    card: "border-yellow-200 bg-yellow-50/50",
    bar: "bg-yellow-400",
    order: 2,
  },
};

export const CATEGORY_LABEL: Record<AlertCategory, string> = {
  flood: "Flash flood",
  landslide: "Landslide",
  frost: "Frost risk",
  storm: "Thunderstorm",
  pest: "Pest outbreak",
  market: "Market advisory",
};

function isoFromNow(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3600_000);
  return d.toISOString();
}

export function generateAlerts(): NacAlert[] {
  const base: Array<
    Omit<NacAlert, "id" | "startsInHours" | "lastsHours"> & {
      startsInHours: number;
      lastsHours: number;
    }
  > = [
    {
      severity: "red",
      category: "flood",
      title: "Flash-flood watch: Barak basin",
      body: "Heavy monsoon cell parked over the Barak valley. Rivers rising 60 cm / 6 h at Silchar gauge. Low-lying paddy fields at risk of 24–48 h inundation.",
      districts: ["Cachar", "Dhalai"],
      state: "Assam · Tripura",
      startsInHours: -3,
      lastsHours: 30,
      source: "IMD regional + river gauge",
      actions: ["Move livestock to high ground", "Open field drainage channels", "Harvest ripe vegetables now"],
    },
    {
      severity: "red",
      category: "landslide",
      title: "Landslide risk: NH-6 Jowai–Silchar stretch",
      body: "Saturated slopes above NH-6 after 210 mm rain in 72 h. A 300 m stretch is prone to slip; bulk freight advised to reroute via NH-27.",
      districts: ["Jaintia Hills", "Cachar"],
      state: "Meghalaya · Assam",
      startsInHours: -1,
      lastsHours: 48,
      source: "Geological Survey + road dept.",
      actions: ["Transporter: reroute via NH-27", "Check load pooling for reroute", "Avoid night travel (11 pm – 5 am)"],
    },
    {
      severity: "orange",
      category: "frost",
      title: "Frost watch: Khasi & Jaintia valleys",
      body: "Clear skies + light winds likely to push night minimums to 4–6 °C in high valleys over the next 3 nights. Frost injury risk for potato, tomato and young turmeric.",
      districts: ["East Khasi Hills", "Jaintia Hills", "West Sikkim"],
      state: "Meghalaya · Sikkim",
      startsInHours: 9,
      lastsHours: 60,
      source: "IMD agromet + surface stations",
      actions: ["Cover seedbeds with straw mulch", "Irrigate lightly before sunset", "Protect tomato nurseries with shade net"],
    },
    {
      severity: "orange",
      category: "storm",
      title: "Severe thunderstorm: Upper Assam",
      body: "Pre-monsoon squalls with gusts to 70 km/h likely from evening. Hail possible along Jorhat–Dibrugarh corridor. Secure tea-garden bungalow roofs and bamboo props.",
      districts: ["Jorhat", "Dibrugarh", "Nagaon"],
      state: "Assam",
      startsInHours: 5,
      lastsHours: 18,
      source: "IMD thunderstorm outlook",
      actions: ["Stake young cardamom & banana plants", "Anchor tea-plucking sheds", "Keep phone charged for alert updates"],
    },
    {
      severity: "yellow",
      category: "pest",
      title: "Fall armyworm report: Churachandpur maize",
      body: "Scout reports of fall armyworm on early maize in two villages. Confirm with leaf photos via the AI diagnosis tool before spraying.",
      districts: ["Churachandpur", "Imphal West"],
      state: "Manipur",
      startsInHours: -8,
      lastsHours: 96,
      source: "Extension scouts",
      actions: ["Scout 20 plants / acre at dawn", "Send leaf photo to AI diagnosis", "Delay broad-spectrum sprays until confirmed"],
    },
    {
      severity: "yellow",
      category: "market",
      title: "Price dip: Queen pineapple, Agartala mandi",
      body: "Arrivals at Agartala mandi rose 22% week-on-week; farm-gate price soft by ₹4/kg. Buyers’ pool below usual for premium GI lots.",
      districts: ["West Tripura", "Gomati"],
      state: "Tripura",
      startsInHours: -12,
      lastsHours: 120,
      source: "Mand survey + FPO reports",
      actions: ["Hold ripe stock 2 days if storage clear", "List surplus in the marketplace", "Negotiate pooled freight to Guwahati"],
    },
    {
      severity: "red",
      category: "flood",
      title: "River erosion advisory: Brahmaputra, Dibrugarh",
      body: "Rising Brahmaputra eroding the Dibrugarh–Mohanbari bank. Farm plots within 150 m of the eroding bank should move pumps and seed stores.",
      districts: ["Dibrugarh"],
      state: "Assam",
      startsInHours: 20,
      lastsHours: 36,
      source: "Water resources dept.",
      actions: ["Relocate diesel pumps & seed godown", "Sandbag the tube well apron", "Move harvested paddy to higher godown"],
    },
    {
      severity: "orange",
      category: "frost",
      title: "Ground frost: Ziro valley, Arunachal",
      body: "Cold-air drainage filling the Ziro bowl around sunrise. Night temps may touch 3 °C — kiwi vines and nursery lettuce at risk.",
      districts: ["Lower Subansiri", "West Siang"],
      state: "Arunachal Pradesh",
      startsInHours: 2,
      lastsHours: 40,
      source: "IMD station + local observers",
      actions: ["Keep kiwi root-zone mulched", "Warm nursery through simple hoop tunnels", "Delay morning irrigation"],
    },
    {
      severity: "yellow",
      category: "storm",
      title: "Squalls possible: Mizoram hill towns",
      body: "Labelled instability across Aizawl–Lunglei hills. Brief but intense showers may disrupt jhum burn schedules this weekend.",
      districts: ["Aizawl", "Lunglei", "Champhai"],
      state: "Mizoram",
      startsInHours: 26,
      lastsHours: 20,
      source: "Regional weather radar",
      actions: ["Hold fire-line preparations", "Carry rain covers for seed sacks", "Monitor the alert board before Sunday"],
    },
  ];

  return base.map((a, i) => ({
    ...a,
    id: `al-${i + 1}`,
    startsInHours: a.startsInHours,
    lastsHours: a.lastsHours,
  }));
}

export function alertStartsAt(a: NacAlert): string {
  return isoFromNow(a.startsInHours);
}

export function statusLabel(a: NacAlert): { text: string; live: boolean } {
  if (a.startsInHours <= 0) return { text: "Active now", live: true };
  const h = Math.round(a.startsInHours);
  if (h < 24) return { text: `Starts in ~${h} h`, live: false };
  return { text: `Starts in ~${Math.round(h / 24)} d`, live: false };
}