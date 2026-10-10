import { Suspense } from "react";
import type { Metadata } from "next";
import ListingDetail from "@/components/market/listing-detail";
import { DetailSkeleton } from "@/components/ui/detail-skeleton";
import { LISTINGS, listingById } from "@/lib/market";

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = listingById(id);
  return {
    title: listing ? `${listing.cropName} — Marketplace` : "Marketplace listing",
    description: listing
      ? `${listing.cropName} from ${listing.district}, ${listing.state} — trace-to-farm, escrow-secured.`
      : "Verified NER produce with trace-to-farm proof.",
  };
}

async function ListingBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail id={id} />;
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ListingBody params={params} />
    </Suspense>
  );
}
