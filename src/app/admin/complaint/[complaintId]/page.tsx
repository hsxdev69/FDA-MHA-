import ComplaintDetailsClient from "@/components/complaint-details-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "Complaint Details — Maha FDA" };

/**
 * Complaint details — no database access on the server.
 * The client component reads the case from localStorage.
 */
export default async function ComplaintDetailsPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const { complaintId } = await params;
  return (
    <ComplaintDetailsClient
      complaintId={complaintId}
      serverComplaint={null}
    />
  );
}
