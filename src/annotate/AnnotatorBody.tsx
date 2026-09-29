"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { makeInspectPromptId } from "../core/makeInspectPromptId";
import { cn } from "../lib/cn";
import { AnnotatorToolbar } from "./AnnotatorToolbar";
import {
  annotationFontSize,
  annotationStrokeWidth,
} from "./annotationGeometry";
import type { ScreenshotAnnotation } from "./annotationTypes";
import {
  annotatorCanvas,
  annotatorError,
  annotatorFooter,
  annotatorSecondaryButton,
  annotatorStage,
  annotatorTextInput,
} from "./annotatorClasses";
import { drawAnnotations } from "./drawAnnotations";
import { loadImage } from "./loadImage";
import { renderAnnotatedImage } from "./renderAnnotatedImage";
import { useAnnotationEditor } from "./useAnnotationEditor";

interface AnnotatorBodyProps {
  /** The clean capture, without any earlier markup burned in. */
  source: string;
  initialAnnotations: readonly ScreenshotAnnotation[];
  primaryActionClassName: string;
  testIdPrefix: string;
  onSave: (annotations: ScreenshotAnnotation[], dataUrl: string) => void;
  onCancel: () => void;
}

/** Marks the floating label box so the dialog can tell Escape came from it. */
export const ANNOTATE_TEXT_INPUT_ATTR = "data-annotate-text-input";

const sameMarkup = (
  a: readonly ScreenshotAnnotation[],
  b: readonly ScreenshotAnnotation[]
) => a.length === b.length && a.every((mark, i) => mark.id === b[i]?.id);

/**
 * The editor inside the "Mark up" dialog. Mounted only while the dialog is
 * open, so each opening starts from the shot's saved markup.
 *
 * Earlier markup is kept as shapes and redrawn on the clean capture, never
 * drawn on top of the already-marked image, so reopening a shot lets the
 * reviewer undo or clear what they drew last time.
 */
export const AnnotatorBody = ({
  source,
  initialAnnotations,
  primaryActionClassName,
  testIdPrefix,
  onSave,
  onCancel,
}: AnnotatorBodyProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const size = image
    ? { width: image.naturalWidth, height: image.naturalHeight }
    : null;
  const editor = useAnnotationEditor(size, initialAnnotations);

  useEffect(() => {
    let cancelled = false;
    loadImage(source)
      .then((loaded) => {
        if (!cancelled) {
          setImage(loaded);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const { annotations, draft } = editor;
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) {
      return;
    }
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    drawAnnotations(ctx, draft ? [...annotations, draft] : annotations, {
      width,
      height,
    });
  }, [annotations, draft, image]);

  /** Committed shapes plus a label still being typed, which Save keeps. */
  const finalMarkup = (): ScreenshotAnnotation[] => {
    const text = editor.pendingText?.value.trim();
    if (!editor.pendingText || !text) {
      return annotations;
    }
    return [
      ...annotations,
      {
        id: makeInspectPromptId("mark"),
        tool: "text",
        color: editor.color,
        at: editor.pendingText.at,
        text,
      },
    ];
  };

  const handleSave = () => {
    if (!image) {
      return;
    }
    const markup = finalMarkup();
    if (sameMarkup(markup, initialAnnotations)) {
      onCancel();
      return;
    }
    try {
      // Clearing every mark uploads the clean capture again, un-marked.
      const dataUrl =
        markup.length > 0 ? renderAnnotatedImage(image, markup) : source;
      onSave(markup, dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT") {
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      editor.undo();
    }
  };

  // Where to float the text box: image pixels scaled to the displayed canvas.
  const displayed = canvasRef.current?.getBoundingClientRect();
  const scale = displayed && size ? displayed.width / size.width : 1;
  const inputFontSize = size
    ? annotationFontSize(annotationStrokeWidth(size.width, size.height)) * scale
    : 16;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: container-level Ctrl+Z for the editor.
    <div
      className="flex min-h-0 flex-1 flex-col gap-3"
      onKeyDown={handleKeyDown}
    >
      <AnnotatorToolbar editor={editor} testIdPrefix={testIdPrefix} />

      <div className={annotatorStage}>
        {image ? (
          <div className="relative inline-block max-w-full">
            <canvas
              ref={canvasRef}
              aria-label="Screenshot to mark up. Drag to draw; with the text tool, click where the label goes."
              data-testid={`${testIdPrefix}-annotate-canvas`}
              className={annotatorCanvas}
              onPointerDown={editor.onPointerDown}
              onPointerMove={editor.onPointerMove}
              onPointerUp={editor.onPointerUp}
              onPointerCancel={editor.onPointerUp}
            />
            {editor.pendingText ? (
              <input
                // biome-ignore lint/a11y/noAutofocus: the reviewer just clicked where they want to type.
                autoFocus
                type="text"
                value={editor.pendingText.value}
                onChange={(event) =>
                  editor.setPendingTextValue(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    editor.commitPendingText();
                  } else if (event.key === "Escape") {
                    // Drop the label; the dialog ignores this Escape.
                    event.preventDefault();
                    editor.cancelPendingText();
                  }
                }}
                placeholder="Type, then Enter"
                aria-label="Label text"
                {...{ [ANNOTATE_TEXT_INPUT_ATTR]: "" }}
                data-testid={`${testIdPrefix}-annotate-text-input`}
                className={annotatorTextInput}
                style={{
                  left: editor.pendingText.at.x * scale,
                  top: editor.pendingText.at.y * scale,
                  fontSize: Math.max(12, inputFontSize),
                  color: editor.color,
                }}
              />
            ) : null}
          </div>
        ) : error ? null : (
          <p className="text-xs text-zinc-500">Loading screenshot…</p>
        )}
      </div>

      {error ? <p className={annotatorError}>{error}</p> : null}

      <div className={annotatorFooter}>
        <button
          type="button"
          onClick={onCancel}
          className={annotatorSecondaryButton}
          data-testid={`${testIdPrefix}-annotate-cancel`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!image}
          className={cn(primaryActionClassName, "w-auto px-4")}
          data-testid={`${testIdPrefix}-annotate-save`}
        >
          Save markup
        </button>
      </div>
    </div>
  );
};
