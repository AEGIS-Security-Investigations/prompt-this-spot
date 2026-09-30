"use client";

import { Trash2 } from "lucide-react";
import type { ElementDescription } from "../core/types";
import { cn } from "../lib/cn";
import { InspectPromptCapturedPageUrl } from "./InspectPromptCapturedPageUrl";
import {
  inspectPromptClearButton,
  inspectPromptHint,
  inspectPromptPanel,
  inspectPromptRemoveButton,
  inspectPromptSectionLabel,
  inspectPromptSelectionIndex,
  inspectPromptSelectionSelector,
  inspectPromptSelectionTitle,
} from "./inspectPromptChromeClasses";

interface InspectPromptSelectionListProps {
  selections: ElementDescription[];
  /** URL of the page the reviewer is on now, to flag spots from other pages. */
  currentPageUrl?: string;
  onRemove: (id: string) => void;
  onClear: () => void;
}

/**
 * Scrollable list of picked DOM targets inside the inspect drawer.
 */
export const InspectPromptSelectionList = ({
  selections,
  currentPageUrl = "",
  onRemove,
  onClear,
}: InspectPromptSelectionListProps) => {
  const hasSelections = selections.length > 0;

  return (
    // min-h keeps the list visible on short windows, where it would otherwise
    // shrink to nothing before the drawer starts to scroll.
    <div className="min-h-28 flex-1 overflow-y-auto px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className={inspectPromptSectionLabel}>{"// Selected spots"}</span>
        {hasSelections ? (
          <button
            type="button"
            onClick={onClear}
            data-testid="inspect-prompt-clear"
            className={inspectPromptClearButton}
          >
            clear()
          </button>
        ) : null}
      </div>

      {hasSelections ? (
        <ul className="flex flex-col gap-2" data-testid="inspect-prompt-list">
          {selections.map((selection, index) => (
            <li
              key={selection.id}
              data-testid="inspect-prompt-list-item"
              className={cn(
                inspectPromptPanel,
                "flex items-start justify-between gap-2 p-2.5"
              )}
            >
              <div className="min-w-0">
                <p className={inspectPromptSelectionTitle}>
                  <span className={inspectPromptSelectionIndex}>
                    [{index + 1}]
                  </span>
                  {selection.label}
                </p>
                <p className={inspectPromptSelectionSelector}>
                  {selection.selector}
                </p>
                <InspectPromptCapturedPageUrl
                  capturedUrl={selection.pageUrl}
                  currentUrl={currentPageUrl}
                  testId="inspect-prompt-list-item-page-url"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(selection.id)}
                aria-label={`Remove ${selection.label}`}
                className={inspectPromptRemoveButton}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className={cn(inspectPromptPanel, "border-dashed text-center")}>
          <p className={inspectPromptHint}>
            No targets yet. Enable pick mode and click elements in the app.
          </p>
        </div>
      )}
    </div>
  );
};
