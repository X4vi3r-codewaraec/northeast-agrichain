import type { Metadata } from "next";
import InsuranceHub from "@/components/insurance/insurance-hub";

export const metadata: Metadata = {
  title: "Weather-index Insurance — Northeast AgriChain",
  description:
    "Objective index triggers, no field inspection and deterministic payouts for North-East growers.",
};

export default function InsurancePage() {
  return <InsuranceHub />;
}
