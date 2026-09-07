import type { StoredComplaint } from "@/lib/client-storage";
import type { VisionPriority } from "@/lib/vision";

const HOUR = 60 * 60 * 1000;

export function slaHoursForPriority(priority?: VisionPriority | string, severity = 50): number {
  const p = String(priority || "").toLowerCase();
  if (p === "critical" || p === "high" || severity >= 70) return 24;
  if (p === "medium" || severity >= 40) return 72;
  return 24 * 7;
}

export function slaDeadline(complaint: StoredComplaint): Date {
  const start = new Date(complaint.createdAt).getTime();
  const hours = slaHoursForPriority(complaint.priorityLevel, complaint.severity);
  return new Date(start + hours * HOUR);
}

export function slaStatus(complaint: StoredComplaint): {
  remainingMs: number;
  breached: boolean;
  label: string;
  closed: boolean;
} {
  const closed = ["Resolved", "Disposed", "Completed", "Rejected", "Approved"].includes(
    complaint.status,
  );
  const remainingMs = slaDeadline(complaint).getTime() - Date.now();
  const breached = !closed && remainingMs <= 0;
  if (closed) {
    return { remainingMs, breached: false, label: "Closed", closed: true };
  }
  if (breached) {
    const overdueH = Math.max(1, Math.round(Math.abs(remainingMs) / HOUR));
    return { remainingMs, breached: true, label: `SLA Breached · ${overdueH}h overdue`, closed: false };
  }
  const hours = remainingMs / HOUR;
  const label =
    hours >= 48
      ? `⏱ ${Math.round(hours / 24)}d remaining`
      : `⏱ ${Math.max(1, Math.round(hours))}h remaining`;
  return { remainingMs, breached: false, label, closed: false };
}
