import type { Metadata } from "next";
import { DashboardShell } from "@/components/auth/dashboard-shell";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardShell />;
}
