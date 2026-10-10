import { Suspense } from "react";
import type { Metadata } from "next";
import FacilityDetail from "@/components/map/facility-detail";
import { DetailSkeleton } from "@/components/ui/detail-skeleton";
import { FACILITIES, facilityById } from "@/lib/facilities";

export function generateStaticParams() {
  return FACILITIES.map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const facility = facilityById(id);
  return {
    title: facility ? `${facility.name} — Storage` : "Storage facility",
    description: facility
      ? `${facility.name} in ${facility.district} — capacity, rates and booking.`
      : "NER storage and logistics facilities.",
  };
}

async function FacilityBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FacilityDetail id={id} />;
}

export default function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <FacilityBody params={params} />
    </Suspense>
  );
}
