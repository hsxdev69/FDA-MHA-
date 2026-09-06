import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officers } from "@/db/schema";
import { OFFICER_SECRET_KEY } from "@/lib/constants";

/**
 * Authorizes an officer request either via:
 *  1. a valid signed session cookie, OR
 *  2. the x-officer-secret header ("Harshal@123").
 *
 * Used by the case-review / status-update endpoints so the form submission
 * works reliably across embedded preview frames.
 */
export async function isAuthorizedOfficer(request: Request): Promise<boolean> {
  const secretHeader = request.headers.get("x-officer-secret");
  if (secretHeader === OFFICER_SECRET_KEY) {
    return true;
  }
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const token = store.get("fda_officer_session")?.value;
    if (!token) return false;
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET ??
        "maha-fda-prototype-local-secret-do-not-use-in-prod",
    );
    const { payload } = await jwtVerify(token, secret);
    return payload.sub === "fdaofficer" || typeof payload.sub === "string";
  } catch {
    return false;
  }
}

/** Resolves which officer username is acting, for the audit trail. */
export async function getReviewingOfficer(): Promise<string> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const token = store.get("fda_officer_session")?.value;
    if (token) {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(
        process.env.SESSION_SECRET ??
          "maha-fda-prototype-local-secret-do-not-use-in-prod",
      );
      const { payload } = await jwtVerify(token, secret);
      if (typeof payload.sub === "string" && payload.sub) return payload.sub;
    }
  } catch {
    // fall through
  }
  return "fdaofficer";
}
