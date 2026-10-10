import type { Metadata } from "next";
import SoilAdvisory from "@/components/soil/soil-advisory";

export const metadata: Metadata = {
  title: "Soil & Nutrient Advisory — Northeast AgriChain",
  description:
    "Turn soil health card data into regenerative actions for acidic North-East hill soils — pH/NPK gauges, dosage and cost.",
};

export default function SoilPage() {
  return <SoilAdvisory />;
}
