import type { Metadata } from "next";
import PriceIntelligence from "@/components/prices/price-intelligence";

export const metadata: Metadata = {
  title: "Price Intelligence — Northeast AgriChain",
  description:
    "Mandi and eNAM price trends, fair-value bands and sell-or-hold signals for NER specialty crops.",
};

export default function PricesPage() {
  return <PriceIntelligence />;
}