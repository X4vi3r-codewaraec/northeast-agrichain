/**
 * Client-side weather fetch. Calls our route handler (which pulls live
 * Open-Meteo data server-side) and silently falls back to the deterministic
 * offline model so the page stays usable on 2G or fully offline.
 */

import { mockWeather, type WeatherReport } from "@/lib/weather";

export async function fetchWeatherReport(district: string): Promise<WeatherReport> {
  try {
    const res = await fetch(`/api/v1/weather?district=${encodeURIComponent(district)}`, {
      cache: "no-store",
    });
    if (!res.ok) return mockWeather(district);
    const rep = (await res.json()) as WeatherReport;
    return rep && rep.days?.length ? rep : mockWeather(district);
  } catch {
    return mockWeather(district);
  }
}