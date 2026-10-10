/** Approximate coords + elevation for demo districts (used for Open-Meteo + routing). */

export type GeoPoint = {
  lat: number;
  lon: number;
  elevation: number; // metres
  label: string;
};

/**
 * Keyed by district name as listed in NER_STATES. Values are demo-grade
 * approximations — accurate enough for a hackathon demo forecast.
 */
export const DISTRICT_COORDS: Record<string, GeoPoint> = {
  "Kamrup Metro": { lat: 26.1445, lon: 91.7362, elevation: 55, label: "Guwahati" },
  Jorhat: { lat: 26.7509, lon: 94.2037, elevation: 116, label: "Jorhat" },
  Dibrugarh: { lat: 27.4728, lon: 94.912, elevation: 108, label: "Dibrugarh" },
  Nagaon: { lat: 26.3461, lon: 92.6844, elevation: 60, label: "Nagaon" },
  Cachar: { lat: 24.817, lon: 92.7979, elevation: 24, label: "Silchar" },
  "East Khasi Hills": { lat: 25.5788, lon: 91.8933, elevation: 1496, label: "Shillong" },
  "Ri-Bhoi": { lat: 25.9, lon: 91.8833, elevation: 540, label: "Nongpoh" },
  "Jaintia Hills": { lat: 25.435, lon: 92.1978, elevation: 1365, label: "Jowai" },
  "Papum Pare": { lat: 27.0844, lon: 93.6053, elevation: 214, label: "Itanagar" },
  "West Siang": { lat: 28.1667, lon: 94.7667, elevation: 745, label: "Aalo" },
  "Lower Subansiri": { lat: 27.57, lon: 93.8336, elevation: 1553, label: "Ziro" },
  Kohima: { lat: 25.6747, lon: 94.1086, elevation: 1444, label: "Kohima" },
  Dimapur: { lat: 25.9118, lon: 93.7282, elevation: 145, label: "Dimapur" },
  Mokokchung: { lat: 26.3241, lon: 94.518, elevation: 1325, label: "Mokokchung" },
  "Imphal West": { lat: 24.817, lon: 93.9368, elevation: 785, label: "Imphal" },
  Thoubal: { lat: 24.6333, lon: 94.0167, elevation: 780, label: "Thoubal" },
  Churachandpur: { lat: 24.332, lon: 93.686, elevation: 914, label: "Churachandpur" },
  Aizawl: { lat: 23.7271, lon: 92.7176, elevation: 1132, label: "Aizawl" },
  Lunglei: { lat: 22.8812, lon: 92.737, elevation: 722, label: "Lunglei" },
  Champhai: { lat: 23.4562, lon: 93.325, elevation: 1325, label: "Champhai" },
  "West Tripura": { lat: 23.8315, lon: 91.2868, elevation: 18, label: "Agartala" },
  Dhalai: { lat: 23.935, lon: 91.849, elevation: 45, label: "Ambassa" },
  Gomati: { lat: 23.533, lon: 91.483, elevation: 30, label: "Udaipur" },
  "East Sikkim": { lat: 27.3389, lon: 88.6065, elevation: 1436, label: "Gangtok" },
  "West Sikkim": { lat: 27.292, lon: 88.259, elevation: 2070, label: "Gyalshing" },
  "North Sikkim": { lat: 27.516, lon: 88.533, elevation: 900, label: "Mangan" },
};

export function districtGeo(district: string): GeoPoint | undefined {
  return DISTRICT_COORDS[district];
}