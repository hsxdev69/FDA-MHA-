/**
 * Builds an inline data-URI from the stored base64 photo data.
 * This renders the image directly inside server-rendered HTML,
 * avoiding any cookie/auth issues on `<img src>` sub-requests.
 */
export function photoDataUri(
  photoData: string | null | undefined,
  photoMime: string | null | undefined,
): string | null {
  if (!photoData) return null;
  const mime = photoMime || "image/jpeg";
  return `data:${mime};base64,${photoData}`;
}
