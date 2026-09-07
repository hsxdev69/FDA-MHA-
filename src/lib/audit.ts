"use client";

export interface AuditEntry {
  id: string;
  timestamp: string;
  officerName: string;
  action: string;
  complaintId: string;
}

const KEY = "mahafda_audit_logs";

export function getAuditLogs(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendAuditLog(entry: Omit<AuditEntry, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const logs = getAuditLogs();
    const next: AuditEntry = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    localStorage.setItem(KEY, JSON.stringify([next, ...logs].slice(0, 500)));
    window.dispatchEvent(new Event("mahafda_audit_updated"));
  } catch {
    // ignore quota
  }
}
