import type { Metadata } from "next";
import SettingsPanel from "@/components/settings/settings-panel";

export const metadata: Metadata = {
  title: "Settings — Northeast AgriChain",
  description: "Language, voice speed and low-bandwidth controls.",
};

export default function SettingsPage() {
  return <SettingsPanel />;
}
