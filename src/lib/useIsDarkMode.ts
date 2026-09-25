"use client";

import { useSyncExternalStore } from "react";

const isDarkNow = (): boolean =>
  document.documentElement.classList.contains("dark");

const subscribe = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
};

/**
 * Whether the page is in dark mode, following the Tailwind `class` strategy
 * (`<html class="dark">`) that next-themes and most shadcn/ui apps use.
 * Reading the class rather than a theme library keeps the package free of one.
 */
export const useIsDarkMode = (): boolean =>
  useSyncExternalStore(subscribe, isDarkNow, () => false);
