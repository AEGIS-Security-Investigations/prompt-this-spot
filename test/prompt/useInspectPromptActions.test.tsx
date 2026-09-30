import { describe, expect, it, mock, spyOn } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { PromptThisSpotProvider } from "../../src/config/PromptThisSpotConfig";
import type { ElementDescription } from "../../src/core/types";
import { useInspectPromptActions } from "../../src/prompt/useInspectPromptActions";

const SELECTION: ElementDescription = {
  id: "sel-1",
  label: 'button · "Go"',
  selector: 'button[data-testid="cta"]',
  dedupeKey: '/dashboard|button[data-testid="cta"]',
  block: '- What it shows: "Go"\n- Element: <button>',
  pathname: "/dashboard",
};

describe("useInspectPromptActions test-coverage wiring", () => {
  it("folds the coverage ask into the assembled prompt", () => {
    const { result } = renderHook(() =>
      useInspectPromptActions([SELECTION], "Make it blue", [], true)
    );

    expect(result.current.rawPrompt).toContain(
      "Also cover this change with automated tests:"
    );
  });

  it("leaves it out when the box is unticked", () => {
    const { result } = renderHook(() =>
      useInspectPromptActions([SELECTION], "Make it blue", [], false)
    );

    expect(result.current.rawPrompt).not.toContain("automated tests");
  });

  it("rebuilds the prompt when the box is toggled", () => {
    const { result, rerender } = renderHook(
      ({ coverage }: { coverage: boolean }) =>
        useInspectPromptActions([SELECTION], "Make it blue", [], coverage),
      { initialProps: { coverage: false } }
    );

    const before = result.current.rawPrompt;
    expect(before).not.toContain("automated tests");

    // Ticking the box must rewrite the text the copy/send buttons act on —
    // otherwise the reviewer copies a prompt that silently omits the ask.
    rerender({ coverage: true });
    expect(result.current.rawPrompt).toContain(
      "Also cover this change with automated tests:"
    );

    rerender({ coverage: false });
    expect(result.current.rawPrompt).toBe(before);
  });
});

describe("useInspectPromptActions page URL and repository", () => {
  const PAGE_URL = "https://preview.example.dev/dashboard?tab=billing#usage";
  const ON_PAGE: ElementDescription = { ...SELECTION, pageUrl: PAGE_URL };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <PromptThisSpotProvider config={{ repoSlug: "acme/web-app" }}>
      {children}
    </PromptThisSpotProvider>
  );

  const renderActions = () =>
    renderHook(
      () => useInspectPromptActions([ON_PAGE], "Make it blue", [], false),
      { wrapper }
    );

  it("puts the repository and full page URL in the assembled prompt", () => {
    const { result } = renderActions();

    expect(result.current.rawPrompt).toContain("Repository: acme/web-app");
    expect(result.current.rawPrompt).toContain(`Page URL: ${PAGE_URL}`);
  });

  it("copies exactly the previewed prompt", async () => {
    const writeText = mock(async (_text: string) => {});
    const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    try {
      const { result } = renderActions();
      await act(() => result.current.handleCopy());

      expect(writeText).toHaveBeenCalledWith(result.current.rawPrompt);
      expect(writeText.mock.calls[0]?.[0]).toContain(`Page URL: ${PAGE_URL}`);
    } finally {
      if (original) {
        Object.defineProperty(navigator, "clipboard", original);
      }
    }
  });

  it("hands Claude Code on the web the same prompt text", () => {
    const open = spyOn(window, "open").mockImplementation(() => null);
    try {
      const { result } = renderActions();
      act(() => result.current.handleSendToWeb());

      const url = new URL(String(open.mock.calls[0]?.[0]));
      expect(url.searchParams.get("prompt")).toBe(result.current.rawPrompt);
      expect(url.searchParams.get("prompt")).toContain(`Page URL: ${PAGE_URL}`);
      expect(url.searchParams.get("repositories")).toBe("acme/web-app");
    } finally {
      open.mockRestore();
    }
  });

  it("hands local Claude Code the same prompt text", () => {
    // Capture the deep link instead of letting happy-dom try to navigate to a
    // custom scheme.
    let assigned = "";
    const original = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        set href(value: string) {
          assigned = value;
        },
      },
    });
    try {
      const { result } = renderActions();
      act(() => result.current.handleOpenLocal());

      const url = new URL(assigned);
      expect(url.protocol).toBe("claude-cli:");
      expect(url.searchParams.get("q")).toBe(result.current.rawPrompt);
      expect(url.searchParams.get("q")).toContain(`Page URL: ${PAGE_URL}`);
      expect(url.searchParams.get("repo")).toBe("acme/web-app");
    } finally {
      if (original) {
        Object.defineProperty(window, "location", original);
      }
    }
  });
});
