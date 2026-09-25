"use client";

import { Target, Trash2 } from "lucide-react";
import type { ElementDescription } from "../core/types";
import { cn } from "../lib/cn";
import { useUserFeedbackTheme } from "./useUserFeedbackTheme";

interface UserFeedbackSelectionListProps {
  selections: ElementDescription[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

/**
 * The spots the reporter pointed at, in the inspector's scrollable rail.
 *
 * Same two-line row shape as the inspector, but the second line is the page the
 * spot was picked on rather than its DOM path. The submitter does not need the
 * selector — that detail is for whoever reads the report — and a route is
 * something they can actually recognise across several picks.
 */
export const UserFeedbackSelectionList = ({
  selections,
  onRemove,
  onClear,
}: UserFeedbackSelectionListProps) => {
  const {
    userFeedbackHint,
    userFeedbackPanel,
    userFeedbackSectionLabel,
    userFeedbackClearButton,
    userFeedbackRemoveButton,
    userFeedbackRowIndex,
    userFeedbackRowMeta,
    userFeedbackRowTitle,
    userFeedbackEmptyIcon,
  } = useUserFeedbackTheme();
  const hasSelections = selections.length > 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={userFeedbackSectionLabel}>Spots you pointed at</span>
        {hasSelections ? (
          <button
            type="button"
            onClick={onClear}
            data-testid="user-feedback-clear"
            className={userFeedbackClearButton}
          >
            Clear all
          </button>
        ) : null}
      </div>

      {hasSelections ? (
        <ul className="flex flex-col gap-2" data-testid="user-feedback-list">
          {selections.map((selection, index) => (
            <li
              key={selection.id}
              data-testid="user-feedback-list-item"
              className={cn(
                userFeedbackPanel,
                "flex items-start justify-between gap-2 p-2.5"
              )}
            >
              <div className="min-w-0">
                <p className={userFeedbackRowTitle}>
                  <span className={userFeedbackRowIndex}>[{index + 1}]</span>
                  {selection.label}
                </p>
                <p className={userFeedbackRowMeta}>{selection.pathname}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(selection.id)}
                aria-label={`Remove ${selection.label}`}
                className={userFeedbackRemoveButton}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={cn(
            userFeedbackPanel,
            "flex flex-col items-center gap-2 border-dashed text-center"
          )}
        >
          <Target className={userFeedbackEmptyIcon} aria-hidden />
          <p className={userFeedbackHint}>
            Nothing pointed at yet. It&apos;s optional — but tapping
            &ldquo;Point at the problem&rdquo; and clicking the spot helps us
            find it straight away.
          </p>
        </div>
      )}
    </div>
  );
};
