"use client";

import { AlertTriangle, Camera, RotateCw, Trash2 } from "lucide-react";
import type { InspectPromptScreenshot } from "../core/types";
import { cn } from "../lib/cn";
import { Spinner } from "../ui/spinner";
import { UserFeedbackScreenshotPreview } from "./UserFeedbackScreenshotPreview";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

interface UserFeedbackScreenshotRowProps {
  screenshot: InspectPromptScreenshot;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

/** One line of status text per shot, in plain English. */
const statusLabel = (screenshot: InspectPromptScreenshot): string => {
  switch (screenshot.status) {
    case "capturing":
      return "Taking the picture…";
    case "uploading":
      return "Attaching…";
    case "failed":
      return screenshot.error ?? "Screenshot failed";
    default:
      return screenshot.kind === "element"
        ? "The spot, with the page around it"
        : "The whole page";
  }
};

const StatusIcon = ({
  status,
}: {
  status: InspectPromptScreenshot["status"];
}) => {
  const { userFeedbackStatusFailedIcon, userFeedbackStatusReadyIcon } =
    useUserFeedbackTheme();
  if (status === "failed") {
    return (
      <AlertTriangle className={userFeedbackStatusFailedIcon} aria-hidden />
    );
  }
  if (status === "ready") {
    return <Camera className={userFeedbackStatusReadyIcon} aria-hidden />;
  }
  return <Spinner size="sm" className="shrink-0" />;
};

/**
 * One attached screenshot: thumbnail (click to enlarge), status, and
 * remove/retry controls.
 *
 * The inspector's per-shot note field is deliberately absent. A reviewer
 * annotates each image because the prompt carries several of them to an agent;
 * a reporter has one message box and should not be asked to caption pictures.
 */
export const UserFeedbackScreenshotRow = ({
  screenshot,
  onRemove,
  onRetry,
}: UserFeedbackScreenshotRowProps) => {
  const {
    userFeedbackPanel,
    userFeedbackSectionDivider,
    userFeedbackRemoveButton,
    userFeedbackRetryButton,
    userFeedbackRowMeta,
    userFeedbackRowMetaFailed,
    userFeedbackRowTitle,
    userFeedbackThumbnailPlaceholder,
  } = useUserFeedbackTheme();
  // The local canvas render shows immediately; once uploaded the row switches
  // to the hosted image, so a broken thumbnail is a visible warning that the
  // stored screenshot won't load for whoever reads the report either.
  const thumbnail = screenshot.url ?? screenshot.previewDataUrl;
  const failed = screenshot.status === "failed";

  return (
    <li
      data-testid="user-feedback-screenshot-item"
      data-status={screenshot.status}
      className={cn(userFeedbackPanel, "p-2.5")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          {thumbnail ? (
            <UserFeedbackScreenshotPreview
              screenshot={screenshot}
              source={thumbnail}
            />
          ) : (
            <div
              className={cn(
                userFeedbackThumbnailPlaceholder,
                userFeedbackSectionDivider
              )}
            >
              <StatusIcon status={screenshot.status} />
            </div>
          )}
          <div className="min-w-0">
            <p className={userFeedbackRowTitle}>{screenshot.label}</p>
            <p
              className={cn(
                userFeedbackRowMeta,
                failed && userFeedbackRowMetaFailed
              )}
            >
              {statusLabel(screenshot)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {/*
            Retry re-runs the shot's ORIGINAL capture, framed on the region it
            was taken for — re-deriving it now could photograph something else
            entirely if the page has since scrolled.
          */}
          {failed ? (
            <button
              type="button"
              onClick={() => onRetry(screenshot.id)}
              aria-label={`Retry ${screenshot.label}`}
              data-testid="user-feedback-screenshot-retry"
              className={userFeedbackRetryButton}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(screenshot.id)}
            aria-label={`Remove ${screenshot.label}`}
            data-testid="user-feedback-screenshot-remove"
            className={userFeedbackRemoveButton}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  );
};
