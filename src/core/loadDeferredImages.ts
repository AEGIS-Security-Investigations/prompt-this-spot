"use client";

/**
 * Start loading every lazy image under `root` that has not loaded yet, for the
 * length of one capture, and return a function that puts `loading="lazy"`
 * back.
 *
 * Before it copies anything, the screenshot library waits for every `<img>`
 * under the capture root to fire `load` or `error`, up to the capture timeout.
 * A lazy image the browser has deferred fires neither. One inside a
 * `display: none` box never will, because it can never reach the viewport: a
 * logo's light and dark twins swapped with CSS, a collapsed panel, a closed
 * menu. Each one of those stalled every capture for the whole timeout.
 *
 * Switching `loading` to `eager` makes the browser fetch the image now, so the
 * wait ends as soon as it loads or fails. Only images that are still pending
 * are touched, and the cost is one request per deferred image, once, when
 * somebody takes a screenshot.
 */
export const loadDeferredImages = (root: Element): (() => void) => {
  const deferred: HTMLImageElement[] = [];
  for (const image of root.querySelectorAll("img")) {
    if (image.loading === "lazy" && !image.complete) {
      image.loading = "eager";
      deferred.push(image);
    }
  }
  return () => {
    for (const image of deferred) {
      image.loading = "lazy";
    }
  };
};
