"use client";

import { useCallback, useEffect, useState } from "react";
import type { InspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";
import { isInspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";

const STORAGE_KEY = "user-feedback-launcher-corner";

/**
 * Opposite corner from the admin inspector's `bottom-left` default, so a super
 * admin who sees both launchers never gets two stacked buttons.
 */
export const DEFAULT_USER_FEEDBACK_LAUNCHER_CORNER: InspectPromptLauncherCorner =
  "bottom-right";

const readStoredCorner = (): InspectPromptLauncherCorner => {
  if (typeof window === "undefined") {
    return DEFAULT_USER_FEEDBACK_LAUNCHER_CORNER;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && isInspectPromptLauncherCorner(stored)
      ? stored
      : DEFAULT_USER_FEEDBACK_LAUNCHER_CORNER;
  } catch {
    // Private browsing / disabled storage — the default is fine.
    return DEFAULT_USER_FEEDBACK_LAUNCHER_CORNER;
  }
};

/**
 * Where the floating launcher sits, remembered per browser.
 *
 * The initial state is the default rather than the stored value so the first
 * client render matches the server's, then the stored corner is applied in an
 * effect — reading `localStorage` during render would be a hydration mismatch.
 */
export const useUserFeedbackLauncherCorner = (): [
  InspectPromptLauncherCorner,
  (corner: InspectPromptLauncherCorner) => void,
] => {
  const [corner, setCornerState] = useState<InspectPromptLauncherCorner>(
    DEFAULT_USER_FEEDBACK_LAUNCHER_CORNER
  );

  useEffect(() => setCornerState(readStoredCorner()), []);

  const setCorner = useCallback((next: InspectPromptLauncherCorner) => {
    setCornerState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Placement is a nicety; failing to persist it must never break the tool.
    }
  }, []);

  return [corner, setCorner];
};
