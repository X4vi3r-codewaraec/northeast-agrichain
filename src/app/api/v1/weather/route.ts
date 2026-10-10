import { NextRequest, connection } from "next/server";
import { fetchWeather } from "@/lib/weather";

/**
 * GET /api/v1/weather?district=Kamrup%20Metro
 *
 * Live district weather from Open-Meteo (current conditions + next-24h hourly +
 * 7-day daily), computed server-side. Falls back to the deterministic offline
 * model when the upstream call fails, so this endpoint is always useful.
 */
export async function GET(request: NextRequest) {
  await connection();
  const district = (request.nextUrl.searchParams.get("district") ?? "Kamrup Metro").trim();
  const report = await fetchWeather(district);
  return Response.json(report, {
    headers: {
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}