"use client";

import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="card p-8">
        <p className="text-4xl" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="mt-3 font-heading text-xl font-bold text-navy">
          Officer Dashboard could not load
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          A temporary server error occurred. Your session and complaints are
          still saved in this browser. Please try again.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[11px] text-muted">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/officer-login" className="btn-outline">
            Back to Officer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
