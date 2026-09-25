import { describe, expect, test } from "bun:test";
import * as entry from "../src/inspect-prompt";

describe("prompt-this-spot/inspect-prompt", () => {
  test("mounts the inspector without re-exporting either tool", () => {
    expect(entry.InspectPromptToolGate).toBeFunction();
    expect(entry.PromptThisSpotProvider).toBeFunction();
    expect(entry.InspectPromptPreferencesProvider).toBeFunction();
    expect(entry.FloatingLauncherStackProvider).toBeFunction();
    expect(entry.createScreenshotUploader).toBeFunction();
    expect(Object.keys(entry)).not.toContain("InspectPromptTool");
    expect(Object.keys(entry)).not.toContain("UserFeedbackToolGate");
  });
});
