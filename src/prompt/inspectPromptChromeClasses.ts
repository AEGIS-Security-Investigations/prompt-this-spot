import { cn } from "../lib/cn";

/** Shell: agent panel — distinct from app chrome in both light and dark. */
export const inspectPromptDrawerShell = cn(
  "pointer-events-auto fixed inset-y-0 left-0 z-[124] flex w-[360px] max-w-[90vw] flex-col",
  "border-r border-violet-300/70 bg-gradient-to-br from-violet-50 via-white to-cyan-50/40",
  "text-zinc-900",
  "dark:border-violet-500/40 dark:from-[#0a0812] dark:via-[#0a0812] dark:to-[#0d0a14]",
  "dark:text-zinc-100",
  "transition-[transform,box-shadow] duration-300 ease-in-out"
);

/** Right-edge glow — only while open; off-screen translate still bleeds shadow into the viewport. */
export const inspectPromptDrawerShellOpenGlow = cn(
  "shadow-[4px_0_24px_rgba(139,92,246,0.14)]",
  "dark:shadow-[4px_0_32px_rgba(88,28,135,0.35)]"
);

export const inspectPromptHeader = cn(
  "flex items-center justify-between border-b border-violet-200/80 px-4 py-3",
  "bg-gradient-to-r from-violet-100/80 to-transparent",
  "dark:border-violet-500/20 dark:from-violet-950/40"
);

export const inspectPromptIconWrap = cn(
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
  "border-violet-300/70 bg-violet-100/80",
  "dark:border-violet-400/30 dark:bg-violet-950/50"
);

export const inspectPromptIcon = cn(
  "h-4 w-4 text-violet-600 dark:text-violet-300"
);

export const inspectPromptTitle = cn(
  "truncate bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-sm font-semibold text-transparent",
  "dark:from-violet-200 dark:to-fuchsia-300"
);

export const inspectPromptSubtitle = cn(
  "truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-500"
);

export const inspectPromptShortcutHint = cn(
  "shrink-0 rounded border px-1 py-px font-mono text-[9px] font-medium leading-none",
  "border-violet-300/70 bg-white/80 text-violet-700",
  "dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300"
);

export const inspectPromptCloseButton = cn(
  "rounded-md border border-transparent p-1.5 text-zinc-500 transition-colors",
  "hover:border-violet-200 hover:bg-violet-100 hover:text-zinc-800",
  "dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
);

export const inspectPromptSectionDivider = cn(
  "border-violet-200/80 dark:border-violet-500/15"
);

export const inspectPromptSectionLabel = cn(
  "font-mono text-[10px] font-medium uppercase tracking-[0.2em]",
  "text-violet-700/90 dark:text-violet-300/80"
);

export const inspectPromptHint = cn(
  "text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-500"
);

export const inspectPromptPanel = cn(
  "rounded-lg border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
  "border-violet-200/80 bg-white/70",
  "dark:border-violet-500/20 dark:bg-black/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
);

export const inspectPromptTextarea = cn(
  "h-28 w-full resize-none rounded-md border p-3 font-mono text-xs leading-relaxed",
  "border-violet-200 bg-white text-zinc-800 placeholder:text-zinc-400",
  "focus-visible:border-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40",
  "dark:border-violet-500/25 dark:bg-[#07050c] dark:text-zinc-200 dark:placeholder:text-zinc-600",
  "dark:focus-visible:border-violet-400/40 dark:focus-visible:ring-violet-500/50"
);

export const inspectPromptPickButton = (active: boolean) =>
  cn(
    "flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2.5",
    "font-mono text-xs font-semibold uppercase tracking-wide transition-all",
    active
      ? cn(
          "border-amber-400/70 bg-amber-50 text-amber-900 shadow-[0_0_16px_rgba(245,158,11,0.12)]",
          "dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200 dark:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
        )
      : cn(
          "border-violet-300/70 bg-violet-100/60 text-violet-900 shadow-[0_0_12px_rgba(139,92,246,0.08)]",
          "hover:border-violet-400 hover:bg-violet-100",
          "dark:border-violet-500/40 dark:bg-violet-950/30 dark:text-violet-100",
          "dark:shadow-[0_0_16px_rgba(139,92,246,0.12)] dark:hover:border-violet-400/60 dark:hover:bg-violet-900/30"
        )
  );

export const inspectPromptActionButton = cn(
  "flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 font-mono text-xs",
  "border-violet-200/80 bg-white/80 text-zinc-700 transition-colors",
  "hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900",
  "disabled:pointer-events-none disabled:opacity-40",
  "dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-300",
  "dark:hover:border-violet-500/40 dark:hover:bg-violet-950/30 dark:hover:text-violet-100"
);

export const inspectPromptPrimaryAction = cn(
  "flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2.5",
  "border-violet-500/40 bg-gradient-to-r from-violet-600 to-fuchsia-600 font-mono text-xs font-semibold text-white",
  "shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-all hover:from-violet-500 hover:to-fuchsia-500",
  "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
  "dark:border-violet-400/50 dark:shadow-[0_0_24px_rgba(139,92,246,0.35)]"
);

export const inspectPromptLauncher = cn(
  "group pointer-events-auto fixed z-[130] flex touch-none select-none items-center",
  "cursor-grab rounded-full border border-violet-400/60 p-3",
  "bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white",
  "shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-[box-shadow,border-color,transform,opacity]",
  "hover:border-violet-300 hover:shadow-[0_0_32px_rgba(139,92,246,0.45)]",
  "active:cursor-grabbing",
  "dark:border-violet-500/50 dark:shadow-[0_0_28px_rgba(139,92,246,0.45)]",
  "dark:hover:border-violet-300/60 dark:hover:shadow-[0_0_36px_rgba(139,92,246,0.55)]"
);

export const inspectPromptLauncherDragging = cn(
  "z-[131] scale-105 opacity-90 shadow-[0_8px_32px_rgba(139,92,246,0.5)]"
);

export const inspectPromptCountBadge = cn(
  "rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium",
  "border-violet-300/70 bg-violet-100 text-violet-800",
  "dark:border-violet-400/30 dark:bg-violet-950/60 dark:text-violet-200"
);

export const inspectPromptClearButton = cn(
  "font-mono text-[10px] text-zinc-500 underline-offset-2 hover:underline",
  "hover:text-violet-700 dark:hover:text-violet-300"
);

export const inspectPromptSelectionTitle = cn(
  "truncate font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200"
);

export const inspectPromptSelectionIndex = cn(
  "mr-1.5 text-violet-600/90 dark:text-violet-400/80"
);

export const inspectPromptSelectionSelector = cn(
  "truncate font-mono text-[10px] text-cyan-700/90 dark:text-cyan-400/70"
);

export const inspectPromptRemoveButton = cn(
  "shrink-0 rounded p-1 text-zinc-400 transition-colors",
  "hover:bg-red-100 hover:text-red-600",
  "dark:text-zinc-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
);

/** Thumbnail acts as the "open full size" trigger, so it reads as clickable. */
export const inspectPromptScreenshotThumbnailButton = cn(
  "h-10 w-14 shrink-0 overflow-hidden rounded border p-0 transition-colors",
  "border-violet-200/80 hover:border-violet-400",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
  "dark:border-violet-500/25 dark:hover:border-violet-400/60"
);

export const inspectPromptScreenshotPreviewContent = cn(
  "fixed left-[50%] top-[50%] z-[140] flex max-h-[92vh] w-[min(96vw,1400px)] translate-x-[-50%] translate-y-[-50%] flex-col gap-3",
  "border border-violet-300/70 bg-gradient-to-br from-violet-50 via-white to-cyan-50/40 p-6",
  "text-zinc-900 shadow-[0_24px_64px_rgba(139,92,246,0.2)] duration-200",
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
  "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  "sm:rounded-lg",
  "dark:border-violet-500/40 dark:from-[#0a0812] dark:via-[#0a0812] dark:to-[#0d0a14]",
  "dark:text-zinc-100 dark:shadow-[0_24px_64px_rgba(88,28,135,0.45)]"
);

/** Scrolls inside the modal so a tall page shot is fully reachable. */
export const inspectPromptScreenshotPreviewImage = cn(
  "min-h-0 w-full flex-1 rounded-md border object-contain",
  "border-violet-200/80 bg-white/60",
  "dark:border-violet-500/25 dark:bg-black/30"
);

export const inspectPromptScreenshotNoteInput = cn(
  "mt-1.5 w-full rounded border px-2 py-1 font-mono text-[11px] leading-relaxed",
  "border-violet-200 bg-white text-zinc-800 placeholder:text-zinc-400",
  "focus-visible:border-violet-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/40",
  "dark:border-violet-500/25 dark:bg-[#07050c] dark:text-zinc-200 dark:placeholder:text-zinc-600"
);

export const inspectPromptRetryButton = cn(
  "shrink-0 rounded p-1 text-zinc-400 transition-colors",
  "hover:bg-violet-100 hover:text-violet-700",
  "dark:text-zinc-600 dark:hover:bg-violet-950/40 dark:hover:text-violet-300"
);

export const inspectPromptCopiedIcon = cn(
  "h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
);

export const inspectPromptRawPreviewPanel = cn(
  "rounded-md border p-3 font-mono text-[11px] leading-relaxed",
  "border-violet-200/80 bg-violet-50/50 text-zinc-800",
  "dark:border-violet-500/25 dark:bg-[#07050c] dark:text-zinc-300"
);

export const inspectPromptRawEditorShell = cn(
  "overflow-hidden rounded-md border",
  "border-violet-200/80 bg-white/80 dark:border-violet-500/25 dark:bg-[#07050c]",
  "[&_.cm-editor]:max-h-[min(60vh,28rem)] [&_.cm-editor]:min-h-[16rem]",
  "[&_.cm-editor.cm-focused]:outline-none",
  "[&_.cm-scroller]:font-mono [&_.cm-scroller]:text-[11px] [&_.cm-scroller]:leading-relaxed"
);

/** Above the inspect drawer (z-124) and launcher (z-130). */
export const inspectPromptRawModalOverlay = cn("z-[140]");

export const inspectPromptRawModalContent = cn(
  "fixed left-[50%] top-[50%] z-[140] grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4",
  "border border-violet-300/70 bg-gradient-to-br from-violet-50 via-white to-cyan-50/40 p-6",
  "text-zinc-900 shadow-[0_24px_64px_rgba(139,92,246,0.2)] duration-200",
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
  "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  "sm:rounded-lg",
  "dark:border-violet-500/40 dark:from-[#0a0812] dark:via-[#0a0812] dark:to-[#0d0a14]",
  "dark:text-zinc-100 dark:shadow-[0_24px_64px_rgba(88,28,135,0.45)]"
);

export const inspectPromptRawModalTitle = cn(
  "bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-lg font-semibold text-transparent",
  "dark:from-violet-200 dark:to-fuchsia-300"
);

export const inspectPromptRawModalClose = cn(
  "absolute right-4 top-4 rounded-md p-1.5 text-zinc-500 transition-colors",
  "hover:bg-violet-100 hover:text-zinc-800",
  "dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
);

export const inspectPromptRawModalFooter = cn(
  "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
);
