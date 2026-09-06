import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { priorityCategory } from "@/lib/priority";

export const dynamic = "force-dynamic";

/**
 * GET /api/track?id=FDA-XXXXXXXX
 * Returns only the public-safe fields for citizens (never exposes the
 * citizen's personal information or the uploaded photo).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("id") ?? "").trim();

  if (!raw) {
    return NextResponse.json(
      { error: "Please enter a Complaint ID." },
      { status: 400 },
    );
  }

  const complaintId = raw.toUpperCase();

  try {
    const rows = await db
      .select({
        complaintId: complaints.complaintId,
        complaintType: complaints.complaintType,
        location: complaints.location,
        latitude: complaints.latitude,
        longitude: complaints.longitude,
        createdAt: complaints.createdAt,
        severity: complaints.severity,
        aiReason: complaints.aiReason,
        status: complaints.status,
      })
      .from(complaints)
      .where(eq(complaints.complaintId, complaintId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Complaint ID not found." },
        { status: 404 },
      );
    }

    const row = rows[0];
    return NextResponse.json({
      complaintId: row.complaintId,
      complaintType: row.complaintType,
      location: row.location,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.createdAt,
      severity: row.severity,
      category: priorityCategory(row.severity),
      aiReason: row.aiReason,
      status: row.status,
    });
  } catch (error) {
    console.error("[track] Failed to look up complaint:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
