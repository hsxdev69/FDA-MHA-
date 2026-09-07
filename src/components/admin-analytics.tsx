"use client";

import { memo, useCallback, useMemo, useState } from "react";
import type { StoredComplaint } from "@/lib/client-storage";
import { slaStatus } from "@/lib/sla";
import { inferDistrict } from "@/lib/maharashtra-districts";

type Range = "today" | "7d" | "30d" | "all";

function inRange(iso: string, range: Range): boolean {
  if (range === "all") return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return t >= start.getTime();
  }
  const days = range === "7d" ? 7 : 30;
  return t >= now - days * 24 * 60 * 60 * 1000;
}

const Bar = memo(function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max <= 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono font-bold">{value}</span>
      </div>
      <div className="h-2.5 rounded bg-slate-200">
        <div className={`h-2.5 rounded ${color}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
});

export default function AdminAnalytics({ rows }: { rows: StoredComplaint[] }) {
  const [range, setRange] = useState<Range>("all");
  const data = useMemo(() => rows.filter((r) => inRange(r.createdAt, range)), [rows, range]);

  /* All aggregation happens once per (rows, range) change. */
  const { byCat, byDist, byStatus, maxCat, maxDist, kpis } = useMemo(() => {
    let pending = 0;
    let investigation = 0;
    let resolved = 0;
    let breached = 0;
    const cats = new Map<string, number>();
    const dists = new Map<string, number>();
    const statuses = new Map<string, number>();

    for (const r of data) {
      if (r.status === "Pending") pending += 1;
      if (["Under Review", "Under Investigation", "Action Taken"].includes(r.status)) {
        investigation += 1;
      }
      if (["Resolved", "Disposed", "Completed", "Approved"].includes(r.status)) {
        resolved += 1;
      }
      if (slaStatus(r).breached) breached += 1;

      const cat = r.category || r.complaintType;
      cats.set(cat, (cats.get(cat) || 0) + 1);
      const d = inferDistrict(r.location, r.district);
      dists.set(d, (dists.get(d) || 0) + 1);
      statuses.set(r.status, (statuses.get(r.status) || 0) + 1);
    }

    return {
      byCat: cats,
      byDist: dists,
      byStatus: statuses,
      maxCat: Math.max(1, ...cats.values()),
      maxDist: Math.max(1, ...dists.values()),
      kpis: [
        { label: "Total", value: data.length, accent: "bg-navy text-white" },
        { label: "Pending", value: pending, accent: "bg-slate-600 text-white" },
        { label: "Under Investigation", value: investigation, accent: "bg-amber-600 text-white" },
        { label: "Resolved", value: resolved, accent: "bg-emerald-700 text-white" },
        { label: "SLA Breached", value: breached, accent: "bg-red-700 text-white" },
      ],
    };
  }, [data]);

  const selectRange = useCallback((r: Range) => setRange(r), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["today", "Today"],
            ["7d", "7 Days"],
            ["30d", "30 Days"],
            ["all", "All Time"],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            onClick={() => selectRange(k)}
            className={
              range === k
                ? "btn-primary !py-1.5 !px-3 text-xs active:scale-[0.98]"
                : "btn-outline !py-1.5 !px-3 text-xs active:scale-[0.98]"
            }
          >
            {lab}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className={`card overflow-hidden ${k.accent}`}>
            <div className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">{k.label}</p>
              <p className="font-heading text-3xl font-bold">{k.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-4 space-y-3">
          <h3 className="font-heading text-sm font-bold text-navy">Complaints by category</h3>
          {[...byCat.entries()].map(([k, v]) => (
            <Bar key={k} label={k} value={v} max={maxCat} color="bg-navy" />
          ))}
          {byCat.size === 0 && <p className="text-xs text-muted">No data</p>}
        </div>
        <div className="card p-4 space-y-3">
          <h3 className="font-heading text-sm font-bold text-navy">District distribution</h3>
          {[...byDist.entries()].map(([k, v]) => (
            <Bar key={k} label={k} value={v} max={maxDist} color="bg-saffron-deep" />
          ))}
          {byDist.size === 0 && <p className="text-xs text-muted">No data</p>}
        </div>
        <div className="card p-4">
          <h3 className="mb-3 font-heading text-sm font-bold text-navy">Status breakdown</h3>
          <svg viewBox="0 0 120 120" className="mx-auto h-40 w-40">
            {(() => {
              const entries = [...byStatus.entries()];
              const sum = entries.reduce((a, [, v]) => a + v, 0) || 1;
              let acc = 0;
              const colors = ["#0f2b48", "#d97706", "#15803d", "#b91c1c", "#64748b"];
              return entries.map(([k, v], i) => {
                const start = acc / sum;
                acc += v;
                const end = acc / sum;
                const a0 = start * Math.PI * 2 - Math.PI / 2;
                const a1 = end * Math.PI * 2 - Math.PI / 2;
                const x0 = 60 + 48 * Math.cos(a0);
                const y0 = 60 + 48 * Math.sin(a0);
                const x1 = 60 + 48 * Math.cos(a1);
                const y1 = 60 + 48 * Math.sin(a1);
                const large = end - start > 0.5 ? 1 : 0;
                return (
                  <path
                    key={k}
                    d={`M60 60 L ${x0} ${y0} A 48 48 0 ${large} 1 ${x1} ${y1} Z`}
                    fill={colors[i % colors.length]}
                  />
                );
              });
            })()}
            <circle cx="60" cy="60" r="24" fill="white" />
          </svg>
          <ul className="mt-2 space-y-1 text-xs">
            {[...byStatus.entries()].map(([k, v]) => (
              <li key={k}>
                {k}: <strong>{v}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
