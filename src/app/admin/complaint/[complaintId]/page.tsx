import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { complaints, reviews } from "@/db/schema";
import ComplaintDetailsClient from "@/components/complaint-details-client";
import type { StoredComplaint } from "@/lib/client-storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Complaint Details — Maha FDA" };

export default async function ComplaintDetailsPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const { complaintId } = await params;

  let serverComplaint: StoredComplaint | null = null;
  try {
    const rows = await db
      .select()
      .from(complaints)
      .where(eq(complaints.complaintId, complaintId.toUpperCase()))
      .limit(1);

    if (rows.length > 0) {
      const r = rows[0];
      const reviewRows = await db
        .select()
        .from(reviews)
        .where(eq(reviews.complaintId, r.complaintId))
        .orderBy(desc(reviews.createdAt));

      const reviewHistory = reviewRows.map((rev) => ({
        status: rev.status,
        notes: rev.notes,
        officer: rev.officer,
        createdAt: new Date(rev.createdAt).toISOString(),
        filename: rev.filename,
      }));

      serverComplaint = {
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
        reviews: reviewHistory,
      };
    }
  } catch {
    serverComplaint = null;
  }

  return (
    <ComplaintDetailsClient
      complaintId={complaintId}
      serverComplaint={serverComplaint}
    />
  );
}
