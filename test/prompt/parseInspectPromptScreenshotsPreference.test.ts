import { describe, expect, test } from "bun:test";
import { parseInspectPromptScreenshotsPreference } from "../../src/prompt/parseInspectPromptScreenshotsPreference";

describe("parseInspectPromptScreenshotsPreference", () => {
  test("defaults to enabled when unset", () => {
    expect(parseInspectPromptScreenshotsPreference(null)).toBe(true);
    expect(parseInspectPromptScreenshotsPreference("true")).toBe(true);
  });

  test("reads false when stored as false", () => {
    expect(parseInspectPromptScreenshotsPreference("false")).toBe(false);
  });

  test("treats unrecognized values as enabled", () => {
    // A half-written or hand-edited value must not silently disable the
    // feature; only an explicit "false" turns it off.
    expect(parseInspectPromptScreenshotsPreference("")).toBe(true);
    expect(parseInspectPromptScreenshotsPreference("nope")).toBe(true);
  });
});
