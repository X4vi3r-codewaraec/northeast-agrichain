import type { Metadata } from "next";
import Marketplace from "@/components/market/marketplace";

export const metadata: Metadata = {
  title: "B2B Marketplace — Northeast AgriChain",
  description:
    "Verified NER produce listings with trace-to-farm, quality grades and escrow-secured trade.",
};

export default function MarketplacePage() {
  return <Marketplace />;
}