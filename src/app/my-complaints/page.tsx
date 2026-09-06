"use client";

import { Suspense } from "react";
import TrackComplaint from "@/components/track-complaint";
import { useLanguage } from "@/context/language-context";

export default function MyComplaintsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 border-l-4 border-saffron pl-4">
        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
          {t.trackComplaint}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy">
          {t.trackingTitle}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {t.trackingSubtitle}
        </p>
      </div>
      <Suspense fallback={<div className="card p-6 text-sm text-muted">Loading tracker…</div>}>
        <TrackComplaint />
      </Suspense>
    </div>
  );
}
