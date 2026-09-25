import { describe, expect, test } from "bun:test";

import {
  FLOATING_LAUNCHER_STACK_STEP_PX,
  getFloatingLauncherStackStyle,
  resolveFloatingLauncherSlot,
} from "../../src/floating-launchers/floatingLauncherStack";

describe("floating launcher stack", () => {
  test("a launcher alone in its corner takes the corner", () => {
    expect(
      resolveFloatingLauncherSlot({
        id: "user-feedback",
        corner: "bottom-right",
        corners: { "user-feedback": "bottom-right" },
      })
    ).toBe(0);
    expect(getFloatingLauncherStackStyle("bottom-right", 0)).toBeUndefined();
  });

  test("The AI assistant launcher keeps bottom-right and Send feedback stacks above", () => {
    const corners = {
      "ai-assistant": "bottom-right",
      "user-feedback": "bottom-right",
    } as const;

    expect(
      resolveFloatingLauncherSlot({
        id: "ai-assistant",
        corner: "bottom-right",
        corners,
      })
    ).toBe(0);
    expect(
      resolveFloatingLauncherSlot({
        id: "user-feedback",
        corner: "bottom-right",
        corners,
      })
    ).toBe(1);
  });

  test("all three in one corner get three distinct slots", () => {
    const corners = {
      "ai-assistant": "bottom-right",
      "user-feedback": "bottom-right",
      "inspect-prompt": "bottom-right",
    } as const;

    expect(
      resolveFloatingLauncherSlot({
        id: "inspect-prompt",
        corner: "bottom-right",
        corners,
      })
    ).toBe(2);
  });

  test("launchers in other corners do not push a launcher out", () => {
    // The inspector's default corner: it must not shift the bottom-right pair.
    expect(
      resolveFloatingLauncherSlot({
        id: "user-feedback",
        corner: "bottom-right",
        corners: {
          "inspect-prompt": "bottom-left",
          "user-feedback": "bottom-right",
        },
      })
    ).toBe(0);
  });

  test("the caller's own corner wins over its last registration", () => {
    // First render, before the registration effect has run: the launcher still
    // has to resolve its slot or it paints one frame on top of the AI button.
    expect(
      resolveFloatingLauncherSlot({
        id: "user-feedback",
        corner: "bottom-right",
        corners: {
          "ai-assistant": "bottom-right",
          "user-feedback": "top-left",
        },
      })
    ).toBe(1);
  });

  test("bottom corners stack upwards and top corners downwards", () => {
    expect(getFloatingLauncherStackStyle("bottom-right", 1)).toEqual({
      transform: `translateY(-${FLOATING_LAUNCHER_STACK_STEP_PX}px)`,
    });
    expect(getFloatingLauncherStackStyle("top-right", 2)).toEqual({
      transform: `translateY(${FLOATING_LAUNCHER_STACK_STEP_PX * 2}px)`,
    });
  });

  test("the step clears the tallest launcher", () => {
    // The feedback / inspector pill is 44px tall (py-3 around a 20px icon).
    expect(FLOATING_LAUNCHER_STACK_STEP_PX).toBeGreaterThan(44);
  });
});
