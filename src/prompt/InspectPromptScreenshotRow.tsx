"use client";

import { AlertTriangle, Camera, Loader2, RotateCw, Trash2 } from "lucide-react";
import {
  ScreenshotAnnotator,
  type ScreenshotAnnotatorClasses,
} from "../annotate/ScreenshotAnnotator";
import type { InspectPromptScreenshot } from "../core/types";
import { cn } from "../lib/cn";
import { InspectPromptCapturedPageUrl } from "./InspectPromptCapturedPageUrl";
import { InspectPromptScreenshotPreview } from "./InspectPromptScreenshotPreview";
import {
  inspectPromptHint,
  inspectPromptPanel,
  inspectPromptPrimaryAction,
  inspectPromptRawModalClose,
  inspectPromptRawModalOverlay,
  inspectPromptRawModalTitle,
  inspectPromptRemoveButton,
  inspectPromptRetryButton,
  inspectPromptScreenshotNoteInput,
  inspectPromptScreenshotPreviewContent,
  inspectPromptSelectionSelector,
  inspectPromptSelectionTitle,
} from "./inspectPromptChromeClasses";

interface InspectPromptScreenshotRowProps {
  screenshot: InspectPromptScreenshot;
  /** URL of the page the reviewer is on now. */
  currentPageUrl?: string;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}

const annotatorClasses: ScreenshotAnnotatorClasses = {
  trigger: inspectPromptRetryButton,
  overlay: inspectPromptRawModalOverlay,
  content: inspectPromptScreenshotPreviewContent,
  title: inspectPromptRawModalTitle,
  description: cn(inspectPromptHint, "font-mono"),
  close: inspectPromptRawModalClose,
  primaryAction: inspectPromptPrimaryAction,
};

/** One line of status text per shot, in plain English. */
const statusLabel = (screenshot: InspectPromptScreenshot): string => {
  switch (screenshot.status) {
    case "capturing":
      return "Capturing…";
    case "uploading":
      return "Uploading…";
    case "failed":
      return screenshot.error ?? "Failed";
    default: {
      const framing =
        screenshot.kind === "element"
          ? "Element + surrounding context"
          : "Full page";
      return screenshot.annotations?.length
        ? `${framing} · marked up`
        : framing;
    }
  }
};

const StatusIcon = ({
  status,
}: {
  status: InspectPromptScreenshot["status"];
}) => {
  if (status === "failed") {
    return (
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
    );
  }
  if (status === "ready") {
    return (
      <Camera className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
    );
  }
  return (
    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-400" />
  );
};

/**
 * One captured screenshot: thumbnail (click to enlarge), status, a per-shot
 * note that travels into the prompt, and remove/retry controls.
 */
export const InspectPromptScreenshotRow = ({
  screenshot,
  currentPageUrl = "",
  onRemove,
  onRetry,
  onNoteChange,
}: InspectPromptScreenshotRowProps) => {
  // The local canvas render shows immediately; once uploaded the row switches to
  // the hosted image, so a broken thumbnail is a visible warning that the URL in
  // the prompt won't load for the agent either.
  const thumbnail = screenshot.url ?? screenshot.previewDataUrl;

  return (
    <li
      data-testid="inspect-prompt-screenshot-item"
      data-status={screenshot.status}
      className={cn(inspectPromptPanel, "p-2.5")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          {thumbnail ? (
            <InspectPromptScreenshotPreview
              screenshot={screenshot}
              source={thumbnail}
            />
          ) : (
            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded border border-dashed border-violet-200/80 dark:border-violet-500/25">
              <StatusIcon status={screenshot.status} />
            </div>
          )}
          <div className="min-w-0">
            <p className={inspectPromptSelectionTitle}>{screenshot.label}</p>
            <p
              className={cn(
                inspectPromptSelectionSelector,
                screenshot.status === "failed" &&
                  "text-red-600 dark:text-red-400"
              )}
            >
              {statusLabel(screenshot)}
            </p>
            <InspectPromptCapturedPageUrl
              capturedUrl={screenshot.pageUrl}
              currentUrl={currentPageUrl}
              testId="inspect-prompt-screenshot-page-url"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <ScreenshotAnnotator
            screenshot={screenshot}
            classes={annotatorClasses}
            testIdPrefix="inspect-prompt"
            title={`Mark up · ${screenshot.label}`}
            description="Draw arrows, boxes or text. The agent gets the marked-up image."
          />
          {screenshot.status === "failed" ? (
            // Retry re-runs the ORIGINAL capture, not a page reload — reloading
            // would lose every selection and screenshot so far.
            <button
              type="button"
              onClick={() => onRetry(screenshot.id)}
              aria-label={`Retry screenshot of ${screenshot.label}`}
              data-testid="inspect-prompt-screenshot-retry"
              className={inspectPromptRetryButton}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(screenshot.id)}
            aria-label={`Remove screenshot of ${screenshot.label}`}
            data-testid="inspect-prompt-screenshot-remove"
            className={inspectPromptRemoveButton}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <input
        type="text"
        value={screenshot.note}
        onChange={(event) => onNoteChange(screenshot.id, event.target.value)}
        placeholder="// Note about this screenshot…"
        aria-label={`Note for screenshot of ${screenshot.label}`}
        data-testid="inspect-prompt-screenshot-note"
        className={inspectPromptScreenshotNoteInput}
      />
    </li>
  );
};
