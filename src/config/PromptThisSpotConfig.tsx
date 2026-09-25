"use client";

import { createContext, type PropsWithChildren, use, useMemo } from "react";
import type {
  CaptureScreenshotUploader,
  ElementDescription,
  InspectPromptScreenshot,
} from "../core/types";
import {
  DEFAULT_USER_FEEDBACK_CATEGORY_OPTIONS,
  type UserFeedbackCategoryOption,
} from "../feedback/userFeedbackCategories";
import {
  defaultUserFeedbackTheme,
  type UserFeedbackTheme,
} from "../feedback/userFeedbackTheme";

/** A toast the tools want shown. Shaped like shadcn/ui's `toast()` argument. */
export interface PromptThisSpotToast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

/** One selection as stored with a feedback report (no raw DOM detail). */
export interface UserFeedbackSubmissionSelection {
  label: ElementDescription["label"];
  selector: ElementDescription["selector"];
  pathname: ElementDescription["pathname"];
  block: ElementDescription["block"];
}

/** One uploaded screenshot as stored with a feedback report. */
export interface UserFeedbackSubmissionScreenshot {
  kind: InspectPromptScreenshot["kind"];
  label: InspectPromptScreenshot["label"];
  pathname: InspectPromptScreenshot["pathname"];
  url: InspectPromptScreenshot["url"];
  expiresAt: InspectPromptScreenshot["expiresAt"];
  note: InspectPromptScreenshot["note"];
}

/**
 * Everything the "Send feedback" widget hands the host app on submit. The AI
 * prompt is already assembled, so the host can store it and hand the report to
 * a coding agent later without reconstructing anything.
 */
export interface UserFeedbackSubmission {
  message: string;
  /** One of the configured category `value`s. */
  category: string;
  pathname: string;
  promptText: string;
  selections: UserFeedbackSubmissionSelection[];
  screenshots: UserFeedbackSubmissionScreenshot[];
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Everything that differs between host apps. Both tools read it from
 * {@link PromptThisSpotProvider}; every field is optional so a missing adapter
 * degrades (no toast, no upload) rather than crashing the page.
 */
export interface PromptThisSpotConfig {
  /** Show a toast. Defaults to a no-op. */
  notify?: (toast: PromptThisSpotToast) => void;
  /** Report an unexpected failure (a screenshot that could not upload). */
  logError?: (message: string, context: Record<string, unknown>) => void;
  /**
   * GitHub `owner/name` the "Send to Claude Code" buttons open. When omitted
   * the links open Claude Code without a repository selected.
   */
  repoSlug?: string;
  /** Stores a "Prompt this spot" screenshot and returns its public URL. */
  uploadPromptScreenshot?: CaptureScreenshotUploader;
  /** Stores a "Send feedback" screenshot and returns its public URL. */
  uploadFeedbackScreenshot?: CaptureScreenshotUploader;
  /** Persists a feedback report. Reject with an `Error` to show its message. */
  submitFeedback?: (submission: UserFeedbackSubmission) => Promise<void>;
  /** Categories offered in the feedback form, in display order. */
  feedbackCategories?: UserFeedbackCategoryOption[];
  /** Class-name overrides for the feedback widget, to match the host brand. */
  feedbackTheme?: Partial<UserFeedbackTheme>;
  /**
   * `sessionStorage` key an E2E spec sets to `"1"` to see the feedback launcher
   * in an automated browser (it is hidden from `navigator.webdriver` otherwise).
   */
  feedbackE2eOptInStorageKey?: string;
}

/** {@link PromptThisSpotConfig} with every default filled in. */
export interface ResolvedPromptThisSpotConfig {
  notify: (toast: PromptThisSpotToast) => void;
  logError: (message: string, context: Record<string, unknown>) => void;
  repoSlug: string | undefined;
  uploadPromptScreenshot: CaptureScreenshotUploader;
  uploadFeedbackScreenshot: CaptureScreenshotUploader;
  submitFeedback: (submission: UserFeedbackSubmission) => Promise<void>;
  feedbackCategories: UserFeedbackCategoryOption[];
  feedbackTheme: UserFeedbackTheme;
  feedbackE2eOptInStorageKey: string;
}

const noUploader: CaptureScreenshotUploader = async () => {
  throw new Error("Screenshot uploads are not configured.");
};

const noSubmit = async () => {
  throw new Error("Feedback submission is not configured.");
};

export const resolvePromptThisSpotConfig = (
  config: PromptThisSpotConfig = {}
): ResolvedPromptThisSpotConfig => ({
  notify: config.notify ?? (() => {}),
  logError:
    config.logError ??
    ((message, context) => {
      console.error(`[prompt-this-spot] ${message}`, context);
    }),
  repoSlug: config.repoSlug,
  uploadPromptScreenshot: config.uploadPromptScreenshot ?? noUploader,
  uploadFeedbackScreenshot: config.uploadFeedbackScreenshot ?? noUploader,
  submitFeedback: config.submitFeedback ?? noSubmit,
  feedbackCategories:
    config.feedbackCategories ?? DEFAULT_USER_FEEDBACK_CATEGORY_OPTIONS,
  feedbackTheme: { ...defaultUserFeedbackTheme, ...config.feedbackTheme },
  feedbackE2eOptInStorageKey:
    config.feedbackE2eOptInStorageKey ?? "prompt-this-spot:e2e-user-feedback",
});

const DEFAULT_CONFIG = resolvePromptThisSpotConfig();

const PromptThisSpotConfigContext =
  createContext<ResolvedPromptThisSpotConfig>(DEFAULT_CONFIG);

/** The host app's adapters, with defaults for anything it left out. */
export const usePromptThisSpotConfig = (): ResolvedPromptThisSpotConfig =>
  use(PromptThisSpotConfigContext);

/**
 * Supplies the host app's adapters to both tools. Mount it once, above the
 * tool gates, inside whatever providers the adapters themselves need (toasts,
 * the GraphQL client, the signed-in user).
 */
export const PromptThisSpotProvider = ({
  config,
  children,
}: PropsWithChildren<{ config: PromptThisSpotConfig }>) => {
  const resolved = useMemo(() => resolvePromptThisSpotConfig(config), [config]);

  return (
    <PromptThisSpotConfigContext.Provider value={resolved}>
      {children}
    </PromptThisSpotConfigContext.Provider>
  );
};
