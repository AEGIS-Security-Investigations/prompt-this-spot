import { afterEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  PromptThisSpotProvider,
  type UserFeedbackSubmission,
} from "../../src/config/PromptThisSpotConfig";
import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../../src/core/types";
import { useUserFeedbackSubmit } from "../../src/feedback/useUserFeedbackSubmit";

interface HappyDomWindow {
  happyDOM: { setURL: (url: string) => void };
}

afterEach(() =>
  (window as unknown as HappyDomWindow).happyDOM.setURL("about:blank")
);

const SELECTION: ElementDescription = {
  id: "sel-1",
  label: 'button · "Save"',
  selector: 'button[data-testid="save"]',
  dedupeKey: '/settings|button[data-testid="save"]',
  block: '- What it shows: "Save"\n- Element: <button>',
  pathname: "/settings",
  pageUrl: "https://app.example.com/settings?tab=profile",
};

const SHOT: InspectPromptScreenshot = {
  id: "shot-1",
  kind: "page",
  selectionId: null,
  label: "Page · /settings",
  pathname: "/settings",
  pageUrl: "https://app.example.com/settings?tab=profile",
  previewDataUrl: null,
  url: "https://cdn.example.test/feedback.png",
  expiresAt: null,
  status: "ready",
  error: null,
  note: "",
};

const submitWith = async () => {
  (window as unknown as HappyDomWindow).happyDOM.setURL(
    "https://app.example.com/settings?tab=profile"
  );
  const submitFeedback = mock(
    async (_submission: UserFeedbackSubmission) => {}
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PromptThisSpotProvider
      config={{ repoSlug: "acme/web-app", submitFeedback }}
    >
      {children}
    </PromptThisSpotProvider>
  );
  const { result } = renderHook(
    () =>
      useUserFeedbackSubmit({
        message: "The save button does nothing",
        category: "BUG",
        selections: [SELECTION],
        screenshots: [SHOT],
        onSubmitted: () => {},
      }),
    { wrapper }
  );
  await act(() => result.current.submit());
  const submission = submitFeedback.mock.calls[0]?.[0];
  if (!submission) {
    throw new Error("submitFeedback was not called");
  }
  return submission;
};

describe("useUserFeedbackSubmit page URL", () => {
  it("carries the repository and page URL inside promptText", async () => {
    const submission = await submitWith();

    expect(submission.promptText).toContain("Repository: acme/web-app");
    expect(submission.promptText).toContain(
      "Page URL: https://app.example.com/settings?tab=profile"
    );
    expect(submission.pathname).toBe("/settings");
  });

  it("keeps the submission's structured shape exactly as before", async () => {
    // Hosts spread this object into typed API inputs (e.g. GraphQL variables),
    // where an unexpected field is rejected. New context rides in promptText.
    const submission = await submitWith();

    expect(Object.keys(submission).sort()).toEqual(
      [
        "category",
        "message",
        "pathname",
        "promptText",
        "screenshots",
        "selections",
        "viewportHeight",
        "viewportWidth",
      ].sort()
    );
    expect(Object.keys(submission.selections[0] ?? {}).sort()).toEqual(
      ["block", "label", "pathname", "selector"].sort()
    );
    expect(Object.keys(submission.screenshots[0] ?? {}).sort()).toEqual(
      ["expiresAt", "kind", "label", "note", "pathname", "url"].sort()
    );
  });
});
