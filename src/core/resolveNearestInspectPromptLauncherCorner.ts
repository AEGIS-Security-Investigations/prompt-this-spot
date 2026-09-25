import type { InspectPromptLauncherCorner } from "./inspectPromptLauncherCorner";

/**
 * Snaps a screen point to the nearest viewport corner (Next.js dev-indicator style).
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { resolveNearestInspectPromptLauncherCorner } from "./resolveNearestInspectPromptLauncherCorner";
 *
 * test("resolveNearestInspectPromptLauncherCorner", () => {
 *   expect(
 *     resolveNearestInspectPromptLauncherCorner(900, 100, 1000, 800)
 *   ).toBe("top-right");
 * });
 * ```
 */
export const resolveNearestInspectPromptLauncherCorner = (
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number
): InspectPromptLauncherCorner => {
  const horizontal = x < viewportWidth / 2 ? "left" : "right";
  const vertical = y < viewportHeight / 2 ? "top" : "bottom";
  return `${vertical}-${horizontal}` as InspectPromptLauncherCorner;
};
