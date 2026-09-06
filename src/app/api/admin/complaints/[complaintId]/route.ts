import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { complaints, reviews } from "@/db/schema";
import { isAuthorizedOfficer } from "@/lib/authorization";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/complaints/[complaintId]
 * Deletes a complaint and its audit reviews permanently from the database.
 * Only accessible to authorized officers.
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
  const clean = complaintId.trim().toUpperCase();

  try {
    // 1. Delete associated review audit records first (foreign key reference)
    await db.delete(reviews).where(eq(reviews.complaintId, clean));

    // 2. Delete the complaint record
    await db.delete(complaints).where(eq(complaints.complaintId, clean));

    return NextResponse.json({ ok: true, complaintId: clean });
  } catch (error) {
    console.error("[delete] Failed to delete complaint from database:", error);
    return NextResponse.json(
      { ok: false, error: "Database error while deleting complaint." },
      { status: 500 },
    );
  }
}
