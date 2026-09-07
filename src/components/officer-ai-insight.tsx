"use client";

import { memo } from "react";
import type { StoredComplaint } from "@/lib/client-storage";
import { FraudRiskBadge, PriorityBadge } from "@/components/badges";

/**
 * Officer-only AI vision insight panel.
 * Shown inside the Case Review Modal and the Complaint Detail view.
 * Shows 3 structured sections:
 *   1. Authenticity & Verification Reason
 *   2. Recommended Action
 *   3. Duplicate / Evidence Check flag
 */
const OfficerAIInsight = memo(function OfficerAIInsight({
  complaint,
}: {
  complaint: Pick<
    StoredComplaint,
    | "complaintId"
    | "authenticityScore"
    | "priorityLevel"
    | "fraudRisk"
    | "isLikelyFake"
    | "aiReasoning"
    | "officerNote"
    | "recommendedAction"
    | "linkedCaseId"
  >;
}) {
  const hasOfficerDetail =
    Boolean(complaint.officerNote) || Boolean(complaint.recommendedAction);

  return (
    <div className="space-y-3">
      {/* ── Header badges ── */}
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge severity={complaint.authenticityScore} />
        <FraudRiskBadge
          risk={complaint.fraudRisk}
          isLikelyFake={complaint.isLikelyFake}
        />
        <span className="font-mono text-[11px] text-muted">
          Authenticity {complaint.authenticityScore}%
        </span>
      </div>

      {/* Section 1 — Authenticity & Verification Reason */}
      <div className="rounded border border-border bg-page-warm p-3">
        <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-navy">
          a) Authenticity &amp; Verification Reason
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          {complaint.officerNote || complaint.aiReasoning || "No AI analysis available."}
        </p>
      </div>

      {/* Section 2 — Recommended Action */}
      {complaint.recommendedAction && (
        <div
          className={`rounded border p-3 text-sm font-semibold leading-relaxed ${
            complaint.recommendedAction.startsWith("🔴")
              ? "border-red-300 bg-red-50 text-red-800"
              : complaint.recommendedAction.startsWith("🟡")
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-green-300 bg-green-50 text-green-800"
          }`}
        >
          <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider opacity-80">
            b) Recommended Action
          </p>
          {complaint.recommendedAction}
        </div>
      )}

      {/* Section 3 — Duplicate / Evidence Check */}
      {complaint.linkedCaseId ? (
        <div className="rounded border border-amber-400 bg-amber-50 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">
            c) Duplicate &amp; Evidence Check
          </p>
          <p className="text-sm font-semibold text-amber-900">
            ⚠️ Possible duplicate of Case{" "}
            <a
              href={`/admin/complaint/${complaint.linkedCaseId}`}
              className="underline hover:no-underline"
            >
              {complaint.linkedCaseId}
            </a>{" "}
            — Same location &amp; product pattern detected.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Review both cases before scheduling a separate field visit. Consider linking or merging.
          </p>
        </div>
      ) : (
        <div className="rounded border border-green-300 bg-green-50 px-3 py-2.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-green-900 mb-1">
            c) Duplicate &amp; Evidence Check
          </p>
          <p className="text-sm text-green-800">
            ✅ No duplicate pattern found for this establishment and product.
          </p>
        </div>
      )}

      {!hasOfficerDetail && (
        <p className="text-xs text-muted">
          Detailed AI officer notes are generated when the complaint is submitted
          with an evidence photo. Re-run analysis from the Review modal if needed.
        </p>
      )}
    </div>
  );
});

export default OfficerAIInsight;
