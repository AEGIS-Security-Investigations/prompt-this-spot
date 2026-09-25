"use client";

import { getAppPushRoot } from "./getAppPushRoot";

/**
 * Ceiling on the frame wait. Browsers stop firing `requestAnimationFrame` in a
 * backgrounded tab, so a bare rAF wait would never settle if the user switches
 * away mid-capture — wedging the capture queue behind a promise that can only
 * resolve once they come back.
 */
const FRAME_WAIT_TIMEOUT_MS = 250;

/** Lets the browser apply the reverted styles before we rasterize. */
const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    let settled = false;
    const settle = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    requestAnimationFrame(() => requestAnimationFrame(settle));
    setTimeout(settle, FRAME_WAIT_TIMEOUT_MS);
  });

/**
 * Run `capture` with the open drawer's app-push transform temporarily reverted.
 *
 * While the drawer is open the app shell is translated right by the drawer
 * width and narrowed to match. A page screenshot taken in that state shows a
 * squeezed layout with a dead band down the left — misleading to an AI agent
 * that is being asked what the page looks like. Reverting the push for the
 * duration of the capture yields the page as it really renders, then restores
 * the pushed state (with the transition suppressed both ways, so neither switch
 * animates into the shot).
 */
export const withAppPushSuppressed = async <T>(
  capture: () => Promise<T>
): Promise<T> => {
  const pushRoot = getAppPushRoot();
  if (!pushRoot) {
    return capture();
  }

  const { style } = pushRoot;
  const previous = {
    transform: style.transform,
    width: style.width,
    transition: style.transition,
  };

  style.transition = "none";
  style.transform = "none";
  style.width = "100%";

  try {
    await nextFrame();
    return await capture();
  } finally {
    style.transform = previous.transform;
    style.width = previous.width;
    // Restore the animated transition only after the layout snaps back, so the
    // drawer's push doesn't replay as a visible slide every time we capture.
    requestAnimationFrame(() => {
      style.transition = previous.transition;
    });
  }
};
