"use client";

import { Send } from "lucide-react";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { cn } from "../lib/cn";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

interface UserFeedbackComposeSectionProps {
  message: string;
  category: string;
  submitting: boolean;
  capturing: boolean;
  error: string | null;
  onMessageChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * The pinned compose block, in the inspector's footer position: what kind of
 * report this is, what happened, and the one gradient action that sends it.
 *
 * Pinned rather than scrolled with the evidence above it, so the message box
 * and Send never disappear behind a long list of picked spots.
 */
export const UserFeedbackComposeSection = ({
  message,
  category,
  submitting,
  capturing,
  error,
  onMessageChange,
  onCategoryChange,
  onSubmit,
}: UserFeedbackComposeSectionProps) => {
  const {
    userFeedbackHint,
    userFeedbackPrimaryAction,
    userFeedbackSectionDivider,
    userFeedbackSectionLabel,
    userFeedbackSelectTrigger,
    userFeedbackTextarea,
    userFeedbackErrorText,
  } = useUserFeedbackTheme();
  const { feedbackCategories } = usePromptThisSpotConfig();
  return (
    <div
      className={cn("space-y-3 border-t px-4 py-3", userFeedbackSectionDivider)}
    >
      <div className="space-y-1.5">
        <Label
          htmlFor="user-feedback-category"
          className={userFeedbackSectionLabel}
        >
          Kind of feedback
        </Label>
        <Select
          value={category}
          onValueChange={(value) => onCategoryChange(value)}
        >
          <SelectTrigger
            id="user-feedback-category"
            data-testid="user-feedback-category"
            className={userFeedbackSelectTrigger}
          >
            <SelectValue />
          </SelectTrigger>
          {/*
            `portalled={false}` for the same reason Sheets need it: the portalled menu renders under `<body>` at `z-50`,
            while this drawer sits at `z-[2147483002]`, so the category list
            would open *behind* the opaque panel and nothing but the default
            could be chosen. In place, it inherits the drawer's stacking
            context.
          */}
          <SelectContent portalled={false}>
            {feedbackCategories.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="user-feedback-message"
          className={userFeedbackSectionLabel}
        >
          What happened?
        </Label>
        <Textarea
          id="user-feedback-message"
          data-testid="user-feedback-message"
          placeholder="Describe what you were doing and what you expected…"
          className={userFeedbackTextarea}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className={userFeedbackErrorText}>
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className={userFeedbackPrimaryAction}
        onClick={onSubmit}
        // Blocked while a capture is in flight: a screenshot only joins the
        // submission once it has finished uploading, so sending now would
        // silently drop the image the user just asked for.
        disabled={submitting || capturing || message.trim().length === 0}
        data-testid="user-feedback-submit"
      >
        {submitting ? (
          <Spinner size="sm" className="shrink-0" />
        ) : (
          <Send className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        {submitting ? "Sending…" : "Send feedback"}
      </button>

      {capturing ? (
        <p className={userFeedbackHint}>Finishing your screenshot…</p>
      ) : null}
    </div>
  );
};
