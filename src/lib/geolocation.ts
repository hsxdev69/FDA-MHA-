"use client";

export type GeoPermissionError = "unsupported" | "denied" | "unavailable" | "timeout";

export interface GeoResult {
  lat: number;
  lng: number;
  address: string;
}

const GPS_OPTIONS_PRIMARY: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 30_000,
};

const GPS_OPTIONS_FALLBACK: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
};

function classifyGeoError(err: GeolocationPositionError | null): GeoPermissionError {
  if (!err) return "unavailable";
  if (err.code === 1) return "denied";
  if (err.code === 3) return "timeout";
  return "unavailable";
}

function readPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GPS_OPTIONS_PRIMARY);
  });
}

function readPositionFallback(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GPS_OPTIONS_FALLBACK);
  });
}

function formatCoords(lat: number, lng: number): string {
  return `Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`;
}

function formatNominatimAddress(json: {
  address?: Record<string, string>;
  display_name?: string;
}): string | null {
  const a = json.address;
  if (!a) {
    return json.display_name?.trim() || null;
  }
  const area =
    a.suburb ||
    a.neighbourhood ||
    a.village ||
    a.hamlet ||
    a.road ||
    a.residential ||
    "";
  const city = a.city || a.town || a.county || a.municipality || "";
  const state = a.state || "";
  const pin = a.postcode || "";
  const parts = [area, city, state, pin].map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.join(", ");
  return json.display_name?.trim() || (parts.length ? parts.join(", ") : null);
}

/**
 * Reverse-geocode via our API (Nominatim proxy). Never throws — returns
 * coordinate text if the lookup fails.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = formatCoords(lat, lng);
  try {
    const res = await fetch(
      `/api/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
      { method: "GET" },
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as { address?: string };
    const address = data.address?.trim();
    return address || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Gets GPS position (high accuracy, then a lower-accuracy retry) and a
 * human-readable address. Only rejects for missing GPS or explicit denial.
 */
export async function detectUserLocation(): Promise<
  | { ok: true; result: GeoResult }
  | { ok: false; error: GeoPermissionError }
> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, error: "unsupported" };
  }

  let position: GeolocationPosition;
  try {
    position = await readPosition();
  } catch (first) {
    const classified = classifyGeoError(first as GeolocationPositionError);
    if (classified === "denied") {
      return { ok: false, error: "denied" };
    }
    try {
      position = await readPositionFallback();
    } catch (second) {
      return { ok: false, error: classifyGeoError(second as GeolocationPositionError) };
    }
  }

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const address = await reverseGeocode(lat, lng);
  return { ok: true, result: { lat, lng, address } };
}

export function geoErrorMessage(code: GeoPermissionError): string {
  if (code === "denied") {
    return "Location permission denied. You can manually type your area/city name above.";
  }
  if (code === "unsupported") {
    return "This device does not support GPS. Please type your area/city name above.";
  }
  return "Location permission denied. You can manually type your area/city name above.";
}
