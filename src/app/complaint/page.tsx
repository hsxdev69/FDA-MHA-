"use client";

import ComplaintForm from "@/components/complaint-form";
import { useLanguage } from "@/context/language-context";

export default function ComplaintPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 border-l-4 border-saffron pl-4">
        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
          {t.grievanceRedressal}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-navy">
          {t.formTitle}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft">
          {t.formSubtitle}
        </p>
      </div>
      <ComplaintForm />
    </div>
  );
}
