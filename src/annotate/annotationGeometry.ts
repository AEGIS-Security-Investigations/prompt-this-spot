import type { AnnotationPoint } from "./annotationTypes";

/**
 * Line width for markup on an image of this size. Screenshots are captured at
 * device pixel ratio, so a fixed 3px line would be a hairline on a 2800px
 * retina capture and heavy on a small element shot.
 */
export const annotationStrokeWidth = (width: number, height: number): number =>
  Math.max(4, Math.round(Math.max(width, height) / 250));

/** Font size for text markup, in image pixels. */
export const annotationFontSize = (strokeWidth: number): number =>
  Math.max(16, strokeWidth * 4);

/**
 * The two back corners of an arrow head at `to`, pointing away from `from`.
 * Returns null for a zero-length arrow, which has no direction to point in.
 */
export const arrowHeadPoints = (
  from: AnnotationPoint,
  to: AnnotationPoint,
  strokeWidth: number
): [AnnotationPoint, AnnotationPoint] | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) {
    return null;
  }
  const angle = Math.atan2(dy, dx);
  const length = strokeWidth * 4;
  const spread = Math.PI / 7;
  return [
    {
      x: to.x - length * Math.cos(angle - spread),
      y: to.y - length * Math.sin(angle - spread),
    },
    {
      x: to.x - length * Math.cos(angle + spread),
      y: to.y - length * Math.sin(angle + spread),
    },
  ];
};

/** A box drawn in any drag direction, as a top-left rectangle. */
export const normalizeBox = (
  from: AnnotationPoint,
  to: AnnotationPoint
): { x: number; y: number; width: number; height: number } => ({
  x: Math.min(from.x, to.x),
  y: Math.min(from.y, to.y),
  width: Math.abs(to.x - from.x),
  height: Math.abs(to.y - from.y),
});

/**
 * Map a pointer position on the scaled-down editor canvas to the screenshot's
 * own pixels, clamped to the image so a drag that leaves the canvas still ends
 * on its edge.
 */
export const toImagePoint = (
  client: { clientX: number; clientY: number },
  displayed: Pick<DOMRect, "left" | "top" | "width" | "height">,
  image: { width: number; height: number }
): AnnotationPoint => {
  const scaleX = displayed.width > 0 ? image.width / displayed.width : 1;
  const scaleY = displayed.height > 0 ? image.height / displayed.height : 1;
  const clamp = (value: number, max: number) =>
    Math.min(Math.max(value, 0), max);
  return {
    x: clamp((client.clientX - displayed.left) * scaleX, image.width),
    y: clamp((client.clientY - displayed.top) * scaleY, image.height),
  };
};

/**
 * Whether a finished drag is big enough to keep. A click without a drag would
 * otherwise leave an invisible zero-size box or a dot-sized arrow.
 */
export const isMeaningfulDrag = (
  from: AnnotationPoint,
  to: AnnotationPoint,
  strokeWidth: number
): boolean => Math.hypot(to.x - from.x, to.y - from.y) >= strokeWidth * 2;
