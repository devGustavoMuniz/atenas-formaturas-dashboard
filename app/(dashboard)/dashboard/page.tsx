import type { Metadata } from "next"
import { AdminDashboardContent } from "@/components/dashboard/admin-dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard overview",
}

export default function DashboardPage() {
  return <AdminDashboardContent />
}
