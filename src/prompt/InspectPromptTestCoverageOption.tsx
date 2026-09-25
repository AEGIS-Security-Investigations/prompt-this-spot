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

interface InspectPromptTestCoverageOptionProps {
  /** Called after a toggle so the drawer can clear its "copied" state. */
  onToggle: () => void;
}

/**
 * "Ask for e2e / unit test coverage" — appends a standing instruction to the
 * assembled prompt so a reviewer who wants tests doesn't have to type it into
 * the request box every time.
 *
 * The choice lives in {@link useInspectPromptPreferences} (localStorage) rather
 * than in the drawer's per-prompt state: it's a working preference, not part of
 * the spot being described, so `clear()` must not reset it.
 */
export const InspectPromptTestCoverageOption = ({
  onToggle,
}: InspectPromptTestCoverageOptionProps) => {
  const { testCoverageRequested, setTestCoverageRequested } =
    useInspectPromptPreferences();

  return (
    <div className={inspectPromptOptionRow}>
      <Checkbox
        id="inspect-prompt-test-coverage"
        data-testid="inspect-prompt-test-coverage"
        className={inspectPromptOptionCheckbox}
        checked={testCoverageRequested}
        onCheckedChange={(checked) => {
          // Radix reports "indeterminate" for tri-state checkboxes; this one is
          // binary, so anything but a true tick reads as off.
          setTestCoverageRequested(checked === true);
          onToggle();
        }}
      />
      <div className="min-w-0">
        <label
          htmlFor="inspect-prompt-test-coverage"
          className={inspectPromptOptionLabel}
        >
          Ask for e2e / unit test coverage
        </label>
        <p className={cn(inspectPromptHint, "mt-1")}>
          Adds a line telling the agent to write unit tests and a Playwright
          spec for the change, and to run them until they pass.
        </p>
      </div>
    </div>
  );
};
