import { Suspense } from "react";
import type { Metadata } from "next";
import ShipmentDetail from "@/components/shipments/shipment-detail";
import { DetailSkeleton } from "@/components/ui/detail-skeleton";
import { DEMO_SHIPMENTS, shipmentById } from "@/lib/shipments";

export function generateStaticParams() {
  return DEMO_SHIPMENTS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shipment = shipmentById(id);
  return {
    title: shipment ? `${shipment.id} — Shipment` : "Shipment",
    description: shipment
      ? `${shipment.cropName} from ${shipment.origin} to ${shipment.dest} — live tracking and cold-chain log.`
      : "Track a consignment with terrain-aware ETA and cold-chain telemetry.",
  };
}

async function ShipmentBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShipmentDetail id={id} />;
}

export default function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ShipmentBody params={params} />
    </Suspense>
  );
}
