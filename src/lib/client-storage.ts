"use client";

import { analyzePriority } from "@/lib/priority";
import {
  DEMO_OFFICER_PASSWORD,
  DEMO_OFFICER_USERNAME,
  OFFICER_SECRET_KEY,
} from "@/lib/constants";

export interface StoredReview {
  status: string;
  notes: string;
  officer: string;
  createdAt: string;
  filename: string | null;
}

export interface StoredComplaint {
  id: number;
  complaintId: string;
  complaintType: string;
  description: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  name: string;
  mobile: string;
  email: string | null;
  photoData: string | null; // Base64 Data URI (data:image/...)
  photoMime: string | null;
  photoFilename: string | null;
  severity: number;
  aiReason: string;
  status: string;
  createdAt: string;
  reviews: StoredReview[];
}

export interface OfficerAccount {
  fullName: string;
  username: string;
  department: string;
  password: string;
  createdAt: string;
}

export interface OfficerAuthSession {
  loggedIn: boolean;
  user: {
    username: string;
    fullName: string;
    department: string;
  };
}

const COMPLAINTS_KEY = "mahafda_complaints";
const OFFICERS_KEY = "mahafda_officers";
const OFFICER_AUTH_KEY = "officerAuth";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Generates a unique Complaint ID in format FDA-MH-XXXXXXXX
 */
export function generateComplaintId(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const ts = Date.now().toString(36).slice(-2).toUpperCase();
  return `FDA-MH-${code}${ts}`;
}

/**
 * Retrieves all complaints from localStorage.
 */
export function getStoredComplaints(): StoredComplaint[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves the complaints list to localStorage and dispatches a storage event.
 */
export function saveStoredComplaints(list: StoredComplaint[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("mahafda_complaints_updated"));
  } catch (err) {
    console.error("Failed to save complaints to localStorage:", err);
  }
}

/**
 * Finds a single complaint by its Complaint ID (case-insensitive).
 */
export function getStoredComplaintById(complaintId: string): StoredComplaint | null {
  const clean = complaintId.trim().toUpperCase();
  const list = getStoredComplaints();
  return list.find((c) => c.complaintId.toUpperCase() === clean) ?? null;
}

/**
 * Creates and persists a new complaint in localStorage.
 */
export function createStoredComplaint(input: {
  complaintType: string;
  description: string;
  location: string;
  latitude?: string;
  longitude?: string;
  name: string;
  mobile: string;
  email?: string;
  photoDataUrl?: string | null;
  photoFilename?: string | null;
}): StoredComplaint {
  const list = getStoredComplaints();
  const complaintId = generateComplaintId();

  let analysis = { severity: 50, reason: "Preliminary review pending." };
  try {
    const res = analyzePriority(input.complaintType, input.description);
    analysis = { severity: res.severity, reason: res.reason };
  } catch {
    // fallback
  }

  let photoData: string | null = null;
  let photoMime: string | null = null;

  if (input.photoDataUrl && input.photoDataUrl.startsWith("data:")) {
    photoData = input.photoDataUrl;
    const match = input.photoDataUrl.match(/^data:([^;]+);base64,/);
    photoMime = match ? match[1] : "image/jpeg";
  }

  const newRecord: StoredComplaint = {
    id: Date.now(),
    complaintId,
    complaintType: input.complaintType,
    description: input.description.trim(),
    location: input.location.trim(),
    latitude: input.latitude?.trim() || null,
    longitude: input.longitude?.trim() || null,
    name: input.name.trim(),
    mobile: input.mobile.trim(),
    email: input.email?.trim() || null,
    photoData,
    photoMime,
    photoFilename: input.photoFilename || null,
    severity: analysis.severity,
    aiReason: analysis.reason,
    status: "Pending",
    createdAt: new Date().toISOString(),
    reviews: [],
  };

  const updated = [newRecord, ...list];
  saveStoredComplaints(updated);
  return newRecord;
}

/**
 * Adds an officer review and updates the status of a complaint in localStorage.
 */
export function addStoredReview(
  complaintId: string,
  review: {
    status: string;
    notes: string;
    officer: string;
    filename?: string | null;
  },
): StoredComplaint | null {
  const list = getStoredComplaints();
  const idx = list.findIndex(
    (c) => c.complaintId.toUpperCase() === complaintId.trim().toUpperCase(),
  );
  if (idx === -1) return null;

  const newReview: StoredReview = {
    status: review.status,
    notes: review.notes.trim(),
    officer: review.officer,
    createdAt: new Date().toISOString(),
    filename: review.filename || null,
  };

  const updatedComplaint: StoredComplaint = {
    ...list[idx],
    status: review.status,
    reviews: [newReview, ...(list[idx].reviews || [])],
  };

  list[idx] = updatedComplaint;
  saveStoredComplaints(list);
  return updatedComplaint;
}

/**
 * Updates only the status of a complaint in localStorage.
 */
export function updateStoredComplaintStatus(
  complaintId: string,
  status: string,
): StoredComplaint | null {
  const list = getStoredComplaints();
  const idx = list.findIndex(
    (c) => c.complaintId.toUpperCase() === complaintId.trim().toUpperCase(),
  );
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    status,
  };
  saveStoredComplaints(list);
  return list[idx];
}

/**
 * Checks whether a case status represents a completed / closed case.
 * Only completed cases can be deleted.
 */
export function isCaseCompleted(status: string): boolean {
  const s = (status || "").trim().toLowerCase();
  return (
    s === "resolved" ||
    s === "disposed" ||
    s === "completed" ||
    s === "rejected"
  );
}

/**
 * Permanently removes a complaint from localStorage by Complaint ID.
 */
export function deleteStoredComplaint(complaintId: string): boolean {
  if (!isBrowser()) return false;
  const list = getStoredComplaints();
  const clean = complaintId.trim().toUpperCase();
  const updated = list.filter((c) => c.complaintId.toUpperCase() !== clean);
  if (updated.length === list.length) return false;
  saveStoredComplaints(updated);
  return true;
}

// ============================================================
// OFFICER ACCOUNTS & PERSISTENT AUTHENTICATION
// ============================================================

export function getRegisteredOfficers(): OfficerAccount[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(OFFICERS_KEY);
    const defaultOfficer: OfficerAccount = {
      fullName: "FDA Chief Vigilance Officer",
      username: DEMO_OFFICER_USERNAME,
      department: "Maharashtra State Vigilance HQ",
      password: DEMO_OFFICER_PASSWORD,
      createdAt: new Date().toISOString(),
    };
    if (!raw) {
      localStorage.setItem(OFFICERS_KEY, JSON.stringify([defaultOfficer]));
      return [defaultOfficer];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [defaultOfficer];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function registerOfficerAccount(account: {
  fullName: string;
  username: string;
  department: string;
  password: string;
  passkey: string;
}): { ok: boolean; error?: string; user?: OfficerAccount } {
  const cleanPasskey = account.passkey.trim();
  if (cleanPasskey !== OFFICER_SECRET_KEY) {
    return {
      ok: false,
      error: "Invalid credentials or unauthorized access: Secret passkey mismatch.",
    };
  }

  const cleanUsername = account.username.trim();
  const cleanName = account.fullName.trim();
  const cleanDept = account.department.trim();

  if (!cleanName || !cleanUsername || !cleanDept || !account.password) {
    return {
      ok: false,
      error: "All officer registration fields are required.",
    };
  }

  const officers = getRegisteredOfficers();
  const exists = officers.some(
    (o) => o.username.toLowerCase() === cleanUsername.toLowerCase(),
  );
  if (exists) {
    return {
      ok: false,
      error: `Officer ID / Username "${cleanUsername}" is already registered.`,
    };
  }

  const newOfficer: OfficerAccount = {
    fullName: cleanName,
    username: cleanUsername,
    department: cleanDept,
    password: account.password,
    createdAt: new Date().toISOString(),
  };

  const updated = [...officers, newOfficer];
  if (isBrowser()) {
    localStorage.setItem(OFFICERS_KEY, JSON.stringify(updated));
  }

  return { ok: true, user: newOfficer };
}

export function authenticateOfficer(input: {
  username: string;
  password: string;
  passkey: string;
}): { ok: boolean; error?: string; session?: OfficerAuthSession } {
  const cleanPasskey = input.passkey.trim();
  const cleanUsername = input.username.trim();
  const password = input.password;

  if (cleanPasskey !== OFFICER_SECRET_KEY) {
    return {
      ok: false,
      error: "Invalid credentials or unauthorized access: Secret passkey mismatch.",
    };
  }

  const officers = getRegisteredOfficers();
  const matched = officers.find(
    (o) =>
      o.username.toLowerCase() === cleanUsername.toLowerCase() &&
      o.password === password,
  );

  // Also allow default demo credentials explicitly
  const isDefaultDemo =
    cleanUsername === DEMO_OFFICER_USERNAME &&
    password === DEMO_OFFICER_PASSWORD;

  if (!matched && !isDefaultDemo) {
    return {
      ok: false,
      error: "Invalid credentials or unauthorized access: Invalid username or password.",
    };
  }

  const session: OfficerAuthSession = {
    loggedIn: true,
    user: {
      username: matched?.username ?? DEMO_OFFICER_USERNAME,
      fullName: matched?.fullName ?? "FDA Chief Vigilance Officer",
      department: matched?.department ?? "Maharashtra State Vigilance HQ",
    },
  };

  setOfficerSession(session);
  return { ok: true, session };
}

export function setOfficerSession(session: OfficerAuthSession): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(OFFICER_AUTH_KEY, JSON.stringify(session));
    sessionStorage.setItem("fda_officer_secret_verified", "true");
    window.dispatchEvent(new Event("officer_auth_updated"));
  } catch (err) {
    console.error("Failed to save officer session:", err);
  }
}

export function getOfficerSession(): OfficerAuthSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(OFFICER_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.loggedIn === true && parsed.user?.username) {
      return parsed as OfficerAuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearOfficerSession(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(OFFICER_AUTH_KEY);
    sessionStorage.removeItem("fda_officer_secret_verified");
    window.dispatchEvent(new Event("officer_auth_updated"));
  } catch {
    // ignore
  }
}
