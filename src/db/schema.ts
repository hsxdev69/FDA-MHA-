import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Citizen complaints submitted via the portal.
 */
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintId: text("complaint_id").notNull().unique(),
  complaintType: text("complaint_type").notNull(),
  description: text("description").notNull(),
  photoFilename: text("photo_filename"),
  photoMime: text("photo_mime"),
  // Photo stored as base64 text for portability; served only to
  // authenticated officers via /uploads/<filename>.
  photoData: text("photo_data"),
  location: text("location").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  severity: integer("severity").notNull().default(0),
  aiReason: text("ai_reason").notNull(),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Officer review audit trail — every time an officer reviews a case we store
 * the chosen status, their remarks and an optional supporting attachment.
 */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  complaintId: text("complaint_id").notNull(),
  status: text("status").notNull(),
  notes: text("notes").notNull().default(""),
  filename: text("filename"),
  mime: text("mime"),
  data: text("data"),
  officer: text("officer").notNull().default("fdaofficer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const officers = pgTable("officers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
