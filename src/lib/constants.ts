/**
 * Client-safe shared constants for the Maha FDA prototype portal.
 * (This file must never import server-only modules.)
 */

export const COMPLAINT_TYPES = [
  "Expired Food",
  "Adulterated Food",
  "Unsafe Food",
  "Spurious Drug",
  "Drug Quality Issue",
  "Unlicensed Sale",
  "Misbranded Product",
  "Other FDA Violation",
] as const;

export const ALLOWED_STATUSES = [
  "Pending",
  "Under Review",
  "Under Investigation",
  "Action Taken",
  "Approved",
  "Rejected",
  "Resolved",
] as const;

export type ComplaintStatus = (typeof ALLOWED_STATUSES)[number];

export const ALLOWED_PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const ALLOWED_PHOTO_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** 5 MB maximum photo size. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Demo officer credentials for the prototype (documented in README too). */
export const DEMO_OFFICER_USERNAME = "fdaofficer";
export const DEMO_OFFICER_PASSWORD = "fda@123";

/** Required secret passkey gatekeeper for Officer Dashboard access. */
export const OFFICER_SECRET_KEY = "Harshal@123";

export const STATUS_ORDER: ComplaintStatus[] = [
  "Pending",
  "Under Review",
  "Action Taken",
  "Resolved",
];
