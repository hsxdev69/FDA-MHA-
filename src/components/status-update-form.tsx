"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_STATUSES } from "@/lib/constants";
import { updateStoredComplaintStatus } from "@/lib/client-storage";

export default function StatusUpdateForm({
  complaintId,
  currentStatus,
}: {
  complaintId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    if (status === currentStatus) {
      setMessage("Status is already set to this value.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      // 1. Update localStorage immediately
      updateStoredComplaintStatus(complaintId, status);

      // 2. Sync to backend in background (best-effort)
      try {
        await fetch(
          `/api/admin/complaints/${encodeURIComponent(complaintId)}/status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-officer-secret": "Harshal@123",
            },
            body: JSON.stringify({ status }),
          },
        );
      } catch {
        // ignore network errors
      }

      setMessage(`Status updated to "${status}".`);
      setIsError(false);
      router.refresh();
    } catch {
      setMessage("Failed to update status. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="status-select" className="label">Complaint Status</label>
        <select
          id="status-select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="input"
        >
          {ALLOWED_STATUSES.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Updating…" : "Update Status"}
      </button>
      {message && (
        <p
          className={`text-sm font-medium ${isError ? "text-red-700" : "text-green-700"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
