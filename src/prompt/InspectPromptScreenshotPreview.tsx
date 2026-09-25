"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import type { InspectPromptScreenshot } from "../core/types";
import { cn } from "../lib/cn";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "../ui/dialog";
import {
  inspectPromptHint,
  inspectPromptRawModalClose,
  inspectPromptRawModalOverlay,
  inspectPromptRawModalTitle,
  inspectPromptScreenshotPreviewContent,
  inspectPromptScreenshotPreviewImage,
  inspectPromptScreenshotThumbnailButton,
} from "./inspectPromptChromeClasses";

/** Marks the tool's own UI so it is never treated as an inspect target. */
const IGNORE_ATTR = "data-inspect-ignore";

interface InspectPromptScreenshotPreviewProps {
  screenshot: InspectPromptScreenshot;
  /** Hosted URL once uploaded, else the local canvas data URL. */
  source: string;
}

/**
 * Click a screenshot thumbnail to see it full size.
 *
 * The drawer thumbnail is 56px wide — enough to confirm *something* was
 * captured, nowhere near enough to check that the shot actually framed the
 * right thing. This is how the reviewer verifies the framing before handing the
 * prompt to an agent.
 */
export const InspectPromptScreenshotPreview = ({
  screenshot,
  source,
}: InspectPromptScreenshotPreviewProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={inspectPromptScreenshotThumbnailButton}
        data-testid="inspect-prompt-screenshot-thumbnail"
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
          {...{ [IGNORE_ATTR]: "" }}
          className={inspectPromptRawModalOverlay}
        />
        <DialogPrimitive.Content
          {...{ [IGNORE_ATTR]: "" }}
          data-testid="inspect-prompt-screenshot-modal"
          className={inspectPromptScreenshotPreviewContent}
        >
          <DialogHeader>
            <DialogTitle className={inspectPromptRawModalTitle}>
              {screenshot.label}
            </DialogTitle>
            <DialogDescription className={cn(inspectPromptHint, "font-mono")}>
              {screenshot.kind === "element"
                ? "Element with surrounding page context"
                : "Full page"}
              {screenshot.pathname ? ` · ${screenshot.pathname}` : null}
            </DialogDescription>
          </DialogHeader>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source}
            alt={`Full size screenshot of ${screenshot.label}`}
            className={inspectPromptScreenshotPreviewImage}
          />

          <DialogPrimitive.Close
            type="button"
            aria-label="Close screenshot preview"
            data-testid="inspect-prompt-screenshot-modal-close"
            className={inspectPromptRawModalClose}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
