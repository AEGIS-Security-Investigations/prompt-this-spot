import { describe, expect, test } from "bun:test";
import { parseInspectPromptTestCoveragePreference } from "../../src/prompt/parseInspectPromptTestCoveragePreference";

describe("parseInspectPromptTestCoveragePreference", () => {
  test("defaults to off when unset", () => {
    // Opt-in, unlike the screenshot switch: it injects an instruction into every
    // prompt, so a reviewer who has never seen the box must not be opted in.
    expect(parseInspectPromptTestCoveragePreference(null)).toBe(false);
  });

  test("reads true when stored as true", () => {
    expect(parseInspectPromptTestCoveragePreference("true")).toBe(true);
  });

  test("treats unrecognized values as off", () => {
    expect(parseInspectPromptTestCoveragePreference("false")).toBe(false);
    expect(parseInspectPromptTestCoveragePreference("")).toBe(false);
    expect(parseInspectPromptTestCoveragePreference("yes")).toBe(false);
  });
});
