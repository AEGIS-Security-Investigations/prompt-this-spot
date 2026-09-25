/**
 * Skip the inspect prompt shortcut while the user is typing in app fields
 * (but allow it from the tool's own drawer, including its request textarea).
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { shouldIgnoreInspectPromptShortcutTarget } from "./shouldIgnoreInspectPromptShortcutTarget";
 *
 * test("shouldIgnoreInspectPromptShortcutTarget", () => {
 *   document.body.innerHTML =
 *     '<div data-inspect-ignore><textarea id="tool"></textarea></div><input id="app" />';
 *   expect(
 *     shouldIgnoreInspectPromptShortcutTarget(document.getElementById("tool"))
 *   ).toBe(false);
 *   expect(
 *     shouldIgnoreInspectPromptShortcutTarget(document.getElementById("app"))
 *   ).toBe(true);
 * });
 * ```
 */
export const shouldIgnoreInspectPromptShortcutTarget = (
  target: EventTarget | null
): boolean => {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  if (target.closest(".cm-editor")) {
    return true;
  }

  const field = target.closest(
    'input, textarea, select, [contenteditable="true"], [role="textbox"]'
  );
  if (!field) {
    return false;
  }

  return field.closest("[data-inspect-ignore]") === null;
};
