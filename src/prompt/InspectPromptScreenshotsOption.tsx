"use client";

import { cn } from "../lib/cn";
import { Checkbox } from "../ui/checkbox";
import { useInspectPromptPreferences } from "./InspectPromptPreferencesContext";
import { inspectPromptHint } from "./inspectPromptChromeClasses";
import {
  inspectPromptOptionCheckbox,
  inspectPromptOptionLabel,
  inspectPromptOptionRow,
} from "./inspectPromptOptionClasses";

/**
 * "Capture screenshots" — the drawer's own switch for the screenshots
 * preference, shown when `PromptThisSpotConfig.promptScreenshotsToggle` is on.
 * Apps with a settings UI of their own can drive the same preference through
 * {@link useInspectPromptPreferences} instead.
 *
 * With it off, picking still records the DOM detail, which is what an app
 * without screenshot storage configured wants.
 */
export const InspectPromptScreenshotsOption = () => {
  const { screenshotsEnabled, setScreenshotsEnabled } =
    useInspectPromptPreferences();

  return (
    <div className={cn(inspectPromptOptionRow, "mt-2.5")}>
      <Checkbox
        id="inspect-prompt-screenshots"
        data-testid="inspect-prompt-screenshots"
        className={inspectPromptOptionCheckbox}
        checked={screenshotsEnabled}
        onCheckedChange={(checked) => setScreenshotsEnabled(checked === true)}
      />
      <div className="min-w-0">
        <label
          htmlFor="inspect-prompt-screenshots"
          className={inspectPromptOptionLabel}
        >
          Capture screenshots
        </label>
        <p className={cn(inspectPromptHint, "mt-1")}>
          Uploads each pick (and the page button) as an image the agent can
          open. Turn off to send DOM detail only.
        </p>
      </div>
    </div>
  );
};
