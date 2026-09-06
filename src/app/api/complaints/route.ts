import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createComplaint,
  detectImageMime,
  validateComplaint,
  validatePhoto,
  type ComplaintInput,
} from "@/lib/complaints";

export const dynamic = "force-dynamic";

/**
 * POST /api/complaints  (multipart/form-data)
 * Equivalent of the Flask /submit-complaint endpoint.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["Invalid form submission."] },
      { status: 400 },
    );
  }

  const field = (name: string) => String(formData.get(name) ?? "").trim();

  // Optional photo (validated extension, MIME type, 5 MB size limit AND real
  // image magic bytes so a corrupt file can never be stored).
  let photo: ComplaintInput["photo"];
  const photoFile = formData.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    const photoError = validatePhoto({
      filename: photoFile.name,
      mimeType: photoFile.type,
      size: photoFile.size,
    });
    if (photoError) {
      return NextResponse.json(
        { ok: false, errors: [photoError] },
        { status: 400 },
      );
    }

    const data = Buffer.from(await photoFile.arrayBuffer());

    // Verify the bytes are a genuine, decodable image. The detected MIME is
    // trusted over the client-supplied one so the stored image always renders.
    const detectedMime = detectImageMime(data);
    if (!detectedMime) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            "The uploaded file is not a valid image. Please attach a genuine JPG, PNG or WEBP photo.",
          ],
        },
        { status: 400 },
      );
    }

    const extFromMime =
      detectedMime === "image/png"
        ? "png"
        : detectedMime === "image/webp"
        ? "webp"
        : "jpg";
    // Unique server-side filename — the original filename is never trusted.
    const filename = `${randomUUID().replace(/-/g, "")}.${extFromMime}`;
    photo = { filename, mimeType: detectedMime, data };
  }

  const latitude = field("latitude");
  const longitude = field("longitude");

  const input: ComplaintInput = {
    complaintType: field("complaintType"),
    description: field("description"),
    location: field("location"),
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    name: field("name"),
    mobile: field("mobile"),
    email: field("email") || undefined,
    photo,
  };

  const errors = validateComplaint(input);
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  try {
    const result = await createComplaint(input);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[complaints] Failed to create complaint:", error);
    return NextResponse.json(
      {
        ok: false,
        errors: ["Something went wrong while saving your complaint. Please try again."],
      },
      { status: 500 },
    );
  }
}
