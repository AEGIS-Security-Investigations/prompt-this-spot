import { describe, expect, test } from "bun:test";
import {
  buildClaudeCodeDeepLink,
  buildClaudeCodeWebUrl,
} from "../../src/prompt/claudeCodeLinks";

const REPO = "acme/widgets";

describe("claudeCodeLinks", () => {
  test("web URL points at claude.ai/code with prompt + repo pre-filled", () => {
    const url = buildClaudeCodeWebUrl("Make the button blue", REPO);

    expect(url.startsWith("https://claude.ai/code?")).toBe(true);
    expect(url).toContain("prompt=Make%20the%20button%20blue");
    expect(url).toContain(`repositories=${encodeURIComponent(REPO)}`);
  });

  test("web URL leaves the repository out when none is configured", () => {
    expect(buildClaudeCodeWebUrl("Hi")).toBe(
      "https://claude.ai/code?prompt=Hi"
    );
  });

  test("deep link uses the claude-cli scheme with repo + q params", () => {
    const url = buildClaudeCodeDeepLink("Fix the spacing", REPO);

    expect(url.startsWith("claude-cli://open?")).toBe(true);
    expect(url).toContain(`repo=${encodeURIComponent(REPO)}`);
    expect(url).toContain("q=Fix%20the%20spacing");
  });

  test("deep link leaves the repository out when none is configured", () => {
    expect(buildClaudeCodeDeepLink("Hi")).toBe("claude-cli://open?q=Hi");
  });

  test("encodes newlines as %0A, not + (handler decodes %20/%0A)", () => {
    const prompt = "Line one\nLine two";

    // %0A for the newline, %20 for spaces — never a bare "+" for spaces.
    expect(buildClaudeCodeWebUrl(prompt, REPO)).toContain(
      "prompt=Line%20one%0ALine%20two"
    );
    expect(buildClaudeCodeDeepLink(prompt, REPO)).toContain(
      "q=Line%20one%0ALine%20two"
    );
  });

  test("escapes reserved characters so they survive in the query", () => {
    const prompt = 'Use "quotes" & <tags> here';
    const encoded = encodeURIComponent(prompt);

    expect(buildClaudeCodeWebUrl(prompt, REPO)).toContain(`prompt=${encoded}`);
    expect(buildClaudeCodeDeepLink(prompt, REPO)).toContain(`q=${encoded}`);
  });
});
