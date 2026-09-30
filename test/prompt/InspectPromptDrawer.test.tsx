import { afterEach, describe, expect, test } from "bun:test";
import { act, render, within } from "@testing-library/react";
import { PromptThisSpotProvider } from "../../src/config/PromptThisSpotConfig";
import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../../src/core/types";
import { InspectPromptDrawer } from "../../src/prompt/InspectPromptDrawer";
import { InspectPromptPreferencesProvider } from "../../src/prompt/InspectPromptPreferencesContext";

interface HappyDomWindow {
  happyDOM: { setURL: (url: string) => void };
}

const setUrl = (url: string) =>
  (window as unknown as HappyDomWindow).happyDOM.setURL(url);

afterEach(() => {
  setUrl("about:blank");
  localStorage.clear();
});

const FIRST_PAGE = "https://app.example.com/orders?status=open";

const SELECTION: ElementDescription = {
  id: "sel-1",
  label: 'button · "Export"',
  selector: 'button[data-testid="export"]',
  dedupeKey: '/orders|button[data-testid="export"]',
  block: '- What it shows: "Export"\n- Element: <button>',
  pathname: "/orders",
  pageUrl: FIRST_PAGE,
};

const SHOT: InspectPromptScreenshot = {
  id: "shot-1",
  kind: "page",
  selectionId: null,
  label: "Page · /orders",
  pathname: "/orders",
  pageUrl: FIRST_PAGE,
  previewDataUrl: null,
  url: null,
  expiresAt: null,
  status: "uploading",
  error: null,
  note: "",
};

const noop = () => {};

const renderDrawer = (open = true) =>
  render(
    <PromptThisSpotProvider config={{ repoSlug: "acme/web-app" }}>
      <InspectPromptPreferencesProvider>
        <InspectPromptDrawer
          open={open}
          pickMode={false}
          selections={[SELECTION]}
          screenshots={[SHOT]}
          capturing={false}
          request=""
          onTogglePick={noop}
          onStopPick={noop}
          onRemove={noop}
          onRemoveScreenshot={noop}
          onRetryScreenshot={noop}
          onScreenshotNoteChange={noop}
          onCapturePage={noop}
          onClear={noop}
          onRequestChange={noop}
          onClose={noop}
        />
      </InspectPromptPreferencesProvider>
    </PromptThisSpotProvider>
  );

describe("InspectPromptDrawer current page", () => {
  test("shows the full, sanitized current URL", () => {
    setUrl(`${FIRST_PAGE}&access_token=abc#totals`);
    const view = within(renderDrawer().container);

    expect(view.getByTestId("inspect-prompt-page-url-value").textContent).toBe(
      "https://app.example.com/orders?status=open&access_token=REDACTED#totals"
    );
  });

  test("captures from the current page carry no 'captured on' label", () => {
    setUrl(FIRST_PAGE);
    const view = within(renderDrawer().container);

    expect(view.queryByTestId("inspect-prompt-list-item-page-url")).toBeNull();
    expect(view.queryByTestId("inspect-prompt-screenshot-page-url")).toBeNull();
  });

  test("after navigating, the current URL updates and earlier captures say where they came from", () => {
    setUrl(FIRST_PAGE);
    const view = within(renderDrawer().container);

    act(() => {
      setUrl("https://app.example.com/orders/42?tab=items");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(view.getByTestId("inspect-prompt-page-url-value").textContent).toBe(
      "https://app.example.com/orders/42?tab=items"
    );
    expect(
      view.getByTestId("inspect-prompt-list-item-page-url").textContent
    ).toBe(`captured on ${FIRST_PAGE}`);
    expect(
      view.getByTestId("inspect-prompt-screenshot-page-url").textContent
    ).toBe(`captured on ${FIRST_PAGE}`);
  });
});
