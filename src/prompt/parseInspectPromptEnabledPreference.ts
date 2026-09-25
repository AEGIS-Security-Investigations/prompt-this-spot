/**
 * Parses the stored preference string. Defaults to enabled when unset.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { parseInspectPromptEnabledPreference } from "./parseInspectPromptEnabledPreference";
 *
 * test("parseInspectPromptEnabledPreference", () => {
 *   expect(parseInspectPromptEnabledPreference(null)).toBe(true);
 *   expect(parseInspectPromptEnabledPreference("false")).toBe(false);
 * });
 * ```
 */
export const parseInspectPromptEnabledPreference = (
  stored: string | null
): boolean => {
  if (stored === "false") {
    return false;
  }

  return true;
};
