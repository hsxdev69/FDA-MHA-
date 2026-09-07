"use client";

import { memo, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced";
import type { StoredComplaint } from "@/lib/client-storage";
import { districtCoords, inferDistrict, MAHARASHTRA_DISTRICTS } from "@/lib/maharashtra-districts";
import { StatusBadge, PriorityBadge } from "@/components/badges";

interface Pin {
  r: StoredComplaint;
  d: string;
  lat: number;
  lng: number;
}

/** Memoised pin card so filter changes only re-render what changed. */
const PinCard = memo(function PinCard({ pin }: { pin: Pin }) {
  const { r, d, lat, lng } = pin;
  return (
    <li className="rounded border border-border bg-white p-3 text-sm">
      <p className="font-mono text-xs font-bold text-navy">{r.complaintId}</p>
      <p>
        {r.category || r.complaintType} · {d}
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <PriorityBadge severity={r.severity} />
        <StatusBadge status={r.status} />
      </div>
      <a
        className="mt-1 inline-block text-xs font-semibold text-navy hover:underline"
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`}
        target="_blank"
        rel="noreferrer"
      >
        Open pin on map ↗
      </a>
    </li>
  );
});

export default function ComplaintMap({ rows }: { rows: StoredComplaint[] }) {
  const [district, setDistrict] = useState("All");
  const [priority, setPriority] = useState("All");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = inferDistrict(r.location, r.district);
      if (district !== "All" && d !== district) return false;
      if (priority === "High" && r.severity < 70) return false;
      if (priority === "Medium" && (r.severity < 40 || r.severity >= 70)) return false;
      if (priority === "Low" && r.severity >= 40) return false;
      return true;
    });
  }, [rows, district, priority]);

  const pins = useMemo(
    () =>
      filtered.map((r) => {
        const d = inferDistrict(r.location, r.district);
        const c = districtCoords(d);
        const lat = r.latitude ? Number(r.latitude) : c.lat;
        const lng = r.longitude ? Number(r.longitude) : c.lng;
        return { r, d, lat, lng };
      }),
    [filtered],
  );

  const center = pins[0] ?? { lat: 19.2, lng: 75.5, r: null, d: "MH" };
  /* Debounced so switching filters does not reload the iframe repeatedly. */
  const mapCenter = useDebouncedValue({ lat: center.lat, lng: center.lng }, 300);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select className="input max-w-xs" value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="All">All districts</option>
          {MAHARASHTRA_DISTRICTS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="input max-w-xs" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="All">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      <iframe
        title="Maharashtra complaints map"
        className="h-80 w-full rounded border border-border"
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=72.6%2C15.6%2C80.9%2C22.1&layer=mapnik&marker=${mapCenter.lat}%2C${mapCenter.lng}`}
      />
      <ul className="grid gap-2 md:grid-cols-2">
        {pins.slice(0, 20).map((p) => (
          <PinCard key={p.r.complaintId} pin={p} />
        ))}
        {pins.length === 0 && (
          <li className="text-sm text-muted">No complaints match the selected filters.</li>
        )}
      </ul>
    </div>
  );
}
