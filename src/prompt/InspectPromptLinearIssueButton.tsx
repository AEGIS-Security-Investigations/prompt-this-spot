"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ExternalLink, Loader2, SquarePen, X } from "lucide-react";
import { useState } from "react";
import { usePromptThisSpotConfig } from "../config/PromptThisSpotConfig";
import { cn } from "../lib/cn";
import {
  buildLinearIssueDraft,
  defaultLinearIssueTitle,
  type LinearIssueDraftInput,
} from "../linear/buildLinearIssueDraft";
import type {
  CreatedLinearIssue,
  LinearIssueCreator,
} from "../linear/linearIssueTypes";
import {
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "../ui/dialog";
import {
  inspectPromptActionButton,
  inspectPromptHint,
  inspectPromptLinearCreatedLink,
  inspectPromptLinearError,
  inspectPromptLinearModalContent,
  inspectPromptLinearTitleInput,
  inspectPromptPrimaryAction,
  inspectPromptRawModalClose,
  inspectPromptRawModalFooter,
  inspectPromptRawModalOverlay,
  inspectPromptRawModalTitle,
  inspectPromptSectionLabel,
} from "./inspectPromptChromeClasses";

/** Marks the tool's own UI so it is never treated as an inspect target. */
const IGNORE_ATTR = "data-inspect-ignore";

interface InspectPromptLinearIssueButtonProps {
  /** Everything the ticket is built from. */
  input: LinearIssueDraftInput;
  disabled: boolean;
  onStopPick: () => void;
}

interface LinearIssueDialogProps extends InspectPromptLinearIssueButtonProps {
  createLinearIssue: LinearIssueCreator;
}

const LinearIssueDialog = ({
  input,
  disabled,
  onStopPick,
  createLinearIssue,
}: LinearIssueDialogProps) => {
  const { notify } = usePromptThisSpotConfig();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedLinearIssue | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (creating) {
      return;
    }
    if (nextOpen) {
      onStopPick();
      setTitle(defaultLinearIssueTitle(input));
      setError(null);
    }
    setOpen(nextOpen);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const issue = await createLinearIssue(
        buildLinearIssueDraft(input, title)
      );
      setCreated(issue);
      setOpen(false);
      notify({
        title: `Created ${issue.identifier}`,
        description: "The ticket is in Linear.",
      });
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "Couldn't create the Linear ticket."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        className={inspectPromptActionButton}
        disabled={disabled}
        onClick={() => handleOpenChange(true)}
        data-testid="inspect-prompt-create-linear-issue"
        title="File this prompt and its screenshots as a Linear ticket"
      >
        <SquarePen className="h-3.5 w-3.5 shrink-0" />
        Create Linear ticket
      </button>
      {created ? (
        <a
          href={created.url}
          target="_blank"
          rel="noopener noreferrer"
          className={inspectPromptLinearCreatedLink}
          data-testid="inspect-prompt-linear-issue-link"
        >
          Created {created.identifier}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : null}

      <DialogPortal>
        <DialogOverlay
          {...{ [IGNORE_ATTR]: "" }}
          className={inspectPromptRawModalOverlay}
        />
        <DialogPrimitive.Content
          {...{ [IGNORE_ATTR]: "" }}
          data-testid="inspect-prompt-linear-modal"
          className={inspectPromptLinearModalContent}
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreate();
            }}
          >
            <DialogHeader>
              <DialogTitle className={inspectPromptRawModalTitle}>
                Create Linear ticket
              </DialogTitle>
              <DialogDescription className={inspectPromptHint}>
                The ticket gets your request, the page, the screenshots and the
                full prompt, ready to hand to a coding agent.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-1.5">
              <label
                htmlFor="inspect-prompt-linear-title"
                className={inspectPromptSectionLabel}
              >
                {"// Title"}
              </label>
              <input
                id="inspect-prompt-linear-title"
                data-testid="inspect-prompt-linear-title"
                className={inspectPromptLinearTitleInput}
                value={title}
                maxLength={255}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className={inspectPromptLinearError}
                data-testid="inspect-prompt-linear-error"
              >
                {error}
              </p>
            ) : null}

            <div className={inspectPromptRawModalFooter}>
              <DialogPrimitive.Close
                type="button"
                disabled={creating}
                className={cn(inspectPromptActionButton, "sm:w-auto")}
              >
                Cancel
              </DialogPrimitive.Close>
              <button
                type="submit"
                className={cn(inspectPromptPrimaryAction, "sm:w-auto")}
                disabled={creating || title.trim().length === 0}
                data-testid="inspect-prompt-linear-submit"
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
                ) : null}
                {creating ? "Creating…" : "Create ticket"}
              </button>
            </div>
          </form>

          <DialogPrimitive.Close
            type="button"
            aria-label="Close"
            disabled={creating}
            className={inspectPromptRawModalClose}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
};

/**
 * "Create Linear ticket": files the drawer's request, page, screenshots and
 * assembled prompt as a Linear ticket through the host app's
 * `createLinearIssue` adapter. Renders nothing when the app hasn't set one.
 */
export const InspectPromptLinearIssueButton = (
  props: InspectPromptLinearIssueButtonProps
) => {
  const { createLinearIssue } = usePromptThisSpotConfig();
  if (!createLinearIssue) {
    return null;
  }
  return <LinearIssueDialog {...props} createLinearIssue={createLinearIssue} />;
};
