"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Copy, Eye, Sparkles, Terminal, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "../ui/dialog";
import { InspectPromptRawEditor } from "./InspectPromptRawEditor";
import {
  inspectPromptActionButton,
  inspectPromptCopiedIcon,
  inspectPromptPrimaryAction,
  inspectPromptRawModalClose,
  inspectPromptRawModalContent,
  inspectPromptRawModalFooter,
  inspectPromptRawModalOverlay,
  inspectPromptRawModalTitle,
} from "./inspectPromptChromeClasses";

/** Marks the tool's own UI so it is never treated as an inspect target. */
const IGNORE_ATTR = "data-inspect-ignore";

type InspectPromptRawPreviewProps = {
  rawPrompt: string;
  onRawPromptChange: (value: string) => void;
  onStopPick: () => void;
  disabled: boolean;
  copied: boolean;
  onCopy: () => Promise<void>;
  onOpenLocal: () => void;
  onSendToWeb: () => void;
};

/**
 * Opens a modal with the full assembled prompt before copy / hand-off.
 */
export const InspectPromptRawPreview = ({
  rawPrompt,
  onRawPromptChange,
  onStopPick,
  disabled,
  copied,
  onCopy,
  onOpenLocal,
  onSendToWeb,
}: InspectPromptRawPreviewProps) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onStopPick();
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        className={inspectPromptActionButton}
        disabled={disabled}
        onClick={() => handleOpenChange(true)}
        data-testid="inspect-prompt-view-raw"
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        View raw prompt
      </button>

      <DialogPortal>
        <DialogOverlay
          {...{ [IGNORE_ATTR]: "" }}
          className={inspectPromptRawModalOverlay}
        />
        <DialogPrimitive.Content
          {...{ [IGNORE_ATTR]: "" }}
          data-testid="inspect-prompt-raw-modal"
          className={inspectPromptRawModalContent}
        >
          <DialogHeader>
            <DialogTitle className={inspectPromptRawModalTitle}>
              Raw prompt
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Edit the assembled prompt before copying or sending to Claude
              Code.
            </DialogDescription>
          </DialogHeader>

          <InspectPromptRawEditor
            value={rawPrompt}
            onChange={onRawPromptChange}
          />

          <div className={inspectPromptRawModalFooter}>
            <button
              type="button"
              className={cn(inspectPromptActionButton, "sm:w-auto sm:flex-1")}
              onClick={onCopy}
              data-testid="inspect-prompt-raw-modal-copy"
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
              className={cn(inspectPromptActionButton, "sm:w-auto sm:flex-1")}
              onClick={onOpenLocal}
              data-testid="inspect-prompt-raw-modal-open-local"
              title="Open your locally installed Claude Code in this repo"
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              Open in local Claude Code
            </button>
            <button
              type="button"
              className={cn(inspectPromptPrimaryAction, "sm:w-auto sm:flex-1")}
              onClick={onSendToWeb}
              data-testid="inspect-prompt-raw-modal-send-claude"
              title="Open Claude Code on the web with this prompt"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Send to Claude Code
            </button>
          </div>

          <DialogPrimitive.Close
            type="button"
            aria-label="Close raw prompt"
            data-testid="inspect-prompt-raw-modal-close"
            className={inspectPromptRawModalClose}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
