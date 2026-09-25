/**
 * Default chrome for the "Send feedback" widget.
 *
 * Shaped after the "Prompt this spot" inspector so the two tools read as one
 * family: the same tinted panel shell, icon chip, gradient title, uppercase
 * section rails, inset panel cards and glowing gradient actions. What it does
 * not borrow is the inspector's violet palette and mono voice, which suit an
 * engineer but not an end user reporting a problem from their phone.
 *
 * Every value is a Tailwind class string (or, for the pick button, a function of
 * its armed state). Host apps override any subset through
 * `PromptThisSpotConfig.feedbackTheme` to match their own brand; unset keys fall
 * back to these. Theme tokens (`bg-card`, `text-muted-foreground`, `ring-ring`,
 * `bg-primary`) are the shadcn/ui set.
 */

import { cn } from "../lib/cn";

/** Floating launcher button — icon-only until hover, like the inspector's. */
const userFeedbackLauncher = cn(
  "group pointer-events-auto fixed z-[2147483001] flex touch-none select-none items-center",
  "cursor-grab rounded-full border border-sky-500/40 p-3",
  "bg-gradient-to-br from-blue-900 to-blue-600 text-white",
  "shadow-[0_0_24px_rgba(48,120,192,0.35)]",
  "transition-[box-shadow,border-color,transform,opacity] duration-200 ease-out",
  "hover:border-sky-500/70 hover:shadow-[0_0_32px_rgba(36,168,216,0.45)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 active:cursor-grabbing",
  "dark:border-sky-500/50 dark:shadow-[0_0_28px_rgba(36,168,216,0.4)]",
  "dark:hover:shadow-[0_0_36px_rgba(36,168,216,0.55)]",
  "motion-reduce:transition-none"
);

/** Above the drawer (z-2147483002) so a drag is never painted behind it. */
const userFeedbackLauncherDragging = cn(
  "z-[2147483003] scale-105 cursor-grabbing opacity-90",
  "shadow-[0_8px_32px_rgba(48,120,192,0.5)]"
);

/**
 * The drawer shell.
 *
 * Full-width below `sm` — a 360px panel that pushes the app sideways on a phone
 * would shove the thing the user is reporting off-screen, which defeats the
 * purpose. From `sm` up it is the same 360px left panel as the inspector, with
 * the same tinted wash over the card surface.
 */
const userFeedbackDrawerShell = cn(
  "pointer-events-auto fixed inset-y-0 left-0 z-[2147483002] flex w-full flex-col",
  "sm:w-[360px] sm:max-w-[90vw]",
  "border-r border-blue-600/25 bg-card text-card-foreground",
  "bg-gradient-to-br from-slate-100/80 via-transparent to-sky-500/10",
  "dark:border-blue-600/35 dark:from-blue-900/50 dark:to-sky-500/[0.07]",
  "transition-[transform,box-shadow] duration-300 ease-in-out",
  "motion-reduce:transition-none"
);

/** Right-edge glow — only while open; an off-screen shell still bleeds shadow. */
const userFeedbackDrawerOpenShadow = cn(
  "shadow-[4px_0_24px_rgba(48,120,192,0.18)]",
  "dark:shadow-[4px_0_32px_rgba(12,48,96,0.55)]"
);

const userFeedbackHeader = cn(
  "flex items-center justify-between gap-2 border-b border-blue-600/20 px-4 py-3",
  "bg-gradient-to-r from-blue-600/10 to-transparent",
  "dark:border-blue-600/25 dark:from-blue-900/60"
);

const userFeedbackIconWrap = cn(
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
  "border-blue-600/30 bg-blue-600/10",
  "dark:border-sky-500/30 dark:bg-blue-900/60"
);

const userFeedbackIcon = "h-4 w-4 text-blue-900 dark:text-sky-500";

const userFeedbackTitle = cn(
  "truncate bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text",
  "text-sm font-semibold text-transparent",
  "dark:from-slate-100 dark:to-sky-500"
);

const userFeedbackSubtitle = cn("truncate text-[11px] text-muted-foreground");

const userFeedbackCountBadge = cn(
  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums",
  "border-blue-600/30 bg-blue-600/10 text-blue-900",
  "dark:border-sky-500/30 dark:bg-blue-900/60 dark:text-slate-100"
);

const userFeedbackCloseButton = cn(
  "rounded-md border border-transparent p-1.5 text-muted-foreground transition-colors",
  "hover:border-blue-600/30 hover:bg-blue-600/10 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "dark:hover:border-sky-500/30 dark:hover:bg-blue-900/50"
);

const userFeedbackSectionDivider = cn(
  "border-blue-600/20 dark:border-blue-600/25"
);

/**
 * Section rail label.
 *
 * Dark blue rather than the accent blue so these 10px labels clear the 4.5:1
 * AA contrast floor on white.
 */
const userFeedbackSectionLabel = cn(
  "text-[10px] font-semibold uppercase tracking-[0.18em]",
  "text-blue-900/85 dark:text-sky-500/90"
);

const userFeedbackHint = cn(
  "text-[11px] leading-relaxed text-muted-foreground"
);

/** Inset card used for every selection / screenshot row and the empty state. */
const userFeedbackPanel = cn(
  "rounded-lg border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
  "border-blue-600/20 bg-card/70",
  "dark:border-blue-600/25 dark:bg-black/25",
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
);

const userFeedbackField = cn(
  "w-full rounded-md border text-xs leading-relaxed",
  "border-blue-600/25 bg-background text-foreground",
  "placeholder:text-muted-foreground",
  "focus-visible:border-blue-600 focus-visible:outline-none",
  "focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:ring-offset-0",
  "dark:border-blue-600/30 dark:bg-black/30"
);

/** Same trigger height as the inspector's buttons so the stack lines up. */
const userFeedbackSelectTrigger = cn(
  userFeedbackField,
  "h-9 px-3 py-2 focus:border-blue-600 focus:outline-none",
  "focus:ring-2 focus:ring-blue-600/30 focus:ring-offset-0"
);

const userFeedbackTextarea = cn(userFeedbackField, "h-28 resize-none p-3");

/** The "point at the problem" toggle — armed state glows sky blue. */
const userFeedbackPickButton = (active: boolean) =>
  cn(
    "flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2.5",
    "text-xs font-semibold uppercase tracking-wide transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? cn(
          "border-sky-500/60 bg-sky-500/15 text-blue-900",
          "shadow-[0_0_16px_rgba(36,168,216,0.25)]",
          "dark:border-sky-500/60 dark:bg-sky-500/20 dark:text-slate-100",
          "dark:shadow-[0_0_20px_rgba(36,168,216,0.3)]"
        )
      : cn(
          "border-blue-600/30 bg-blue-600/10 text-blue-900",
          "shadow-[0_0_12px_rgba(48,120,192,0.08)]",
          "hover:border-blue-600/50 hover:bg-blue-600/[0.15]",
          "dark:border-blue-600/40 dark:bg-blue-900/50 dark:text-slate-100",
          "dark:hover:border-sky-500/50 dark:hover:bg-blue-900/70"
        )
  );

const userFeedbackActionButton = cn(
  "flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs",
  "border-blue-600/20 bg-card/80 text-foreground/80 transition-colors",
  "hover:border-blue-600/40 hover:bg-blue-600/10 hover:text-blue-900",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:pointer-events-none disabled:opacity-40",
  "dark:border-blue-600/25 dark:bg-black/25 dark:text-slate-100/80",
  "dark:hover:border-sky-500/40 dark:hover:bg-blue-900/60 dark:hover:text-slate-100"
);

const userFeedbackPrimaryAction = cn(
  "flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2.5",
  "border-blue-900/40 bg-gradient-to-r from-blue-900 to-blue-600",
  "text-xs font-semibold uppercase tracking-wide text-white",
  "shadow-[0_0_20px_rgba(48,120,192,0.25)] transition-all",
  "hover:from-blue-600 hover:to-sky-500",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
  "dark:border-sky-500/40 dark:shadow-[0_0_24px_rgba(36,168,216,0.3)]"
);

/** Leading `[1]` marker on a picked spot, so a row matches its highlight order. */
const userFeedbackRowIndex = cn("mr-1.5 text-blue-600 dark:text-sky-500");

const userFeedbackRowTitle = cn("truncate text-xs font-medium text-foreground");

/** Secondary line under a row title: capture kind, status, failure reason. */
const userFeedbackRowMeta = cn("truncate text-[10px] text-muted-foreground");

const userFeedbackRowMetaFailed = cn("text-destructive");

const userFeedbackRemoveButton = cn(
  "shrink-0 rounded p-1 text-muted-foreground transition-colors",
  "hover:bg-destructive/10 hover:text-destructive",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "dark:hover:bg-destructive/20"
);

const userFeedbackRetryButton = cn(
  "shrink-0 rounded p-1 text-muted-foreground transition-colors",
  "hover:bg-blue-600/10 hover:text-blue-900",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "dark:hover:bg-blue-900/60 dark:hover:text-sky-500"
);

const userFeedbackClearButton = cn(
  "text-[10px] text-muted-foreground underline-offset-2 transition-colors",
  "hover:text-blue-900 hover:underline",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "dark:hover:text-sky-500"
);

/** Thumbnail doubles as the "open full size" trigger, so it reads as clickable. */
const userFeedbackThumbnailButton = cn(
  "h-10 w-14 shrink-0 overflow-hidden rounded border p-0 transition-colors",
  "border-blue-600/20 hover:border-blue-600/50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40",
  "dark:border-blue-600/25 dark:hover:border-sky-500/60"
);

/** Placeholder tile while a shot is still capturing, or after it failed. */
const userFeedbackThumbnailPlaceholder = cn(
  "flex h-10 w-14 shrink-0 items-center justify-center rounded border border-dashed",
  "border-blue-600/25 dark:border-blue-600/30"
);

/** Above the drawer (z-2147483002) and its launcher (z-2147483003). */
const userFeedbackPreviewOverlay = cn("z-[2147483004]");

const userFeedbackPreviewContent = cn(
  "fixed left-[50%] top-[50%] z-[2147483004] flex max-h-[92vh] w-[min(96vw,1400px)]",
  "translate-x-[-50%] translate-y-[-50%] flex-col gap-3",
  "border border-blue-600/25 bg-card p-6 text-card-foreground",
  "bg-gradient-to-br from-slate-100/80 via-transparent to-sky-500/10",
  "shadow-[0_24px_64px_rgba(48,120,192,0.2)] duration-200",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  "sm:rounded-lg",
  "dark:border-blue-600/35 dark:from-blue-900/50 dark:to-sky-500/[0.07]",
  "dark:shadow-[0_24px_64px_rgba(12,48,96,0.6)]"
);

/** Scrolls inside the modal so a tall page shot is fully reachable. */
const userFeedbackPreviewImage = cn(
  "min-h-0 w-full flex-1 rounded-md border object-contain",
  "border-blue-600/20 bg-card/60 dark:border-blue-600/25 dark:bg-black/25"
);

const userFeedbackPreviewTitle = cn(
  "bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text",
  "text-lg font-semibold text-transparent",
  "dark:from-slate-100 dark:to-sky-500"
);

const userFeedbackPreviewClose = cn(
  "absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors",
  "hover:bg-blue-600/10 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "dark:hover:bg-blue-900/60"
);

/** Glyph in the empty "nothing pointed at yet" panel. */
const userFeedbackEmptyIcon = "h-5 w-5 text-blue-600/60 dark:text-sky-500/60";

/** Inline reason a submit failed, under the send button. */
const userFeedbackErrorText = "text-[11px] text-destructive";

const userFeedbackStatusFailedIcon = "h-3.5 w-3.5 shrink-0 text-destructive";

const userFeedbackStatusReadyIcon =
  "h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-sky-500";

/** Class names for every part of the feedback widget. */
export const defaultUserFeedbackTheme = {
  userFeedbackLauncher,
  userFeedbackLauncherDragging,
  userFeedbackDrawerShell,
  userFeedbackDrawerOpenShadow,
  userFeedbackHeader,
  userFeedbackIconWrap,
  userFeedbackIcon,
  userFeedbackTitle,
  userFeedbackSubtitle,
  userFeedbackCountBadge,
  userFeedbackCloseButton,
  userFeedbackSectionDivider,
  userFeedbackSectionLabel,
  userFeedbackHint,
  userFeedbackPanel,
  userFeedbackField,
  userFeedbackSelectTrigger,
  userFeedbackTextarea,
  userFeedbackPickButton,
  userFeedbackActionButton,
  userFeedbackPrimaryAction,
  userFeedbackRowIndex,
  userFeedbackRowTitle,
  userFeedbackRowMeta,
  userFeedbackRowMetaFailed,
  userFeedbackRemoveButton,
  userFeedbackRetryButton,
  userFeedbackClearButton,
  userFeedbackThumbnailButton,
  userFeedbackThumbnailPlaceholder,
  userFeedbackPreviewOverlay,
  userFeedbackPreviewContent,
  userFeedbackPreviewImage,
  userFeedbackPreviewTitle,
  userFeedbackPreviewClose,
  userFeedbackEmptyIcon,
  userFeedbackErrorText,
  userFeedbackStatusFailedIcon,
  userFeedbackStatusReadyIcon,
};

export type UserFeedbackTheme = typeof defaultUserFeedbackTheme;
