import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { complaints, reviews } from "@/db/schema";
import { isAuthorizedOfficer } from "@/lib/authorization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const dynamicParams = true;
export const revalidate = 0;

/**
 * DELETE /api/admin/complaints/[complaintId]
 * Deletes a complaint and all associated review audit logs from the database.
 * Only accessible to authorized officers.
 *
 * PostgreSQL is optional — if DATABASE_URL is unset, deletion is a no-op
 * success (client already removed the case from localStorage).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ complaintId: string }> },
) {
  if (!(await isAuthorizedOfficer(request))) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Officer access required." },
      { status: 401 },
    );
  }

  const { complaintId } = await params;
  const cleanId = complaintId.trim().toUpperCase();

  if (!isDatabaseConfigured) {
    return NextResponse.json({
      ok: true,
      message: `Case ${cleanId} deleted successfully.`,
    });
  }

  try {
    await db.delete(reviews).where(eq(reviews.complaintId, cleanId));
    await db.delete(complaints).where(eq(complaints.complaintId, cleanId));

    return NextResponse.json({
      ok: true,
      message: `Case ${cleanId} deleted successfully.`,
    });
  } catch (error) {
    console.error("[delete-complaint] Error deleting complaint:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete case from database." },
      { status: 500 },
    );
  }
}
