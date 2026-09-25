"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { describeElement } from "./buildInspectPrompt";
import type {
  CaptureScreenshotUploader,
  ElementDescription,
  InspectPromptScreenshot,
} from "./types";
import { useCaptureScreenshots } from "./useCaptureScreenshots";

export interface InspectPromptController {
  /** Whether the left drawer is mounted/visible. */
  drawerOpen: boolean;
  /** Whether click-to-pick mode is currently capturing the page. */
  pickMode: boolean;
  /** Accumulated selections, in pick order. */
  selections: ElementDescription[];
  /** Shared free-text request applied to all selections. */
  request: string;
  /** Bounding box of the element currently under the pointer (pick mode). */
  hoverRect: DOMRect | null;
  /** Captured screenshots (element shots + standalone page shots). */
  screenshots: InspectPromptScreenshot[];
  /** True while a capture or upload is in flight. */
  capturing: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  togglePickMode: () => void;
  /** Turn off pick mode without closing the drawer. */
  stopPickMode: () => void;
  /**
   * Derive + append a selection from a clicked element (dedupes), and kick off
   * its context screenshot. No-op returning null when the spot is already
   * selected, so a re-pick doesn't queue a duplicate capture.
   */
  addSelection: (
    element: Element,
    pathname: string
  ) => ElementDescription | null;
  removeSelection: (id: string) => void;
  clearSelections: () => void;
  /** Reset the tool: drop every selection, screenshot AND the request text. */
  clearAll: () => void;
  /** Capture the visible page as a standalone screenshot. Repeatable. */
  capturePageScreenshot: () => void;
  /** Re-run a failed screenshot's original capture. */
  retryScreenshot: (id: string) => void;
  /** Set the reviewer's per-shot note, which travels into the prompt. */
  setScreenshotNote: (id: string, note: string) => void;
  removeScreenshot: (id: string) => void;
  setRequest: (value: string) => void;
  setHoverRect: (rect: DOMRect | null) => void;
}

/**
 * Owns the inspect tool's state. `drawerOpen` and `pickMode` are independent:
 * closing the drawer also stops picking; turning picking on opens the drawer;
 * but the drawer can stay open with picking off (to review/edit selections).
 */
export interface CaptureControllerOptions {
  /** Where captured PNGs are stored. See {@link CaptureScreenshotUploader}. */
  upload: CaptureScreenshotUploader;
  /**
   * Whether picking a spot also queues a screenshot of it. The inspector
   * wires this to its screenshots preference; the feedback widget keeps it on.
   */
  screenshotsEnabled: boolean;
}

export const useCaptureController = ({
  upload,
  screenshotsEnabled,
}: CaptureControllerOptions): InspectPromptController => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [selections, setSelections] = useState<ElementDescription[]>([]);
  const [request, setRequest] = useState("");
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const {
    screenshots,
    busy: capturing,
    capturePage,
    captureElement,
    retryScreenshot,
    setScreenshotNote,
    removeScreenshot,
    removeScreenshotsForSelection,
    clearScreenshots,
  } = useCaptureScreenshots(upload);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setPickMode(false);
    setHoverRect(null);
  }, []);

  const togglePickMode = useCallback(() => {
    setPickMode((prev) => {
      const next = !prev;
      if (next) {
        setDrawerOpen(true);
      } else {
        setHoverRect(null);
      }
      return next;
    });
  }, []);

  const stopPickMode = useCallback(() => {
    setPickMode(false);
    setHoverRect(null);
  }, []);

  /**
   * Mirrors `selections` so `addSelection` can decide "already picked?" and
   * report it back to the caller synchronously. A `setSelections` updater runs
   * during React's render phase, not at call time, so the dedupe verdict is not
   * readable from inside one — and the caller needs it immediately to decide
   * whether to queue a screenshot.
   */
  const selectionsRef = useRef<ElementDescription[]>([]);

  const commitSelections = useCallback((next: ElementDescription[]) => {
    selectionsRef.current = next;
    setSelections(next);
  }, []);

  const addSelection = useCallback(
    (element: Element, pathname: string): ElementDescription | null => {
      const next = describeElement({ pathname, element });
      // Dedupe on the full-depth dedupeKey (the readable selector is
      // depth-limited and can collide across repeated layouts).
      if (selectionsRef.current.some((s) => s.dedupeKey === next.dedupeKey)) {
        return null;
      }

      // Read the box before anything else — the element is live at this instant,
      // which is the only moment its on-screen position is knowable.
      const rect = element.getBoundingClientRect();
      commitSelections([...selectionsRef.current, next]);

      // Every picked spot gets a screenshot of itself plus surrounding page, so
      // the agent can see where the target sits, not just what it is — unless
      // the reviewer has switched screenshots off, in which case picking still
      // records the selection and its DOM detail.
      if (screenshotsEnabled) {
        captureElement({
          selectionId: next.id,
          label: next.label,
          pathname,
          rect,
        });
      }
      return next;
    },
    [captureElement, commitSelections, screenshotsEnabled]
  );

  const removeSelection = useCallback(
    (id: string) => {
      commitSelections(selectionsRef.current.filter((s) => s.id !== id));
      removeScreenshotsForSelection(id);
    },
    [commitSelections, removeScreenshotsForSelection]
  );

  const clearSelections = useCallback(
    () => commitSelections([]),
    [commitSelections]
  );

  // The drawer's clear() control is a full reset, not just a selection wipe:
  // it also drops captured screenshots and empties the shared request so a
  // fresh prompt starts blank.
  const clearAll = useCallback(() => {
    commitSelections([]);
    setRequest("");
    clearScreenshots();
  }, [clearScreenshots, commitSelections]);

  return useMemo(
    () => ({
      drawerOpen,
      pickMode,
      selections,
      request,
      hoverRect,
      screenshots,
      capturing,
      openDrawer,
      closeDrawer,
      togglePickMode,
      stopPickMode,
      addSelection,
      removeSelection,
      clearSelections,
      clearAll,
      capturePageScreenshot: capturePage,
      retryScreenshot,
      setScreenshotNote,
      removeScreenshot,
      setRequest,
      setHoverRect,
    }),
    [
      drawerOpen,
      pickMode,
      selections,
      request,
      hoverRect,
      screenshots,
      capturing,
      openDrawer,
      closeDrawer,
      togglePickMode,
      stopPickMode,
      addSelection,
      removeSelection,
      clearSelections,
      clearAll,
      capturePage,
      retryScreenshot,
      setScreenshotNote,
      removeScreenshot,
    ]
  );
};
