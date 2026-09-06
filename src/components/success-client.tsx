"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { getStoredComplaintById, type StoredComplaint } from "@/lib/client-storage";

export default function SuccessClient({
  complaintId,
  serverComplaint,
}: {
  complaintId: string;
  serverComplaint?: {
    complaintId: string;
    severity: number;
    aiReason: string;
    status: string;
    complaintType: string;
  } | null;
}) {
  const [complaint, setComplaint] = useState<{
    complaintId: string;
    severity: number;
    aiReason: string;
    status: string;
    complaintType: string;
  } | null>(serverComplaint ?? null);
  const [loaded, setLoaded] = useState(Boolean(serverComplaint));

  useEffect(() => {
    if (complaintId) {
      const stored: StoredComplaint | null = getStoredComplaintById(complaintId);
      if (stored) {
        setComplaint({
          complaintId: stored.complaintId,
          severity: stored.severity,
          aiReason: stored.aiReason,
          status: stored.status,
          complaintType: stored.complaintType,
        });
      }
    }
    setLoaded(true);
  }, [complaintId]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6">
        <div className="card p-8">
          <p className="text-sm text-muted">Loading confirmation details…</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6">
        <div className="card p-8">
          <p className="text-4xl">🔎</p>
          <h1 className="mt-3 font-heading text-xl font-bold text-navy">Complaint not found</h1>
          <p className="mt-2 text-sm text-ink-soft">
            We could not find a complaint with ID <span className="font-mono font-bold">{complaintId}</span>.
          </p>
          <Link href="/complaint" className="btn-primary mt-5">File a Complaint</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="card overflow-hidden">
        {/* Acknowledgement banner */}
        <div className="border-b-2 border-green-600 bg-green-50 px-6 py-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
            ✓
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-green-800 sm:text-3xl">
            Complaint Submitted Successfully
          </h1>
          <p className="mt-2 text-sm text-green-700">
            Please save your Complaint ID for future status tracking.
          </p>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <div className="rounded border-2 border-navy bg-page-warm px-5 py-5 text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-muted">
              Your Complaint ID
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold tracking-wider text-navy sm:text-3xl">
              {complaint.complaintId}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-border bg-white px-4 py-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Complaint Type
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">
                {complaint.complaintType}
              </p>
            </div>
            <div className="rounded border border-border bg-white px-4 py-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Current Status
              </p>
              <p className="mt-1">
                <StatusBadge status={complaint.status} />
              </p>
            </div>
          </div>

          <div className="rounded border border-border bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Preliminary Priority Score
              </p>
              <PriorityBadge severity={complaint.severity} />
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-navy"
                style={{ width: `${Math.max(4, complaint.severity)}%` }}
              />
            </div>
          </div>

          <div className="notice">
            <p className="text-sm italic text-ink-soft">
              &ldquo;{complaint.aiReason}&rdquo;
            </p>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            This is a preliminary automated prioritization recommendation. It
            does not determine whether the complaint is genuine and does not
            replace official investigation or decisions by an authorized FDA
            officer.
          </p>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <Link href={`/my-complaints?id=${encodeURIComponent(complaint.complaintId)}`} className="btn-primary flex-1">
              Track Complaint
            </Link>
            <Link href="/" className="btn-outline flex-1">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
