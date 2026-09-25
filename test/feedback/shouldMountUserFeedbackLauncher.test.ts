import { describe, expect, it } from "bun:test";
import { shouldMountUserFeedbackLauncher } from "../../src/feedback/shouldMountUserFeedbackLauncher";

describe("shouldMountUserFeedbackLauncher", () => {
  it("hides the launcher in Playwright unless the spec opts in", () => {
    expect(
      shouldMountUserFeedbackLauncher({
        eligible: true,
        isAutomatedBrowser: true,
        e2eOptIn: false,
      })
    ).toBe(false);
  });

  it("shows the launcher in Playwright when the widget spec opts in", () => {
    expect(
      shouldMountUserFeedbackLauncher({
        eligible: true,
        isAutomatedBrowser: true,
        e2eOptIn: true,
      })
    ).toBe(true);
  });

  it("shows the launcher for a real eligible user", () => {
    expect(
      shouldMountUserFeedbackLauncher({
        eligible: true,
        isAutomatedBrowser: false,
        e2eOptIn: false,
      })
    ).toBe(true);
  });

  it("stays hidden when the viewer is not eligible", () => {
    expect(
      shouldMountUserFeedbackLauncher({
        eligible: false,
        isAutomatedBrowser: false,
        e2eOptIn: true,
      })
    ).toBe(false);
  });
});
