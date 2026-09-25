import { cn } from "../lib/cn";

/**
 * Chrome for the drawer's checkbox options. Kept out of
 * `inspectPromptChromeClasses` only because that file is at the repo's
 * file-size cap — these belong to the same agent-panel look.
 */

/** Row wrapping one checkbox option under the request field. */
export const inspectPromptOptionRow = cn(
  "flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 transition-colors",
  "border-violet-200/80 bg-white/70 hover:border-violet-300 hover:bg-violet-50",
  "dark:border-violet-500/25 dark:bg-black/30",
  "dark:hover:border-violet-400/50 dark:hover:bg-violet-950/30"
);

/** Overrides the shared <Checkbox>'s app-primary palette with drawer violet. */
export const inspectPromptOptionCheckbox = cn(
  "mt-px h-3.5 w-3.5 border-violet-400 focus-visible:ring-violet-400/50",
  "data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600",
  "data-[state=checked]:text-white",
  "dark:border-violet-400/60 dark:data-[state=checked]:border-violet-500",
  "dark:data-[state=checked]:bg-violet-500",
  // The shared checkbox's tick is sized for a 16px box; keep it inside ours.
  "[&_svg]:h-3 [&_svg]:w-3"
);

export const inspectPromptOptionLabel = cn(
  "block cursor-pointer font-mono text-[11px] font-medium leading-tight",
  "text-zinc-700 dark:text-zinc-300"
);
