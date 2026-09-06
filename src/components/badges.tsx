import { PRIORITY_META, priorityCategory } from "@/lib/priority";

const PRIORITY_CLASSES: Record<string, string> = {
  HIGH: "border-red-600 bg-red-50 text-red-700",
  MEDIUM: "border-amber-500 bg-amber-50 text-amber-700",
  LOW: "border-green-600 bg-green-50 text-green-700",
};

const STATUS_CLASSES: Record<string, string> = {
  Pending: "border-slate-400 bg-slate-50 text-slate-700",
  "Under Review": "border-amber-500 bg-amber-50 text-amber-700",
  "Under Investigation": "border-orange-500 bg-orange-50 text-orange-700",
  "Action Taken": "border-blue-500 bg-blue-50 text-blue-700",
  Approved: "border-emerald-600 bg-emerald-50 text-emerald-700",
  Rejected: "border-red-600 bg-red-50 text-red-700",
  Resolved: "border-green-600 bg-green-50 text-green-700",
};

export function PriorityBadge({ severity }: { severity: number }) {
  const category = priorityCategory(severity);
  const meta = PRIORITY_META[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_CLASSES[category]}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      <span className="uppercase tracking-wide">{meta.label}</span>
      <span className="font-mono text-[11px] opacity-80">({severity}%)</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const classes = STATUS_CLASSES[status] ?? STATUS_CLASSES.Pending;
  return (
    <span
      className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}
