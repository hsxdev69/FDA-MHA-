import { db, isDatabaseConfigured } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // App is healthy even without PostgreSQL — citizen/officer data lives in
  // localStorage. Probe the DB only when DATABASE_URL is actually set.
  if (!isDatabaseConfigured) {
    return Response.json({ ok: true, db: "optional-unavailable" });
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "ok" });
  } catch {
    // Still report healthy so deploys without a live DB can serve the UI.
    return Response.json({ ok: true, db: "unreachable" });
  }
}
