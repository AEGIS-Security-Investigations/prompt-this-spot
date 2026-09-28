/**
 * Markup a reviewer draws on a captured screenshot. Framework-free so the
 * prompt builder, the renderer and the editor can all share it.
 *
 * Every coordinate is in the screenshot's own pixels (its natural size), not
 * the on-screen size of the editor, so the same shapes redraw identically on
 * the full-resolution image that gets uploaded.
 */

export interface AnnotationPoint {
  x: number;
  y: number;
}

/** The drawing tools the editor offers, in toolbar order. */
export type AnnotationTool = "pen" | "arrow" | "box" | "text";

interface AnnotationBase {
  id: string;
  /** CSS colour the shape is drawn in. */
  color: string;
}

export interface PenAnnotation extends AnnotationBase {
  tool: "pen";
  points: AnnotationPoint[];
}

export interface ArrowAnnotation extends AnnotationBase {
  tool: "arrow";
  from: AnnotationPoint;
  /** Where the head is drawn: the thing being pointed at. */
  to: AnnotationPoint;
}

export interface BoxAnnotation extends AnnotationBase {
  tool: "box";
  from: AnnotationPoint;
  to: AnnotationPoint;
}

export interface TextAnnotation extends AnnotationBase {
  tool: "text";
  /** Top-left of the first line. */
  at: AnnotationPoint;
  text: string;
}

export type ScreenshotAnnotation =
  | PenAnnotation
  | ArrowAnnotation
  | BoxAnnotation
  | TextAnnotation;
