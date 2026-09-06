import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { complaints, reviews } from "@/db/schema";
import { ALLOWED_STATUSES, MAX_PHOTO_BYTES, type ComplaintStatus } from "@/lib/constants";
import { isAuthorizedOfficer, getReviewingOfficer } from "@/lib/authorization";
import { detectImageMime } from "@/lib/complaints";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/complaints/[complaintId]/review
 * Accepts multipart/form-data with:
 *   - status       (required, one of ALLOWED_STATUSES)
 *   - notes        (officer remarks / review notes)
 *   - attachment   (optional file, same validation as complaint photos)
 *
 * Persists an audit-trail row in `reviews` AND updates the complaint's
 * status so citizens see the latest state immediately.
 */
export async function POST(
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form submission." },
      { status: 400 },
    );
  }

  const status = String(form.get("status") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();

  if (!ALLOWED_STATUSES.includes(status as ComplaintStatus)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (!notes) {
    return NextResponse.json(
      { ok: false, error: "Officer remarks / review notes are required." },
      { status: 400 },
    );
  }

  // Optional attachment — accepts images plus PDFs and DOC/DOCX.
  let attachment:
    | { filename: string; mimeType: string; data: Buffer }
    | null = null;
  const file = form.get("attachment");
  if (file instanceof File && file.size > 0) {
    const ALLOWED_ATTACHMENT_EXTS = [
      "jpg", "jpeg", "png", "webp", "pdf", "doc", "docx",
    ];
    const ALLOWED_ATTACHMENT_MIMES = [
      "image/jpeg", "image/png", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_ATTACHMENT_EXTS.includes(ext)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid file format. Allowed: ${ALLOWED_ATTACHMENT_EXTS.join(", ")}.`,
        },
        { status: 400 },
      );
    }
    if (file.type && !ALLOWED_ATTACHMENT_MIMES.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid file type. Allowed: ${ALLOWED_ATTACHMENT_MIMES.join(", ")}.`,
        },
        { status: 400 },
      );
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Attachment is too large. Maximum size is 5 MB." },
        { status: 400 },
      );
    }

    const data = Buffer.from(await file.arrayBuffer());
    let mime = file.type || "application/octet-stream";

    // For image attachments, verify the real bytes are a decodable image and
    // trust the detected MIME so thumbnails never render broken.
    const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];
    if (IMAGE_EXTS.includes(ext)) {
      const detected = detectImageMime(data);
      if (!detected) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "The attached file is not a valid image. Please attach a genuine JPG, PNG or WEBP photo.",
          },
          { status: 400 },
        );
      }
      mime = detected;
    } else if (ext === "pdf" && !(data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46)) {
      // PDF files must start with "%PDF"
      return NextResponse.json(
        { ok: false, error: "The attached file is not a valid PDF document." },
        { status: 400 },
      );
    }

    attachment = {
      filename: `${randomUUID().replace(/-/g, "")}.${ext}`,
      mimeType: mime,
      data,
    };
  }

  const officer = await getReviewingOfficer();

  try {
    // Verify the complaint exists.
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

    const complaintRowId = rows[0].id;

    // Persist the review audit-trail row.
    await db.insert(reviews).values({
      complaintId,
      status,
      notes,
      filename: attachment?.filename ?? null,
      mime: attachment?.mimeType ?? null,
      data: attachment ? attachment.data.toString("base64") : null,
      officer,
    });

    // Update the complaint's current status so citizens see it immediately.
    await db
      .update(complaints)
      .set({ status: status as ComplaintStatus })
      .where(eq(complaints.id, complaintRowId));

    return NextResponse.json({
      ok: true,
      status,
      notes,
      attachment: attachment
        ? { filename: attachment.filename }
        : null,
      officer,
    });
  } catch (error) {
    console.error("[review] Failed to save review:", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong while saving your review. Please try again." },
      { status: 500 },
    );
  }
}
