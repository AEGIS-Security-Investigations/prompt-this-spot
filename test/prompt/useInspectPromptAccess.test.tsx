import { afterEach, describe, expect, test } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { InspectPromptPreferencesProvider } from "../../src/prompt/InspectPromptPreferencesContext";
import { INSPECT_PROMPT_ENABLED_STORAGE_KEY } from "../../src/prompt/inspectPromptPreferencesStorageKey";
import { useInspectPromptAccess } from "../../src/prompt/useInspectPromptAccess";

const wrapper = ({ children }: { children: ReactNode }) => (
  <InspectPromptPreferencesProvider>
    {children}
  </InspectPromptPreferencesProvider>
);

afterEach(() => localStorage.clear());

describe("useInspectPromptAccess", () => {
  test("launcherVisible requires eligible and the launcher preference", async () => {
    const { result, rerender } = renderHook(
      ({ eligible }) => useInspectPromptAccess(eligible),
      { initialProps: { eligible: true }, wrapper }
    );
    expect(result.current).toEqual({ eligible: true, launcherVisible: true });

    rerender({ eligible: false });
    expect(result.current).toEqual({ eligible: false, launcherVisible: false });
  });

  test("a switched-off launcher hides the button but keeps the tool usable", async () => {
    localStorage.setItem(INSPECT_PROMPT_ENABLED_STORAGE_KEY, "false");
    const { result } = renderHook(() => useInspectPromptAccess(true), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current).toEqual({ eligible: true, launcherVisible: false })
    );
  });
});
