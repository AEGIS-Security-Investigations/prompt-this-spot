"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { bindAppPushLayout } from "../core/bindAppPushLayout";
import { getAppPushRoot } from "../core/getAppPushRoot";
import { computeInspectHighlightBox } from "../core/inspectHighlightBox";
import { useCaptureController } from "../core/useCaptureController";
import { INSPECT_IGNORE_ATTR, usePickMode } from "../core/usePickMode";
import { UserFeedbackDrawer } from "./UserFeedbackDrawer";
import { UserFeedbackLauncher } from "./UserFeedbackLauncher";
import { useUserFeedbackLauncherCorner } from "./useUserFeedbackLauncherCorner";
import { useUserFeedbackSubmit } from "./useUserFeedbackSubmit";

/** Width of the left drawer; the app is pushed right by this when it's open. */
const DRAWER_WIDTH_PX = 360;

/** Below this the drawer goes full-width, so pushing the app is meaningless. */
const PUSH_MIN_VIEWPORT_PX = 640;

/**
 * The pick highlight lives inside `[data-app-push-root]` (the push-transform
 * container), so it needs a high z-index to sit over high-stacking app UI.
 */
const HIGHLIGHT_Z_INDEX = 2147483000;

/**
 * The in-app feedback widget: point at spots, capture screenshots, describe the
 * problem, and file it to the review queue.
 *
 * Built on the same capture core as the admin "Prompt this spot" inspector —
 * identical element description, screenshots and dialog-safe pick mode — but
 * the submit action hands the report to the host app's `submitFeedback`
 * adapter instead of opening an AI. The AI prompt is still assembled at submit
 * time and handed over with it, so the host can store it and pass the report to
 * a coding agent in one click.
 */
export const UserFeedbackTool = () => {
  const { feedbackCategories, uploadFeedbackScreenshot } =
    usePromptThisSpotConfig();
  const defaultCategory = feedbackCategories[0]?.value ?? "";
  const [corner, setCorner] = useUserFeedbackLauncherCorner();
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState(defaultCategory);

  const {
    drawerOpen,
    openDrawer,
    closeDrawer: closeCaptureDrawer,
    pickMode,
    selections,
    screenshots,
    capturing,
    hoverRect,
    togglePickMode,
    stopPickMode,
    addSelection,
    removeSelection,
    removeScreenshot,
    retryScreenshot,
    capturePageScreenshot,
    clearAll,
    setHoverRect,
  } = useCaptureController({
    upload: uploadFeedbackScreenshot,
    // Always on here. The inspector exposes a preference for this because
    // an engineer sometimes wants the DOM detail without the image cost; a
    // screenshot is the single most useful thing a non-technical reporter can
    // attach, so it is never opt-out.
    screenshotsEnabled: true,
  });

  // This component is only mounted once the user has clicked the launcher (the
  // gate defers its chunk until then), so the drawer should already be open by
  // the time it first paints.
  useEffect(() => openDrawer(), [openDrawer]);

  const closeDrawer = useCallback(() => {
    closeCaptureDrawer();
  }, [closeCaptureDrawer]);

  const handleSubmitted = useCallback(() => {
    clearAll();
    setMessage("");
    setCategory(defaultCategory);
    closeDrawer();
  }, [clearAll, closeDrawer, defaultCategory]);

  const { submit, submitting, error } = useUserFeedbackSubmit({
    message,
    category,
    selections,
    screenshots,
    onSubmitted: handleSubmitted,
  });

  usePickMode({
    active: pickMode,
    onPick: addSelection,
    onHover: setHoverRect,
    // Stop picking but leave the drawer open so the user can finish writing.
    onEscape: stopPickMode,
  });

  // Portalled to <html>, so wait for the client mount before targeting it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Push the app shell aside while the drawer is open instead of overlaying it,
  // so the page being reported on stays visible and pickable. Skipped on narrow
  // viewports, where the drawer is full-width and a push would only shove the
  // page off-screen. Only `[data-app-push-root]` is transformed — not <body> —
  // so portalled drawer chrome stays viewport-fixed at left:0.
  useEffect(() => {
    if (!drawerOpen || window.innerWidth < PUSH_MIN_VIEWPORT_PX) {
      return;
    }
    return bindAppPushLayout(() => DRAWER_WIDTH_PX);
  }, [drawerOpen]);

  if (!mounted) {
    return null;
  }

  const pushRoot = getAppPushRoot();

  return createPortal(
    <>
      {pickMode && hoverRect && pushRoot
        ? createPortal(
            <div
              aria-hidden
              {...{ [INSPECT_IGNORE_ATTR]: "" }}
              data-testid="user-feedback-highlight"
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

      {!drawerOpen ? (
        <UserFeedbackLauncher
          corner={corner}
          onCornerChange={setCorner}
          onOpen={openDrawer}
        />
      ) : null}

      <UserFeedbackDrawer
        open={drawerOpen}
        pickMode={pickMode}
        capturing={capturing}
        message={message}
        category={category}
        selections={selections}
        screenshots={screenshots}
        submitting={submitting}
        error={error}
        onMessageChange={setMessage}
        onCategoryChange={setCategory}
        onTogglePick={togglePickMode}
        onCapturePage={capturePageScreenshot}
        onRemoveSelection={removeSelection}
        onClearSelections={clearAll}
        onRemoveScreenshot={removeScreenshot}
        onRetryScreenshot={retryScreenshot}
        onSubmit={submit}
        onClose={closeDrawer}
      />
    </>,
    document.documentElement
  );
};
