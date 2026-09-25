"use client";

import { Check, Copy, Sparkles, Terminal } from "lucide-react";
import { InspectPromptRawPreview } from "./InspectPromptRawPreview";
import {
  inspectPromptActionButton,
  inspectPromptCopiedIcon,
  inspectPromptPrimaryAction,
} from "./inspectPromptChromeClasses";

interface InspectPromptHandoffActionsProps {
  rawPrompt: string;
  copied: boolean;
  /** True while there is nothing to send, or a capture is still uploading. */
  disabled: boolean;
  onRawPromptChange: (value: string) => void;
  onStopPick: () => void;
  onCopy: () => Promise<void>;
  onOpenLocal: () => void;
  onSendToWeb: () => void;
}

/**
 * The drawer's hand-off block: the raw-prompt preview plus the three ways to
 * get the assembled prompt out — clipboard, a locally installed Claude Code,
 * and Claude Code on the web.
 *
 * Split out of `InspectPromptDrawer` to keep that file under the repo's
 * 250-line cap; these controls move together and share one disabled state.
 */
export const InspectPromptHandoffActions = ({
  rawPrompt,
  copied,
  disabled,
  onRawPromptChange,
  onStopPick,
  onCopy,
  onOpenLocal,
  onSendToWeb,
}: InspectPromptHandoffActionsProps) => (
  <div className="flex flex-col gap-2">
    <InspectPromptRawPreview
      rawPrompt={rawPrompt}
      onRawPromptChange={onRawPromptChange}
      onStopPick={onStopPick}
      disabled={disabled}
      copied={copied}
      onCopy={onCopy}
      onOpenLocal={onOpenLocal}
      onSendToWeb={onSendToWeb}
    />
    <button
      type="button"
      className={inspectPromptActionButton}
      disabled={disabled}
      onClick={onCopy}
      data-testid="inspect-prompt-copy"
    >
      {copied ? (
        <Check className={inspectPromptCopiedIcon} />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0" />
      )}
      {copied ? "Copied" : "Copy prompt"}
    </button>
    <button
      type="button"
      className={inspectPromptActionButton}
      disabled={disabled}
      onClick={onOpenLocal}
      data-testid="inspect-prompt-open-local"
      title="Open your locally installed Claude Code in this repo"
    >
      <Terminal className="h-3.5 w-3.5 shrink-0" />
      Open in local Claude Code
    </button>
    <button
      type="button"
      className={inspectPromptPrimaryAction}
      disabled={disabled}
      onClick={onSendToWeb}
      data-testid="inspect-prompt-send-claude"
      title="Open Claude Code on the web with this prompt"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      Send to Claude Code
    </button>
  </div>
);
