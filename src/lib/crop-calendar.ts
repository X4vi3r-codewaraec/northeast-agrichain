/** Sowing/transplanting/harvesting windows for NER specialty crops.
 *  Months are 0-based (0 = Jan … 11 = Dec). Relative to today's month,
 *  the UI highlights "what to do now". */

export type CropWindow = {
  activity: "seedbed" | "transplant" | "harvest" | "market";
  start: number; // month 0–11
  end: number; // month 0–11 (inclusive)
  note: string;
};

export type CropTimeline = {
  id: string;
  name: string;
  local: string;
  region: string;
  windows: CropWindow[];
};

export const CROP_TIMELINES: CropTimeline[] = [
  {
    id: "joha-rice",
    name: "Joha Rice",
    local: "Joha",
    region: "Assam",
    windows: [
      { activity: "seedbed", start: 3, end: 5, note: "Raise sali nursery" },
      { activity: "transplant", start: 5, end: 7, note: "Transplant into puddled field" },
      { activity: "harvest", start: 9, end: 10, note: "Harvest — golden awns" },
      { activity: "market", start: 10, end: 11, note: "Peak festival demand" },
    ],
  },
  {
    id: "king-chilli",
    name: "King Chilli",
    local: "Bhut Jolokia",
    region: "Nagaland · Assam · Manipur",
    windows: [
      { activity: "seedbed", start: 1, end: 3, note: "Sow seed trays" },
      { activity: "transplant", start: 3, end: 4, note: "Transplant after frost" },
      { activity: "harvest", start: 6, end: 10, note: "Green → ripe red picking" },
      { activity: "market", start: 7, end: 10, note: "Premium dried + fresh lots" },
    ],
  },
  {
    id: "lakadong-turmeric",
    name: "Lakadong Turmeric",
    local: "Lakadong",
    region: "Meghalaya",
    windows: [
      { activity: "seedbed", start: 3, end: 5, note: "Plant rhizome sets" },
      { activity: "transplant", start: 4, end: 6, note: "Second flush planting" },
      { activity: "harvest", start: 10, end: 12, note: "Dig, cure & polish" },
      { activity: "market", start: 1, end: 2, note: "Export orders for curcumin" },
    ],
  },
  {
    id: "large-cardamom",
    name: "Large Cardamom",
    local: "Bara Elaichi",
    region: "Sikkim",
    windows: [
      { activity: "seedbed", start: 4, end: 6, note: "Propagate suckers under shade" },
      { activity: "transplant", start: 5, end: 7, note: "Plant under alder canopy" },
      { activity: "harvest", start: 7, end: 9, note: "Pick capsules, smoke-cure" },
      { activity: "market", start: 8, end: 10, note: "Capsule grading & auction" },
    ],
  },
  {
    id: "queen-pineapple",
    name: "Queen Pineapple",
    local: "Queen Pine",
    region: "Tripura",
    windows: [
      { activity: "seedbed", start: 4, end: 6, note: "Sucker plantation" },
      { activity: "transplant", start: 5, end: 7, note: "Mulch rows, inter-crop" },
      { activity: "harvest", start: 7, end: 10, note: "Main + ratoon crop" },
      { activity: "market", start: 7, end: 9, note: "GI premium at mandi" },
    ],
  },
  {
    id: "mizo-ginger",
    name: "Mizo Ginger",
    local: "Aliaw Adu",
    region: "Mizoram",
    windows: [
      { activity: "seedbed", start: 2, end: 4, note: "Chit & sow rhizomes" },
      { activity: "transplant", start: 3, end: 5, note: "Hill-slope drills" },
      { activity: "harvest", start: 10, end: 11, note: "Mature rhizome lifting" },
      { activity: "market", start: 11, end: 12, note: "Oleoresin tender lots" },
    ],
  },
];

const ACTIVITY_META: Record<
  CropWindow["activity"],
  { label: string; classes: string; short: string }
> = {
  seedbed: { label: "Seedbed / planting", short: "Sow", classes: "bg-gold-300 text-gold-950" },
  transplant: { label: "Transplanting", short: "Plant", classes: "bg-forest-600 text-sand-50" },
  harvest: { label: "Harvesting", short: "Harvest", classes: "bg-clay-500 text-sand-50" },
  market: { label: "Best market window", short: "Market", classes: "bg-gold-500 text-ink-900" },
};

export const ACTIVITY_META_BY_ID = ACTIVITY_META;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function activityMeta(activity: CropWindow["activity"]) {
  return ACTIVITY_META[activity];
}

export function monthStatus(m: number, win: CropWindow): "upcoming" | "active" | "done" {
  const wrappedEnd = win.start <= win.end ? win.end : win.end + 12;
  const pos = m >= win.start ? m : m + 12;
  if (pos > wrappedEnd) return "done";
  if (pos < win.start) return "upcoming";
  return "active";
}