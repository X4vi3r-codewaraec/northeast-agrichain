import type { Metadata } from "next";
import NewListingWizard from "@/components/market/new-listing-wizard";

export const metadata: Metadata = {
  title: "Create a listing — Northeast AgriChain",
  description:
    "List NER produce with photos, grade and certification — escrow and pooling auto-fill from your profile.",
};

export default function NewListingPage() {
  return <NewListingWizard />;
}
