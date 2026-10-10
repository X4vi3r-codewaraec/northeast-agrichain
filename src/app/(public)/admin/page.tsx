import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Government Console — Northeast AgriChain",
  description:
    "Regional pest surveillance, flood clusters, price anomalies, verification queue and audit trail.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
