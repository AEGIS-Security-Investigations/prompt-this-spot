"use client";

import { Camera, MousePointerClick } from "lucide-react";
import { cn } from "../lib/cn";
import { Spinner } from "../ui/spinner";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

interface UserFeedbackCaptureControlsProps {
  pickMode: boolean;
  /** True while a capture/upload is in flight. */
  capturing: boolean;
  onTogglePick: () => void;
  onCapturePage: () => void;
}

/**
 * The drawer's two capture actions, in the inspector's layout: a full-width
 * primary toggle for pointing at a spot, a quieter secondary for grabbing the
 * whole page, and one line of guidance underneath.
 *
 * Pointing at a spot screenshots that spot with its surroundings automatically,
 * so the pair covers "this exact control" and "the page as a whole".
 */
export const UserFeedbackCaptureControls = ({
  pickMode,
  capturing,
  onTogglePick,
  onCapturePage,
}: UserFeedbackCaptureControlsProps) => {
  const {
    userFeedbackActionButton,
    userFeedbackHint,
    userFeedbackPickButton,
    userFeedbackSectionDivider,
  } = useUserFeedbackTheme();
  return (
    <div className={cn("border-b px-4 py-3", userFeedbackSectionDivider)}>
      <button
        type="button"
        className={userFeedbackPickButton(pickMode)}
        onClick={onTogglePick}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        data-testid="user-feedback-pick"
        aria-pressed={pickMode}
      >
        <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden />
        {pickMode ? "Click a spot" : "Point at the problem"}
      </button>

      <button
        type="button"
        className={cn(userFeedbackActionButton, "mt-2")}
        onClick={onCapturePage}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        disabled={capturing}
        data-testid="user-feedback-capture-page"
        title="Attach a picture of the page as you see it right now"
      >
        {capturing ? (
          <Spinner size="sm" className="shrink-0" />
        ) : (
          <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        {capturing ? "Taking the picture…" : "Screenshot this page"}
      </button>

      <p className={cn(userFeedbackHint, "mt-2.5")}>
        {pickMode
          ? "Click anything on the page — including inside an open dialog. Each spot is screenshotted with its surroundings. Press Esc when you're done."
          : "Pointing at a spot helps us find it straight away. The app stays usable while this panel is open."}
      </p>
    </div>
  );
};
