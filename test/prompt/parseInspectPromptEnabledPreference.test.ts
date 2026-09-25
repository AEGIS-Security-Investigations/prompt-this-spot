import { describe, expect, test } from "bun:test";
import { parseInspectPromptEnabledPreference } from "../../src/prompt/parseInspectPromptEnabledPreference";

describe("parseInspectPromptEnabledPreference", () => {
  test("defaults to enabled when unset", () => {
    expect(parseInspectPromptEnabledPreference(null)).toBe(true);
    expect(parseInspectPromptEnabledPreference("true")).toBe(true);
  });

  test("reads false when stored as false", () => {
    expect(parseInspectPromptEnabledPreference("false")).toBe(false);
  });
});
