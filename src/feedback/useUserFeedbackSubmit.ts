"use client";

import { useCallback, useState } from "react";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { buildMultiInspectPrompt } from "../core/buildInspectPrompt";
import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../core/types";

export interface UseUserFeedbackSubmitParams {
  message: string;
  category: string;
  selections: ElementDescription[];
  screenshots: InspectPromptScreenshot[];
  /** Called after a successful submit so the drawer can reset and close. */
  onSubmitted: () => void;
}

export interface UserFeedbackSubmit {
  submit: () => Promise<void>;
  submitting: boolean;
  /** Message from the last failed attempt, shown inline in the drawer. */
  error: string | null;
}

/** Only uploaded shots are worth citing — a pending or failed one has no URL. */
const readyScreenshots = (
  screenshots: InspectPromptScreenshot[]
): InspectPromptScreenshot[] =>
  screenshots.filter((shot) => shot.status === "ready" && Boolean(shot.url));

/**
 * Turn the widget's state into a {@link UserFeedbackSubmission} and hand it to
 * the host app's `submitFeedback` adapter.
 *
 * The AI prompt is assembled HERE, at submit time, by the same
 * `buildMultiInspectPrompt` the "Prompt this spot" inspector uses — so the row arrives with
 * a ready-to-send prompt and an admin never has to reconstruct one from raw
 * DOM data. That is the whole reason the two tools share a core.
 */
export const useUserFeedbackSubmit = ({
  message,
  category,
  selections,
  screenshots,
  onSubmitted,
}: UseUserFeedbackSubmitParams): UserFeedbackSubmit => {
  const { notify: toast, submitFeedback } = usePromptThisSpotConfig();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please tell us what happened.");
      return;
    }
    setError(null);

    const ready = readyScreenshots(screenshots);

    setLoading(true);
    try {
      await submitFeedback({
        message: trimmed,
        category,
        pathname: window.location.pathname,
        promptText: buildMultiInspectPrompt({
          descriptions: selections,
          request: trimmed,
          screenshots: ready,
        }),
        selections: selections.map((selection) => ({
          label: selection.label,
          selector: selection.selector,
          pathname: selection.pathname,
          block: selection.block,
        })),
        screenshots: ready.map((shot) => ({
          kind: shot.kind,
          label: shot.label,
          pathname: shot.pathname,
          url: shot.url,
          expiresAt: shot.expiresAt,
          note: shot.note,
        })),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });

      toast({
        title: "Thanks — we got it",
        description: "Your feedback is with our team.",
      });
      onSubmitted();
    } catch (submitError) {
      const description =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.";
      // Inline as well as toasted: the drawer stays open on failure with the
      // message intact, so the reason it did not send has to be visible there.
      setError(description);
      toast({
        title: "Couldn't send your feedback",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    category,
    message,
    onSubmitted,
    screenshots,
    selections,
    submitFeedback,
    toast,
  ]);

  return { submit, submitting: loading, error };
};
