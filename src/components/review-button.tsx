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

export default function ReviewButton({
  complaintId,
  initialStatus,
  lastReview,
}: {
  complaintId: string;
  initialStatus: string;
  lastReview: ReviewRecord | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary !px-3.5 !py-1.5 text-xs"
      >
        Review Case
      </button>
      {open && (
        <CaseReviewModal
          complaintId={complaintId}
          initialStatus={initialStatus}
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
