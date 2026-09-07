import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase project credentials for Maha FDA Citizen Portal Email OTP.
 */
const DEFAULT_SUPABASE_URL = "https://mtucwfuyehhomecrpgpz.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dWN3ZnV5ZWhob21lY3JwZ3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTkyNDIsImV4cCI6MjEwNDI5NTI0Mn0.3k0Z0qJwFF9-llUq5E3Lv0wNJ6YEOZAmFdiXF7KH2EQ";

/**
 * Ensures the Supabase anon key is a valid JWT format.
 * If sentence casing turned 'eyJ...' into 'EyJ...', this normalizes it to
 * standard lowercase base64url 'eyJ' to prevent HTTP 401 Invalid API Key errors.
 */
function normalizeKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.startsWith("EyJ")) {
    return "e" + trimmed.slice(1);
  }
  return trimmed;
}

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY = normalizeKey(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
);

/**
 * Live Supabase client instance configured for citizen OTP verification.
 * Does not persist sessions in local storage or auto-refresh tokens.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Always returns the live Supabase client.
 */
export function getSupabase(): SupabaseClient {
  return supabase;
}

export const isSupabaseConfigured = true;

/** Maps common Supabase auth errors to citizen-friendly messages. */
export function friendlySupabaseError(message: string): string {
  const m = (message || "").toLowerCase();
  if (
    m.includes("rate limit") ||
    m.includes("too many requests") ||
    m.includes("over_email_send_rate_limit")
  ) {
    return "Too many attempts. Please wait a minute before requesting another code.";
  }
  if (m.includes("invalid email") || m.includes("email_address_invalid")) {
    return "That email address does not look valid. Please check and try again.";
  }
  if (
    m.includes("token has expired") ||
    m.includes("otp expired") ||
    m.includes("token_expired")
  ) {
    return "The verification code has expired. Please resend a new code.";
  }
  if (
    m.includes("invalid token") ||
    m.includes("token invalid") ||
    m.includes("otp invalid") ||
    m.includes("bad token")
  ) {
    return "The verification code is incorrect. Please check the 6 digits and try again.";
  }
  if (m.includes("email not confirmed")) {
    return "This email is not confirmed yet. Please verify with the 6-digit code sent to your inbox.";
  }
  return message || "Email verification failed. Please try again in a moment.";
}
