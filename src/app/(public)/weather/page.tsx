import type { Metadata } from "next";
import WeatherDashboard from "@/components/weather/weather-dashboard";

export const metadata: Metadata = {
  title: "Climate Outlook — Northeast AgriChain",
  description:
    "7-day district microclimate forecasts, sowing calendar, indigenous knowledge and voice advisories for North East India.",
};

export default function WeatherPage() {
  return <WeatherDashboard />;
}