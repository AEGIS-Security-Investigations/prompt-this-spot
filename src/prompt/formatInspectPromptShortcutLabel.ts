const isApplePlatform = (): boolean => {
  if (typeof navigator === "undefined") {
    return true;
  }
  return /mac|iphone|ipad|ipod/i.test(
    navigator.platform || navigator.userAgent
  );
};

/**
 * Platform-correct label for the inspect prompt toggle shortcut (Mod+Shift+P).
 *
 * @example
 * ```ts
 * import { expect, test } from "bun:test";
 * import { formatInspectPromptShortcutLabel } from "./formatInspectPromptShortcutLabel";
 *
 * test("formatInspectPromptShortcutLabel", () => {
 *   expect(formatInspectPromptShortcutLabel(true)).toBe("⌘⇧P");
 *   expect(formatInspectPromptShortcutLabel(false)).toBe("Ctrl+Shift+P");
 * });
 * ```
 */
export const formatInspectPromptShortcutLabel = (
  isMac: boolean = isApplePlatform()
): string => (isMac ? "⌘⇧P" : "Ctrl+Shift+P");
