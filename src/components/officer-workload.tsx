"use client";

import { DEFAULT_OFFICERS } from "@/lib/maharashtra-districts";
import { getRegisteredOfficers, reassignStoredComplaint, type StoredComplaint } from "@/lib/client-storage";
import { getOfficerSession } from "@/lib/client-storage";
import { appendAuditLog } from "@/lib/audit";

export default function OfficerWorkload({
  rows,
}: {
  rows: StoredComplaint[];
}) {
  const registered = getRegisteredOfficers().map((o) => ({
    username: o.username,
    fullName: o.fullName,
    department: o.department,
  }));
  const roster = [...DEFAULT_OFFICERS];
  for (const r of registered) {
    if (!roster.some((x) => x.username === r.username)) roster.push(r);
  }

  const capacity = 10;

  return (
    <div className="space-y-4">
      {roster.map((o) => {
        const assigned = rows.filter((c) => (c.assignedOfficer || "fdaofficer") === o.username);
        const active = assigned.filter((c) => !["Resolved", "Rejected", "Disposed", "Completed"].includes(c.status)).length;
        const resolved = assigned.filter((c) => ["Resolved", "Approved", "Completed"].includes(c.status)).length;
        const pct = Math.min(100, Math.round((active / capacity) * 100));
        return (
          <div key={o.username} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-heading font-bold text-navy">{o.fullName}</p>
                <p className="text-xs text-muted">{o.department} · @{o.username}</p>
              </div>
              <p className="text-xs font-mono">
                Active {active} · Resolved {resolved}
              </p>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded bg-slate-200">
              <div
                className={`h-3 ${pct >= 80 ? "bg-red-600" : pct >= 50 ? "bg-amber-500" : "bg-green-600"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">{pct}% capacity (of {capacity} active cases)</p>
          </div>
        );
      })}

      <div className="card p-4">
        <h3 className="mb-3 font-heading text-sm font-bold text-navy">Reassign a case</h3>
        <ReassignForm rows={rows} roster={roster} />
      </div>
    </div>
  );
}

function ReassignForm({
  rows,
  roster,
}: {
  rows: StoredComplaint[];
  roster: { username: string; fullName: string }[];
}) {
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const id = String(fd.get("case") || "");
        const officer = String(fd.get("officer") || "");
        if (!id || !officer) return;
        reassignStoredComplaint(id, officer);
        const session = getOfficerSession();
        appendAuditLog({
          officerName: session?.user.fullName || session?.user.username || "Officer",
          action: `Case reassigned to ${officer}`,
          complaintId: id,
        });
        e.currentTarget.reset();
      }}
    >
      <select name="case" className="input max-w-xs" required defaultValue="">
        <option value="" disabled>
          Select case
        </option>
        {rows.map((r) => (
          <option key={r.complaintId} value={r.complaintId}>
            {r.complaintId}
          </option>
        ))}
      </select>
      <select name="officer" className="input max-w-xs" required defaultValue="">
        <option value="" disabled>
          Assign to
        </option>
        {roster.map((o) => (
          <option key={o.username} value={o.username}>
            {o.fullName}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-primary">
        Reassign
      </button>
    </form>
  );
}
