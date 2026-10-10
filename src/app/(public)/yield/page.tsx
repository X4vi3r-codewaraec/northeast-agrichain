import type { Metadata } from "next";
import YieldForecast from "@/components/yield/yield-forecast";

export const metadata: Metadata = {
  title: "Yield Forecast — Northeast AgriChain",
  description:
    "District-aware yield bands for NER specialty crops — weather, practice and terrain, computed deterministically.",
};

export default function YieldPage() {
  return <YieldForecast />;
}
