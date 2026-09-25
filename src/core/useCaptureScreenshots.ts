"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { captureDocumentRegion } from "./captureDocumentRegion";
import { makeInspectPromptId } from "./makeInspectPromptId";
import {
  resolveElementCaptureRect,
  resolveViewportCaptureRect,
} from "./resolveInspectCaptureRects";
import type {
  CaptureScreenshotUploader,
  InspectPromptScreenshot,
  InspectPromptScreenshots,
} from "./types";
import { withAppPushSuppressed } from "./withAppPushSuppressed";

/**
 * Owns the tool's screenshots: rasterizing a region of the live page, uploading
 * it to the public bucket, and tracking each shot's status for the drawer.
 *
 * Captures are queued rather than run concurrently — html2canvas clones the
 * whole document for every call, so two overlapping runs are both slow and
 * prone to capturing each other's scratch DOM. Queueing also keeps rapid
 * multi-pick responsive: the click is never blocked on a rasterize.
 */
export const useCaptureScreenshots = (
  upload: CaptureScreenshotUploader
): InspectPromptScreenshots => {
  const { logError } = usePromptThisSpotConfig();
  const [screenshots, setScreenshots] = useState<InspectPromptScreenshot[]>([]);
  const [pending, setPending] = useState(0);
  /** Tail of the capture queue; every new capture chains onto it. */
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  /**
   * Each shot's original capture thunk, kept so a failed one can be re-run on
   * exactly the region it was framed for. An element shot's rect was measured
   * at pick time against a page that may since have scrolled or navigated, so
   * re-deriving it on retry would silently photograph the wrong thing.
   */
  const capturesRef = useRef(new Map<string, () => Promise<string>>());

  const patch = useCallback(
    (id: string, changes: Partial<InspectPromptScreenshot>) => {
      setScreenshots((prev) =>
        prev.map((shot) => (shot.id === id ? { ...shot, ...changes } : shot))
      );
    },
    []
  );

  /** Chain one capture→upload run for `id` onto the tail of the queue. */
  const run = useCallback(
    (id: string, capture: () => Promise<string>) => {
      setPending((count) => count + 1);

      queueRef.current = queueRef.current
        .then(async () => {
          const dataUrl = await capture();
          patch(id, { previewDataUrl: dataUrl, status: "uploading" });

          const uploaded = await upload(dataUrl);
          patch(id, {
            url: uploaded.url,
            expiresAt: uploaded.expiresAt ?? null,
            status: "ready",
            error: null,
            // Drop the base64 payload now that the image is hosted. A 2000px
            // PNG data URL is megabytes of string per shot, and the drawer
            // thumbnail switches to the uploaded URL — which also proves the
            // object really is publicly readable before the prompt cites it.
            previewDataUrl: null,
          });
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Screenshot failed";
          logError("Screenshot failed", { err: error, screenshotId: id });
          patch(id, { status: "failed", error: message });
        })
        .finally(() => setPending((count) => Math.max(0, count - 1)));
    },
    [logError, patch, upload]
  );

  const enqueue = useCallback(
    (
      draft: Omit<InspectPromptScreenshot, "id">,
      capture: () => Promise<string>
    ) => {
      const id = makeInspectPromptId("shot");
      setScreenshots((prev) => [...prev, { ...draft, id }]);
      capturesRef.current.set(id, capture);
      run(id, capture);
    },
    [run]
  );

  const retryScreenshot = useCallback(
    (id: string) => {
      const capture = capturesRef.current.get(id);
      if (!capture) {
        return;
      }
      patch(id, { status: "capturing", error: null, previewDataUrl: null });
      run(id, capture);
    },
    [patch, run]
  );

  const capturePage = useCallback(() => {
    const pathname = window.location.pathname;
    enqueue(
      {
        kind: "page",
        selectionId: null,
        label: `Page · ${pathname}`,
        pathname,
        previewDataUrl: null,
        url: null,
        expiresAt: null,
        status: "capturing",
        error: null,
        note: "",
      },
      // The open drawer pushes the app shell right and narrows it. Revert that
      // for the duration of the shot so the AI sees the page at its real width
      // instead of a squeezed layout with a dead band down the left. The rect is
      // measured INSIDE the suppression, once the layout has snapped back.
      () =>
        withAppPushSuppressed(() =>
          captureDocumentRegion(resolveViewportCaptureRect())
        )
    );
  }, [enqueue]);

  const captureElement: InspectPromptScreenshots["captureElement"] =
    useCallback(
      ({ selectionId, label, pathname, rect }) => {
        // The rect is resolved to document coordinates NOW, at pick time — by
        // the time the queue reaches this capture the element may have moved,
        // or its dialog may have closed. The app-push transform is deliberately
        // left in place here: the rect was measured with it applied, so the
        // render has to keep it for the crop to land on the right pixels.
        const captureRect = resolveElementCaptureRect(rect);

        enqueue(
          {
            kind: "element",
            selectionId,
            label,
            pathname,
            previewDataUrl: null,
            url: null,
            expiresAt: null,
            status: "capturing",
            error: null,
            note: "",
          },
          () => captureDocumentRegion(captureRect)
        );
      },
      [enqueue]
    );

  const setScreenshotNote = useCallback(
    (id: string, note: string) => patch(id, { note }),
    [patch]
  );

  const removeScreenshot = useCallback((id: string) => {
    capturesRef.current.delete(id);
    setScreenshots((prev) => prev.filter((shot) => shot.id !== id));
  }, []);

  const removeScreenshotsForSelection = useCallback((selectionId: string) => {
    setScreenshots((prev) =>
      prev.filter((shot) => {
        if (shot.selectionId !== selectionId) {
          return true;
        }
        capturesRef.current.delete(shot.id);
        return false;
      })
    );
  }, []);

  const clearScreenshots = useCallback(() => {
    capturesRef.current.clear();
    setScreenshots([]);
  }, []);

  return useMemo(
    () => ({
      screenshots,
      busy: pending > 0,
      capturePage,
      captureElement,
      retryScreenshot,
      setScreenshotNote,
      removeScreenshot,
      removeScreenshotsForSelection,
      clearScreenshots,
    }),
    [
      screenshots,
      pending,
      capturePage,
      captureElement,
      retryScreenshot,
      setScreenshotNote,
      removeScreenshot,
      removeScreenshotsForSelection,
      clearScreenshots,
    ]
  );
};
