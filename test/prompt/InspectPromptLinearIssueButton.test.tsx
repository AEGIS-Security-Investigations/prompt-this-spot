import { describe, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  type PromptThisSpotConfig,
  PromptThisSpotProvider,
} from "../../src/config/PromptThisSpotConfig";
import type { LinearIssueDraft } from "../../src/linear/linearIssueTypes";
import { InspectPromptLinearIssueButton } from "../../src/prompt/InspectPromptLinearIssueButton";

const INPUT = {
  request: "Make export full width",
  prompt: "the prompt",
  selections: [],
  screenshots: [],
  currentPageUrl: "https://app.example.com/orders",
};

const renderButton = (config: PromptThisSpotConfig) =>
  render(
    <PromptThisSpotProvider config={config}>
      <InspectPromptLinearIssueButton
        input={INPUT}
        disabled={false}
        onStopPick={() => {}}
      />
    </PromptThisSpotProvider>
  );

describe("InspectPromptLinearIssueButton", () => {
  test("is hidden when the app can't create tickets", () => {
    renderButton({});
    expect(
      screen.queryByTestId("inspect-prompt-create-linear-issue")
    ).toBeNull();
  });

  test("files the ticket with the edited title and links to it", async () => {
    const drafts: LinearIssueDraft[] = [];
    const notify = mock(() => {});
    renderButton({
      notify,
      createLinearIssue: async (draft) => {
        drafts.push(draft);
        return { identifier: "ENG-7", url: "https://app.example.com/ENG-7" };
      },
    });

    fireEvent.click(screen.getByTestId("inspect-prompt-create-linear-issue"));
    const title = screen.getByTestId(
      "inspect-prompt-linear-title"
    ) as HTMLInputElement;
    expect(title.value).toBe("Make export full width");

    fireEvent.change(title, { target: { value: "Widen export" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("inspect-prompt-linear-submit"));
    });

    expect(drafts[0]?.title).toBe("Widen export");
    expect(drafts[0]?.description).toContain("the prompt");
    const link = screen.getByTestId("inspect-prompt-linear-issue-link");
    expect(link.textContent).toContain("Created ENG-7");
    expect(link.getAttribute("href")).toBe("https://app.example.com/ENG-7");
    expect(screen.queryByTestId("inspect-prompt-linear-modal")).toBeNull();
    expect(notify).toHaveBeenCalled();
  });

  test("shows the route's error and keeps the dialog open", async () => {
    renderButton({
      createLinearIssue: async () => {
        throw new Error("Linear rejected the API key.");
      },
    });

    fireEvent.click(screen.getByTestId("inspect-prompt-create-linear-issue"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("inspect-prompt-linear-submit"));
    });

    expect(screen.getByTestId("inspect-prompt-linear-error").textContent).toBe(
      "Linear rejected the API key."
    );
    expect(screen.getByTestId("inspect-prompt-linear-modal")).toBeTruthy();
  });
});
