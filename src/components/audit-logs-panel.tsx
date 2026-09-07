"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import { getAuditLogs, type AuditEntry } from "@/lib/audit";

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const load = () => setLogs(getAuditLogs());
    load();
    window.addEventListener("mahafda_audit_updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("mahafda_audit_updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-page-warm px-4 py-3">
        <h3 className="font-heading text-sm font-bold text-navy">Immutable audit log</h3>
        <p className="text-xs text-muted">Append-only record stored in this browser (max 500 events).</p>
      </div>
      <div className="overflow-x-auto">
        <table className="gov-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Officer</th>
              <th>Action</th>
              <th>Case</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted">
                  No audit events yet.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap font-mono text-[11px]">{formatDate(l.timestamp)}</td>
                <td>{l.officerName}</td>
                <td>{l.action}</td>
                <td className="font-mono text-xs">{l.complaintId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
