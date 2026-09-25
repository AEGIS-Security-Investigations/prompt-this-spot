import { describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useInspectPromptShortcut } from "../../src/prompt/useInspectPromptShortcut";

describe("useInspectPromptShortcut", () => {
  test("toggles the drawer when active", () => {
    const openDrawer = mock(() => undefined);
    const closeDrawer = mock(() => undefined);
    const target = document.createElement("div");
    document.body.appendChild(target);

    const dispatchShortcut = () => {
      act(() => {
        target.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "p",
            shiftKey: true,
            ctrlKey: true,
            bubbles: true,
          })
        );
      });
    };

    const { rerender } = renderHook(
      ({ active, drawerOpen }) =>
        useInspectPromptShortcut(active, drawerOpen, openDrawer, closeDrawer),
      { initialProps: { active: false, drawerOpen: false } }
    );

    dispatchShortcut();

    expect(openDrawer).not.toHaveBeenCalled();
    expect(closeDrawer).not.toHaveBeenCalled();

    rerender({ active: true, drawerOpen: false });

    dispatchShortcut();

    expect(openDrawer).toHaveBeenCalledTimes(1);

    rerender({ active: true, drawerOpen: true });

    dispatchShortcut();

    expect(closeDrawer).toHaveBeenCalledTimes(1);
  });
});
