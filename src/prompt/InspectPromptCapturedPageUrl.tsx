"use client";

import { inspectPromptCapturedPageUrl } from "./inspectPromptChromeClasses";

interface InspectPromptCapturedPageUrlProps {
  /** URL snapshotted when the selection or shot was captured. */
  capturedUrl: string | undefined;
  /** URL of the page the reviewer is on now. */
  currentUrl: string;
  testId: string;
}

/**
 * Says which page a selection or screenshot came from, but only once the
 * reviewer has navigated away from it — on the same page it would just repeat
 * the "Current page" line. The full URL is in the tooltip.
 */
export const InspectPromptCapturedPageUrl = ({
  capturedUrl,
  currentUrl,
  testId,
}: InspectPromptCapturedPageUrlProps) => {
  if (!capturedUrl || capturedUrl === currentUrl) {
    return null;
  }
  return (
    <p
      className={inspectPromptCapturedPageUrl}
      title={capturedUrl}
      data-testid={testId}
    >
      captured on {capturedUrl}
    </p>
  );
};
