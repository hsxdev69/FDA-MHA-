"use client";

import { useEffect, useRef, useState } from "react";

/** Returns a value that only updates after `delay` ms of inactivity. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/** Debounces a callback (e.g. expensive geocode / filter work). */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 300,
): (...args: A) => void {
  const timer = useRef<number | null>(null);
  const saved = useRef(fn);

  useEffect(() => {
    saved.current = fn;
  }, [fn]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return (...args: A) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saved.current(...args), delay);
  };
}
