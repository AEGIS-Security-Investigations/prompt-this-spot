/**
 * Shared types for the "Prompt this spot" inspect tool. Kept framework-free so
 * the prompt builder and the controller hook can both depend on them without a
 * React import.
 */

/**
 * A captured selection. We derive and store this data synchronously when the
 * user clicks — never a live {@link Element} ref — because an element picked
 * inside a dialog/drawer may be unmounted by the time the prompt is assembled.
 */
export interface ElementDescription {
  /** Stable id for React keys + removal. */
  id: string;
  /** Short label for the selection list, e.g. `button · "Get started"`. */
  label: string;
  /** Readable CSS-ish selector (buildDomPath output) — for the prompt/UI. */
  selector: string;
  /**
   * Full-depth, collision-free key (pathname + unique DOM path) used only to
   * de-duplicate selections. The readable `selector` is depth-limited and can
   * collide across repeated layouts, so it must NOT be used for dedupe.
   */
  dedupeKey: string;
  /** Formatted per-element bullet block, WITHOUT the trailing request line. */
  block: string;
  /** Route the element was captured on (window.location.pathname). */
  pathname: string;
}

/** A rectangle in document coordinates (page origin, not viewport origin). */
export interface InspectCaptureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Lifecycle of one screenshot, from canvas render to public URL. */
export type InspectPromptScreenshotStatus =
  | "capturing"
  | "uploading"
  | "ready"
  | "failed";

/**
 * A screenshot the tool captured and uploaded to the public bucket so an AI
 * agent can look at it. `element` shots frame one picked selection plus a band
 * of surrounding page; `page` shots are the whole visible viewport.
 *
 * Objects are swept from the bucket after 7 days, so `url` is a short-lived
 * review artifact — never a durable reference.
 */
export interface InspectPromptScreenshot {
  /** Stable id for React keys + removal. */
  id: string;
  kind: "element" | "page";
  /** Selection this shot illustrates; null for standalone page shots. */
  selectionId: string | null;
  /** Short label for the screenshot list row. */
  label: string;
  /** Route the shot was taken on. */
  pathname: string;
  /** Local data URL, available as soon as the canvas render finishes. */
  previewDataUrl: string | null;
  /** Public S3 URL, available once the upload completes. */
  url: string | null;
  /** ISO timestamp when the object is deleted from the bucket. */
  expiresAt: string | null;
  status: InspectPromptScreenshotStatus;
  /** Human-readable failure reason when `status` is "failed". */
  error: string | null;
  /**
   * Reviewer's free-text note for this specific shot, carried into the prompt
   * beside its URL. Lets one prompt say different things about different
   * images ("this arrow is misaligned" / "this whole column is too wide")
   * instead of one shared request having to cover them all.
   */
  note: string;
}

/**
 * Sends one captured PNG data URL wherever the host tool stores its
 * screenshots, and reports back the public URL plus its expiry.
 *
 * Injected rather than imported because the two tools that share this hook
 * write to different prefixes with different retention and different auth: the
 * admin inspector uploads seven-day review scratch, the feedback widget uploads
 * images that have to outlive an admin's triage queue.
 */
export type CaptureScreenshotUploader = (dataUrl: string) => Promise<{
  url: string;
  /** When the stored image is deleted; omit or null if it never expires. */
  expiresAt?: string | null;
}>;

export interface InspectPromptScreenshots {
  screenshots: InspectPromptScreenshot[];
  /** True while any capture/upload is in flight (drives button state). */
  busy: boolean;
  /** Capture the visible page as a standalone shot. Repeatable. */
  capturePage: () => void;
  /** Capture a picked element plus a band of surrounding page. */
  captureElement: (params: {
    selectionId: string;
    label: string;
    pathname: string;
    /** The element's box in VIEWPORT coordinates, read at pick time. */
    rect: Pick<DOMRect, "left" | "top" | "width" | "height">;
  }) => void;
  /** Re-run a failed shot's original capture (retry, don't reload). */
  retryScreenshot: (id: string) => void;
  /** Set the reviewer's per-shot note, which travels into the prompt. */
  setScreenshotNote: (id: string, note: string) => void;
  removeScreenshot: (id: string) => void;
  /** Drop the element shot(s) belonging to a removed selection. */
  removeScreenshotsForSelection: (selectionId: string) => void;
  clearScreenshots: () => void;
}
