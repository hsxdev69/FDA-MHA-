"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import ReviewPanel from "@/components/review-panel";
import { EvidenceViewer } from "@/components/evidence-thumbnail";
import {
  deleteStoredComplaint,
  getStoredComplaintById,
  isCaseCompleted,
  type StoredComplaint,
} from "@/lib/client-storage";

export default function ComplaintDetailsClient({
  complaintId,
  serverComplaint,
}: {
  complaintId: string;
  serverComplaint?: StoredComplaint | null;
}) {
  const router = useRouter();
  const [complaint, setComplaint] = useState<StoredComplaint | null>(
    serverComplaint ?? null,
  );
  const [loaded, setLoaded] = useState(Boolean(serverComplaint));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = () => {
    const localMatch = getStoredComplaintById(complaintId);
    if (localMatch) {
      setComplaint(localMatch);
    } else if (serverComplaint) {
      setComplaint(serverComplaint);
    }
    setLoaded(true);
  };

  useEffect(() => {
    reload();
    const handleUpdate = () => reload();
    window.addEventListener("mahafda_complaints_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mahafda_complaints_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  const handleDeleteCase = async () => {
    if (!complaint) return;
    setDeleting(true);
    const cleanId = complaint.complaintId.trim().toUpperCase();

    try {
      deleteStoredComplaint(cleanId);
      try {
        fetch(`/api/admin/complaints/${encodeURIComponent(cleanId)}`, {
          method: "DELETE",
          headers: { "x-officer-secret": "Harshal@123" },
        }).catch(() => {});
      } catch {
        // ignore
      }
      router.push("/admin");
    } catch (err) {
      console.error("Failed to delete case:", err);
      setDeleting(false);
    }
  };

  if (!loaded) {
    return (
      <div className="mx-auto max-w-xl py-14 text-center">
        <div className="card p-8 text-sm text-muted">
          Loading complaint details…
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="mx-auto max-w-xl py-14 text-center">
        <div className="card p-8">
          <p className="text-4xl">🔎</p>
          <h1 className="mt-3 font-heading text-xl font-bold text-navy">
            Complaint not found
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            No complaint exists with ID{" "}
            <span className="font-mono font-semibold">{complaintId}</span>.
          </p>
          <Link href="/admin" className="btn-primary mt-5">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const mapsUrl =
    complaint.latitude && complaint.longitude
      ? `https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`
      : null;

  const reviewHistory = complaint.reviews || [];
  let photoUri: string | null = null;
  if (complaint.photoData) {
    photoUri = complaint.photoData.startsWith("data:")
      ? complaint.photoData
      : `data:${complaint.photoMime || "image/jpeg"};base64,${complaint.photoData}`;
  }

  const completed = isCaseCompleted(complaint.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-saffron pl-4">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-navy hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy">
            Complaint Details
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border-2 border-navy bg-page-warm px-4 py-2 font-mono text-sm font-bold text-navy">
            {complaint.complaintId}
          </span>
          {completed ? (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100"
              title="Permanently delete this completed case"
            >
              <span aria-hidden="true">🗑️</span> Delete Case
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-400 opacity-60"
              title="Case must be completed before deletion."
            >
              <span aria-hidden="true">🗑️</span> Delete Case
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <h2 className="mb-5 border-b border-border pb-2 font-heading text-base font-bold text-navy">
              Complaint Information
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Complaint ID</dt>
                <dd className="mt-1 font-mono text-sm font-bold text-navy">{complaint.complaintId}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Complaint Type</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{complaint.complaintType}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Filed On</dt>
                <dd className="mt-1 text-sm font-medium text-ink-soft">{formatDate(complaint.createdAt)}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Status</dt>
                <dd className="mt-1"><StatusBadge status={complaint.status} /></dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded border border-border bg-page-warm px-4 py-3 text-sm leading-relaxed text-ink-soft">
                  {complaint.description}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Location</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{complaint.location}</dd>
                {complaint.latitude && complaint.longitude && (
                  <dd className="mt-1 font-mono text-xs text-muted">
                    Lat: <span className="font-semibold">{complaint.latitude}</span> ·
                    Lng: <span className="font-semibold">{complaint.longitude}</span>
                    {mapsUrl && (
                      <>
                        {" · "}
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy hover:underline">
                          View on Google Maps ↗
                        </a>
                      </>
                    )}
                  </dd>
                )}
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="mb-5 border-b border-border pb-2 font-heading text-base font-bold text-navy">
              Uploaded Photo / Evidence
            </h2>
            <EvidenceViewer src={photoUri} complaintId={complaint.complaintId} />
            {photoUri && (
              <p className="mt-3 font-mono text-xs text-muted">
                File: {complaint.photoFilename ?? "uploaded"} · Type:{" "}
                {complaint.photoMime ?? "image"} · Click the image to enlarge
              </p>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 border-b border-border pb-2 font-heading text-base font-bold text-navy">
              Citizen Information
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Name</dt>
                <dd className="mt-1 font-semibold text-ink">{complaint.name}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Mobile</dt>
                <dd className="mt-1 font-mono font-semibold text-ink">{complaint.mobile}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">Email</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {complaint.email || <span className="text-muted-dim">Not provided</span>}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 border-b border-border pb-2 font-heading text-base font-bold text-navy">
              AI Preliminary Assessment
            </h2>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-navy">{complaint.severity}</span>
              <span className="text-sm text-muted">/ 100</span>
              <PriorityBadge severity={complaint.severity} />
            </div>
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-navy"
                style={{ width: `${Math.max(4, complaint.severity)}%` }}
              />
            </div>
            <p className="rounded border border-saffron bg-amber-50 px-4 py-3 text-sm italic leading-relaxed text-ink-soft">
              &ldquo;{complaint.aiReason}&rdquo;
            </p>
            <div className="mt-3 notice notice-info">
              <p className="text-xs">
                <strong className="text-navy">Warning:</strong> This is a
                preliminary automated prioritization recommendation. It does
                not determine whether the complaint is genuine and does not
                replace official investigation or decisions by an authorized
                FDA officer.
              </p>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 border-b border-border pb-2 font-heading text-base font-bold text-navy">
              Case Review &amp; Status
            </h2>
            <ReviewPanel
              complaintId={complaint.complaintId}
              currentStatus={complaint.status}
              lastReview={reviewHistory[0] ?? null}
              reviewCount={reviewHistory.length}
            />
          </section>

          {reviewHistory.length > 0 && (
            <section className="card p-6">
              <h2 className="mb-4 border-b border-border pb-2 font-heading text-base font-bold text-navy">
                Review History ({reviewHistory.length})
              </h2>
              <div className="space-y-4">
                {reviewHistory.map((review, idx) => (
                  <div
                    key={idx}
                    className="rounded border border-border bg-page-warm px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-navy">
                        {review.officer}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-navy">Status: {review.status}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{review.notes}</p>
                    {review.filename && (
                      <p className="mt-1 font-mono text-xs text-navy">📎 {review.filename}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Confirmation Safety Modal on Details Page */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-ink/70"
            onClick={() => !deleting && setShowDeleteModal(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Case Deletion"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="card w-full max-w-md overflow-hidden shadow-2xl">
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
                  onClick={() => !deleting && setShowDeleteModal(false)}
                  disabled={deleting}
                  className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Are you sure you want to permanently delete Case ID{" "}
                  <strong className="font-mono font-bold text-navy">
                    [{complaint.complaintId}]
                  </strong>
                  ? This action cannot be undone.
                </p>

                <div className="notice notice-danger text-xs leading-relaxed">
                  <p>
                    <strong className="text-red-700">Permanent Action:</strong>{" "}
                    The complaint record and all officer audit logs will be
                    permanently removed from storage.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="btn-outline !py-2 !px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCase}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded border border-red-700 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? "Deleting Case…" : "Yes, Delete Case"}
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
