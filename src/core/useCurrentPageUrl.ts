"use client";

import { useSyncExternalStore } from "react";
import { readPageUrl } from "./readPageUrl";

/**
 * How often to re-read the URL while someone is watching it. Single-page apps
 * change the URL with `history.pushState`/`replaceState`, which fire no event,
 * and patching those globals from a shared package would fight every router.
 * A cheap string comparison twice a second catches them instead.
 */
const POLL_MS = 500;

interface NavigationLike {
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

const subscribe = (onChange: () => void): (() => void) => {
  // Back/Forward and hash navigation announce themselves.
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  // Where the Navigation API exists it also reports pushState/replaceState
  // immediately; the poll below covers every other browser.
  const navigation = (window as { navigation?: NavigationLike }).navigation;
  navigation?.addEventListener("currententrychange", onChange);
  const poll = window.setInterval(onChange, POLL_MS);

  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
    navigation?.removeEventListener("currententrychange", onChange);
    window.clearInterval(poll);
  };
};

/** Subscribes to nothing, for when no one is looking at the URL. */
const subscribeNever = (): (() => void) => () => {};

/** No `window` during server rendering: show nothing until hydrated. */
const getServerSnapshot = (): string => "";

/**
 * The sanitized URL of the page the user is on, kept current through
 * client-side navigation, Back/Forward, query-only changes and hash changes
 * without a reload.
 *
 * This is for DISPLAY. Captures read the URL once, at capture time (see
 * `readPageUrl`), so navigating never relabels an earlier selection or
 * screenshot as belonging to the new page.
 *
 * Pass `enabled: false` while the drawer is closed so a hidden tool does not
 * keep listening and polling.
 */
export const useCurrentPageUrl = (enabled = true): string =>
  useSyncExternalStore(
    enabled ? subscribe : subscribeNever,
    readPageUrl,
    getServerSnapshot
  );
