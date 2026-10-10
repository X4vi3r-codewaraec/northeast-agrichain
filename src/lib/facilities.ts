/** NER storage & logistics facility catalog (demo seed — the FastAPI service
 *  will serve the live GeoJSON/PostGIS version). */

export type FacilityType = "cold" | "godown" | "ripening" | "curing";

export type Facility = {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  state: string;
  lat: number;
  lon: number;
  address: string;
  capacityT: number;
  availableT: number;
  tempC: string;
  rate: number; // ₹ / tonne / day
  crops: string[]; // crop ids served
  owner: string;
  rating: number; // 0–5
  solarBackup: boolean;
  hours: string;
};

export const FACILITY_TYPE_LABEL: Record<FacilityType, string> = {
  cold: "Cold storage",
  godown: "Dry godown",
  ripening: "Ripening chamber",
  curing: "Curing & storage",
};

export const FACILITIES: Facility[] = [
  {
    id: "fac-guw-cold",
    name: "Guwahati Cold Chain Hub",
    type: "cold",
    district: "Kamrup Metro",
    state: "Assam",
    lat: 26.1833,
    lon: 91.7506,
    address: "Amingaon Industrial Area, NH-27",
    capacityT: 2400,
    availableT: 540,
    tempC: "−18 / +4 °C",
    rate: 180,
    crops: ["king-chilli", "mizo-ginger", "kiwi", "queen-pineapple"],
    owner: "NER Agro Logistics Pvt Ltd",
    rating: 4.4,
    solarBackup: true,
    hours: "24 × 7",
  },
  {
    id: "fac-sil-cold",
    name: "Silchar Perishable Store",
    type: "cold",
    district: "Cachar",
    state: "Assam",
    lat: 24.85,
    lon: 92.8,
    address: "Tarapur Bypass, near APMC",
    capacityT: 800,
    availableT: 210,
    tempC: "+4 / +8 °C",
    rate: 150,
    crops: ["king-chilli", "mizo-ginger"],
    owner: "Barak Valley Cold Co-op",
    rating: 4.1,
    solarBackup: false,
    hours: "6 am – 9 pm",
  },
  {
    id: "fac-jor-godown",
    name: "Jorhat Agro Godown",
    type: "godown",
    district: "Jorhat",
    state: "Assam",
    lat: 26.75,
    lon: 94.21,
    address: "Chenijan Road, Jorhat",
    capacityT: 1500,
    availableT: 780,
    tempC: "Ambient, dry",
    rate: 45,
    crops: ["joha-rice", "assam-tea", "large-cardamom"],
    owner: "Assam Warehousing Corp",
    rating: 4.0,
    solarBackup: false,
    hours: "8 am – 6 pm",
  },
  {
    id: "fac-dim-hub",
    name: "Dimapur Perishable Hub",
    type: "cold",
    district: "Dimapur",
    state: "Nagaland",
    lat: 25.9036,
    lon: 93.7275,
    address: "4th Mile, Chumukedima",
    capacityT: 600,
    availableT: 145,
    tempC: "+2 / +6 °C",
    rate: 165,
    crops: ["queen-pineapple", "kiwi", "large-cardamom"],
    owner: "Naga Horti Federation",
    rating: 4.2,
    solarBackup: true,
    hours: "24 × 7",
  },
  {
    id: "fac-imph-godown",
    name: "Imphal Mandi Godown",
    type: "godown",
    district: "Imphal West",
    state: "Manipur",
    lat: 24.808,
    lon: 93.938,
    address: "Ima Keithel complex, Khwairamband",
    capacityT: 900,
    availableT: 430,
    tempC: "Ambient",
    rate: 40,
    crops: ["joha-rice", "mizo-ginger", "lakadong-turmeric"],
    owner: "Manipur State Agro",
    rating: 3.9,
    solarBackup: false,
    hours: "7 am – 7 pm",
  },
  {
    id: "fac-aiz-cold",
    name: "Aizawl Hill Cold Store",
    type: "cold",
    district: "Aizawl",
    state: "Mizoram",
    lat: 23.7271,
    lon: 92.7176,
    address: "Kulikawn, Aizawl",
    capacityT: 450,
    availableT: 60,
    tempC: "+4 / +8 °C",
    rate: 175,
    crops: ["mizo-ginger", "king-chilli"],
    owner: "Mizo Fresh Produce Ltd",
    rating: 4.3,
    solarBackup: true,
    hours: "8 am – 8 pm",
  },
  {
    id: "fac-agart-rip",
    name: "Agartala Banana Ripening Centre",
    type: "ripening",
    district: "West Tripura",
    state: "Tripura",
    lat: 23.8419,
    lon: 91.2868,
    address: "Bodhjungnagar Industrial Estate",
    capacityT: 300,
    availableT: 95,
    tempC: "+14 / +18 °C",
    rate: 120,
    crops: ["queen-pineapple"],
    owner: "Tripura Horti Mission",
    rating: 4.0,
    solarBackup: true,
    hours: "6 am – 10 pm",
  },
  {
    id: "fac-gant-cure",
    name: "Gangtok Cardamom Cure & Store",
    type: "curing",
    district: "East Sikkim",
    state: "Sikkim",
    lat: 27.3389,
    lon: 88.6065,
    address: "Sichey, Gangtok",
    capacityT: 220,
    availableT: 18,
    tempC: "Drying room 35–40 °C",
    rate: 210,
    crops: ["large-cardamom"],
    owner: "Sikkim Spices Board outlet",
    rating: 4.5,
    solarBackup: true,
    hours: "9 am – 6 pm",
  },
];

export function facilityById(id: string): Facility | undefined {
  return FACILITIES.find((f) => f.id === id);
}