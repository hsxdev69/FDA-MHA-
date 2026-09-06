import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import SuccessClient from "@/components/success-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Complaint Submitted — Maha FDA" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6">
        <div className="card p-8">
          <p className="text-4xl">❓</p>
          <h1 className="mt-3 font-heading text-xl font-bold text-navy">Complaint ID missing</h1>
          <p className="mt-2 text-sm text-ink-soft">No Complaint ID was provided on this page.</p>
          <Link href="/complaint" className="btn-primary mt-5">File a Complaint</Link>
        </div>
      </div>
    );
  }

  let serverComplaint = null;
  try {
    const rows = await db
      .select({
        complaintId: complaints.complaintId,
        severity: complaints.severity,
        aiReason: complaints.aiReason,
        status: complaints.status,
        complaintType: complaints.complaintType,
      })
      .from(complaints)
      .where(eq(complaints.complaintId, id.trim().toUpperCase()))
      .limit(1);

    if (rows.length > 0) {
      serverComplaint = rows[0];
    }
  } catch {
    // fallback to client localStorage in SuccessClient
  }

  return <SuccessClient complaintId={id} serverComplaint={serverComplaint} />;
}
