"use client";

/** Lightweight CSS-only spinner (no layout thrash, no filters). */
export default function Spinner({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 ${
        light ? "border-white/40 border-t-white" : "border-navy/30 border-t-navy"
      } ${className}`}
    />
  );
}
