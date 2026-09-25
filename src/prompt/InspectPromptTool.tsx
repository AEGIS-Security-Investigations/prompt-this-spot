"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { getAppPushRoot } from "../core/getAppPushRoot";
import { computeInspectHighlightBox } from "../core/inspectHighlightBox";
import { useCaptureController } from "../core/useCaptureController";
import { INSPECT_IGNORE_ATTR, usePickMode } from "../core/usePickMode";
import { InspectPromptDrawer } from "./InspectPromptDrawer";
import { InspectPromptLauncher } from "./InspectPromptLauncher";
import { useInspectPromptPreferences } from "./InspectPromptPreferencesContext";
import { useInspectPromptAccess } from "./useInspectPromptAccess";
import { useInspectPromptShortcut } from "./useInspectPromptShortcut";

/** Width of the left drawer; the app is pushed right by this when it's open. */
const DRAWER_WIDTH_PX = 360;

/**
 * The pick-mode highlight lives in `[data-app-push-root]` (the push-transform
 * container), so — unlike drawer chrome, which stays outside that wrapper — it
 * needs a high z-index to sit over high-stacking app UI (menus, popovers, overlays).
 */
const HIGHLIGHT_Z_INDEX = 2147483000;

/**
 * Floating entry point for the "click spots → copy an AI prompt" tool. Who may
 * use it is the host app's call, passed in as `eligible` (see
 * {@link useInspectPromptAccess}). Mount it once, globally, through
 * `InspectPromptToolGate`.
 *
 * The button only opens/closes the left {@link InspectPromptDrawer}; element
 * picking is started from inside the drawer. While pick mode is active a
 * capture-phase click listener ADDS each clicked element to the selection list
 * — and queues a screenshot of it with surrounding context — while staying
 * active for rapid multi-pick, stopping the event before it reaches the app.
 * Capture-phase `pointerdown`/`mousedown` listeners additionally
 * swallow the press before the document-level outside-click dismissers (Radix
 * dialogs/popovers, the admin command search) can fire — so clicking inside or
 * behind an open dialog neither activates it nor closes it.
 */
export const InspectPromptTool = ({ eligible }: { eligible: boolean }) => {
  const { eligible: canUse, launcherVisible } =
    useInspectPromptAccess(eligible);
  const { uploadPromptScreenshot } = usePromptThisSpotConfig();
  const { screenshotsEnabled } = useInspectPromptPreferences();
  const {
    drawerOpen,
    pickMode,
    selections,
    screenshots,
    capturing,
    request,
    hoverRect,
    openDrawer,
    closeDrawer,
    togglePickMode,
    stopPickMode,
    addSelection,
    removeSelection,
    removeScreenshot,
    retryScreenshot,
    setScreenshotNote,
    capturePageScreenshot,
    clearAll,
    setRequest,
    setHoverRect,
  } = useCaptureController({
    upload: uploadPromptScreenshot,
    screenshotsEnabled,
  });

  useInspectPromptShortcut(canUse, drawerOpen, openDrawer, closeDrawer);

  useEffect(() => {
    if (!canUse) {
      closeDrawer();
    }
  }, [canUse, closeDrawer]);

  // The tool is portalled to <html> (outside <body>), so it must wait for the
  // client mount before document.documentElement is safe to target.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Push the app shell to the right while the drawer is open instead of
  // overlaying it, so every part of the app stays visible and pickable. Only
  // `[data-app-push-root]` is transformed — not `<body>` — so portalled drawer
  // chrome (which browsers attach under `<body>`) stays viewport-fixed at left:0.
  useEffect(() => {
    if (!canUse || !drawerOpen) {
      return;
    }
    const pushRoot = getAppPushRoot();
    if (!pushRoot) {
      return;
    }
    const { style } = pushRoot;
    const previous = {
      transform: style.transform,
      width: style.width,
      transition: style.transition,
    };
    style.transition = "transform 300ms ease-in-out, width 300ms ease-in-out";
    style.transform = `translateX(${DRAWER_WIDTH_PX}px)`;
    style.width = `calc(100% - ${DRAWER_WIDTH_PX}px)`;
    return () => {
      style.transform = previous.transform;
      style.width = previous.width;
      style.transition = previous.transition;
    };
  }, [canUse, drawerOpen]);

  usePickMode({
    active: pickMode,
    onPick: addSelection,
    onHover: setHoverRect,
    // Stop picking but leave the drawer open so the user can finish editing.
    onEscape: togglePickMode,
  });

  if (!canUse || !mounted) {
    return null;
  }

  const pushRoot = getAppPushRoot();

  // Portal drawer chrome to <html>. Browsers reparent those nodes under <body>,
  // but they stay outside `[data-app-push-root]`, so they are not shifted when
  // the app shell is pushed aside. The pick-mode highlight portals into the push
  // root so it shares the app's transformed coordinate space.
  return createPortal(
    <>
      {pickMode && hoverRect && pushRoot
        ? createPortal(
            <div
              aria-hidden
              {...{ [INSPECT_IGNORE_ATTR]: "" }}
              data-testid="inspect-prompt-highlight"
              className="pointer-events-none fixed rounded-sm border-2 border-primary bg-primary/10"
              style={{
                ...computeInspectHighlightBox(
                  hoverRect,
                  pushRoot.getBoundingClientRect()
                ),
                zIndex: HIGHLIGHT_Z_INDEX,
              }}
            />,
            pushRoot
          )
        : null}

      {!drawerOpen && launcherVisible ? (
        <InspectPromptLauncher onOpen={openDrawer} />
      ) : null}

      <InspectPromptDrawer
        open={drawerOpen}
        pickMode={pickMode}
        selections={selections}
        screenshots={screenshots}
        capturing={capturing}
        request={request}
        onTogglePick={togglePickMode}
        onStopPick={stopPickMode}
        onRemove={removeSelection}
        onRemoveScreenshot={removeScreenshot}
        onRetryScreenshot={retryScreenshot}
        onScreenshotNoteChange={setScreenshotNote}
        onCapturePage={capturePageScreenshot}
        onClear={clearAll}
        onRequestChange={setRequest}
        onClose={closeDrawer}
      />
    </>,
    document.documentElement
  );
};
