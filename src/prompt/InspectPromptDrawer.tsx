"use client";

import { Sparkles, X } from "lucide-react";
import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../core/types";
import { cn } from "../lib/cn";
import { InspectPromptCaptureControls } from "./InspectPromptCaptureControls";
import { InspectPromptHandoffActions } from "./InspectPromptHandoffActions";
import { useInspectPromptPreferences } from "./InspectPromptPreferencesContext";
import { InspectPromptScreenshotList } from "./InspectPromptScreenshotList";
import { InspectPromptSelectionList } from "./InspectPromptSelectionList";
import { InspectPromptShortcutHint } from "./InspectPromptShortcutHint";
import { InspectPromptTestCoverageOption } from "./InspectPromptTestCoverageOption";
import {
  inspectPromptCloseButton,
  inspectPromptCountBadge,
  inspectPromptDrawerShell,
  inspectPromptDrawerShellOpenGlow,
  inspectPromptHeader,
  inspectPromptIcon,
  inspectPromptIconWrap,
  inspectPromptSectionDivider,
  inspectPromptSectionLabel,
  inspectPromptSubtitle,
  inspectPromptTextarea,
  inspectPromptTitle,
} from "./inspectPromptChromeClasses";
import { useInspectPromptActions } from "./useInspectPromptActions";

/** Marks the tool's own UI so it is never treated as an inspect target. */
const IGNORE_ATTR = "data-inspect-ignore";

interface InspectPromptDrawerProps {
  open: boolean;
  pickMode: boolean;
  selections: ElementDescription[];
  screenshots: InspectPromptScreenshot[];
  /** True while a capture/upload is in flight. */
  capturing: boolean;
  request: string;
  onTogglePick: () => void;
  onStopPick: () => void;
  onRemove: (id: string) => void;
  onRemoveScreenshot: (id: string) => void;
  onRetryScreenshot: (id: string) => void;
  onScreenshotNoteChange: (id: string, note: string) => void;
  onCapturePage: () => void;
  onClear: () => void;
  onRequestChange: (value: string) => void;
  onClose: () => void;
}

/**
 * Non-modal left drawer for the "Prompt this spot" tool. Styled as a standalone
 * agent/dev panel — deliberately distinct from app chrome.
 */
export const InspectPromptDrawer = ({
  open,
  pickMode,
  selections,
  screenshots,
  capturing,
  request,
  onTogglePick,
  onStopPick,
  onRemove,
  onRemoveScreenshot,
  onRetryScreenshot,
  onScreenshotNoteChange,
  onCapturePage,
  onClear,
  onRequestChange,
  onClose,
}: InspectPromptDrawerProps) => {
  // The checkbox itself owns writing this back (see
  // InspectPromptTestCoverageOption); the drawer only needs the value so the
  // assembled prompt picks it up.
  const { testCoverageRequested } = useInspectPromptPreferences();
  const {
    rawPrompt,
    setRawPrompt,
    copied,
    markStale,
    handleCopy,
    handleOpenLocal,
    handleSendToWeb,
  } = useInspectPromptActions(
    selections,
    request,
    screenshots,
    testCoverageRequested
  );
  // A page screenshot on its own is a complete prompt — the agent gets an image
  // of what the reviewer is looking at even with no element picked.
  const hasSelections = selections.length > 0;
  const hasContext = hasSelections || screenshots.length > 0;
  // Copying or sending mid-upload would hand over a prompt whose screenshot
  // URLs don't exist yet — the shot is only added once it reaches "ready", so
  // an in-flight capture is silently missing from the text.
  const actionsDisabled = !hasContext || capturing;

  return (
    <div
      {...{ [IGNORE_ATTR]: "" }}
      data-testid="inspect-prompt-drawer"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        inspectPromptDrawerShell,
        open ? "translate-x-0" : "-translate-x-full",
        open ? inspectPromptDrawerShellOpenGlow : "shadow-none"
      )}
    >
      <div className={inspectPromptHeader}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={inspectPromptIconWrap} aria-hidden>
            <Sparkles className={inspectPromptIcon} />
          </div>
          <div className="min-w-0">
            <p className={inspectPromptTitle}>Prompt this spot</p>
            <p
              className={cn(
                inspectPromptSubtitle,
                "flex min-w-0 items-center gap-1"
              )}
            >
              <span className="truncate">agent://inspect-prompt</span>
              <InspectPromptShortcutHint />
            </p>
          </div>
          {hasSelections ? (
            <span className={inspectPromptCountBadge}>{selections.length}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close prompt tool"
          className={inspectPromptCloseButton}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <InspectPromptCaptureControls
        pickMode={pickMode}
        capturing={capturing}
        onTogglePick={onTogglePick}
        onCapturePage={onCapturePage}
      />

      <InspectPromptSelectionList
        selections={selections}
        onRemove={onRemove}
        onClear={onClear}
      />

      <InspectPromptScreenshotList
        screenshots={screenshots}
        onRemove={onRemoveScreenshot}
        onRetry={onRetryScreenshot}
        onNoteChange={onScreenshotNoteChange}
      />

      <div
        className={cn(
          "space-y-3 border-t px-4 py-3",
          inspectPromptSectionDivider
        )}
      >
        <label
          htmlFor="inspect-prompt-request"
          className={inspectPromptSectionLabel}
        >
          {"// What do you want changed?"}
        </label>
        <textarea
          id="inspect-prompt-request"
          data-testid="inspect-prompt-request"
          aria-label="What do you want changed"
          placeholder="// Describe the change across selected spots…"
          className={inspectPromptTextarea}
          value={request}
          onChange={(event) => {
            onRequestChange(event.target.value);
            markStale();
          }}
        />

        <InspectPromptTestCoverageOption onToggle={markStale} />

        <InspectPromptHandoffActions
          rawPrompt={rawPrompt}
          copied={copied}
          disabled={actionsDisabled}
          onRawPromptChange={(value) => {
            setRawPrompt(value);
            markStale();
          }}
          onStopPick={onStopPick}
          onCopy={handleCopy}
          onOpenLocal={handleOpenLocal}
          onSendToWeb={handleSendToWeb}
        />
      </div>
    </div>
  );
};
