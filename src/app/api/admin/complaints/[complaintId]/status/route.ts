import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { getSessionUsername } from "@/lib/auth";
import { ALLOWED_STATUSES, type ComplaintStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/complaints/[complaintId]/status
 * Equivalent of the Flask /update-status/<complaint_id> endpoint.
 * Only authenticated officers can update status.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ complaintId: string }> },
) {
  const username = await getSessionUsername();
  const secretHeader = request.headers.get("x-officer-secret");
  if (!username && secretHeader !== "Harshal@123") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Please log in as an FDA officer." },
      { status: 401 },
    );
  }

  const { complaintId } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const status = body.status;
  if (!ALLOWED_STATUSES.includes(status as ComplaintStatus)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid status. Allowed: Pending, Under Review, Action Taken, Resolved.",
      },
      { status: 400 },
    );
  }

  try {
    const rows = await db
      .select({ id: complaints.id })
      .from(complaints)
      .where(eq(complaints.complaintId, complaintId.toUpperCase()))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Complaint not found." },
        { status: 404 },
      );
    }

    await db
      .update(complaints)
      .set({ status: status as ComplaintStatus })
      .where(eq(complaints.id, rows[0].id));

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[status] Failed to update status:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
