"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  deleteStoredComplaint,
  getOfficerSession,
  getStoredComplaints,
  isCaseDeletable,
  linkStoredComplaints,
  reassignStoredComplaint,
  type StoredComplaint,
} from "@/lib/client-storage";
import { appendAuditLog } from "@/lib/audit";
import { slaStatus } from "@/lib/sla";
import { useDebouncedValue } from "@/lib/use-debounced";
import { CaseRow, KpiCard } from "@/components/dashboard-parts";
import Spinner from "@/components/ui/spinner";

/* Heavy modules are lazy-loaded so the dashboard paints immediately. */
const ComplaintMap = dynamic(() => import("@/components/complaint-map"), {
  ssr: false,
  loading: () => <PanelSkeleton label="Loading map…" />,
});
const AdminAnalytics = dynamic(() => import("@/components/admin-analytics"), {
  ssr: false,
  loading: () => <PanelSkeleton label="Loading analytics…" />,
});
const OfficerWorkload = dynamic(() => import("@/components/officer-workload"), {
  ssr: false,
  loading: () => <PanelSkeleton label="Loading workload…" />,
});
const AuditLogsPanel = dynamic(() => import("@/components/audit-logs-panel"), {
  ssr: false,
  loading: () => <PanelSkeleton label="Loading audit log…" />,
});

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="card flex items-center gap-3 p-10 text-sm text-muted">
      <Spinner /> {label}
    </div>
  );
}

type Tab = "cases" | "map" | "analytics" | "workload" | "audit";

export default function OfficerDashboardClient({
  serverComplaints = [],
}: {
  serverComplaints?: StoredComplaint[];
}) {
  const [rows, setRows] = useState<StoredComplaint[]>(serverComplaints);
  const [loaded, setLoaded] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<StoredComplaint | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("cases");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const loadComplaints = useCallback(() => {
    const localList = getStoredComplaints();
    const map = new Map<string, StoredComplaint>();
    for (const c of serverComplaints) map.set(c.complaintId.toUpperCase(), c);
    for (const c of localList) map.set(c.complaintId.toUpperCase(), c);
    const merged = Array.from(map.values()).sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setRows(merged);
    setLoaded(true);
  }, [serverComplaints]);

  useEffect(() => {
    loadComplaints();
    const handleUpdate = () => loadComplaints();
    window.addEventListener("mahafda_complaints_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mahafda_complaints_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadComplaints]);

  /* Filtering is debounced + memoised so typing never blocks the table. */
  const visibleRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.complaintId.toLowerCase().includes(q) ||
        (r.category || r.complaintType).toLowerCase().includes(q) ||
        (r.district || "").toLowerCase().includes(q) ||
        (r.establishmentName || "").toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [rows, debouncedSearch]);

  /* SLA + counters computed once per rows change, not per render. */
  const stats = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    let pending = 0;
    let resolved = 0;
    let breached = 0;
    for (const r of rows) {
      if (r.severity >= 70) high += 1;
      else if (r.severity >= 40) medium += 1;
      else low += 1;
      if (r.status === "Pending") pending += 1;
      if (["Resolved", "Disposed", "Completed"].includes(r.status)) resolved += 1;
      if (slaStatus(r).breached) breached += 1;
    }
    return [
      { label: "Total Cases", value: rows.length, accent: "bg-navy text-white" },
      { label: "High Priority", value: high, accent: "bg-red-600 text-white" },
      { label: "Medium Priority", value: medium, accent: "bg-amber-500 text-white" },
      { label: "Low Priority", value: low, accent: "bg-green-600 text-white" },
      { label: "Pending Review", value: pending, accent: "bg-slate-500 text-white" },
      { label: "Disposed", value: resolved, accent: "bg-emerald-600 text-white" },
      { label: "SLA Breached", value: breached, accent: "bg-red-800 text-white" },
    ];
  }, [rows]);

  const officerName = useCallback(() => {
    const s = getOfficerSession();
    return s?.user.fullName || s?.user.username || "Officer";
  }, []);

  const handleReassign = useCallback(
    (complaintId: string, officer: string) => {
      reassignStoredComplaint(complaintId, officer);
      appendAuditLog({
        officerName: officerName(),
        action: `Case reassigned to ${officer}`,
        complaintId,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.complaintId === complaintId ? { ...r, assignedOfficer: officer } : r,
        ),
      );
    },
    [officerName],
  );

  const handleLink = useCallback((complaintId: string, linkedId: string) => {
    linkStoredComplaints(complaintId, linkedId);
    setToastMessage(`Linked ${complaintId} → ${linkedId}`);
  }, []);

  const handleAskDelete = useCallback((row: StoredComplaint) => {
    setCaseToDelete(row);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!caseToDelete || deleting) return;
    const targetId = caseToDelete.complaintId;
    setDeleting(true);
    try {
      deleteStoredComplaint(targetId);
      appendAuditLog({
        officerName: officerName(),
        action: "Case deleted",
        complaintId: targetId,
      });
      setRows((prev) =>
        prev.filter((r) => r.complaintId.toUpperCase() !== targetId.toUpperCase()),
      );
      setCaseToDelete(null);
      setToastMessage(`Case ${targetId} deleted successfully.`);
      window.setTimeout(
        () => setToastMessage((cur) => (cur?.includes(targetId) ? null : cur)),
        4000,
      );
      void fetch(`/api/admin/complaints/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers: { "x-officer-secret": "Harshal@123" },
      }).catch(() => {});
    } finally {
      setDeleting(false);
    }
  }, [caseToDelete, deleting, officerName]);

  const tabs: [Tab, string][] = [
    ["cases", "Cases"],
    ["map", "Map"],
    ["analytics", "Analytics"],
    ["workload", "Workload"],
    ["audit", "Audit log"],
  ];

  if (!loaded) {
    return <PanelSkeleton label="Loading Officer Dashboard cases…" />;
  }

  return (
    <div className="space-y-8">
      {toastMessage && (
        <div className="flex items-center justify-between rounded border border-green-600 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          <span>✓ {toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 border-l-4 border-saffron pl-4">
        <div>
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
            Officer Dashboard
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy">
            Complaint Management
          </h1>
        </div>
        <p className="font-mono text-xs text-muted">
          Total Records: <span className="font-semibold text-navy">{rows.length}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map(([id, lab]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "btn-primary !py-1.5 !px-3 text-xs active:scale-[0.98]"
                : "btn-outline !py-1.5 !px-3 text-xs active:scale-[0.98]"
            }
          >
            {lab}
          </button>
        ))}
      </div>

      {tab === "map" && <ComplaintMap rows={rows} />}
      {tab === "analytics" && <AdminAnalytics rows={rows} />}
      {tab === "workload" && <OfficerWorkload rows={rows} />}
      {tab === "audit" && <AuditLogsPanel />}

      {tab === "cases" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {stats.map((s) => (
              <KpiCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-page-warm px-5 py-3">
              <p className="font-heading text-sm font-bold text-navy">All Cases</p>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, district, shop, status…"
                className="input max-w-xs !py-1.5 text-xs"
              />
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {visibleRows.length} of {rows.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="gov-table min-w-[1200px]">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Evidence</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Fraud Risk</th>
                    <th>AI Vision Finding</th>
                    <th>Status / SLA</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-muted">
                        {rows.length === 0
                          ? "No complaints submitted yet."
                          : "No cases match your search."}
                      </td>
                    </tr>
                  )}
                  {visibleRows.map((row) => (
                    <CaseRow
                      key={row.complaintId}
                      row={row}
                      canDelete={isCaseDeletable(row.status)}
                      onDelete={handleAskDelete}
                      onReassign={handleReassign}
                      onLink={handleLink}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {caseToDelete && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/60"
            onClick={() => !deleting && setCaseToDelete(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md overflow-hidden border-2 border-red-500">
              <div className="bg-red-600 px-6 py-4 text-white">
                <h2 className="font-heading font-bold">Confirm Permanent Deletion</h2>
                <p className="font-mono text-xs">{caseToDelete.complaintId}</p>
              </div>
              <div className="space-y-3 p-6 text-sm">
                <p>
                  Are you sure you want to permanently delete Case ID{" "}
                  <strong>{caseToDelete.complaintId}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded bg-red-600 py-2 font-semibold text-white disabled:opacity-60 active:scale-[0.99]"
                    disabled={deleting}
                    onClick={handleConfirmDelete}
                  >
                    {deleting ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner light /> Deleting…
                      </span>
                    ) : (
                      "Yes, Delete Case"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-outline flex-1"
                    disabled={deleting}
                    onClick={() => setCaseToDelete(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
