import type { CaptureScreenshotUploader } from "../core/types";
import { withScreenshotTimeout } from "../core/withScreenshotTimeout";

const UPLOAD_TIMEOUT_MS = 20_000;

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") {
      return body.error;
    }
  } catch {
    // Fall through to the status text below.
  }
  return response.statusText || `Upload failed (${response.status})`;
};

/**
 * Build a {@link CaptureScreenshotUploader} that POSTs `{ dataUrl }` as JSON to
 * one of the host app's routes and expects `{ url, expiresAt }` back (extra
 * fields are ignored). A non-2xx response rejects with the route's `error`
 * string, which the drawer shows on the failed screenshot row.
 *
 * The route decides storage, retention and auth; the package never sees a
 * credential.
 */
export const createScreenshotUploader =
  (path: string): CaptureScreenshotUploader =>
  async (dataUrl) => {
    const controller = new AbortController();
    try {
      return await withScreenshotTimeout(
        (async () => {
          const response = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl }),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }
          return response.json();
        })(),
        UPLOAD_TIMEOUT_MS,
        "Screenshot upload timed out. Retry or remove this screenshot to continue."
      );
    } finally {
      controller.abort();
    }
  };
