import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /officer-logout — clears the session and returns to the login page.
 * (Mirrors the Flask /officer-logout route.)
 */
export async function GET() {
  await clearSessionCookie();
  redirect("/officer-login");
}
