"use client";

import LogoutButton from "@/components/logout-button";
import OfficerGatekeeper from "@/components/officer-gatekeeper";
import AdminHeaderUser from "@/components/admin-header-user";

/**
 * Client layout: session lives in localStorage (`officerAuth`).
 * No cookies()/DB calls here — those were crashing /admin on Vercel
 * when DATABASE_URL was unset.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OfficerGatekeeper serverAuthenticated={false}>
      <div className="min-h-full">
        <div className="sticky top-0 z-30 border-b-2 border-saffron bg-navy text-white shadow-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <div>
              <p className="font-heading text-lg font-bold leading-tight">
                Maha FDA · Officer Command Center
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
                Restricted — Authorized Officers Only
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AdminHeaderUser fallbackUsername="Officer" />
              <LogoutButton />
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <p className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-muted sm:px-6 lg:px-8">
          Prototype disclaimer · preliminary AI priority scores are a
          recommendation only — final decisions belong to authorized FDA
          officers.
        </p>
      </div>
    </OfficerGatekeeper>
  );
}
