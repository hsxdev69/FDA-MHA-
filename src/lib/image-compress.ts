"use client";

/**
 * Client-side image compression.
 * Downscales to max 800px on the longest edge at quality 0.7 BEFORE the
 * image ever reaches React state / localStorage. This prevents multi-MB
 * Base64 strings from freezing mobile browsers.
 */

export interface CompressedImage {
  dataUrl: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
}

const MAX_EDGE = 800;
const QUALITY = 0.7;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode-failed"));
    el.src = src;
  });
}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

export function approxBytesFromDataUrl(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.length - comma - 1 : dataUrl.length;
  return Math.round((b64 * 3) / 4);
}

/**
 * Compresses an image File to a small JPEG data URL.
 * Falls back to the original data URL if canvas is unavailable.
 */
export async function compressImageFile(
  file: File,
  maxEdge = MAX_EDGE,
  quality = QUALITY,
): Promise<CompressedImage> {
  const original = await readAsDataUrl(file);

  // Non-images (e.g. PDF) are returned untouched.
  if (!file.type.startsWith("image/")) {
    return {
      dataUrl: original,
      mime: file.type || "application/octet-stream",
      width: 0,
      height: 0,
      bytes: approxBytesFromDataUrl(original),
    };
  }

  try {
    const img = await loadImage(original);
    let w = img.naturalWidth || 1;
    let h = img.naturalHeight || 1;

    if (w <= maxEdge && h <= maxEdge && approxBytesFromDataUrl(original) < 250_000) {
      return {
        dataUrl: original,
        mime: file.type || "image/jpeg",
        width: w,
        height: h,
        bytes: approxBytesFromDataUrl(original),
      };
    }

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return {
        dataUrl: original,
        mime: file.type || "image/jpeg",
        width: w,
        height: h,
        bytes: approxBytesFromDataUrl(original),
      };
    }
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", quality);

    // Release the large source string for GC as early as possible.
    return {
      dataUrl: out,
      mime: "image/jpeg",
      width: w,
      height: h,
      bytes: approxBytesFromDataUrl(out),
    };
  } catch {
    return {
      dataUrl: original,
      mime: file.type || "image/jpeg",
      width: 0,
      height: 0,
      bytes: approxBytesFromDataUrl(original),
    };
  }
}
