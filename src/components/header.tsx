"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/context/language-context";

/** Simple shield emblem placeholder (not the official state emblem). */
function ShieldEmblem() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-14 w-14 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="shield-gov" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff9933" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#138808" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 58 14v16c0 14-10 25-26 30C16 55 6 44 6 30V14z"
        fill="#0f2b48"
        stroke="#d97706"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="28" r="9" fill="url(#shield-gov)" stroke="#0f2b48" strokeWidth="1" />
      <path
        d="M24 32 l5 5 l11 -11"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t, language } = useLanguage();

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/complaint", label: t.fileComplaint },
    { href: "/my-complaints", label: t.trackComplaint },
    { href: "/information", label: t.fdaContact },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b-2 border-saffron-deep bg-surface shadow-sm">
      {/* Ministry header */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-4 hover:no-underline"
            onClick={() => setOpen(false)}
          >
            <ShieldEmblem />
            <div className="leading-tight">
              <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t.govtOfMah}
              </p>
              <p className="mt-0.5 font-heading text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
                Maha FDA
              </p>
              <p className="font-heading text-sm font-medium text-ink-soft sm:text-base">
                {t.deptName}
              </p>
              <p className="mt-0.5 text-[11px] font-medium tracking-wider text-muted-dim">
                {t.portalSubtitle}
              </p>
            </div>
          </Link>

          {/* Right side: emergency contact & active language flag */}
          <div className="hidden text-right md:block">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-dim">
              {t.helplineTitle}
            </p>
            <a
              href="tel:02226122652"
              className="font-heading text-lg font-bold text-navy hover:text-saffron-deep"
            >
              022-26122652
            </a>
            <p className="text-[11px] text-muted">comm.fda-mah@nic.in</p>
          </div>
        </div>
      </div>

      {/* Primary navigation — solid navy bar */}
      <nav className="bg-navy" aria-label="Main">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="hidden items-center md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative block px-5 py-3 text-sm font-semibold tracking-wide transition-colors ${
                  isActive(link.href)
                    ? "bg-navy-dark text-saffron"
                    : "text-white hover:bg-navy-light hover:text-white"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-saffron" />
                )}
              </Link>
            ))}
          </div>

          <Link
            href="/officer-login"
            className="hidden items-center gap-2 border-l border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-light md:inline-flex"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />
            </svg>
            {t.officerLogin}
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            className="p-2 text-white md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="border-t border-white/10 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block border-b border-white/5 px-5 py-3 text-sm font-semibold transition ${
                  isActive(link.href)
                    ? "bg-navy-dark text-saffron"
                    : "text-white hover:bg-navy-light"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/officer-login"
              onClick={() => setOpen(false)}
              className="block px-5 py-3 text-sm font-semibold text-saffron hover:bg-navy-light"
            >
              {t.officerLogin}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
