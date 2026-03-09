import { redirect } from "next/navigation"
import { getAdminDashboardUrl } from "@/lib/admin-app"

export default function DashboardPage() {
  redirect(getAdminDashboardUrl())
}
