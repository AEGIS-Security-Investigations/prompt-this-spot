import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react";
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
