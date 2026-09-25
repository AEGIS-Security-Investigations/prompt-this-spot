import type { InspectPromptLauncherCorner } from "./inspectPromptLauncherCorner";
import {
  DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER,
  isInspectPromptLauncherCorner,
} from "./inspectPromptLauncherCorner";

/**
 * Parses a stored launcher corner value.
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { parseInspectPromptLauncherCorner } from "./parseInspectPromptLauncherCorner";
 *
 * test("parseInspectPromptLauncherCorner", () => {
 *   expect(parseInspectPromptLauncherCorner("top-right")).toBe("top-right");
 *   expect(parseInspectPromptLauncherCorner(null)).toBe("bottom-left");
 * });
 * ```
 */
export const parseInspectPromptLauncherCorner = (
  stored: string | null
): InspectPromptLauncherCorner => {
  if (stored && isInspectPromptLauncherCorner(stored)) {
    return stored;
  }

  return DEFAULT_INSPECT_PROMPT_LAUNCHER_CORNER;
};
