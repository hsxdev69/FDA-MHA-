"use client";

import { memo } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { FraudRiskBadge, PriorityBadge, StatusBadge } from "@/components/badges";
import EvidenceThumbnail from "@/components/evidence-thumbnail";
import ReviewButton from "@/components/review-button";
import SlaBadge from "@/components/sla-badge";
import { DEFAULT_OFFICERS } from "@/lib/maharashtra-districts";
import type { StoredComplaint } from "@/lib/client-storage";

/** Memoised KPI card — re-renders only when its own value changes. */
export const KpiCard = memo(function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`card overflow-hidden ${accent}`}>
      <div className="px-4 py-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] opacity-90">
          {label}
        </p>
        <p className="mt-1 font-heading text-3xl font-bold leading-none">{value}</p>
      </div>
    </div>
  );
});

export interface CaseRowProps {
  row: StoredComplaint;
  canDelete: boolean;
  onDelete: (row: StoredComplaint) => void;
  onReassign: (complaintId: string, officer: string) => void;
  onLink: (complaintId: string, linkedId: string) => void;
}

/**
 * Memoised table row. Comparator keeps rows static unless the fields the row
 * actually renders have changed — this removes list-wide re-render lag.
 */
export const CaseRow = memo(
  function CaseRow({ row, canDelete, onDelete, onReassign, onLink }: CaseRowProps) {
    const thumbUri = row.photoData
      ? row.photoData.startsWith("data:")
        ? row.photoData
        : `data:${row.photoMime || "image/jpeg"};base64,${row.photoData}`
      : null;

    return (
      <tr>
        <td>
          <Link
            href={`/admin/complaint/${row.complaintId}`}
            prefetch={false}
            className="font-mono text-xs font-bold text-navy hover:underline"
          >
            {row.complaintId}
          </Link>
          {row.linkedCaseId && (
            <p className="mt-1 rounded border border-amber-500 bg-amber-50 px-1.5 py-1 text-[10px] font-semibold text-amber-900">
              ⚠️ Similar complaint detected (Case ID: {row.linkedCaseId}){" "}
              <button
                type="button"
                className="underline"
                onClick={() => onLink(row.complaintId, row.linkedCaseId as string)}
              >
                Link/Merge
              </button>
            </p>
          )}
        </td>
        <td className="font-semibold text-ink">{row.category || row.complaintType}</td>
        <td>
          <EvidenceThumbnail src={thumbUri} complaintId={row.complaintId} size={44} />
        </td>
        <td className="max-w-[160px] truncate" title={row.location}>
          {row.district || row.location}
        </td>
        <td>
          <PriorityBadge severity={row.severity} />
        </td>
        <td>
          <FraudRiskBadge risk={row.fraudRisk} isLikelyFake={row.isLikelyFake} />
        </td>
        <td>
          <div className="max-w-[240px] space-y-1.5">
            {/* Officer note is the primary source; aiReasoning is citizen-facing fallback */}
            <p className="truncate text-xs text-muted" title={row.officerNote || row.aiReasoning || row.aiReason}>
              {row.officerNote || row.aiReasoning || row.aiReason}
            </p>
            {row.recommendedAction && (
              <p
                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  row.recommendedAction.startsWith("🔴")
                    ? "bg-red-100 text-red-800"
                    : row.recommendedAction.startsWith("🟡")
                      ? "bg-amber-100 text-amber-900"
                      : "bg-green-100 text-green-800"
                }`}
                title={row.recommendedAction}
              >
                {row.recommendedAction.split(":")[0]}
              </p>
            )}
            {row.linkedCaseId && (
              <p className="text-[10px] font-semibold text-amber-800">
                ⚠️ Possible duplicate of {row.linkedCaseId}
              </p>
            )}
          </div>
        </td>
        <td>
          <div className="space-y-1">
            <StatusBadge status={row.status} />
            <SlaBadge complaint={row} />
          </div>
        </td>
        <td className="whitespace-nowrap font-mono text-[11px] text-muted">
          {formatDate(row.createdAt)}
        </td>
        <td>
          <div className="flex flex-col gap-1.5">
            <ReviewButton
              complaintId={row.complaintId}
              initialStatus={row.status}
              lastReview={row.reviews?.[0] ?? null}
              vision={{
                authenticityScore: row.authenticityScore,
                priorityLevel: row.priorityLevel,
                isLikelyFake: row.isLikelyFake,
                fraudRisk: row.fraudRisk,
                aiReasoning: row.aiReasoning || row.aiReason,
                officerNote: row.officerNote,
                recommendedAction: row.recommendedAction,
                linkedCaseId: row.linkedCaseId,
              }}
            />
            <select
              className="input !px-1 !py-1 text-[10px]"
              value={row.assignedOfficer || "fdaofficer"}
              onChange={(e) => onReassign(row.complaintId, e.target.value)}
            >
              {DEFAULT_OFFICERS.map((o) => (
                <option key={o.username} value={o.username}>
                  {o.fullName}
                </option>
              ))}
            </select>
            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete(row)}
                className="rounded border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 active:scale-[0.98]"
              >
                🗑️ Delete
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Case must be completed before deletion."
                className="cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] text-slate-400"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  },
  (prev, next) =>
    prev.row.complaintId === next.row.complaintId &&
    prev.row.status === next.row.status &&
    prev.row.severity === next.row.severity &&
    prev.row.assignedOfficer === next.row.assignedOfficer &&
    prev.row.linkedCaseId === next.row.linkedCaseId &&
    prev.row.photoData === next.row.photoData &&
    prev.canDelete === next.canDelete,
);
