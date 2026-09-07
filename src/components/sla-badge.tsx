"use client";

import { useEffect, useState } from "react";
import { slaStatus } from "@/lib/sla";
import type { StoredComplaint } from "@/lib/client-storage";

export default function SlaBadge({ complaint }: { complaint: StoredComplaint }) {
  const [label, setLabel] = useState("");
  const [breached, setBreached] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const tick = () => {
      const s = slaStatus(complaint);
      setLabel(s.label);
      setBreached(s.breached);
      setClosed(s.closed);
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [complaint]);

  if (closed) {
    return (
      <span className="inline-flex rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
        SLA closed
      </span>
    );
  }
  if (breached) {
    return (
      <span className="inline-flex rounded border border-red-600 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
        🔴 {label}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded border border-amber-500 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
      {label}
    </span>
  );
}
