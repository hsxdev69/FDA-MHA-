"use client";

import { useCallback, useEffect, useState } from "react";
import { friendlySupabaseError, supabase } from "@/lib/supabase";
import Spinner from "@/components/ui/spinner";

const RESEND_COOLDOWN_SECONDS = 60;

interface EmailOtpVerifyProps {
  email: string;
  onEmailChange: (value: string) => void;
  verified?: boolean;
  isEmailVerified?: boolean;
  onVerifiedChange?: (value: boolean) => void;
  setIsEmailVerified?: (value: boolean) => void;
}

/**
 * Step 4: Citizen Email OTP verification component using live Supabase Auth.
 */
export default function EmailOtpVerify({
  email,
  onEmailChange,
  verified,
  isEmailVerified: isEmailVerifiedProp,
  onVerifiedChange,
  setIsEmailVerified,
}: EmailOtpVerifyProps) {
  const isVerified = Boolean(isEmailVerifiedProp ?? verified);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);

  const updateVerified = useCallback(
    (status: boolean) => {
      onVerifiedChange?.(status);
      setIsEmailVerified?.(status);
    },
    [onVerifiedChange, setIsEmailVerified]
  );

  /* 1-second interval for resend cooldown */
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const showToast = useCallback(
    (message: string, type: "error" | "success" | "info" = "error") => {
      setToast({ message, type });
    },
    []
  );

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleEmailChange = useCallback(
    (value: string) => {
      if (isVerified) return; // Prevent edits when email is already verified
      onEmailChange(value);
      setOtpSent(false);
      setOtp("");
      setToast(null);
    },
    [isVerified, onEmailChange]
  );

  /* Trigger Supabase signInWithOtp */
  const sendOtp = useCallback(async () => {
    setToast(null);
    const targetEmail = email.trim();

    if (!emailValid) {
      showToast(
        "Please enter a valid email address (e.g. yourname@gmail.com).",
        "error"
      );
      return;
    }

    setSending(true);
    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { shouldCreateUser: true },
      });

      if (sendError) {
        showToast(friendlySupabaseError(sendError.message), "error");
        return;
      }

      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showToast(
        `A 6-digit verification code has been sent to ${targetEmail}. Please check your inbox and spam folder.`,
        "info"
      );
    } catch {
      showToast(
        "Could not send the verification code. Please check your network connection and try again.",
        "error"
      );
    } finally {
      setSending(false);
    }
  }, [email, emailValid, showToast]);

  /* Trigger Supabase verifyOtp */
  const verifyOtp = useCallback(async () => {
    setToast(null);
    const code = otp.trim();
    const targetEmail = email.trim();

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      showToast("Please enter the complete 6-digit verification code.", "error");
      return;
    }

    setVerifying(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: code,
        type: "email",
      });

      if (verifyError) {
        // Show alert toast without resetting the form
        showToast(
          friendlySupabaseError(verifyError.message),
          "error"
        );
        return;
      }

      // Verification successful
      updateVerified(true);
      setOtpSent(false);
      setOtp("");
      showToast("Email address verified successfully!", "success");
    } catch {
      showToast(
        "Verification failed. Please check the code and try again.",
        "error"
      );
    } finally {
      setVerifying(false);
    }
  }, [email, otp, updateVerified, showToast]);

  const handleResetEmail = () => {
    updateVerified(false);
    setOtpSent(false);
    setOtp("");
    setToast(null);
  };

  return (
    <div className="space-y-3 rounded border border-border bg-page-warm p-4">
      {/* Email Input Field */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="citizen-email" className="label mb-0">
            Gmail / Email ID <span className="text-red-600">*</span>
          </label>
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-600 bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-800">
              🟢 Email Verified
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="citizen-email"
            type="email"
            disabled={isVerified}
            className={`input flex-1 transition ${
              isVerified
                ? "cursor-not-allowed border-green-500 bg-slate-100 font-medium text-slate-700"
                : ""
            }`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="yourname@gmail.com"
            autoComplete="email"
          />

          {!isVerified ? (
            <button
              type="button"
              onClick={() => void sendOtp()}
              disabled={sending || cooldown > 0}
              className="btn-primary whitespace-nowrap disabled:opacity-60"
            >
              {sending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner light /> Sending…
                </span>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : otpSent ? (
                "Resend code"
              ) : (
                "Send OTP"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResetEmail}
              className="btn-outline whitespace-nowrap text-xs text-muted hover:text-navy"
              title="Edit or use a different email"
            >
              Change email
            </button>
          )}
        </div>

        <p className="mt-1 text-xs text-muted">
          We send a 6-digit OTP to confirm this address. Mobile number above is contact-only (no SMS verification).
        </p>
      </div>

      {/* 6-digit OTP Box (visible once OTP is sent and until verified) */}
      {otpSent && !isVerified && (
        <div className="space-y-2 rounded border border-navy/20 bg-white p-3">
          <label htmlFor="citizen-otp" className="label">
            Enter 6-digit verification code
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="citizen-otp"
              className="input max-w-[180px] font-mono text-lg tracking-[0.4em] text-center"
              value={otp}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="••••••"
              aria-label="6-digit email verification code"
              autoFocus
            />
            <button
              type="button"
              onClick={() => void verifyOtp()}
              disabled={verifying || otp.length !== 6}
              className="btn-teal whitespace-nowrap disabled:opacity-60"
            >
              {verifying ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner light /> Verifying…
                </span>
              ) : (
                "Verify OTP"
              )}
            </button>
          </div>
          <p className="text-xs text-muted">
            {cooldown > 0
              ? `Code expires in a few minutes. You can request another in ${cooldown}s.`
              : "Didn't receive the code? Click 'Resend code' above."}
          </p>
        </div>
      )}

      {/* Alert Toast / Notification (does not reset form on error) */}
      {toast && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-2 rounded border p-3 text-xs font-semibold shadow-sm transition-all ${
            toast.type === "error"
              ? "border-red-400 bg-red-50 text-red-800"
              : toast.type === "success"
                ? "border-green-400 bg-green-50 text-green-800"
                : "border-blue-300 bg-blue-50 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>
              {toast.type === "error"
                ? "⚠️"
                : toast.type === "success"
                  ? "✅"
                  : "ℹ️"}
            </span>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-sm leading-none opacity-60 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
