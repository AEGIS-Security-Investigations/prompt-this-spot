"use client";

import { useEffect } from "react";
import { isInspectPromptShortcutKeyDown } from "./isInspectPromptShortcutKeyDown";
import { shouldIgnoreInspectPromptShortcutTarget } from "./shouldIgnoreInspectPromptShortcutTarget";

/**
 * Registers Mod+Shift+P to toggle the inspect prompt drawer globally.
 *
 * @param active When false, the shortcut listener is not registered (e.g. the
 * viewer is ineligible). Independent of the launcher preference.
 */
export const useInspectPromptShortcut = (
  active: boolean,
  drawerOpen: boolean,
  openDrawer: () => void,
  closeDrawer: () => void
): void => {
  useEffect(() => {
    if (!active) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isInspectPromptShortcutKeyDown(event)) {
        return;
      }
      if (shouldIgnoreInspectPromptShortcutTarget(event.target)) {
        return;
      }
      event.preventDefault();
      if (drawerOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, drawerOpen, openDrawer, closeDrawer]);
};
