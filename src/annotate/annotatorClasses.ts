import { cn } from "../lib/cn";

/**
 * Chrome for the markup toolbar. Neutral greys so it sits inside either tool's
 * dialog; each tool passes its own dialog, trigger and primary-button classes.
 */
export const annotatorToolbar = cn(
  "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
  "border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80"
);

export const annotatorToolButton = (active: boolean) =>
  cn(
    "flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
    "disabled:pointer-events-none disabled:opacity-40",
    active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
  );

export const annotatorSwatch = (active: boolean) =>
  cn(
    "h-6 w-6 rounded-full border-2 transition-transform",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
    active
      ? "scale-110 border-zinc-900 dark:border-white"
      : "border-white/80 dark:border-zinc-900"
  );

export const annotatorDivider = "mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700";

export const annotatorStage = cn(
  "flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-md border p-2",
  "border-zinc-200 bg-zinc-100/80 dark:border-zinc-700 dark:bg-black/40"
);

export const annotatorCanvas =
  "block h-auto max-h-[62vh] w-auto max-w-full cursor-crosshair touch-none select-none";

export const annotatorTextInput = cn(
  "absolute min-w-[8rem] rounded-sm border border-dashed border-white/80 bg-slate-900/85 px-1 font-semibold",
  "outline-none placeholder:text-white/60"
);

export const annotatorFooter = "flex flex-wrap items-center justify-end gap-2";

export const annotatorSecondaryButton = cn(
  "rounded-md border px-3 py-2 text-xs font-medium transition-colors",
  "border-zinc-300 text-zinc-700 hover:bg-zinc-100",
  "dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
);

export const annotatorError = "text-xs text-red-700 dark:text-red-400";
