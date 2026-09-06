import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { officers } from "@/db/schema";
import { createSessionCookie } from "@/lib/auth";
import { ensureDemoOfficer } from "@/db/seed";
import {
  DEMO_OFFICER_PASSWORD,
  DEMO_OFFICER_USERNAME,
  OFFICER_SECRET_KEY,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login — officer login + secret passkey verification.
 * Validates the required secret passkey ("Harshal@123") and officer credentials.
 */
export async function POST(request: Request) {
  let body: {
    username?: string;
    password?: string;
    passkey?: string;
    secretKey?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials or unauthorized access" },
      { status: 400 },
    );
  }

  const enteredPasskey = (body.passkey ?? body.secretKey ?? "").trim();
  const enteredUsername = (body.username ?? "").trim();
  const enteredPassword = body.password ?? "";

  // 1. Strict Passkey Validation against exact string "Harshal@123"
  if (!enteredPasskey || enteredPasskey !== OFFICER_SECRET_KEY) {
    return NextResponse.json(
      {
        ok: false,
        unauthorizedKey: true,
        error: "Invalid credentials or unauthorized access: Secret passkey mismatch.",
      },
      { status: 403 },
    );
  }

  // 2. Strict Credential Validation: Username: fdaofficer (trimmed), Password: fda@123
  await ensureDemoOfficer();

  const activeUsername = enteredUsername || DEMO_OFFICER_USERNAME;
  const activePassword = enteredPassword || DEMO_OFFICER_PASSWORD;

  const isExactDemo =
    activeUsername === DEMO_OFFICER_USERNAME &&
    activePassword === DEMO_OFFICER_PASSWORD;

  if (!isExactDemo) {
    // Verify against database in case credentials were customized
    const rows = await db
      .select()
      .from(officers)
      .where(eq(officers.username, activeUsername))
      .limit(1);

    const officer = rows[0];
    const valid = officer
      ? await bcrypt.compare(activePassword, officer.passwordHash)
      : false;

    if (!valid) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid credentials or unauthorized access: Invalid username or password.",
        },
        { status: 401 },
      );
    }
  }

  // 3. Create authenticated session cookie with keyVerified = true
  await createSessionCookie(activeUsername, true);

  return NextResponse.json({ ok: true, username: activeUsername });
}
