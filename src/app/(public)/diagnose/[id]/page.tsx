import { Suspense } from "react";
import type { Metadata } from "next";
import DiagnosisDetail from "@/components/diagnose/diagnosis-detail";
import { DetailSkeleton } from "@/components/ui/detail-skeleton";

/** Sample ids are prerendered; any other id (e.g. from on-device history) is
 *  rendered on demand from the deterministic `diagnosisById` engine. */
export function generateStaticParams() {
  return [{ id: "dx-demo-0001" }, { id: "dx-demo-0002" }, { id: "dx-demo-0003" }];
}

export const metadata: Metadata = {
  title: "Diagnosis result — Northeast AgriChain",
  description:
    "Your crop diagnosis with ranked issue, confidence, organic and chemical remedies, dosage and timing.",
};

async function DiagnosisBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiagnosisDetail id={id} />;
}

export default function DiagnosisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DiagnosisBody params={params} />
    </Suspense>
  );
}
