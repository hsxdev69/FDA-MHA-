"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CaseReviewModal from "./case-review-modal";

interface ReviewRecord {
  status: string;
  notes: string;
  officer: string;
  createdAt: string;
  filename: string | null;
}

export default function ReviewPanel({
  complaintId,
  currentStatus,
  lastReview,
  reviewCount,
}: {
  complaintId: string;
  currentStatus: string;
  lastReview: ReviewRecord | null;
  reviewCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOpen(true)} className="btn-saffron !py-2">
          📝 Submit Official Remarks
        </button>
        <span className="rounded border border-border bg-page-warm px-3 py-1 font-mono text-xs text-muted">
          {reviewCount} review{reviewCount === 1 ? "" : "s"}
        </span>
      </div>
      {open && (
        <CaseReviewModal
          complaintId={complaintId}
          initialStatus={currentStatus}
          initialNotes={lastReview?.notes ?? ""}
          lastReview={lastReview}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
