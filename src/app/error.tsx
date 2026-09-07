"use client";

import Link from "next/link";

export default function RootError({
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
          This page couldn&apos;t load
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          A server error occurred. Please try again. Citizen complaints stored
          in this browser are not lost.
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
          <Link href="/" className="btn-outline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
