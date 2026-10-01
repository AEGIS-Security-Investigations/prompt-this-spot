"use client";

import { cn } from "../lib/cn";
import {
  inspectPromptPageUrlValue,
  inspectPromptSectionDivider,
  inspectPromptSectionLabel,
} from "./inspectPromptChromeClasses";

interface InspectPromptPageUrlProps {
  /** Sanitized URL of the page the user is on now. */
  url: string;
}

/**
 * The page the reviewer is on right now, in full (scheme, host, port, path,
 * query and anchor), so they can see which deployment and view the prompt will
 * name. Secrets are already stripped (see `sanitizePageUrl`). The text is
 * selectable in one click for copying.
 */
export const InspectPromptPageUrl = ({ url }: InspectPromptPageUrlProps) => (
  <div
    className={cn("border-b px-4 py-2.5", inspectPromptSectionDivider)}
    data-testid="inspect-prompt-page-url"
  >
    <span className={inspectPromptSectionLabel}>{"// Current page"}</span>
    <p
      className={inspectPromptPageUrlValue}
      data-testid="inspect-prompt-page-url-value"
    >
      {url}
    </p>
  </div>
);
