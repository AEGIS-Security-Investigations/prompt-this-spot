"use client";

import { useMemo, useState } from "react";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { buildMultiInspectPrompt } from "../core/buildInspectPrompt";
import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../core/types";
import {
  buildClaudeCodeDeepLink,
  buildClaudeCodeWebUrl,
} from "./claudeCodeLinks";

export interface InspectPromptActions {
  /** Editable assembled prompt (copy / hand-off / preview). */
  rawPrompt: string;
  /** Replace the full prompt text (e.g. from the CodeMirror editor). */
  setRawPrompt: (value: string) => void;
  /** Whether the current prompt was just copied (for button feedback). */
  copied: boolean;
  /** Clear the "copied" state, e.g. when the request text changes. */
  markStale: () => void;
  handleCopy: () => Promise<void>;
  handleOpenLocal: () => void;
  handleSendToWeb: () => void;
}

/**
 * Copy / hand-off actions for the assembled multi-element prompt. Extracted
 * from the drawer so the component stays focused (and under the file-size cap).
 *
 * The prompt is rebuilt as screenshots finish uploading, so a shot captured
 * moments ago appears in the text (and resets the "copied" state) the instant
 * its URL lands — the user never has to re-trigger anything to pick it up. The
 * same rebuild carries the test-coverage box: ticking it rewrites the prompt in
 * place, including any hand-edits made in the raw editor.
 */
export const useInspectPromptActions = (
  selections: ElementDescription[],
  request: string,
  screenshots: InspectPromptScreenshot[],
  /** Whether the prompt should also ask the agent for unit + e2e coverage. */
  testCoverage: boolean
): InspectPromptActions => {
  const {
    notify: toast,
    repoSlug,
    promptScreenshotRetentionDays,
  } = usePromptThisSpotConfig();
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const builtPrompt = useMemo(
    () =>
      buildMultiInspectPrompt({
        descriptions: selections,
        request,
        screenshots,
        testCoverage,
        screenshotRetentionDays: promptScreenshotRetentionDays,
      }),
    [
      selections,
      request,
      screenshots,
      testCoverage,
      promptScreenshotRetentionDays,
    ]
  );

  const [rawPrompt, setRawPrompt] = useState(builtPrompt);
  const [syncedBuiltPrompt, setSyncedBuiltPrompt] = useState(builtPrompt);

  if (syncedBuiltPrompt !== builtPrompt) {
    setSyncedBuiltPrompt(builtPrompt);
    setRawPrompt(builtPrompt);
    setCopiedPrompt(null);
  }

  const copied = copiedPrompt === rawPrompt;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawPrompt);
      setCopiedPrompt(rawPrompt);
      toast({ title: "Prompt copied", description: "Paste it to your AI." });
    } catch {
      toast({
        title: "Couldn't copy",
        description: "Select the text and copy it manually.",
        variant: "destructive",
      });
    }
  };

  // Open Claude Code on the web with the prompt + repo pre-filled. Reliable for
  // anyone signed into claude.ai, so this is the primary action.
  const handleSendToWeb = () => {
    window.open(
      buildClaudeCodeWebUrl(rawPrompt, repoSlug),
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Hand off to a locally installed Claude Code via its custom protocol. If the
  // handler isn't registered the browser silently ignores it, so nudge the user
  // toward the web button as a fallback.
  const handleOpenLocal = () => {
    window.location.href = buildClaudeCodeDeepLink(rawPrompt, repoSlug);
    toast({
      title: "Opening local Claude Code…",
      description:
        "Nothing happened? Install Claude Code (v2.1.91+) or use “Send to Claude Code”.",
    });
  };

  return {
    rawPrompt,
    setRawPrompt,
    copied,
    markStale: () => setCopiedPrompt(null),
    handleCopy,
    handleOpenLocal,
    handleSendToWeb,
  };
};
