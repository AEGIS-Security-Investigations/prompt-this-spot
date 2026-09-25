"use client";

import type { InspectPromptScreenshot } from "../core/types";
import { cn } from "../lib/cn";
import { InspectPromptScreenshotRow } from "./InspectPromptScreenshotRow";
import {
  inspectPromptHint,
  inspectPromptSectionDivider,
  inspectPromptSectionLabel,
} from "./inspectPromptChromeClasses";

interface InspectPromptScreenshotListProps {
  screenshots: InspectPromptScreenshot[];
  onRemove: (id: string) => void;
  /** Re-run a failed shot's original capture. */
  onRetry: (id: string) => void;
  /** Update a shot's note, which travels into the prompt beside its URL. */
  onNoteChange: (id: string, note: string) => void;
}

/**
 * Screenshots attached to the current prompt. Each row shows the captured
 * thumbnail so the reviewer can confirm the shot framed the right thing before
 * handing the prompt to an AI agent — click one to see it full size.
 */
export const InspectPromptScreenshotList = ({
  screenshots,
  onRemove,
  onRetry,
  onNoteChange,
}: InspectPromptScreenshotListProps) => {
  if (screenshots.length === 0) {
    return null;
  }

  return (
    <div className={cn("border-t px-4 py-3", inspectPromptSectionDivider)}>
      <div className="mb-2 flex items-center justify-between">
        <span className={inspectPromptSectionLabel}>{"// Screenshots"}</span>
        <span className={cn(inspectPromptHint, "font-mono text-[10px]")}>
          expire in 7 days
        </span>
      </div>

      <ul
        className="flex max-h-72 flex-col gap-2 overflow-y-auto"
        data-testid="inspect-prompt-screenshot-list"
      >
        {screenshots.map((screenshot) => (
          <InspectPromptScreenshotRow
            key={screenshot.id}
            screenshot={screenshot}
            onRemove={onRemove}
            onRetry={onRetry}
            onNoteChange={onNoteChange}
          />
        ))}
      </ul>
    </div>
  );
};
