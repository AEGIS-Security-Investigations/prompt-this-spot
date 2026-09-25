"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import type { InspectPromptScreenshot } from "../core/types";
import { INSPECT_IGNORE_ATTR } from "../core/usePickMode";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "../ui/dialog";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

interface UserFeedbackScreenshotPreviewProps {
  screenshot: InspectPromptScreenshot;
  /** Hosted URL once uploaded, else the local canvas data URL. */
  source: string;
}

/**
 * Click a screenshot thumbnail to see it full size.
 *
 * The same check the inspector gives a reviewer, for the person filing the
 * report: the 56px row thumbnail proves *something* was captured, and nowhere
 * near proves it framed the right thing. Better they notice a bad shot here
 * than after it reaches the review queue.
 */
export const UserFeedbackScreenshotPreview = ({
  screenshot,
  source,
}: UserFeedbackScreenshotPreviewProps) => {
  const {
    userFeedbackHint,
    userFeedbackPreviewClose,
    userFeedbackPreviewContent,
    userFeedbackPreviewImage,
    userFeedbackPreviewOverlay,
    userFeedbackPreviewTitle,
    userFeedbackThumbnailButton,
  } = useUserFeedbackTheme();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={userFeedbackThumbnailButton}
        data-testid="user-feedback-screenshot-thumbnail"
        aria-label={`View larger screenshot of ${screenshot.label}`}
        title="Click to view full size"
      >
        {/* Either a transient canvas data URL or a short-lived screenshot
            object — neither is a durable asset worth next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source}
          alt={`Screenshot of ${screenshot.label}`}
          className="h-full w-full rounded-[3px] object-cover"
        />
      </button>

      <DialogPortal>
        <DialogOverlay
          {...{ [INSPECT_IGNORE_ATTR]: "" }}
          className={userFeedbackPreviewOverlay}
        />
        <DialogPrimitive.Content
          {...{ [INSPECT_IGNORE_ATTR]: "" }}
          data-testid="user-feedback-screenshot-modal"
          className={userFeedbackPreviewContent}
        >
          <DialogHeader>
            <DialogTitle className={userFeedbackPreviewTitle}>
              {screenshot.label}
            </DialogTitle>
            <DialogDescription className={userFeedbackHint}>
              {screenshot.kind === "element"
                ? "The spot you pointed at, with the page around it"
                : "The whole page"}
              {screenshot.pathname ? ` · ${screenshot.pathname}` : null}
            </DialogDescription>
          </DialogHeader>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source}
            alt={`Full size screenshot of ${screenshot.label}`}
            className={userFeedbackPreviewImage}
          />

          <DialogPrimitive.Close
            type="button"
            aria-label="Close screenshot preview"
            data-testid="user-feedback-screenshot-modal-close"
            className={userFeedbackPreviewClose}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
