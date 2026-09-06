import { eq } from "drizzle-orm";
import { db } from "@/db";
import { complaints } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * GET /uploads/[filename] — serves an uploaded complaint photo.
 *
 * Photos are now primarily rendered inline as data-URIs inside the
 * server-rendered admin pages, so cookie/auth issues no longer
 * prevent officers from seeing evidence images. This route is kept
 * as a fallback for any direct links.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  try {
    const rows = await db
      .select({
        photoData: complaints.photoData,
        photoMime: complaints.photoMime,
      })
      .from(complaints)
      .where(eq(complaints.photoFilename, filename))
      .limit(1);

    const row = rows[0];
    if (!row || !row.photoData) {
      return new Response("Not found", { status: 404 });
    }

    const bytes = new Uint8Array(Buffer.from(row.photoData, "base64"));
    return new Response(bytes, {
      headers: {
        "Content-Type": row.photoMime ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[uploads] Failed to serve photo:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
