"use client";

import { useEffect, useState } from "react";

/**
 * Shared full-size evidence lightbox modal.
 * Used by both the dashboard thumbnail and the details-page viewer.
 */
function EvidenceLightbox({
  src,
  complaintId,
  onClose,
  onDecodeError,
}: {
  src: string;
  complaintId: string;
  onClose: () => void;
  onDecodeError: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/75"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Lightbox modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Evidence viewer"
        className="fixed inset-0 z-50 flex items-center justify-center overflow-auto p-4"
      >
        <div className="card my-8 w-full max-w-3xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b-2 border-saffron bg-navy px-5 py-3 text-white">
            <div>
              <h2 className="font-heading text-base font-bold">
                Evidence / Proof
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
                {complaintId}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-white/25 bg-white/10 px-2.5 py-1 text-sm font-semibold transition hover:bg-white/20"
              aria-label="Close evidence viewer"
            >
              ✕ Close
            </button>
          </div>

          <div className="flex max-h-[70vh] items-center justify-center overflow-auto bg-[#0f172a] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Full-size evidence for ${complaintId}`}
              onError={onDecodeError}
              className="max-h-[65vh] w-auto max-w-full rounded object-contain"
            />
          </div>

          <div className="border-t border-border bg-page-warm px-5 py-3">
            <p className="font-mono text-[11px] text-muted">
              Press Esc or click outside to close. Evidence is visible to
              authorized FDA officers only.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Evidence thumbnail for the Officer Dashboard table.
 * - Neat 44×44 rounded, object-cover thumbnail.
 * - Clicking opens a full-size lightbox modal.
 * - Corrupt / undecodable data degrades to "No File" (dash) rather than
 *   showing a broken-image icon.
 */
export default function EvidenceThumbnail({
  src,
  complaintId,
  size = 44,
  emptyLabel = "—",
}: {
  src: string | null;
  complaintId: string;
  size?: number;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className="inline-flex items-center justify-center rounded border border-dashed border-border-strong bg-page-warm font-mono text-[11px] text-muted-dim"
        style={{ width: size, height: size }}
        title={
          failed
            ? "Evidence file could not be displayed"
            : "No evidence attached"
        }
        aria-label={failed ? "Evidence unavailable" : "No File"}
      >
        {emptyLabel}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block cursor-zoom-in rounded-md border border-border p-0 transition hover:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        style={{ width: size, height: size }}
        title={`View full-size evidence for ${complaintId}`}
        aria-label={`View full-size evidence for ${complaintId}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Evidence for ${complaintId}`}
          onError={() => setFailed(true)}
          className="rounded object-cover"
          style={{ width: size - 2, height: size - 2 }}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-navy/0 text-[10px] font-bold text-white opacity-0 transition group-hover:bg-navy/55 group-hover:opacity-100">
          🔍
        </span>
      </button>

      {open && (
        <EvidenceLightbox
          src={src}
          complaintId={complaintId}
          onClose={() => setOpen(false)}
          onDecodeError={() => {
            setFailed(true);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

/**
 * Large evidence preview for the complaint details page.
 * Clicking the preview opens the same full-size lightbox.
 */
export function EvidenceViewer({
  src,
  complaintId,
}: {
  src: string | null;
  complaintId: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="rounded border border-dashed border-border-strong bg-page-warm py-12 text-center">
        <span className="block text-4xl" aria-hidden="true">
          📷
        </span>
        <p className="mt-2 text-sm font-medium text-muted">
          {failed
            ? "The attached evidence file could not be displayed."
            : "No photo was attached to this complaint."}
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded border border-border bg-page-warm p-2 text-left transition hover:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        title="Click to view full size"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Complaint evidence for ${complaintId}`}
          onError={() => setFailed(true)}
          className="max-h-80 w-auto rounded object-contain"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded bg-navy/85 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
          🔍 Click to enlarge
        </span>
      </button>

      {open && (
        <EvidenceLightbox
          src={src}
          complaintId={complaintId}
          onClose={() => setOpen(false)}
          onDecodeError={() => {
            setFailed(true);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
