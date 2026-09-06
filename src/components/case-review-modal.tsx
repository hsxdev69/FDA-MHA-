"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addStoredReview, getOfficerSession } from "@/lib/client-storage";

type Toast = { type: "success" | "error"; message: string } | null;

interface ReviewRecord {
  status: string;
  notes: string;
  officer: string;
  createdAt: string;
  filename: string | null;
}

const STATUSES = [
  "Pending",
  "Under Review",
  "Under Investigation",
  "Action Taken",
  "Approved",
  "Rejected",
  "Resolved",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx"];
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export default function CaseReviewModal({
  complaintId,
  initialStatus,
  initialNotes,
  lastReview,
  onClose,
  onSaved,
}: {
  complaintId: string;
  initialStatus: string;
  initialNotes?: string;
  lastReview: ReviewRecord | null;
  onClose: () => void;
  onSaved: (status: string, notes: string) => void;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) { setAttachment(null); return; }
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Invalid file format. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAttachment(null);
      return;
    }
    if (f.size > MAX_ATTACHMENT_BYTES) {
      setError("Attachment is too large. Maximum size is 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAttachment(null);
      return;
    }
    setError("");
    setAttachment(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!status) { setError("Please select a status."); return; }
    if (!notes.trim()) { setError("Officer remarks / review notes are required."); return; }

    setSubmitting(true);
    const officerSession = getOfficerSession();
    const officerName = officerSession?.user.username ?? "fdaofficer";

    try {
      // 1. Save directly to localStorage so UI updates immediately and reliably
      addStoredReview(complaintId, {
        status,
        notes: notes.trim(),
        officer: officerName,
        filename: attachment ? attachment.name : null,
      });

      // 2. Also fire non-blocking sync to backend API
      try {
        const formData = new FormData();
        formData.append("status", status);
        formData.append("notes", notes.trim());
        if (attachment) formData.append("attachment", attachment);
        fetch(`/api/admin/complaints/${encodeURIComponent(complaintId)}/review`, {
          method: "POST",
          headers: { "x-officer-secret": "Harshal@123" },
          body: formData,
        }).catch(() => {});
      } catch {
        // ignore network failure
      }

      showToast("success", "Review saved and status updated successfully.");
      onSaved(status, notes.trim());
      setTimeout(() => onClose(), 600);
    } catch {
      setError("Failed to save review locally. Please try again.");
      showToast("error", "Review failed to save.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/60"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />
      <div role="dialog" aria-modal="true" aria-label="Case Review" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
        <div className="card my-8 w-full max-w-lg overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b-2 border-saffron bg-navy px-6 py-4 text-white">
            <div>
              <h2 className="font-heading text-lg font-bold">Review Case</h2>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">{complaintId}</p>
            </div>
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="rounded border border-white/20 bg-white/10 px-2.5 py-1 text-sm transition hover:bg-white/20"
              aria-label="Close review dialog"
            >
              ✕
            </button>
          </div>

          {toast && (
            <div
              role="status"
              className={`mx-6 mt-4 rounded border px-4 py-3 text-sm font-semibold ${
                toast.type === "success"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-red-600 bg-red-50 text-red-700"
              }`}
            >
              {toast.type === "success" ? "✓" : "⚠"} {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            <div>
              <label htmlFor="review-status" className="label">
                Status <span className="text-red-600">*</span>
              </label>
              <select
                id="review-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
                disabled={submitting}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="review-notes" className="label">
                Officer Remarks / Review Notes <span className="text-red-600">*</span>
              </label>
              <textarea
                id="review-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                disabled={submitting}
                placeholder="Document your investigation findings, decisions and follow-up actions…"
                className="input resize-y"
              />
              <p className="mt-1.5 font-mono text-[11px] text-muted">
                {notes.trim().length}/2000 characters · required
              </p>
            </div>

            <div>
              <label className="label">Supporting Attachment (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                onChange={handleAttachmentChange}
                disabled={submitting}
                className="block w-full text-sm text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-page-warm file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-white"
              />
              {attachment && (
                <p className="mt-2 font-mono text-xs text-navy">
                  📎 {attachment.name} ({(attachment.size / 1024).toFixed(0)} KB)
                </p>
              )}
              <p className="mt-1 text-xs text-muted">JPG / PNG / WEBP / PDF / DOC up to 5 MB.</p>
            </div>

            <div className="rounded border border-border bg-page-warm px-3 py-2.5 font-mono text-xs text-ink-soft">
              <span className="text-muted">Timestamp:</span>{" "}
              <span className="font-semibold text-navy">
                {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>

            {error && (
              <div role="alert" className="notice notice-danger">
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? "Submitting Review…" : "Submit Official Remarks"}
              </button>
              <button type="button" onClick={onClose} disabled={submitting} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>

          {lastReview && (
            <div className="border-t border-border bg-page-warm px-6 py-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-navy">
                Last review by {lastReview.officer}
              </p>
              <p className="mt-1.5 text-sm whitespace-pre-wrap text-ink-soft">{lastReview.notes}</p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {new Date(lastReview.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
