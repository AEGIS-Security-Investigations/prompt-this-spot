/**
 * Whether a keydown event is the inspect prompt drawer toggle (Mod+Shift+P).
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { isInspectPromptShortcutKeyDown } from "./isInspectPromptShortcutKeyDown";
 *
 * test("isInspectPromptShortcutKeyDown", () => {
 *   expect(
 *     isInspectPromptShortcutKeyDown(
 *       new KeyboardEvent("keydown", { key: "p", shiftKey: true, metaKey: true })
 *     )
 *   ).toBe(true);
 * });
 * ```
 */
export const isInspectPromptShortcutKeyDown = (
  event: KeyboardEvent
): boolean => {
  if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) {
    return false;
  }
  return event.key.toLowerCase() === "p";
};
