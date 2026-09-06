"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_OFFICER_PASSWORD,
  DEMO_OFFICER_USERNAME,
  OFFICER_SECRET_KEY,
} from "@/lib/constants";
import {
  getOfficerSession,
  setOfficerSession,
} from "@/lib/client-storage";

const STORAGE_KEY = "fda_officer_secret_verified";

export default function OfficerGatekeeper({
  serverAuthenticated,
  children,
}: {
  serverAuthenticated: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [verified, setVerified] = useState(serverAuthenticated);
  const [mounted, setMounted] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // 1. Check persistent localStorage officerAuth session first
    const session = getOfficerSession();
    if (session && session.loggedIn) {
      setVerified(true);
      return;
    }

    // 2. Check server cookie or sessionStorage
    if (serverAuthenticated) {
      setVerified(true);
      setOfficerSession({
        loggedIn: true,
        user: {
          username: DEMO_OFFICER_USERNAME,
          fullName: "FDA Chief Vigilance Officer",
          department: "Maharashtra State Vigilance HQ",
        },
      });
      return;
    }

    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "true") {
        setVerified(true);
      }
    } catch {
      // ignore
    }
  }, [serverAuthenticated]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setUnauthorizedMessage(null);
    const enteredPasskey = passkey.trim();

    if (!enteredPasskey || enteredPasskey !== OFFICER_SECRET_KEY) {
      setUnauthorizedMessage(
        "Invalid credentials or unauthorized access: Secret passkey mismatch."
      );
      setSubmitting(false);
      setTimeout(() => {
        router.push("/");
      }, 1600);
      return;
    }

    // Persist session in localStorage so officer never gets accidentally logged out
    setOfficerSession({
      loggedIn: true,
      user: {
        username: DEMO_OFFICER_USERNAME,
        fullName: "FDA Chief Vigilance Officer",
        department: "Maharashtra State Vigilance HQ",
      },
    });

    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: DEMO_OFFICER_USERNAME,
          password: DEMO_OFFICER_PASSWORD,
          passkey: enteredPasskey,
          secretKey: enteredPasskey,
        }),
      });
    } catch {
      // ignore
    }

    setUnauthorizedMessage(null);
    setVerified(true);
    setSubmitting(false);
    router.refresh();
  };

  if (verified) return <>{children}</>;

  // While checking localStorage on client mount, show a brief loading shell
  if (!mounted) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-muted">
        Verifying officer session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="card overflow-hidden shadow-sm">
        <div className="border-b-2 border-saffron bg-navy px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-saffron text-xl text-navy">
              🔒
            </span>
            <div>
              <h1 className="font-heading text-lg font-bold">Officer Security Gatekeeper</h1>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                Restricted FDA Section
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6" noValidate>
          <p className="text-sm leading-relaxed text-ink-soft">
            This dashboard is restricted to authorized Maharashtra FDA officers.
            Please enter your officer secret passkey to access the dashboard.
          </p>

          {unauthorizedMessage && (
            <div role="alert" className="notice notice-danger">
              <p className="font-bold">⚠️ {unauthorizedMessage}</p>
            </div>
          )}

          <div>
            <label htmlFor="passkey-gate" className="label">
              Secret Passkey <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id="passkey-gate"
                name="passkey"
                type={showKey ? "text" : "password"}
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value);
                  setUnauthorizedMessage(null);
                }}
                placeholder="Enter secret passkey"
                required
                autoFocus
                autoComplete="off"
                className="input pr-20 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border-strong bg-page-warm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy transition hover:bg-white"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5">
              {submitting ? "Verifying…" : "Unlock Officer Dashboard"}
            </button>
            <button type="button" onClick={() => router.push("/")} className="btn-outline py-2.5">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
