import OfficerDashboardClient from "@/components/officer-dashboard-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Officer Dashboard — Maha FDA" };

/**
 * Officer Dashboard — no database access on the server.
 * Complaints are loaded in the browser from localStorage so a missing
 * DATABASE_URL on Vercel cannot 500 this route.
 */
export default function AdminDashboardPage() {
  return <OfficerDashboardClient serverComplaints={[]} />;
}
