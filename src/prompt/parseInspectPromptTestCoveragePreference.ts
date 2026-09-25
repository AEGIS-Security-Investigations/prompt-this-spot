/**
 * Parses the stored "ask for test coverage" preference. Defaults to OFF when
 * unset — unlike the screenshot switch, this one adds an instruction to every
 * prompt, so it is opt-in rather than something a reviewer has to discover and
 * turn off.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { parseInspectPromptTestCoveragePreference } from "./parseInspectPromptTestCoveragePreference";
 *
 * test("parseInspectPromptTestCoveragePreference", () => {
 *   expect(parseInspectPromptTestCoveragePreference(null)).toBe(false);
 *   expect(parseInspectPromptTestCoveragePreference("true")).toBe(true);
 * });
 * ```
 */
export const parseInspectPromptTestCoveragePreference = (
  stored: string | null
): boolean => stored === "true";
