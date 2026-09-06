import { desc } from "drizzle-orm";
import { db } from "@/db";
import { complaints, reviews } from "@/db/schema";
import OfficerDashboardClient from "@/components/officer-dashboard-client";
import type { StoredComplaint } from "@/lib/client-storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Officer Dashboard — Maha FDA" };

export default async function AdminDashboardPage() {
  let serverComplaints: StoredComplaint[] = [];
  try {
    const rows = await db
      .select()
      .from(complaints)
      .orderBy(desc(complaints.severity), desc(complaints.createdAt));

    const allReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt));

    serverComplaints = rows.map((r) => {
      const caseReviews = allReviews
        .filter((rev) => rev.complaintId === r.complaintId)
        .map((rev) => ({
          status: rev.status,
          notes: rev.notes,
          officer: rev.officer,
          createdAt: new Date(rev.createdAt).toISOString(),
          filename: rev.filename,
        }));

      return {
        id: r.id,
        complaintId: r.complaintId,
        complaintType: r.complaintType,
        description: r.description,
        location: r.location,
        latitude: r.latitude,
        longitude: r.longitude,
        name: r.name,
        mobile: r.mobile,
        email: r.email,
        photoData: r.photoData,
        photoMime: r.photoMime,
        photoFilename: r.photoFilename,
        severity: r.severity,
        aiReason: r.aiReason,
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        reviews: caseReviews,
      };
    });
  } catch {
    serverComplaints = [];
  }

  return <OfficerDashboardClient serverComplaints={serverComplaints} />;
}
