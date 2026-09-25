import { INSPECT_PROMPT_SCREENSHOTS_STORAGE_KEY } from "./inspectPromptPreferencesStorageKey";
import { parseInspectPromptScreenshotsPreference } from "./parseInspectPromptScreenshotsPreference";

/**
 * Reads whether the prompt inspector should capture screenshots at all, for
 * this browser profile. Screenshot rendering is approximate (see
 * `docs/INSPECT_PROMPT_SCREENSHOTS.md`), so it is switchable independently of
 * the tool itself.
 */
export const readInspectPromptScreenshotsPreference = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  return parseInspectPromptScreenshotsPreference(
    localStorage.getItem(INSPECT_PROMPT_SCREENSHOTS_STORAGE_KEY)
  );
};
