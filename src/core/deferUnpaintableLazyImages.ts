"use client";

import type { InspectCaptureRect } from "./types";

export interface DeferredLazyImages {
  /** Put back every attribute that was taken off the live page. */
  release: () => void;
}

/** Attributes that give an image something to load. */
const SOURCE_ATTRIBUTES = ["src", "srcset"] as const;

const isLazyAndPending = (image: HTMLImageElement): boolean =>
  !image.complete &&
  (image.loading === "lazy" || image.getAttribute("loading") === "lazy");

/**
 * True when no part of the image can land in the crop: it has no layout box at
 * all (`display: none`, like the inactive half of a light/dark logo pair), or
 * its box lies wholly outside `rect`. `rect` is in document coordinates.
 */
const cannotPaintInCrop = (
  image: HTMLImageElement,
  rect: InspectCaptureRect
): boolean => {
  if (image.getClientRects().length === 0) {
    return true;
  }
  const box = image.getBoundingClientRect();
  const x = box.left + window.scrollX;
  const y = box.top + window.scrollY;
  return (
    x + box.width <= rect.x ||
    x >= rect.x + rect.width ||
    y + box.height <= rect.y ||
    y >= rect.y + rect.height
  );
};

/**
 * Stop the renderer waiting on lazy images that will never load.
 *
 * Before copying the page, the renderer waits for every `<img>` under the
 * capture root to finish loading, up to its timeout. A `loading="lazy"` image
 * that is hidden or far from the viewport is never fetched, so it never
 * finishes, and every screenshot of a page carrying one sat out the whole
 * timeout. A light/dark logo pair swapped with `display: none` is enough.
 *
 * Such an image cannot appear in the crop either, so its source is taken off
 * for the wait and put back by `release()` before the copy is made. Nothing is
 * fetched, and a lazy image the user can see in the crop is left to load.
 */
export const deferUnpaintableLazyImages = (
  root: Element,
  rect: InspectCaptureRect
): DeferredLazyImages => {
  const restores: Array<() => void> = [];
  const images: HTMLImageElement[] = [
    ...(root instanceof HTMLImageElement ? [root] : []),
    ...root.querySelectorAll("img"),
  ];

  for (const image of images) {
    if (!isLazyAndPending(image) || !cannotPaintInCrop(image, rect)) {
      continue;
    }
    for (const name of SOURCE_ATTRIBUTES) {
      const value = image.getAttribute(name);
      if (value === null) {
        continue;
      }
      image.removeAttribute(name);
      restores.push(() => image.setAttribute(name, value));
    }
  }

  return {
    release: () => {
      // Restore in reverse so `srcset` is back before `src` re-selects a source.
      for (const restore of restores.reverse()) {
        restore();
      }
      restores.length = 0;
    },
  };
};
