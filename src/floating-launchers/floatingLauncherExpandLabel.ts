import { cn } from "../lib/cn";

/**
 * Label classes for the icon-only-until-hover floating launchers.
 *
 * Prompt this spot and Send feedback already expand this way: the label starts
 * at `max-w-0` / `opacity-0` and opens on group hover or focus-visible. A host
 * app's own launchers can use the same helper so the three pills animate as one family.
 *
 * `expandsLeft` is for a right-edge launcher so the text grows into the page
 * instead of off the viewport.
 */
export const floatingLauncherExpandLabelClass = (
  expandsLeft: boolean
): string =>
  cn(
    "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out motion-reduce:transition-none",
    expandsLeft
      ? "group-hover:mr-2 group-hover:max-w-[12rem] group-hover:opacity-100 group-focus-visible:mr-2 group-focus-visible:max-w-[12rem] group-focus-visible:opacity-100"
      : "group-hover:ml-2 group-hover:max-w-[12rem] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[12rem] group-focus-visible:opacity-100"
  );
