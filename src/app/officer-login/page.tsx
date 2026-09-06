import type { Metadata } from "next";
import OfficerLoginForm from "@/components/officer-login-form";

export const metadata: Metadata = {
  title: "Officer Login — Maha FDA",
  description: "Restricted login for authorized FDA officers.",
};

export default function OfficerLoginPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-6 border-l-4 border-saffron pl-4">
        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
          Restricted Access
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy">
          Officer Login
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          The Officer Complaint Dashboard is restricted to authorized officers.
          Please provide your credentials and the official secret passkey.
        </p>
      </div>

      <OfficerLoginForm />

      <div className="mt-5 notice notice-info text-xs">
        <p>
          <strong className="text-navy">Security notice:</strong> Sessions are
          protected with password hashing and signed HttpOnly session cookies.
          Production deployments additionally require HTTPS, CSRF protection,
          rate limiting and proper government identity verification.
        </p>
      </div>
    </div>
  );
}
