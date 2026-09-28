import {
  annotationFontSize,
  annotationStrokeWidth,
  arrowHeadPoints,
  normalizeBox,
} from "./annotationGeometry";
import type { ScreenshotAnnotation } from "./annotationTypes";

/** Thin light edge around lines so markup still reads on a dark page. */
const HALO = "rgba(255, 255, 255, 0.9)";

/** Backing plate behind text labels, so any colour reads on any page. */
const LABEL_PLATE = "rgba(15, 23, 42, 0.85)";

const FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const strokePath = (
  ctx: CanvasRenderingContext2D,
  trace: () => void,
  color: string,
  width: number
) => {
  // Halo first, then the colour on top, so a blue mark on a dark sidebar
  // stays visible. Thin, so the colour itself stays saturated when the
  // editor shows the image scaled down.
  ctx.beginPath();
  trace();
  ctx.strokeStyle = HALO;
  ctx.lineWidth = width + Math.max(2, Math.round(width * 0.4));
  ctx.stroke();

  ctx.beginPath();
  trace();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
};

const drawOne = (
  ctx: CanvasRenderingContext2D,
  annotation: ScreenshotAnnotation,
  width: number,
  fontSize: number
) => {
  switch (annotation.tool) {
    case "pen": {
      const [first, ...rest] = annotation.points;
      if (!first) {
        return;
      }
      strokePath(
        ctx,
        () => {
          ctx.moveTo(first.x, first.y);
          // A single-point stroke still draws a dot.
          if (rest.length === 0) {
            ctx.lineTo(first.x + 0.01, first.y);
          }
          for (const point of rest) {
            ctx.lineTo(point.x, point.y);
          }
        },
        annotation.color,
        width
      );
      return;
    }
    case "box": {
      const box = normalizeBox(annotation.from, annotation.to);
      strokePath(
        ctx,
        () => ctx.rect(box.x, box.y, box.width, box.height),
        annotation.color,
        width
      );
      return;
    }
    case "arrow": {
      const { from, to } = annotation;
      const head = arrowHeadPoints(from, to, width);
      strokePath(
        ctx,
        () => {
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          if (head) {
            ctx.moveTo(head[0].x, head[0].y);
            ctx.lineTo(to.x, to.y);
            ctx.lineTo(head[1].x, head[1].y);
          }
        },
        annotation.color,
        width
      );
      return;
    }
    case "text": {
      ctx.font = `600 ${fontSize}px ${FONT_FAMILY}`;
      ctx.textBaseline = "top";
      const pad = Math.round(fontSize * 0.3);
      const { x, y } = annotation.at;
      const textWidth = ctx.measureText(annotation.text).width;
      ctx.fillStyle = LABEL_PLATE;
      ctx.fillRect(x - pad, y - pad, textWidth + pad * 2, fontSize + pad * 2);
      ctx.fillStyle = annotation.color;
      ctx.fillText(annotation.text, x, y);
      return;
    }
  }
};

/**
 * Draw markup onto a canvas already holding the screenshot at its natural
 * size. Line width and font scale with the image, so the editor preview and
 * the uploaded PNG look the same.
 */
export const drawAnnotations = (
  ctx: CanvasRenderingContext2D,
  annotations: readonly ScreenshotAnnotation[],
  image: { width: number; height: number }
): void => {
  const width = annotationStrokeWidth(image.width, image.height);
  const fontSize = annotationFontSize(width);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const annotation of annotations) {
    drawOne(ctx, annotation, width, fontSize);
  }
  ctx.restore();
};
