import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

const SESSION_COOKIE = "fda_officer_session";
const SESSION_HOURS = 8;

/**
 * Prototype-only fallback secret. In a real deployment SESSION_SECRET must be
 * provided via environment variables (never hard-code secrets).
 */
const DEV_FALLBACK_SECRET = "maha-fda-prototype-local-secret-do-not-use-in-prod";

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? DEV_FALLBACK_SECRET);
}

export async function createSessionCookie(
  username: string,
  keyVerified: boolean = true,
): Promise<void> {
  const token = await new SignJWT({ sub: username, keyVerified })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecretKey());

  const store = await cookies();
  let isHttps = false;
  try {
    const hdrs = await headers();
    const proto = hdrs.get("x-forwarded-proto") ?? "";
    isHttps = proto.includes("https");
  } catch {
    isHttps = false;
  }

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export interface OfficerSessionInfo {
  username: string | null;
  keyVerified: boolean;
}

export async function getSessionInfo(): Promise<OfficerSessionInfo> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return { username: null, keyVerified: false };

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const username = typeof payload.sub === "string" ? payload.sub : null;
    const keyVerified = payload.keyVerified === true;
    return { username, keyVerified };
  } catch {
    return { username: null, keyVerified: false };
  }
}

export async function getSessionUsername(): Promise<string | null> {
  const info = await getSessionInfo();
  return info.username && info.keyVerified ? info.username : null;
}

/**
 * Checks whether the officer session is active and secret-key verified.
 * Used by server components/APIs.
 */
export async function requireOfficer(): Promise<string> {
  const info = await getSessionInfo();
  if (!info.username || !info.keyVerified) {
    redirect("/officer-login");
  }
  return info.username;
}
