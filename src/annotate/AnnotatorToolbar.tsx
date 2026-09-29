"use client";

import { Eraser, MoveUpRight, Pencil, Square, Type, Undo2 } from "lucide-react";
import type { ComponentType } from "react";
import { ANNOTATION_COLORS } from "./annotationColors";
import type { AnnotationTool } from "./annotationTypes";
import {
  annotatorDivider,
  annotatorSwatch,
  annotatorToolButton,
  annotatorToolbar,
} from "./annotatorClasses";
import type { AnnotationEditor } from "./useAnnotationEditor";

const TOOLS: {
  tool: AnnotationTool;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { tool: "arrow", label: "Arrow", Icon: MoveUpRight },
  { tool: "box", label: "Box", Icon: Square },
  { tool: "pen", label: "Draw", Icon: Pencil },
  { tool: "text", label: "Text", Icon: Type },
];

/** Tool picker, colour swatches, and undo / clear for the markup editor. */
export const AnnotatorToolbar = ({
  editor,
  testIdPrefix,
}: {
  editor: AnnotationEditor;
  testIdPrefix: string;
}) => (
  <div
    className={annotatorToolbar}
    role="toolbar"
    aria-label="Markup tools"
    data-testid={`${testIdPrefix}-annotate-toolbar`}
  >
    {TOOLS.map(({ tool, label, Icon }) => (
      <button
        key={tool}
        type="button"
        onClick={() => editor.setTool(tool)}
        aria-pressed={editor.tool === tool}
        data-testid={`${testIdPrefix}-annotate-tool-${tool}`}
        className={annotatorToolButton(editor.tool === tool)}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </button>
    ))}

    <span className={annotatorDivider} aria-hidden />

    {ANNOTATION_COLORS.map(({ value, label }) => (
      <button
        key={value}
        type="button"
        onClick={() => editor.setColor(value)}
        aria-pressed={editor.color === value}
        aria-label={`${label} markup`}
        title={label}
        className={annotatorSwatch(editor.color === value)}
        style={{ backgroundColor: value }}
      />
    ))}

    <span className={annotatorDivider} aria-hidden />

    <button
      type="button"
      onClick={editor.undo}
      disabled={editor.annotations.length === 0}
      title="Undo (Ctrl+Z)"
      data-testid={`${testIdPrefix}-annotate-undo`}
      className={annotatorToolButton(false)}
    >
      <Undo2 className="h-3.5 w-3.5 shrink-0" />
      Undo
    </button>
    <button
      type="button"
      onClick={editor.clear}
      disabled={editor.annotations.length === 0}
      data-testid={`${testIdPrefix}-annotate-clear`}
      className={annotatorToolButton(false)}
    >
      <Eraser className="h-3.5 w-3.5 shrink-0" />
      Clear
    </button>
  </div>
);
