"use client";

import Link from "next/link";
import { useLanguage } from "@/context/language-context";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 border-t-2 border-saffron bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Ministry */}
          <div>
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              {t.govtOfMah}
            </p>
            <p className="mt-1 font-heading text-lg font-bold text-white">
              {t.deptName}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              {t.footerAbout}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-4 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-saffron">
              {t.quickLinksTitle}
            </p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/", label: t.home },
                { href: "/complaint", label: t.fileComplaint },
                { href: "/my-complaints", label: t.trackComplaint },
                { href: "/information", label: t.fdaContact },
                { href: "/officer-login", label: t.officerLogin },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/80 transition hover:text-saffron"
                  >
                    › {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-saffron">
              {t.officialContactTitle}
            </p>
            <address className="not-italic text-sm leading-relaxed text-white/85">
              Food and Drug Administration, Maharashtra
              <br />
              Survey No. 341, 2nd Floor,
              <br />
              Bandra Kurla Complex,
              <br />
              Opposite Reserve Bank of India,
              <br />
              Bandra East, Mumbai - 400051
            </address>
            <div className="mt-4 space-y-1 text-sm">
              <p className="text-white/85">
                <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">Tel</span>{" "}
                <a href="tel:02226122652" className="text-white hover:text-saffron">
                  022-26122652
                </a>
              </p>
              <p className="text-white/85">
                <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">Email</span>{" "}
                <a href="mailto:comm.fda-mah@nic.in" className="text-white hover:text-saffron">
                  comm.fda-mah@nic.in
                </a>
              </p>
            </div>
            <div className="mt-5">
              <a
                href="https://fda.maharashtra.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-saffron bg-saffron/10 px-3 py-1.5 text-xs font-semibold text-saffron transition hover:bg-saffron hover:text-navy-dark"
              >
                Visit fda.maharashtra.gov.in ↗
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="rounded border border-saffron/30 bg-saffron/5 px-5 py-3 text-xs leading-relaxed text-white/85">
            <p>
              <strong className="text-saffron">{t.disclaimerTitle}</strong>{" "}
              {t.disclaimerText}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-navy-dark">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-white/60 sm:px-6 lg:px-8">
          <p>{t.copyright}</p>
          <p className="font-mono">Designed in accordance with GIGW guidelines</p>
        </div>
      </div>
    </footer>
  );
}
