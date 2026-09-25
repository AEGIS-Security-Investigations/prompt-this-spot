"use client";

import type { InspectPromptScreenshot } from "../core/types";
import { cn } from "../lib/cn";
import { UserFeedbackScreenshotRow } from "./UserFeedbackScreenshotRow";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

interface UserFeedbackScreenshotListProps {
  screenshots: InspectPromptScreenshot[];
  onRemove: (id: string) => void;
  /** Re-run a failed shot's original capture. */
  onRetry: (id: string) => void;
}

/**
 * Screenshots attached to the report. Each row shows its thumbnail so the
 * reporter can confirm the picture framed the right thing before sending —
 * click one to see it full size.
 */
export const UserFeedbackScreenshotList = ({
  screenshots,
  onRemove,
  onRetry,
}: UserFeedbackScreenshotListProps) => {
  const {
    userFeedbackHint,
    userFeedbackSectionDivider,
    userFeedbackSectionLabel,
  } = useUserFeedbackTheme();
  if (screenshots.length === 0) {
    return null;
  }

  return (
    <div className={cn("border-t px-4 py-3", userFeedbackSectionDivider)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={userFeedbackSectionLabel}>Screenshots</span>
        <span className={cn(userFeedbackHint, "shrink-0 text-[10px]")}>
          Only our team can see these
        </span>
      </div>

      <ul
        className="flex max-h-60 flex-col gap-2 overflow-y-auto"
        data-testid="user-feedback-screenshot-list"
      >
        {screenshots.map((screenshot) => (
          <UserFeedbackScreenshotRow
            key={screenshot.id}
            screenshot={screenshot}
            onRemove={onRemove}
            onRetry={onRetry}
          />
        ))}
      </ul>
    </div>
  );
};
