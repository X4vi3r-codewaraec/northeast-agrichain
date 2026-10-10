import type { Metadata } from "next";
import LogisticsMap from "@/components/map/logistics-map";

export const metadata: Metadata = {
  title: "Storage & Terrain Logistics — Northeast AgriChain",
  description:
    "Find nearby cold storage, godowns and ripening chambers across North East India with terrain-aware ETA, availability and route risk.",
};

export default function MapPage() {
  return <LogisticsMap />;
}