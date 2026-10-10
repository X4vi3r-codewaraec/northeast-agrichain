import type { Metadata } from "next";
import ShipmentsBoard from "@/components/shipments/shipments-board";

export const metadata: Metadata = {
  title: "Shipments & Pooling — Northeast AgriChain",
  description:
    "Track NER consignments, share vehicles with neighbouring farmers and watch shelf-life from field to cold store.",
};

export default function ShipmentsPage() {
  return <ShipmentsBoard />;
}