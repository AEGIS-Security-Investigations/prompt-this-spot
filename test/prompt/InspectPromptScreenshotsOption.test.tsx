import { afterEach, describe, expect, test } from "bun:test";
import { fireEvent, render, within } from "@testing-library/react";
import { PromptThisSpotProvider } from "../../src/config/PromptThisSpotConfig";
import { InspectPromptCaptureControls } from "../../src/prompt/InspectPromptCaptureControls";
import { InspectPromptPreferencesProvider } from "../../src/prompt/InspectPromptPreferencesContext";
import { INSPECT_PROMPT_SCREENSHOTS_STORAGE_KEY } from "../../src/prompt/inspectPromptPreferencesStorageKey";

afterEach(() => localStorage.clear());

const renderControls = (promptScreenshotsToggle?: boolean) =>
  render(
    <PromptThisSpotProvider config={{ promptScreenshotsToggle }}>
      <InspectPromptPreferencesProvider>
        <InspectPromptCaptureControls
          pickMode={false}
          capturing={false}
          onTogglePick={() => {}}
          onCapturePage={() => {}}
        />
      </InspectPromptPreferencesProvider>
    </PromptThisSpotProvider>
  );

describe("promptScreenshotsToggle", () => {
  test("leaves the checkbox out by default", () => {
    const { container } = renderControls();
    expect(
      within(container).queryByTestId("inspect-prompt-screenshots")
    ).toBeNull();
  });

  test("switches screenshots off from the drawer", () => {
    const { container } = renderControls(true);
    const view = within(container);
    const checkbox = view.getByTestId("inspect-prompt-screenshots");
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(view.queryByTestId("inspect-prompt-capture-page")).not.toBeNull();

    fireEvent.click(checkbox);

    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    expect(view.queryByTestId("inspect-prompt-capture-page")).toBeNull();
    expect(localStorage.getItem(INSPECT_PROMPT_SCREENSHOTS_STORAGE_KEY)).toBe(
      "false"
    );
  });
});
