"use client";

import { createContext, useContext } from "react";
import type { ScreenshotAnnotation } from "./annotationTypes";

/**
 * What a screenshot row needs to offer "Mark up": the clean capture to draw
 * on, and a way to hand back the marked-up image for upload.
 *
 * Provided by each tool around its drawer rather than threaded through the
 * drawer and list props, which never touch it.
 */
export interface ScreenshotAnnotationApi {
  /** The un-annotated capture as a data URL, or undefined if it's gone. */
  getSource: (id: string) => string | undefined;
  /** Store the markup and upload `dataUrl` in place of the shot's image. */
  annotate: (
    id: string,
    annotations: ScreenshotAnnotation[],
    dataUrl: string
  ) => void;
}

const ScreenshotAnnotationContext =
  createContext<ScreenshotAnnotationApi | null>(null);

export const ScreenshotAnnotationProvider =
  ScreenshotAnnotationContext.Provider;

/** Null outside a provider, in which case rows hide the "Mark up" button. */
export const useScreenshotAnnotationApi = (): ScreenshotAnnotationApi | null =>
  useContext(ScreenshotAnnotationContext);
