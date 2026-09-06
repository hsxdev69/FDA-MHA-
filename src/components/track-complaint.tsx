"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/format";
import { STATUS_ORDER } from "@/lib/constants";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { useLanguage } from "@/context/language-context";
import { getStoredComplaintById } from "@/lib/client-storage";

interface TrackResult {
  complaintId: string;
  complaintType: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  severity: number;
  aiReason: string;
  status: string;
}

export default function TrackComplaint() {
  const searchParams = useSearchParams();
  const initialId = searchParams?.get("id") ?? "";

  const [complaintId, setComplaintId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const { t } = useLanguage();

  const steps = [
    t.stageSubmitted,
    t.stageReview,
    t.stageAction,
    t.stageResolved,
  ];

  const performLookup = async (idToSearch: string) => {
    const clean = idToSearch.trim().toUpperCase();
    if (!clean) {
      setError("Please enter a Complaint ID.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    // 1. Check localStorage first
    const localMatch = getStoredComplaintById(clean);
    if (localMatch) {
      setResult({
        complaintId: localMatch.complaintId,
        complaintType: localMatch.complaintType,
        location: localMatch.location,
        latitude: localMatch.latitude,
        longitude: localMatch.longitude,
        createdAt: localMatch.createdAt,
        severity: localMatch.severity,
        aiReason: localMatch.aiReason,
        status: localMatch.status,
      });
      setLoading(false);
      return;
    }

    // 2. Fallback to backend API
    try {
      const response = await fetch(`/api/track?id=${encodeURIComponent(clean)}`);
      const data = await response.json().catch(() => null);
      if (response.ok && data?.complaintId) {
        setResult(data as TrackResult);
      } else {
        setError(typeof data?.error === "string" ? data.error : "Complaint ID not found.");
      }
    } catch {
      setError("Complaint ID not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      performLookup(initialId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performLookup(complaintId);
  };

  const statusIndex = result
    ? Math.max(0, STATUS_ORDER.indexOf(result.status as (typeof STATUS_ORDER)[number]))
    : 0;
  const doneCount = result ? Math.min(statusIndex + 1, steps.length) : 1;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="track-id" className="label">{t.complaintIdLabel}</label>
          <input
            id="track-id"
            type="text"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            placeholder="e.g. FDA-MH-8X9K2M1A"
            className="input font-mono uppercase tracking-wider"
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Searching…" : t.trackBtn}
        </button>
      </form>

      {error && (
        <div role="alert" className="notice notice-danger">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {result && (
        <div className="card overflow-hidden">
          <div className="border-b-2 border-saffron bg-page-warm px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {t.complaintIdLabel}
                </p>
                <p className="mt-1 font-mono text-xl font-bold tracking-wider text-navy">{result.complaintId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge severity={result.severity} />
                <StatusBadge status={result.status} />
              </div>
            </div>
          </div>

          <div className="p-6">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Complaint Type
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{result.complaintType}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Filed On
                </dt>
                <dd className="mt-1 text-sm font-medium text-ink-soft">{formatDate(result.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Location
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">
                  {result.location}
                  {result.latitude && result.longitude && (
                    <>
                      {" · "}
                      <a href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`} target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">
                        View on Google Maps ↗
                      </a>
                    </>
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-7 border-t border-border pt-6">
              <p className="mb-5 font-heading text-sm font-bold text-navy">{t.progressTitle}</p>
              <ol className="space-y-0">
                {steps.map((step, index) => {
                  const isDone = index < doneCount;
                  const isCurrent = index === doneCount - 1 && result.status !== "Resolved";
                  const isLast = index === steps.length - 1;
                  return (
                    <li key={step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            isDone
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-border-strong bg-white text-muted-dim"
                          } ${isCurrent ? "ring-4 ring-green-200" : ""}`}
                        >
                          {isDone ? "✓" : index + 1}
                        </span>
                        {!isLast && (
                          <span className={`h-6 w-0.5 ${index < doneCount - 1 ? "bg-green-600" : "bg-border-strong"}`} />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className={`text-sm font-semibold ${isDone ? "text-navy" : "text-muted-dim"}`}>
                          {step}
                        </p>
                        {isCurrent && (
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-green-700">
                            {t.currentStage}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="notice notice-info">
              <p className="text-sm">
                <strong className="text-navy">Preliminary AI priority:</strong>{" "}
                {result.severity}/100 — {result.aiReason} This is a preliminary
                recommendation only and is subject to official verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
