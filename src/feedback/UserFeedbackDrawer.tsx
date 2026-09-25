"use client";

import { MessageSquarePlus, X } from "lucide-react";
import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../core/types";
import { INSPECT_IGNORE_ATTR } from "../core/usePickMode";
import { cn } from "../lib/cn";
import { UserFeedbackCaptureControls } from "./UserFeedbackCaptureControls";
import { UserFeedbackComposeSection } from "./UserFeedbackComposeSection";
import { UserFeedbackScreenshotList } from "./UserFeedbackScreenshotList";
import { UserFeedbackSelectionList } from "./UserFeedbackSelectionList";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

interface UserFeedbackDrawerProps {
  open: boolean;
  pickMode: boolean;
  capturing: boolean;
  message: string;
  category: string;
  selections: ElementDescription[];
  screenshots: InspectPromptScreenshot[];
  submitting: boolean;
  error: string | null;
  onMessageChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTogglePick: () => void;
  onCapturePage: () => void;
  onRemoveSelection: (id: string) => void;
  onClearSelections: () => void;
  onRemoveScreenshot: (id: string) => void;
  onRetryScreenshot: (id: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * The feedback panel.
 *
 * Built to the same anatomy as the admin "Prompt this spot" inspector — icon
 * chip and count badge in a tinted header, capture actions in their own rail,
 * a scrollable evidence list, and the compose block pinned at the bottom — so
 * the two tools are recognisably one family.
 *
 * The palette and the words are this app's, though, not the inspector's: brand
 * navy/royal/cyan instead of dev-panel violet, and plain English instead of
 * `// comment` labels, because the people who see this one are guards and
 * client contacts rather than engineers. Full-width on phones so the panel
 * never shoves the thing being reported off-screen.
 */
export const UserFeedbackDrawer = ({
  open,
  pickMode,
  capturing,
  message,
  category,
  selections,
  screenshots,
  submitting,
  error,
  onMessageChange,
  onCategoryChange,
  onTogglePick,
  onCapturePage,
  onRemoveSelection,
  onClearSelections,
  onRemoveScreenshot,
  onRetryScreenshot,
  onSubmit,
  onClose,
}: UserFeedbackDrawerProps) => {
  const {
    userFeedbackCloseButton,
    userFeedbackCountBadge,
    userFeedbackDrawerOpenShadow,
    userFeedbackDrawerShell,
    userFeedbackHeader,
    userFeedbackIcon,
    userFeedbackIconWrap,
    userFeedbackSubtitle,
    userFeedbackTitle,
  } = useUserFeedbackTheme();
  return (
    <div
      {...{ [INSPECT_IGNORE_ATTR]: "" }}
      data-testid="user-feedback-drawer"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        userFeedbackDrawerShell,
        open ? "translate-x-0" : "-translate-x-full",
        open ? userFeedbackDrawerOpenShadow : "shadow-none"
      )}
    >
      <div className={userFeedbackHeader}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={userFeedbackIconWrap} aria-hidden>
            <MessageSquarePlus className={userFeedbackIcon} />
          </div>
          <div className="min-w-0">
            <p className={userFeedbackTitle}>Send feedback</p>
            <p className={userFeedbackSubtitle}>
              Tell us what&apos;s working — or what isn&apos;t
            </p>
          </div>
          {selections.length > 0 ? (
            <span className={userFeedbackCountBadge}>{selections.length}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close feedback"
          className={userFeedbackCloseButton}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <UserFeedbackCaptureControls
        pickMode={pickMode}
        capturing={capturing}
        onTogglePick={onTogglePick}
        onCapturePage={onCapturePage}
      />

      <UserFeedbackSelectionList
        selections={selections}
        onRemove={onRemoveSelection}
        onClear={onClearSelections}
      />

      <UserFeedbackScreenshotList
        screenshots={screenshots}
        onRemove={onRemoveScreenshot}
        onRetry={onRetryScreenshot}
      />

      <UserFeedbackComposeSection
        message={message}
        category={category}
        submitting={submitting}
        capturing={capturing}
        error={error}
        onMessageChange={onMessageChange}
        onCategoryChange={onCategoryChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};
