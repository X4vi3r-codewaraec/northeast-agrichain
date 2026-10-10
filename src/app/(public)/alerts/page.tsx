import type { Metadata } from "next";
import AlertsDashboard from "@/components/alerts/alerts-dashboard";

export const metadata: Metadata = {
  title: "Early-Warning Board — Northeast AgriChain",
  description:
    "Flash flood, landslide, frost and pest alerts for North East India districts, with voice delivery and suggested actions.",
};

export default function AlertsPage() {
  return <AlertsDashboard />;
}