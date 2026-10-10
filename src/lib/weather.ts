/** Weather data layer: real Open-Meteo forecasts with a deterministic mock
 *  fallback so the UI works fully offline (Project.md: low-bandwidth offline-first). */

import type { IconName } from "@/components/icons";
import { districtGeo } from "@/lib/geo";

export type DayForecast = {
  /** ISO date, e.g. 2026-10-10 */
  date: string;
  dayLabel: string; // "Sat 10"
  monthLabel: string; // "10 Oct"
  weatherCode: number;
  weatherLabel: string;
  icon: IconName;
  tempMax: number;
  tempMin: number;
  precipProb: number; // 0–100
  precipMm: number;
  humidity: number; // %
  windKmh: number; // gust-max for the day
};

export type WeatherReport = {
  district: string;
  place: string;
  elevation: number;
  source: "open-meteo" | "mock";
  generatedAt: string; // ISO
  days: DayForecast[];
};

/** WMO weather interpretation codes → localised label + icon. */
export function wmoInfo(code: number): { label: string; icon: IconName } {
  switch (code) {
    case 0:
      return { label: "Clear skies", icon: "sun" };
    case 1:
      return { label: "Mostly clear", icon: "sun" };
    case 2:
      return { label: "Partly cloudy", icon: "cloud" };
    case 3:
      return { label: "Overcast", icon: "cloud" };
    case 45:
    case 48:
      return { label: "Fog / mist", icon: "fog" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: "Light drizzle", icon: "droplet" };
    case 61:
      return { label: "Light rain", icon: "droplet" };
    case 63:
      return { label: "Rain", icon: "cloudRain" };
    case 65:
      return { label: "Heavy rain", icon: "cloudRain" };
    case 66:
    case 67:
      return { label: "Freezing rain", icon: "cloudRain" };
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: "Snowfall", icon: "cloud" };
    case 80:
      return { label: "Light showers", icon: "droplet" };
    case 81:
      return { label: "Showers", icon: "cloudRain" };
    case 82:
      return { label: "Violent showers", icon: "cloudRain" };
    case 85:
    case 86:
      return { label: "Snow showers", icon: "cloud" };
    case 95:
      return { label: "Thunderstorm", icon: "thunder" };
    case 96:
    case 99:
      return { label: "Thunder + hail risk", icon: "thunder" };
    default:
      return { label: "Mixed", icon: "cloud" };
  }
}

function dayLabel(dateStr: string): { dayLabel: string; monthLabel: string } {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDate();
  const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  return { dayLabel: `${dayName} ${day}`, monthLabel: `${day} ${month}` };
}

/** Tiny seeded PRNG so offline demo data is stable across reloads. */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
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

type DailyRow = {
  time: string;
  weather_code: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  precipitation_sum: number;
  precipitation_probability_max: number;
  wind_speed_10m_max: number;
  relative_humidity_2m_max: number;
};

type OpenMeteoResponse = {
  daily?: DailyRow[];
  timezone?: string;
};

/** Fetch a 7-day forecast for a district from Open-Meteo (no API key needed). */
export async function fetchWeather(district: string): Promise<WeatherReport> {
  const geo = districtGeo(district);
  const fallback = mockWeather(district);

  if (!geo) {
    return fallback;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,` +
    `precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max` +
    `&forecast_days=7&timezone=Asia%2FKolkata`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;

    const json = (await res.json()) as OpenMeteoResponse;
    const rows = json.daily ?? [];
    if (rows.length === 0) return fallback;

    const days: DayForecast[] = rows.map((r) => {
      const info = wmoInfo(r.weather_code);
      const labels = dayLabel(r.time);
      return {
        date: r.time,
        ...labels,
        weatherCode: r.weather_code,
        weatherLabel: info.label,
        icon: info.icon,
        tempMax: Math.round(r.temperature_2m_max ?? 0),
        tempMin: Math.round(r.temperature_2m_min ?? 0),
        precipProb: Math.round(r.precipitation_probability_max ?? 0),
        precipMm: Number((r.precipitation_sum ?? 0).toFixed(1)),
        humidity: Math.round(r.relative_humidity_2m_max ?? 70),
        windKmh: Math.round(r.wind_speed_10m_max ?? 8),
      };
    });

    return {
      district,
      place: geo.label,
      elevation: geo.elevation,
      source: "open-meteo",
      generatedAt: new Date().toISOString(),
      days,
    };
  } catch {
    return fallback;
  }
}

/** Deterministic, plausible NER monsoon-taper forecast used when offline. */
export function mockWeather(district: string): WeatherReport {
  const geo = districtGeo(district);
  const rand = mulberry32(hashSeed(district));
  const base = geo ? Math.max(16, 30 - geo.elevation / 140) : 27;
  const days: DayForecast[] = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const labels = dayLabel(iso);

    // Wave pattern: rain clusters then a dry cooler stretch.
    const wave = 0.5 + 0.5 * Math.sin(i * 1.7 + hashSeed(district) % 7);
    const rainy = wave > 0.72;
    const code = rainy
      ? Math.random() < 0.35 ? 95 : Math.random() < 0.5 ? 80 : 63
      : wave > 0.55
        ? 3
        : wave > 0.4
          ? 2
          : 1;

    const tempMax = Math.round(base + (rainy ? -2 : 3) + rand() * 3);
    const tempMin = Math.round(base - 8 + rand() * 3);
    const precipProb = rainy
      ? 65 + Math.round(rand() * 30)
      : Math.round(rand() * 30);
    const precipMm = rainy
      ? Number((4 + rand() * 26).toFixed(1))
      : Number((rand() * 1.2).toFixed(1));

    const info = wmoInfo(code);
    days.push({
      date: iso,
      ...labels,
      weatherCode: code,
      weatherLabel: info.label,
      icon: info.icon,
      tempMax,
      tempMin,
      precipProb,
      precipMm,
      humidity: rainy ? 86 + Math.round(rand() * 9) : 62 + Math.round(rand() * 14),
      windKmh: 8 + Math.round(rand() * 18),
    });
  }

  return {
    district,
    place: geo?.label ?? district,
    elevation: geo?.elevation ?? 120,
    source: "mock",
    generatedAt: new Date().toISOString(),
    days,
  };
}

/** Rolling rain window used by the soil-moisture gauge. */
export function rainWindow(days: DayForecast[]): number {
  return days
    .slice(0, 3)
    .reduce((acc, d) => acc + d.precipMm, 0);
}

export function soilMoistureLevel(rain3d: number): {
  level: "low" | "ok" | "wet" | "saturated";
  label: string;
} {
  if (rain3d >= 28) return { level: "saturated", label: "Saturated" };
  if (rain3d >= 14) return { level: "wet", label: "Moist — watch for waterlogging" };
  if (rain3d >= 4) return { level: "ok", label: "Adequate for germination" };
  return { level: "low", label: "Low — irrigate if seedlings" };
}

/** Rule-based advisory that mimics the GPT-4o mini pipeline. Deterministic,
 *  never the LLM — used in the demo until the FastAPI `POST /diagnose` ships. */
export function buildAdvisory(days: DayForecast[], crop: string): string[] {
  const rainToday = days[0]?.precipProb ?? 0;
  const heavyDay = days.findIndex((d) => d.precipMm >= 15);
  const dryDay = days.findIndex((d) => d.precipProb <= 20 && d.precipMm < 1);
  const cold = days.some((d) => d.tempMin < 14);
  const out: string[] = [];

  if (heavyDay >= 0) {
    const d = days[heavyDay];
    out.push(
      `Expect ${d.weatherLabel.toLowerCase()} on ${d.dayLabel} (~${d.precipMm} mm). ` +
        `Delay urea / fertiliser top-dressing by 2 days and keep harvest rows ` +
        `drained. Secure tarpaulin over any dried produce.`,
    );
  }
  if (dryDay >= 0) {
    const d = days[dryDay];
    out.push(
      `${d.dayLabel} looks mostly dry (${d.precipProb}% rain) — a good window for ` +
        `spraying, transplanting ${crop}, or opening bale stacks for airing.`,
    );
  }
  if (cold) {
    out.push(
      `Night minimums dip below 14 °C this week: cover nursery beds with ` +
        `mulch near frost-prone valleys and move seed trays under shade.`,
    );
  }
  if (rainToday >= 55) {
    out.push(
      `Rain likely within the next 24–48 h. Finish field draining and move ` +
        `harvested produce to the store house before the showers start.`,
    );
  }
  if (out.length === 0) {
    out.push(
      `A settled, mild week ahead. Ideal conditions for weeding, seedbed ` +
        `preparation and scheduled irrigation — keep an eye on the alert board ` +
        `for any last-minute change.`,
    );
  }
  return out;
}