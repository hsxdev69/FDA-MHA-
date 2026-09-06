"use client";

import { useEffect, useState } from "react";
import { useLanguage, type Language } from "@/context/language-context";

/**
 * Official government portal top utility bar:
 * - Text size controls (A- | A | A+) for accessibility
 * - Functional Language selector (English / हिन्दी / मराठी)
 * - Government branding
 */
export default function TopBar() {
  const [scale, setScale] = useState<number>(16);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", `${scale}px`);
  }, [scale]);

  const adjust = (delta: number) => {
    setScale((prev) => Math.max(13, Math.min(22, prev + delta)));
  };

  return (
    <div className="bg-navy-dark text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-1.5 text-xs sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-white/85 font-medium">
            {language === "mr"
              ? "महाराष्ट्र शासन उपक्रम · Food & Drug Administration"
              : language === "hi"
              ? "भारत सरकार एवं महाराष्ट्र शासन उपक्रम"
              : "Government of India Initiative · महाराष्ट्र राज्य"}
          </span>
          <span className="hidden md:inline text-white/60">|</span>
          <a
            href="https://www.india.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white underline-offset-2"
          >
            india.gov.in
          </a>
        </div>

        <div className="flex items-center gap-2">
          {/* Text size controls */}
          <div className="flex items-center gap-0.5 border-r border-white/20 pr-3">
            <span className="mr-1 hidden font-mono text-[10px] text-white/70 sm:inline">
              Font:
            </span>
            <button
              type="button"
              onClick={() => adjust(-1)}
              aria-label="Decrease text size"
              className="rounded px-2 py-0.5 font-semibold text-white/90 transition hover:bg-white/10"
              title="Decrease font size"
            >
              A<sup className="text-[9px]">-</sup>
            </button>
            <button
              type="button"
              onClick={() => setScale(16)}
              aria-label="Reset text size"
              className="rounded px-2 py-0.5 font-semibold text-white transition hover:bg-white/10"
              title="Default font size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => adjust(1)}
              aria-label="Increase text size"
              className="rounded px-2 py-0.5 font-semibold text-white/90 transition hover:bg-white/10"
              title="Increase font size"
            >
              A<sup className="text-[9px]">+</sup>
            </button>
          </div>

          {/* Functional Language selector with globe icon */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded border border-white/20">
            <span aria-hidden="true" className="text-xs">🌐</span>
            <label htmlFor="gov-lang-select" className="sr-only">
              Select Language / भाषा निवडा
            </label>
            <select
              id="gov-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="Select language"
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-medium focus:outline-none"
            >
              <option value="en" className="text-ink bg-white">English (EN)</option>
              <option value="hi" className="text-ink bg-white">हिन्दी (HI)</option>
              <option value="mr" className="text-ink bg-white">मराठी (MR)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
