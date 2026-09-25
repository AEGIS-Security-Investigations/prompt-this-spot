import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, waitFor, within } from "@testing-library/react";
import {
  type PromptThisSpotConfig,
  PromptThisSpotProvider,
  type UserFeedbackSubmission,
} from "../../src/config/PromptThisSpotConfig";
import { UserFeedbackToolGate } from "../../src/feedback/UserFeedbackToolGate";

// happy-dom reports `navigator.webdriver`, which hides the launcher unless the
// E2E opt-in is set — exactly the path a Playwright spec takes.
const OPT_IN_KEY = "prompt-this-spot:e2e-user-feedback";
beforeEach(() => sessionStorage.setItem(OPT_IN_KEY, "1"));
afterEach(() => sessionStorage.clear());

// The drawer portals to <html>, outside <body>, so query the whole document.
const screen = within(document.documentElement);

// A tap is a pointerdown + pointerup with no movement in between (a move past
// the threshold is a drag to another corner instead).
const tapLauncher = async () => {
  const launcher = await screen.findByTestId("user-feedback-toggle");
  launcher.setPointerCapture = () => {};
  launcher.hasPointerCapture = () => false;
  fireEvent.pointerDown(launcher, { pointerId: 1, clientX: 5, clientY: 5 });
  fireEvent.pointerUp(launcher, { pointerId: 1, clientX: 5, clientY: 5 });
};

const renderGate = (config: PromptThisSpotConfig, eligible = true) =>
  render(
    <PromptThisSpotProvider config={config}>
      <UserFeedbackToolGate eligible={eligible} />
    </PromptThisSpotProvider>
  );

describe("UserFeedbackToolGate", () => {
  test("hides the launcher from automated browsers without the opt-in", async () => {
    sessionStorage.clear();
    renderGate({});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId("user-feedback-toggle")).toBeNull();
  });

  test("renders nothing for an ineligible viewer", () => {
    renderGate({}, false);
    expect(screen.queryByTestId("user-feedback-toggle")).toBeNull();
  });

  test("hands the report to the host app's submitFeedback adapter", async () => {
    const submitFeedback = mock(async (_: UserFeedbackSubmission) => {});
    const notify = mock(() => {});
    renderGate({ submitFeedback, notify });

    await tapLauncher();
    const message = await screen.findByTestId("user-feedback-message");
    fireEvent.change(message, {
      target: { value: "  The Save button is grey  " },
    });
    fireEvent.click(screen.getByTestId("user-feedback-submit"));

    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));
    const submission = submitFeedback.mock.calls[0]?.[0];
    expect(submission?.message).toBe("The Save button is grey");
    expect(submission?.category).toBe("BUG");
    expect(submission?.promptText).toContain("The Save button is grey");
    expect(submission?.selections).toEqual([]);
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Thanks — we got it" })
      )
    );
  });

  test("shows the adapter's error inline when a submit fails", async () => {
    renderGate({
      submitFeedback: async () => {
        throw new Error("Server said no");
      },
    });

    await tapLauncher();
    fireEvent.change(await screen.findByTestId("user-feedback-message"), {
      target: { value: "Broken" },
    });
    fireEvent.click(screen.getByTestId("user-feedback-submit"));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Server said no"
    );
  });
});
