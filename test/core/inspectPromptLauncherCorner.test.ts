import { describe, expect, test } from "bun:test";
import { parseInspectPromptLauncherCorner } from "../../src/core/parseInspectPromptLauncherCorner";
import { resolveNearestInspectPromptLauncherCorner } from "../../src/core/resolveNearestInspectPromptLauncherCorner";

describe("inspect prompt launcher corner", () => {
  test("parseInspectPromptLauncherCorner", () => {
    expect(parseInspectPromptLauncherCorner(null)).toBe("bottom-left");
    expect(parseInspectPromptLauncherCorner("top-right")).toBe("top-right");
    expect(parseInspectPromptLauncherCorner("invalid")).toBe("bottom-left");
  });

  test("resolveNearestInspectPromptLauncherCorner", () => {
    expect(resolveNearestInspectPromptLauncherCorner(900, 100, 1000, 800)).toBe(
      "top-right"
    );
    expect(resolveNearestInspectPromptLauncherCorner(100, 700, 1000, 800)).toBe(
      "bottom-left"
    );
  });
});
