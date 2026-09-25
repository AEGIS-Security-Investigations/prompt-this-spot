import { INSPECT_PROMPT_ENABLED_STORAGE_KEY } from "./inspectPromptPreferencesStorageKey";
import { parseInspectPromptEnabledPreference } from "./parseInspectPromptEnabledPreference";

/**
 * Reads whether the prompt inspector is enabled for this browser profile.
 */
export const readInspectPromptEnabledPreference = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  return parseInspectPromptEnabledPreference(
    localStorage.getItem(INSPECT_PROMPT_ENABLED_STORAGE_KEY)
  );
};
