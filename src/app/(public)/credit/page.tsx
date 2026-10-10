import type { Metadata } from "next";
import CreditHub from "@/components/credit/credit-hub";

export const metadata: Metadata = {
  title: "Credit & Insurance — Northeast AgriChain",
  description:
    "Climate-risk scores, loan readiness estimates and rainfall-index insurance with automatic payouts for NER farmers.",
};

export default function CreditPage() {
  return <CreditHub />;
}