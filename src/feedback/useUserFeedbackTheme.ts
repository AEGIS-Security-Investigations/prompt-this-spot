"use client";

import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import type { UserFeedbackTheme } from "./userFeedbackTheme";

/** The feedback widget's class names: the defaults merged with host overrides. */
export const useUserFeedbackTheme = (): UserFeedbackTheme =>
  usePromptThisSpotConfig().feedbackTheme;
