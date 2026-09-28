import type { ScreenshotAnnotation } from "./annotationTypes";
import { drawAnnotations } from "./drawAnnotations";

/**
 * Burn markup into the screenshot at full resolution and return it as a PNG
 * data URL, ready for the same uploader the original capture used.
 *
 * Takes an already-decoded image (the editor has one on screen) so saving does
 * not decode a multi-megabyte data URL a second time.
 */
export const renderAnnotatedImage = (
  image: HTMLImageElement,
  annotations: readonly ScreenshotAnnotation[]
): string => {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("This browser can't draw on screenshots");
  }
  ctx.drawImage(image, 0, 0, width, height);
  drawAnnotations(ctx, annotations, { width, height });
  return canvas.toDataURL("image/png");
};
