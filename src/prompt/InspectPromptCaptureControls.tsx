"use client";

import { Camera, Loader2, MousePointerClick } from "lucide-react";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { cn } from "../lib/cn";
import { useInspectPromptPreferences } from "./InspectPromptPreferencesContext";
import { InspectPromptScreenshotsOption } from "./InspectPromptScreenshotsOption";
import {
  inspectPromptActionButton,
  inspectPromptHint,
  inspectPromptPickButton,
  inspectPromptSectionDivider,
} from "./inspectPromptChromeClasses";

interface InspectPromptCaptureControlsProps {
  pickMode: boolean;
  /** True while a capture/upload is in flight. */
  capturing: boolean;
  onTogglePick: () => void;
  onCapturePage: () => void;
}

/**
 * The drawer's two capture actions: enter element pick mode, or grab the whole
 * visible page. Picking an element also captures that element with surrounding
 * context automatically, so this pair covers "this exact control" and "the page
 * as a whole".
 */
export const InspectPromptCaptureControls = ({
  pickMode,
  capturing,
  onTogglePick,
  onCapturePage,
}: InspectPromptCaptureControlsProps) => {
  const { screenshotsEnabled } = useInspectPromptPreferences();
  const { promptScreenshotsToggle } = usePromptThisSpotConfig();

  return (
    <div className={cn("border-b px-4 py-3", inspectPromptSectionDivider)}>
      <button
        type="button"
        className={inspectPromptPickButton(pickMode)}
        onClick={onTogglePick}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        data-testid="inspect-prompt-pick-toggle"
        aria-pressed={pickMode}
      >
        <MousePointerClick className="h-4 w-4 shrink-0" />
        {pickMode ? "Stop picking" : "Pick elements"}
      </button>

      {screenshotsEnabled ? (
        <button
          type="button"
          className={cn(inspectPromptActionButton, "mt-2")}
          onClick={onCapturePage}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          data-testid="inspect-prompt-capture-page"
          title="Screenshot the visible page and attach its link to the prompt"
        >
          {capturing ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5 shrink-0" />
          )}
          {capturing ? "Capturing" : "Screenshot page"}
        </button>
      ) : null}

      <p className={cn(inspectPromptHint, "mt-2.5")}>
        {pickMode
          ? screenshotsEnabled
            ? "Click any spot in the app — including inside open dialogs. Each pick is screenshotted with its surroundings. Esc to stop."
            : "Click any spot in the app — including inside open dialogs. Screenshots are off, so picks record the DOM only. Esc to stop."
          : screenshotsEnabled
            ? "Enable pick mode, then click UI targets. The app stays usable while this panel is open."
            : "Enable pick mode, then click UI targets. Screenshots are switched off."}
      </p>

      {promptScreenshotsToggle ? <InspectPromptScreenshotsOption /> : null}
    </div>
  );
};
