import "server-only";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officers } from "@/db/schema";
import {
  DEMO_OFFICER_PASSWORD,
  DEMO_OFFICER_USERNAME,
} from "@/lib/constants";

let seeded = false;

/**
 * Creates the demo officer account (fdaofficer) on first use.
 * The password is stored as a bcrypt hash — never in plain text.
 * Existing complaints / accounts are never deleted on restart.
 */
export async function ensureDemoOfficer(): Promise<void> {
  if (seeded) return;

  const existing = await db
    .select({ id: officers.id })
    .from(officers)
    .where(eq(officers.username, DEMO_OFFICER_USERNAME))
    .limit(1);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(DEMO_OFFICER_PASSWORD, 10);
    await db
      .insert(officers)
      .values({ username: DEMO_OFFICER_USERNAME, passwordHash })
      .onConflictDoNothing();
  }

  seeded = true;
}
