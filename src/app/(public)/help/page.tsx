import type { Metadata } from "next";
import HelpCenter from "@/components/help/help-center";

export const metadata: Metadata = {
  title: "Help & Guide — Northeast AgriChain",
  description: "Answers, offline tips and ways to reach a human.",
};

export default function HelpPage() {
  return <HelpCenter />;
}
