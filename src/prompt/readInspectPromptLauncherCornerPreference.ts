import type { InspectPromptLauncherCorner } from "../core/inspectPromptLauncherCorner";
import { DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER } from "../core/inspectPromptLauncherCorner";
import { parseInspectPromptLauncherCorner } from "../core/parseInspectPromptLauncherCorner";
import { INSPECT_PROMPT_LAUNCHER_CORNER_STORAGE_KEY } from "./inspectPromptPreferencesStorageKey";

/**
 * Reads the saved launcher corner for this browser profile.
 */
export const readInspectPromptLauncherCornerPreference =
  (): InspectPromptLauncherCorner => {
    if (typeof window === "undefined") {
      return DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER;
    }

    return parseInspectPromptLauncherCorner(
      localStorage.getItem(INSPECT_PROMPT_LAUNCHER_CORNER_STORAGE_KEY)
    );
  };
