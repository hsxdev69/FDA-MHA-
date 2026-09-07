"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { OFFICER_SECRET_KEY } from "@/lib/constants";
import {
  authenticateOfficer,
  getOfficerSession,
  registerOfficerAccount,
  setOfficerSession,
} from "@/lib/client-storage";

export default function OfficerLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign In fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passkey, setPasskey] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);

  // Sign Up fields
  const [fullName, setFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [department, setDepartment] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasskey, setRegPasskey] = useState("");
  const [showRegPasskey, setShowRegPasskey] = useState(false);

  // Status & errors
  const [error, setError] = useState("");
  const [unauthorizedAlert, setUnauthorizedAlert] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    const existing = getOfficerSession();
    if (existing && existing.loggedIn) {
      window.location.href = "/admin";
    }
  }, []);

  const clearAlerts = () => {
    setError("");
    setUnauthorizedAlert("");
    setSuccessMsg("");
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return; // guard against double-submit
    clearAlerts();
    setLoading(true);

    const enteredUsername = username.trim();
    const enteredPassword = password;
    const enteredPasskey = passkey.trim();

    if (!enteredUsername || !enteredPassword || !enteredPasskey) {
      setError("Invalid credentials or unauthorized access: All fields are required.");
      setLoading(false);
      return;
    }

    if (enteredPasskey !== OFFICER_SECRET_KEY) {
      setUnauthorizedAlert("Invalid credentials or unauthorized access: Secret passkey mismatch.");
      setLoading(false);
      return;
    }

    // Validate against localStorage officers (or default demo account)
    const authRes = authenticateOfficer({
      username: enteredUsername,
      password: enteredPassword,
      passkey: enteredPasskey,
    });

    if (!authRes.ok) {
      setError(authRes.error || "Invalid credentials or unauthorized access");
      setLoading(false);
      return;
    }

    // Best-effort sync with server cookie (ignore any failure)
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: enteredUsername,
          password: enteredPassword,
          passkey: enteredPasskey,
          secretKey: enteredPasskey,
        }),
      });
    } catch {
      // ignore
    }

    window.location.href = "/admin";
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return; // guard against double-submit
    clearAlerts();
    setLoading(true);

    const enteredName = fullName.trim();
    const enteredUsername = regUsername.trim();
    const enteredDept = department.trim();
    const enteredPassword = regPassword;
    const enteredPasskey = regPasskey.trim();

    if (!enteredName || !enteredUsername || !enteredDept || !enteredPassword || !enteredPasskey) {
      setError("All officer registration fields are required.");
      setLoading(false);
      return;
    }

    if (enteredPasskey !== OFFICER_SECRET_KEY) {
      setUnauthorizedAlert("Invalid credentials or unauthorized access: Secret passkey mismatch.");
      setLoading(false);
      return;
    }

    const regRes = registerOfficerAccount({
      fullName: enteredName,
      username: enteredUsername,
      department: enteredDept,
      password: enteredPassword,
      passkey: enteredPasskey,
    });

    if (!regRes.ok) {
      setError(regRes.error || "Failed to register officer account.");
      setLoading(false);
      return;
    }

    // Automatically log the newly registered officer in and persist session
    setOfficerSession({
      loggedIn: true,
      user: {
        username: enteredUsername,
        fullName: enteredName,
        department: enteredDept,
      },
    });

    setSuccessMsg("Officer account created successfully. Redirecting to Command Center…");

    // Best-effort sync with server session
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: enteredUsername,
          password: enteredPassword,
          passkey: enteredPasskey,
          secretKey: enteredPasskey,
        }),
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      window.location.href = "/admin";
    }, 600);
  };

  return (
    <div className="card overflow-hidden">
      {/* Tab switcher: Sign In vs Register / Sign Up */}
      <div className="grid grid-cols-2 border-b border-border bg-page-warm">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            clearAlerts();
          }}
          className={`py-3.5 text-sm font-heading font-bold tracking-wide transition ${
            mode === "signin"
              ? "border-b-2 border-saffron bg-white text-navy"
              : "text-muted hover:text-navy"
          }`}
        >
          🔑 Officer Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            clearAlerts();
          }}
          className={`py-3.5 text-sm font-heading font-bold tracking-wide transition ${
            mode === "signup"
              ? "border-b-2 border-saffron bg-white text-navy"
              : "text-muted hover:text-navy"
          }`}
        >
          🛡️ Register / Sign Up
        </button>
      </div>

      <div className="p-7">
        {unauthorizedAlert && (
          <div role="alert" className="notice notice-danger mb-5">
            <p className="font-bold">⚠️ {unauthorizedAlert}</p>
          </div>
        )}
        {error && !unauthorizedAlert && (
          <div role="alert" className="notice notice-danger mb-5">
            <p>{error}</p>
          </div>
        )}
        {successMsg && (
          <div role="status" className="notice notice-success mb-5">
            <p className="font-semibold text-green-800">✓ {successMsg}</p>
          </div>
        )}

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-5" noValidate>
            <div>
              <label htmlFor="username" className="label">
                Username / Officer ID <span className="text-red-600">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearAlerts();
                }}
                required
                autoComplete="username"
                placeholder="Enter Officer Username or ID"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password <span className="text-red-600">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearAlerts();
                }}
                required
                autoComplete="current-password"
                placeholder="Enter Password"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="passkey" className="label">
                Secret Passkey Gatekeeper <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="passkey"
                  name="passkey"
                  type={showPasskey ? "text" : "password"}
                  value={passkey}
                  onChange={(e) => {
                    setPasskey(e.target.value);
                    clearAlerts();
                  }}
                  required
                  autoComplete="off"
                  placeholder="Enter secret passkey"
                  className="input pr-20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasskey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border-strong bg-page-warm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy transition hover:bg-white"
                >
                  {showPasskey ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Confidential authorization passkey required for official access.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner light /> Signing in…
                </span>
              ) : (
                "Sign In to Officer Dashboard"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-fullname" className="label">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearAlerts();
                }}
                required
                placeholder="e.g. Rajesh Deshmukh"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="reg-username" className="label">
                Officer ID / Username <span className="text-red-600">*</span>
              </label>
              <input
                id="reg-username"
                type="text"
                value={regUsername}
                onChange={(e) => {
                  setRegUsername(e.target.value);
                  clearAlerts();
                }}
                required
                placeholder="e.g. fda_pune_01"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="reg-dept" className="label">
                Department / District <span className="text-red-600">*</span>
              </label>
              <input
                id="reg-dept"
                type="text"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  clearAlerts();
                }}
                required
                placeholder="e.g. Food & Drug Vigilance, Pune Division"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="label">
                Create Password <span className="text-red-600">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => {
                  setRegPassword(e.target.value);
                  clearAlerts();
                }}
                required
                placeholder="Create a secure password"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="reg-passkey" className="label">
                Secret Passkey Gatekeeper <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-passkey"
                  type={showRegPasskey ? "text" : "password"}
                  value={regPasskey}
                  onChange={(e) => {
                    setRegPasskey(e.target.value);
                    clearAlerts();
                  }}
                  required
                  autoComplete="off"
                  placeholder="Enter secret passkey to authorize registration"
                  className="input pr-20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPasskey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border-strong bg-page-warm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy transition hover:bg-white"
                >
                  {showRegPasskey ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted">
                Only authorized personnel with the secret passkey can register an officer account.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner light /> Registering Officer…
                </span>
              ) : (
                "Register Officer Account"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
