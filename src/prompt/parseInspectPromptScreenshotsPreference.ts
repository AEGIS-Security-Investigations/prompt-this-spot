/**
 * Parses the stored "capture screenshots" preference. Defaults to enabled when
 * unset, so the tool keeps behaving as it does today for anyone who has never
 * touched the switch.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { parseInspectPromptScreenshotsPreference } from "./parseInspectPromptScreenshotsPreference";
 *
 * test("parseInspectPromptScreenshotsPreference", () => {
 *   expect(parseInspectPromptScreenshotsPreference(null)).toBe(true);
 *   expect(parseInspectPromptScreenshotsPreference("false")).toBe(false);
 * });
 * ```
 */
export const parseInspectPromptScreenshotsPreference = (
  stored: string | null
): boolean => {
  if (stored === "false") {
    return false;
  }

  return true;
};
