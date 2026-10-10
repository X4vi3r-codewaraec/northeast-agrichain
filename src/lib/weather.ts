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

export type CurrentConditions = {
  isoTime: string;
  timeLabel: string; // "2:30 pm"
  temp: number; // °C
  feelsLike: number;
  weatherCode: number;
  weatherLabel: string;
  icon: IconName;
  humidity: number; // %
  windKmh: number;
  gustKmh: number;
  uvIndex: number;
  precipMm: number; // past hour
};

export type HourForecast = {
  isoTime: string;
  hourLabel: string; // "2 pm"
  temp: number;
  weatherCode: number;
  icon: IconName;
  precipProb: number; // 0–100
};

export type WeatherReport = {
  district: string;
  place: string;
  elevation: number;
  source: "open-meteo" | "mock";
  generatedAt: string; // ISO
  current: CurrentConditions;
  /** Next ~24 hours from the moment of the fetch. */
  hourly: HourForecast[];
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

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    hour12: true,
  });
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

/** Current conditions are returned as a single scalar row. */
type CurrentRow = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_gusts_10m?: number;
  uv_index: number;
};

/** Open-Meteo returns column-oriented series: each field maps to a value array. */
type ColumnSeries = {
  time: string[];
  [field: string]: (number | string | null)[];
};

type OpenMeteoResponse = {
  current?: CurrentRow;
  hourly?: ColumnSeries;
  daily?: ColumnSeries;
  timezone?: string;
};

/** Read one value from a column array at row `i`. */
function columnAt(
  series: ColumnSeries | undefined,
  field: string,
  i: number,
  fallback = 0,
): number {
  const v = series?.[field]?.[i];
  return typeof v === "number" ? v : Number(v ?? fallback);
}

/** Fetch a 7-day forecast for a district from Open-Meteo (no API key needed). */
export async function fetchWeather(district: string): Promise<WeatherReport> {
  const geo = districtGeo(district);
  const fallback = mockWeather(district);

  if (!geo) {
    return fallback;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,` +
    `wind_speed_10m,wind_gusts_10m,uv_index` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
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
    const daily = json.daily;
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      return fallback;
    }

    const days: DayForecast[] = daily.time.map((t, i) => {
      const code = Math.round(columnAt(daily, "weather_code", i));
      const info = wmoInfo(code);
      const labels = dayLabel(String(t));
      return {
        date: String(t),
        ...labels,
        weatherCode: code,
        weatherLabel: info.label,
        icon: info.icon,
        tempMax: Math.round(columnAt(daily, "temperature_2m_max", i)),
        tempMin: Math.round(columnAt(daily, "temperature_2m_min", i)),
        precipProb: Math.round(columnAt(daily, "precipitation_probability_max", i)),
        precipMm: Number(columnAt(daily, "precipitation_sum", i).toFixed(1)),
        humidity: Math.round(columnAt(daily, "relative_humidity_2m_max", i, 70)),
        windKmh: Math.round(columnAt(daily, "wind_speed_10m_max", i, 8)),
      };
    });

    const current: CurrentConditions | null = json.current
      ? {
          isoTime: json.current.time,
          timeLabel: timeLabel(json.current.time),
          temp: Math.round(json.current.temperature_2m ?? 0),
          feelsLike: Math.round(
            json.current.apparent_temperature ?? json.current.temperature_2m ?? 0,
          ),
          weatherCode: json.current.weather_code,
          weatherLabel: wmoInfo(json.current.weather_code).label,
          icon: wmoInfo(json.current.weather_code).icon,
          humidity: Math.round(json.current.relative_humidity_2m ?? 70),
          windKmh: Math.round(json.current.wind_speed_10m ?? 8),
          gustKmh: Math.round(
            json.current.wind_gusts_10m ?? json.current.wind_speed_10m ?? 8,
          ),
          uvIndex: Number((json.current.uv_index ?? 0).toFixed(1)),
          precipMm: Number((json.current.precipitation ?? 0).toFixed(1)),
        }
      : null;

    // Next 24 rolling hours (drop stale rows from earlier today).
    const hourly: HourForecast[] = [];
    const hRaw = json.hourly;
    if (hRaw && Array.isArray(hRaw.time)) {
      const cutoff = Date.now() - 30 * 60 * 1000;
      for (let i = 0; i < hRaw.time.length && hourly.length < 24; i++) {
        const iso = String(hRaw.time[i]);
        if (Date.parse(iso) < cutoff) continue;
        const code = Math.round(columnAt(hRaw, "weather_code", i));
        const info = wmoInfo(code);
        hourly.push({
          isoTime: iso,
          hourLabel: hourLabel(iso),
          temp: Math.round(columnAt(hRaw, "temperature_2m", i)),
          weatherCode: code,
          icon: info.icon,
          precipProb: Math.round(columnAt(hRaw, "precipitation_probability", i)),
        });
      }
    }

    if (!current || hourly.length < 4) return fallback;

    return {
      district,
      place: geo.label,
      elevation: geo.elevation,
      source: "open-meteo",
      generatedAt: new Date().toISOString(),
      current,
      hourly,
      days,
    };
  } catch (cause) {
    console.error(
      "[weather] open-meteo fetch failed, using mock:",
      cause instanceof Error ? cause.message : String(cause),
    );
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
      ? rand() < 0.35 ? 95 : rand() < 0.5 ? 80 : 63
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

  // "Current" conditions + next-24h hourly under the same deterministic model.
  const t0 = days[0];
  const hourNow = now.getHours();

  // Sun-time curve so temperature follows the day (peak ~3 pm).
  const diurnal = (hour: number) =>
    0.5 + 0.5 * Math.sin(((hour - 9) / 24) * 2 * Math.PI);

  const current: CurrentConditions = {
    isoTime: now.toISOString(),
    timeLabel: timeLabel(now.toISOString()),
    temp: Math.round(t0.tempMin + (t0.tempMax - t0.tempMin) * diurnal(hourNow)),
    feelsLike: Math.round(
      t0.tempMin +
        (t0.tempMax - t0.tempMin) * diurnal(hourNow) -
        (t0.precipProb >= 55 ? 1 : 0),
    ),
    weatherCode: t0.weatherCode,
    weatherLabel: t0.weatherLabel,
    icon: t0.icon,
    humidity: t0.humidity,
    windKmh: t0.windKmh,
    gustKmh: Math.round(t0.windKmh * 1.4),
    uvIndex:
      hourNow >= 6 && hourNow <= 17
        ? Math.round(10 * Math.sin(((hourNow - 6) / 12) * Math.PI))
        : 0,
    precipMm: t0.precipProb >= 55 ? Number((1.2 + rand() * 3).toFixed(1)) : 0,
  };

  const hourly: HourForecast[] = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(now);
    t.setMinutes(0, 0, 0);
    t.setHours(now.getHours() + i);
    hourly.push({
      isoTime: t.toISOString(),
      hourLabel: hourLabel(t.toISOString()),
      temp: Math.round(t0.tempMin + (t0.tempMax - t0.tempMin) * diurnal(t.getHours())),
      weatherCode: t0.weatherCode,
      icon: t0.icon,
      precipProb: Math.max(
        0,
        Math.min(100, Math.round(t0.precipProb * (0.5 + rand() * 1.1))),
      ),
    });
  }

  return {
    district,
    place: geo?.label ?? district,
    elevation: geo?.elevation ?? 120,
    source: "mock",
    generatedAt: new Date().toISOString(),
    current,
    hourly,
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