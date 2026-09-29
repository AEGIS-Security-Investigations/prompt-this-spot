"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PenLine, X } from "lucide-react";
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
import { ANNOTATE_TEXT_INPUT_ATTR, AnnotatorBody } from "./AnnotatorBody";
import { useScreenshotAnnotationApi } from "./ScreenshotAnnotationContext";

/** Each tool's own dialog chrome, so the editor matches its drawer. */
export interface ScreenshotAnnotatorClasses {
  trigger: string;
  overlay: string;
  content: string;
  title: string;
  description: string;
  close: string;
  primaryAction: string;
}

interface ScreenshotAnnotatorProps {
  screenshot: InspectPromptScreenshot;
  classes: ScreenshotAnnotatorClasses;
  /** `inspect-prompt` or `user-feedback`; prefixes every test id. */
  testIdPrefix: string;
  /** Dialog heading. */
  title: string;
  /** One line under the heading saying what the markup is for. */
  description: string;
}

/**
 * "Mark up" button for one screenshot row, and the dialog it opens: draw
 * arrows, boxes, freehand lines and text on the capture, then save to upload
 * the marked-up image in place of the plain one.
 *
 * Renders nothing outside a {@link ScreenshotAnnotationProvider}, until the
 * shot has uploaded, or once its clean capture is no longer held.
 */
export const ScreenshotAnnotator = ({
  screenshot,
  classes,
  testIdPrefix,
  title,
  description,
}: ScreenshotAnnotatorProps) => {
  const api = useScreenshotAnnotationApi();
  const [open, setOpen] = useState(false);
  const source = api?.getSource(screenshot.id);

  if (!api || !source || screenshot.status !== "ready") {
    return null;
  }

  const marked = (screenshot.annotations?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${marked ? "Edit markup on" : "Mark up"} ${screenshot.label}`}
        title={marked ? "Edit markup" : "Mark up: draw arrows, boxes or text"}
        data-testid={`${testIdPrefix}-screenshot-annotate`}
        className={classes.trigger}
      >
        <PenLine className="h-3.5 w-3.5" />
      </button>

      <DialogPortal>
        <DialogOverlay
          {...{ [INSPECT_IGNORE_ATTR]: "" }}
          className={classes.overlay}
        />
        <DialogPrimitive.Content
          {...{ [INSPECT_IGNORE_ATTR]: "" }}
          data-testid={`${testIdPrefix}-annotate-modal`}
          className={classes.content}
          onEscapeKeyDown={(event) => {
            // Escape in the label box drops the label (its own handler); it
            // must not also throw away every mark by closing the dialog.
            if (
              event.target instanceof HTMLElement &&
              event.target.hasAttribute(ANNOTATE_TEXT_INPUT_ATTR)
            ) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className={classes.title}>{title}</DialogTitle>
            <DialogDescription className={classes.description}>
              {description}
            </DialogDescription>
          </DialogHeader>

          {open ? (
            <AnnotatorBody
              source={source}
              initialAnnotations={screenshot.annotations ?? []}
              primaryActionClassName={classes.primaryAction}
              testIdPrefix={testIdPrefix}
              onCancel={() => setOpen(false)}
              onSave={(annotations, dataUrl) => {
                api.annotate(screenshot.id, annotations, dataUrl);
                setOpen(false);
              }}
            />
          ) : null}

          <DialogPrimitive.Close
            type="button"
            aria-label="Close markup editor"
            className={classes.close}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
