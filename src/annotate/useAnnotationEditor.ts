"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { makeInspectPromptId } from "../core/makeInspectPromptId";
import { DEFAULT_ANNOTATION_COLOR } from "./annotationColors";
import {
  annotationStrokeWidth,
  isMeaningfulDrag,
  toImagePoint,
} from "./annotationGeometry";
import type {
  AnnotationPoint,
  AnnotationTool,
  ScreenshotAnnotation,
} from "./annotationTypes";

/** A text label waiting for the reviewer to type it, in image pixels. */
export interface PendingText {
  at: AnnotationPoint;
  value: string;
}

export interface AnnotationEditor {
  tool: AnnotationTool;
  setTool: (tool: AnnotationTool) => void;
  color: string;
  setColor: (color: string) => void;
  /** Finished shapes, oldest first. */
  annotations: ScreenshotAnnotation[];
  /** The shape under the pointer mid-drag, drawn but not yet committed. */
  draft: ScreenshotAnnotation | null;
  pendingText: PendingText | null;
  setPendingTextValue: (value: string) => void;
  commitPendingText: () => void;
  cancelPendingText: () => void;
  undo: () => void;
  clear: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
}

/**
 * State for the markup editor: the active tool and colour, the committed
 * shapes, the one being dragged, and a text label being typed.
 *
 * Pointer events (not mouse events) so a finger or stylus draws the same as a
 * mouse, which matters for the feedback widget on phones. The canvas captures
 * the pointer on press, so a drag that leaves the canvas keeps tracking and
 * ends clamped to the image edge.
 */
export const useAnnotationEditor = (
  image: { width: number; height: number } | null,
  initial: readonly ScreenshotAnnotation[]
): AnnotationEditor => {
  const [tool, setTool] = useState<AnnotationTool>("arrow");
  const [color, setColor] = useState<string>(DEFAULT_ANNOTATION_COLOR);
  const [annotations, setAnnotations] = useState<ScreenshotAnnotation[]>(() => [
    ...initial,
  ]);
  // Mirrored in refs so pointer-up and commit read the latest value without
  // side effects inside a state updater (which StrictMode runs twice).
  const [draft, setDraftState] = useState<ScreenshotAnnotation | null>(null);
  const draftRef = useRef<ScreenshotAnnotation | null>(null);
  const setDraft = useCallback((next: ScreenshotAnnotation | null) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);
  const [pendingText, setPendingTextState] = useState<PendingText | null>(null);
  const pendingTextRef = useRef<PendingText | null>(null);
  const setPendingText = useCallback((next: PendingText | null) => {
    pendingTextRef.current = next;
    setPendingTextState(next);
  }, []);

  const pointFor = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): AnnotationPoint | null =>
      image
        ? toImagePoint(
            event,
            event.currentTarget.getBoundingClientRect(),
            image
          )
        : null,
    [image]
  );

  const commitPendingText = useCallback(() => {
    const pending = pendingTextRef.current;
    const text = pending?.value.trim();
    setPendingText(null);
    if (!pending || !text) {
      return;
    }
    const mark: ScreenshotAnnotation = {
      id: makeInspectPromptId("mark"),
      tool: "text",
      color,
      at: pending.at,
      text,
    };
    setAnnotations((prev) => [...prev, mark]);
  }, [color, setPendingText]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (event.button !== 0) {
        return;
      }
      const point = pointFor(event);
      if (!point) {
        return;
      }
      event.preventDefault();
      if (tool === "text") {
        // A second click elsewhere keeps what was typed and starts a new label.
        commitPendingText();
        setPendingText({ at: point, value: "" });
        return;
      }
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const id = makeInspectPromptId("mark");
      setDraft(
        tool === "pen"
          ? { id, tool, color, points: [point] }
          : { id, tool, color, from: point, to: point }
      );
    },
    [color, commitPendingText, pointFor, setDraft, setPendingText, tool]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const point = pointFor(event);
      if (!point) {
        return;
      }
      const current = draftRef.current;
      if (!current) {
        return;
      }
      if (current.tool === "pen") {
        setDraft({ ...current, points: [...current.points, point] });
      } else if (current.tool === "arrow" || current.tool === "box") {
        setDraft({ ...current, to: point });
      }
    },
    [pointFor, setDraft]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      const current = draftRef.current;
      setDraft(null);
      if (!current || !image) {
        return;
      }
      const keep =
        current.tool === "pen" ||
        current.tool === "text" ||
        isMeaningfulDrag(
          current.from,
          current.to,
          annotationStrokeWidth(image.width, image.height)
        );
      if (keep) {
        setAnnotations((prev) => [...prev, current]);
      }
    },
    [image, setDraft]
  );

  const undo = useCallback(() => {
    setPendingText(null);
    setAnnotations((prev) => prev.slice(0, -1));
  }, [setPendingText]);

  const clear = useCallback(() => {
    setPendingText(null);
    setAnnotations([]);
  }, [setPendingText]);

  const selectTool = useCallback(
    (next: AnnotationTool) => {
      commitPendingText();
      setTool(next);
    },
    [commitPendingText]
  );

  return {
    tool,
    setTool: selectTool,
    color,
    setColor,
    annotations,
    draft,
    pendingText,
    setPendingTextValue: (value) => {
      const pending = pendingTextRef.current;
      if (pending) {
        setPendingText({ ...pending, value });
      }
    },
    commitPendingText,
    cancelPendingText: () => setPendingText(null),
    undo,
    clear,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
};
