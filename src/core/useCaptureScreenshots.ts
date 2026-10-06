"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ScreenshotAnnotation } from "../annotate/annotationTypes";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { captureDocumentRegion } from "./captureDocumentRegion";
import { makeInspectPromptId } from "./makeInspectPromptId";
import { readPageUrl } from "./readPageUrl";
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
import { withScreenshotTimeout } from "./withScreenshotTimeout";

/**
 * Owns the tool's screenshots: rasterizing a region of the live page, uploading
 * it to the public bucket, and tracking each shot's status for the drawer.
 *
 * Captures are queued rather than run concurrently — every call copies the
 * whole document and briefly marks the live page's sticky and fixed elements,
 * so two overlapping runs are both slow and would trip over each other's marks. Queueing also keeps rapid
 * multi-pick responsive: the click is never blocked on a rasterize.
 */
export const useCaptureScreenshots = (
  upload: CaptureScreenshotUploader
): InspectPromptScreenshots => {
  const { logError } = usePromptThisSpotConfig();
  const [screenshots, setScreenshots] = useState<InspectPromptScreenshot[]>([]);
  /** Tail of the capture queue; every new capture chains onto it. */
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  /**
   * Each shot's original capture thunk, kept so a failed one can be re-run on
   * exactly the region it was framed for. An element shot's rect was measured
   * at pick time against a page that may since have scrolled or navigated, so
   * re-deriving it on retry would silently photograph the wrong thing.
   */
  const capturesRef = useRef(new Map<string, () => Promise<string>>());
  /**
   * Each shot's clean capture, kept after upload so markup can be redrawn on
   * the original rather than stacked on an already-marked image. A ref, not
   * state: nothing renders from it, and megabytes of base64 in state would be
   * copied on every patch.
   */
  const sourcesRef = useRef(new Map<string, string>());

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
      queueRef.current = queueRef.current
        .then(async () => {
          if (!capturesRef.current.has(id)) {
            return;
          }
          const dataUrl = await capture();
          if (!capturesRef.current.has(id)) {
            return;
          }
          patch(id, { previewDataUrl: dataUrl, status: "uploading" });

          const uploaded = await withScreenshotTimeout(
            upload(dataUrl),
            20_000,
            "Screenshot upload timed out. Retry or remove this screenshot to continue."
          );
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
          if (!capturesRef.current.has(id)) {
            return;
          }
          patch(id, { status: "failed", error: message });
          logError("Screenshot failed", { err: error, screenshotId: id });
        });
    },
    [logError, patch, upload]
  );

  const enqueue = useCallback(
    (
      draft: Omit<InspectPromptScreenshot, "id">,
      capture: () => Promise<string>
    ) => {
      const id = makeInspectPromptId("shot");
      const captureAndKeep = async () => {
        const dataUrl = await withScreenshotTimeout(
          capture(),
          25_000,
          "Screenshot capture timed out. Retry or remove this screenshot to continue."
        );
        if (capturesRef.current.get(id) === captureAndKeep) {
          sourcesRef.current.set(id, dataUrl);
        }
        return dataUrl;
      };
      setScreenshots((prev) => [...prev, { ...draft, id }]);
      capturesRef.current.set(id, captureAndKeep);
      run(id, captureAndKeep);
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
    // Snapshotted now: the queue may not reach this capture until after the
    // app has navigated, and the shot must stay labelled with ITS page.
    const pageUrl = readPageUrl();
    enqueue(
      {
        kind: "page",
        selectionId: null,
        label: `Page · ${pathname}`,
        pathname,
        pageUrl,
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
      ({ selectionId, label, pathname, pageUrl, rect }) => {
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
            ...(pageUrl ? { pageUrl } : {}),
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

  const getScreenshotSource = useCallback(
    (id: string) => sourcesRef.current.get(id),
    []
  );

  const annotateScreenshot = useCallback(
    (id: string, annotations: ScreenshotAnnotation[], dataUrl: string) => {
      // From here a retry re-uploads this marked-up image; re-capturing the
      // page would silently throw the markup away.
      const upload = () => Promise.resolve(dataUrl);
      capturesRef.current.set(id, upload);
      // Out of "ready" until the new image is hosted, so neither the prompt
      // nor a feedback submit can cite the old, un-marked URL meanwhile.
      patch(id, {
        annotations,
        url: null,
        expiresAt: null,
        status: "uploading",
        error: null,
      });
      run(id, upload);
    },
    [patch, run]
  );

  const removeScreenshot = useCallback((id: string) => {
    capturesRef.current.delete(id);
    sourcesRef.current.delete(id);
    setScreenshots((prev) => prev.filter((shot) => shot.id !== id));
  }, []);

  const removeScreenshotsForSelection = useCallback((selectionId: string) => {
    setScreenshots((prev) =>
      prev.filter((shot) => {
        if (shot.selectionId !== selectionId) {
          return true;
        }
        capturesRef.current.delete(shot.id);
        sourcesRef.current.delete(shot.id);
        return false;
      })
    );
  }, []);

  const clearScreenshots = useCallback(() => {
    capturesRef.current.clear();
    sourcesRef.current.clear();
    setScreenshots([]);
  }, []);

  return useMemo(
    () => ({
      screenshots,
      // Removed or cleared work must not keep Copy/Send disabled. The queue
      // still serializes rendering and late completions cannot restore rows.
      busy: screenshots.some(
        (shot) => shot.status === "capturing" || shot.status === "uploading"
      ),
      capturePage,
      captureElement,
      retryScreenshot,
      setScreenshotNote,
      getScreenshotSource,
      annotateScreenshot,
      removeScreenshot,
      removeScreenshotsForSelection,
      clearScreenshots,
    }),
    [
      screenshots,
      capturePage,
      captureElement,
      retryScreenshot,
      setScreenshotNote,
      getScreenshotSource,
      annotateScreenshot,
      removeScreenshot,
      removeScreenshotsForSelection,
      clearScreenshots,
    ]
  );
};
