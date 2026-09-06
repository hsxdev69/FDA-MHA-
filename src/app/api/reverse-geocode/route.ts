import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/reverse-geocode?lat=&lng=
 * Proxies OpenStreetMap Nominatim so the browser is not blocked by CORS
 * and we can send a proper User-Agent.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ address: null }, { status: 400 });
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}` +
      `&lon=${encodeURIComponent(String(lng))}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MahaFDA-CitizenPortal/1.0 (complaint-geocode)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ address: null });
    }

    const json = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = json.address ?? {};
    const area =
      a.suburb || a.neighbourhood || a.village || a.hamlet || a.road || "";
    const city = a.city || a.town || a.county || a.municipality || "";
    const state = a.state || "";
    const pin = a.postcode || "";
    const parts = [area, city, state, pin].map((p) => String(p).trim()).filter(Boolean);
    const address =
      parts.length >= 2 ? parts.join(", ") : json.display_name?.trim() || parts.join(", ") || null;

    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ address: null });
  }
}
