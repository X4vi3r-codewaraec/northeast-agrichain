import type { Metadata } from "next";
import NewShipmentWizard from "@/components/shipments/new-shipment-wizard";

export const metadata: Metadata = {
  title: "New Shipment — Northeast AgriChain",
  description:
    "Book a load with the 4-step wizard: produce, route, pooling suggestions and escrow-secured freight.",
};

export default function NewShipmentPage() {
  return <NewShipmentWizard />;
}