import { describe, expect, test } from "bun:test";
import { formatInspectPromptShortcutLabel } from "../../src/prompt/formatInspectPromptShortcutLabel";
import { isInspectPromptShortcutKeyDown } from "../../src/prompt/isInspectPromptShortcutKeyDown";
import { shouldIgnoreInspectPromptShortcutTarget } from "../../src/prompt/shouldIgnoreInspectPromptShortcutTarget";

describe("inspect prompt keyboard shortcut", () => {
  test("formatInspectPromptShortcutLabel", () => {
    expect(formatInspectPromptShortcutLabel(true)).toBe("⌘⇧P");
    expect(formatInspectPromptShortcutLabel(false)).toBe("Ctrl+Shift+P");
  });

  test("isInspectPromptShortcutKeyDown", () => {
    expect(
      isInspectPromptShortcutKeyDown(
        new KeyboardEvent("keydown", {
          key: "p",
          shiftKey: true,
          metaKey: true,
        })
      )
    ).toBe(true);
    expect(
      isInspectPromptShortcutKeyDown(
        new KeyboardEvent("keydown", {
          key: "p",
          shiftKey: true,
          ctrlKey: true,
        })
      )
    ).toBe(true);
    expect(
      isInspectPromptShortcutKeyDown(
        new KeyboardEvent("keydown", { key: "p", metaKey: true })
      )
    ).toBe(false);
  });

  test("shouldIgnoreInspectPromptShortcutTarget", () => {
    document.body.innerHTML =
      '<div data-inspect-ignore><textarea id="tool"></textarea></div><input id="app" />';
    expect(
      shouldIgnoreInspectPromptShortcutTarget(document.getElementById("tool"))
    ).toBe(false);
    expect(
      shouldIgnoreInspectPromptShortcutTarget(document.getElementById("app"))
    ).toBe(true);
  });
});
