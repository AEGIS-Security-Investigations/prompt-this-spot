import { INSPECT_PROMPT_TEST_COVERAGE_STORAGE_KEY } from "./inspectPromptPreferencesStorageKey";
import { parseInspectPromptTestCoveragePreference } from "./parseInspectPromptTestCoveragePreference";

/**
 * Reads whether assembled prompts should ask the agent for unit + e2e coverage,
 * for this browser profile. Persisted so a reviewer who always wants tests ticks
 * the box once rather than on every prompt.
 */
export const readInspectPromptTestCoveragePreference = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return parseInspectPromptTestCoveragePreference(
    localStorage.getItem(INSPECT_PROMPT_TEST_COVERAGE_STORAGE_KEY)
  );
};
