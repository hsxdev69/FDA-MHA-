import "server-only";

import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import {
  ALLOWED_PHOTO_EXTENSIONS,
  ALLOWED_PHOTO_MIMES,
  COMPLAINT_TYPES,
  MAX_PHOTO_BYTES,
} from "@/lib/constants";
import { analyzePriority, priorityCategory } from "@/lib/priority";

export interface PhotoInput {
  filename: string;
  mimeType: string;
  /** Raw binary data (converted to base64 before storage). */
  data: Buffer;
}

export interface ComplaintInput {
  complaintType: string;
  description: string;
  location: string;
  latitude?: string;
  longitude?: string;
  name: string;
  mobile: string;
  email?: string;
  photo?: PhotoInput;
}

const ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const MOBILE_RE = /^\d{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COORD_RE = /^-?\d{1,3}(\.\d+)?$/;

export function validatePhoto(file: {
  filename: string;
  mimeType: string;
  size: number;
}): string | null {
  const ext = file.filename.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_PHOTO_EXTENSIONS.includes(ext as (typeof ALLOWED_PHOTO_EXTENSIONS)[number])) {
    return "Invalid photo format. Allowed formats: JPG, JPEG, PNG, WEBP.";
  }
  if (file.mimeType && !ALLOWED_PHOTO_MIMES.includes(file.mimeType as (typeof ALLOWED_PHOTO_MIMES)[number])) {
    return "Invalid photo type. Allowed formats: JPG, JPEG, PNG, WEBP.";
  }
  if (file.size <= 0) {
    return "The uploaded photo is empty.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo is too large. Maximum allowed size is 5 MB.";
  }
  return null;
}

/**
 * Sniffs the real image format from the file's magic bytes.
 * Returns the detected MIME type, or null when the bytes are not a genuine,
 * decodable JPEG / PNG / WEBP image.
 *
 * This prevents corrupt or spoofed files (e.g. random bytes with a .png
 * extension) from being stored, which would otherwise render as a broken
 * image icon in the Officer Dashboard evidence column.
 */
export function detectImageMime(data: Buffer): string | null {
  if (!data || data.length < 12) return null;

  // JPEG: FF D8 FF ... ends with FF D9
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    const endsOk =
      data[data.length - 2] === 0xff && data[data.length - 1] === 0xd9;
    return endsOk ? "image/jpeg" : null;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR chunk
  const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const hasPngSig = PNG_SIG.every((b, i) => data[i] === b);
  if (hasPngSig) {
    const hasIhdr =
      data[12] === 0x49 && data[13] === 0x48 && data[14] === 0x44 && data[15] === 0x52;
    // A real PNG must also terminate with an IEND chunk.
    const tail = data.subarray(Math.max(0, data.length - 12)).toString("latin1");
    return hasIhdr && tail.includes("IEND") ? "image/png" : null;
  }

  // WEBP: "RIFF" .... "WEBP"
  const isRiff =
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46;
  const isWebp =
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50;
  if (isRiff && isWebp) return "image/webp";

  return null;
}

export function validateComplaint(input: ComplaintInput): string[] {
  const errors: string[] = [];

  if (!COMPLAINT_TYPES.includes(input.complaintType as (typeof COMPLAINT_TYPES)[number])) {
    errors.push("Please select a valid complaint type.");
  }
  if (!input.description || input.description.trim().length < 10) {
    errors.push("Please provide a detailed description (at least 10 characters).");
  }
  if (!input.location || !input.location.trim()) {
    errors.push("Please enter the complaint location or use the 'Get My Location' button.");
  }
  if (!input.name || input.name.trim().length < 2) {
    errors.push("Please enter your full name.");
  }
  if (!MOBILE_RE.test(input.mobile)) {
    errors.push("Mobile number must be exactly 10 digits.");
  }
  if (input.email && !EMAIL_RE.test(input.email)) {
    errors.push("Please enter a valid email address.");
  }
  if (input.latitude && !COORD_RE.test(input.latitude)) {
    errors.push("Invalid latitude value.");
  }
  if (input.longitude && !COORD_RE.test(input.longitude)) {
    errors.push("Invalid longitude value.");
  }

  return errors;
}

export interface CreateComplaintResult {
  complaintId: string;
  severity: number;
  category: "HIGH" | "MEDIUM" | "LOW";
  aiReason: string;
  status: string;
}

/**
 * Generates a unique complaint ID in the format FDA-XXXXXXXX.
 * (Never a fixed value — retries until a non-colliding ID is found.)
 */
async function generateUniqueComplaintId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let suffix = "";
    for (let i = 0; i < 8; i += 1) {
      suffix += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
    }
    const candidate = `FDA-${suffix}`;

    const existing = await db
      .select({ id: complaints.id })
      .from(complaints)
      .where(eq(complaints.complaintId, candidate))
      .limit(1);

    if (existing.length === 0) return candidate;
  }
  throw new Error("Could not generate a unique complaint ID.");
}

/**
 * Creates a complaint in the database. The AI step can never block
 * submission: if analysis fails, a fallback note is stored instead.
 */
export async function createComplaint(
  input: ComplaintInput,
): Promise<CreateComplaintResult> {
  let analysis;
  try {
    analysis = analyzePriority(input.complaintType, input.description);
  } catch {
    // AI unavailability must never prevent complaint submission.
    analysis = {
      severity: 0,
      category: "LOW" as const,
      reason: "AI analysis unavailable.",
    };
  }

  const complaintId = await generateUniqueComplaintId();

  await db.insert(complaints).values({
    complaintId,
    complaintType: input.complaintType,
    description: input.description.trim(),
    photoFilename: input.photo?.filename ?? null,
    photoMime: input.photo?.mimeType ?? null,
    photoData: input.photo ? input.photo.data.toString("base64") : null,
    location: input.location.trim(),
    latitude: input.latitude?.trim() || null,
    longitude: input.longitude?.trim() || null,
    name: input.name.trim(),
    mobile: input.mobile,
    email: input.email?.trim() || null,
    severity: analysis.severity,
    aiReason: analysis.reason,
    status: "Pending",
  });

  return {
    complaintId,
    severity: analysis.severity,
    category: priorityCategory(analysis.severity),
    aiReason: analysis.reason,
    status: "Pending",
  };
}
