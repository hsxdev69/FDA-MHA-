"use client";

import type { ImageSignals } from "@/lib/vision";

function entropy8(hist: number[], total: number): number {
  if (total <= 0) return 0;
  let h = 0;
  for (const c of hist) {
    if (c <= 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  return h;
}

/**
 * Samples the image on a canvas to estimate entropy, edge density and size.
 * Used so even the no-API fallback does not assign a static 55% to every file.
 */
export async function collectImageSignals(
  dataUrl: string,
  filename = "",
): Promise<ImageSignals> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not decode image"));
    el.src = dataUrl;
  });

  const width = img.naturalWidth || 1;
  const height = img.naturalHeight || 1;
  const aspect = width / height;

  const canvas = document.createElement("canvas");
  const sampleW = Math.min(96, width);
  const sampleH = Math.max(1, Math.round((sampleW * height) / width));
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      width,
      height,
      aspect,
      entropy: 4,
      edgeScore: 10,
      fileBytes: Math.round((dataUrl.length * 3) / 4),
      filename,
    };
  }
  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

  const hist = new Array(32).fill(0);
  let edge = 0;
  let samples = 0;
  for (let y = 0; y < sampleH; y += 1) {
    for (let x = 0; x < sampleW; x += 1) {
      const i = (y * sampleW + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      hist[Math.min(31, Math.floor(lum / 8))] += 1;
      samples += 1;
      if (x + 1 < sampleW) {
        const j = (y * sampleW + x + 1) * 4;
        const lum2 = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
        if (Math.abs(lum - lum2) > 28) edge += 1;
      }
    }
  }

  const comma = dataUrl.indexOf(",");
  const b64len = comma >= 0 ? dataUrl.length - comma - 1 : dataUrl.length;

  return {
    width,
    height,
    aspect,
    entropy: entropy8(hist, samples),
    edgeScore: samples > 0 ? (edge / samples) * 100 : 0,
    fileBytes: Math.round((b64len * 3) / 4),
    filename,
  };
}

/** Shrink the photo before sending to the vision API (Vercel body limits). */
export async function resizeDataUrlForVision(
  dataUrl: string,
  maxEdge = 768,
): Promise<{ mime: string; base64: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not decode image"));
    el.src = dataUrl;
  });

  const mimeMatch = dataUrl.match(/^data:([^;]+);/);
  const mime = mimeMatch?.[1] || "image/jpeg";

  let { naturalWidth: w, naturalHeight: h } = img;
  if (w <= maxEdge && h <= maxEdge) {
    const comma = dataUrl.indexOf(",");
    return { mime, base64: dataUrl.slice(comma + 1) };
  }

  const scale = maxEdge / Math.max(w, h);
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const comma = dataUrl.indexOf(",");
    return { mime, base64: dataUrl.slice(comma + 1) };
  }
  ctx.drawImage(img, 0, 0, w, h);
  const out = canvas.toDataURL("image/jpeg", 0.82);
  return { mime: "image/jpeg", base64: out.slice(out.indexOf(",") + 1) };
}
