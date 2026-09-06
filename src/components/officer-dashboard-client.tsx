"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import EvidenceThumbnail from "@/components/evidence-thumbnail";
import ReviewButton from "@/components/review-button";
import {
  deleteStoredComplaint,
  getStoredComplaints,
  isCaseCompleted,
  type StoredComplaint,
} from "@/lib/client-storage";

export default function OfficerDashboardClient({
  serverComplaints = [],
}: {
  serverComplaints?: StoredComplaint[];
}) {
  const [rows, setRows] = useState<StoredComplaint[]>(serverComplaints);
  const [loaded, setLoaded] = useState(true);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  const loadComplaints = () => {
    const localList = getStoredComplaints();
    // Merge local and server complaints by complaintId without duplicates
    const map = new Map<string, StoredComplaint>();
    for (const c of serverComplaints) {
      map.set(c.complaintId.toUpperCase(), c);
    }
    for (const c of localList) {
      map.set(c.complaintId.toUpperCase(), c);
    }

    const merged = Array.from(map.values()).sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setRows(merged);
    setLoaded(true);
  };

  useEffect(() => {
    loadComplaints();
    const handleUpdate = () => loadComplaints();
    window.addEventListener("mahafda_complaints_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mahafda_complaints_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmDelete = async (complaintId: string) => {
    setDeleting(true);
    const cleanId = complaintId.trim().toUpperCase();

    try {
      // 1. Remove from localStorage
      deleteStoredComplaint(cleanId);

      // 2. Also send background DELETE request to server database
      try {
        fetch(`/api/admin/complaints/${encodeURIComponent(cleanId)}`, {
          method: "DELETE",
          headers: { "x-officer-secret": "Harshal@123" },
        }).catch(() => {});
      } catch {
        // ignore network error
      }

      // 3. Update dashboard state immediately without full page reload
      setRows((prev) =>
        prev.filter((c) => c.complaintId.toUpperCase() !== cleanId),
      );

      // 4. Show green success toast
      setDeleteToast(`Case [${cleanId}] deleted successfully.`);
      setTimeout(() => setDeleteToast(null), 5000);

      // 5. Close confirmation modal
      setCaseToDelete(null);
    } catch (err) {
      console.error("Failed to delete case:", err);
    } finally {
      setDeleting(false);
    }
  };

  const total = rows.length;
  const high = rows.filter((r) => r.severity >= 70).length;
  const medium = rows.filter((r) => r.severity >= 40 && r.severity < 70).length;
  const low = rows.filter((r) => r.severity < 40).length;
  const pending = rows.filter((r) => r.status === "Pending").length;
  const resolved = rows.filter((r) => isCaseCompleted(r.status)).length;

  const stats = [
    { label: "Total Cases", value: total, accent: "bg-navy text-white" },
    { label: "High Priority", value: high, accent: "bg-red-600 text-white" },
    { label: "Medium Priority", value: medium, accent: "bg-amber-500 text-white" },
    { label: "Low Priority", value: low, accent: "bg-green-600 text-white" },
    { label: "Pending Review", value: pending, accent: "bg-slate-500 text-white" },
    { label: "Disposed", value: resolved, accent: "bg-emerald-600 text-white" },
  ];

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="card p-10 text-center text-sm text-muted">
          Loading Officer Dashboard cases…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-l-4 border-saffron pl-4">
        <div>
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
            Officer Dashboard
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy">
            Complaint Management
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Sorted by AI priority (highest first), then by newest complaint.
          </p>
        </div>
        <p className="font-mono text-xs text-muted">
          Total Records: <span className="font-semibold text-navy">{total}</span>
        </p>
      </div>

      {/* Success Notification Toast */}
      {deleteToast && (
        <div
          role="status"
          className="flex items-center justify-between rounded border border-green-600 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 shadow-sm transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">
              ✓
            </span>
            <span>{deleteToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteToast(null)}
            className="rounded px-2 py-0.5 text-xs font-bold text-green-700 hover:bg-green-100 hover:text-green-900"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card overflow-hidden">
            <div className={`px-4 py-3 ${stat.accent}`}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] opacity-90">
                {stat.label}
              </p>
              <p className="mt-1 font-heading text-3xl font-bold leading-none">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-page-warm px-5 py-3">
          <p className="font-heading text-sm font-bold text-navy">All Cases</p>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {total} record{total === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table min-w-[1150px]">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Evidence</th>
                <th>Location</th>
                <th>Priority</th>
                <th>AI Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <span className="block text-4xl" aria-hidden="true">
                      🗂️
                    </span>
                    <p className="mt-3 font-heading text-base font-semibold text-navy">
                      No complaints submitted yet.
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Cases lodged through the citizen &ldquo;File Complaint&rdquo;
                      form will appear here automatically.
                    </p>
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const lastReview =
                  row.reviews && row.reviews.length > 0 ? row.reviews[0] : null;
                let thumbUri: string | null = null;
                if (row.photoData) {
                  thumbUri = row.photoData.startsWith("data:")
                    ? row.photoData
                    : `data:${row.photoMime || "image/jpeg"};base64,${row.photoData}`;
                }

                const completed = isCaseCompleted(row.status);

                return (
                  <tr key={row.complaintId}>
                    <td>
                      <Link
                        href={`/admin/complaint/${row.complaintId}`}
                        className="font-mono text-xs font-bold text-navy hover:underline"
                      >
                        {row.complaintId}
                      </Link>
                    </td>
                    <td className="font-semibold text-ink">{row.complaintType}</td>
                    <td>
                      <EvidenceThumbnail
                        src={thumbUri}
                        complaintId={row.complaintId}
                        size={44}
                      />
                    </td>
                    <td className="max-w-[170px] truncate" title={row.location}>
                      {row.location}
                    </td>
                    <td>
                      <PriorityBadge severity={row.severity} />
                    </td>
                    <td className="max-w-[200px] truncate text-xs text-muted" title={row.aiReason}>
                      {row.aiReason}
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap font-mono text-[11px] text-muted">
                      {formatDate(row.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <ReviewButton
                          complaintId={row.complaintId}
                          initialStatus={row.status}
                          lastReview={lastReview}
                        />

                        {/* Conditional Delete Action Button */}
                        {completed ? (
                          <button
                            type="button"
                            onClick={() => setCaseToDelete(row.complaintId)}
                            className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100"
                            title={`Delete completed case ${row.complaintId}`}
                            aria-label={`Delete case ${row.complaintId}`}
                          >
                            <span aria-hidden="true">🗑️</span> Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-400 opacity-60"
                            title="Case must be completed before deletion."
                            aria-label="Case must be completed before deletion"
                          >
                            <span aria-hidden="true">🗑️</span> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Safety Modal */}
      {caseToDelete && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-ink/70"
            onClick={() => !deleting && setCaseToDelete(null)}
            aria-hidden="true"
          />

          {/* Modal Box */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Case Deletion"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="card w-full max-w-md overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-red-600 bg-navy px-5 py-3.5 text-white">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                    ⚠️
                  </span>
                  <h2 className="font-heading text-base font-bold text-white">
                    Confirm Permanent Deletion
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => !deleting && setCaseToDelete(null)}
                  disabled={deleting}
                  className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Are you sure you want to permanently delete Case ID{" "}
                  <strong className="font-mono font-bold text-navy">
                    [{caseToDelete}]
                  </strong>
                  ? This action cannot be undone.
                </p>

                <div className="notice notice-danger text-xs leading-relaxed">
                  <p>
                    <strong className="text-red-700">Permanent Action:</strong>{" "}
                    The complaint record, citizen evidence photo, and all officer
                    audit logs will be permanently removed from storage.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCaseToDelete(null)}
                    disabled={deleting}
                    className="btn-outline !py-2 !px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(caseToDelete)}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded border border-red-700 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? (
                      "Deleting Case…"
                    ) : (
                      <>
                        <span aria-hidden="true">🗑️</span> Yes, Delete Case
                      </>
                    )}
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
