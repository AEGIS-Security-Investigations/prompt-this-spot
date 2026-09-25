"use client";

import { useInspectPromptPreferences } from "./InspectPromptPreferencesContext";

export type InspectPromptAccess = {
  /** Whether the current viewer may use the inspect tool at all (ignoring toggle). */
  eligible: boolean;
  /** Whether the floating launcher should render (eligible + the launcher preference). */
  launcherVisible: boolean;
};

/**
 * Decides how the "copy AI prompt for this spot" inspect tool is exposed.
 *
 * Combines the host app's eligibility decision with the per-browser launcher
 * toggle ({@link useInspectPromptPreferences}). The keyboard shortcut and drawer
 * respect {@link InspectPromptAccess.eligible} only; the launcher respects
 * {@link InspectPromptAccess.launcherVisible}.
 */
export const useInspectPromptAccess = (
  eligible: boolean
): InspectPromptAccess => {
  const { enabled } = useInspectPromptPreferences();

  return {
    eligible,
    launcherVisible: eligible && enabled,
  };
};
