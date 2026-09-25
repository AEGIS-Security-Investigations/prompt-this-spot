/**
 * Lift a bottom-anchored floating launcher clear of the mobile bottom
 * navigation.
 *
 * Assumes a mobile bottom nav that is `fixed inset-x-0 bottom-0` with a 64px bar
 * plus the safe-area inset, and `lg:hidden` — so below
 * `lg` a launcher sitting at `bottom-6` (24px) lands *on top of* the bar and
 * swallows the taps meant for it. Without the lift the floating button intercepts every tap on the
 * bar's own buttons.
 *
 * The offset is the bar's own height plus its inset plus a gap — `5rem` is the
 * 64px bar and a 16px gap, and `env(safe-area-inset-bottom)` matches the
 * padding the bar itself adds, which a flat `bottom-24` would still clip on a
 * notched iPhone. Applied only below `lg`, which is exactly where the bar
 * exists; `cn()` runs tailwind-merge, so this coexists with the base `bottom-6`
 * rather than fighting it.
 *
 * Shared by every bottom-anchored launcher — they stack on each
 * other, so they have to agree on where the bottom of the stack is.
 */
export const floatingLauncherAboveMobileNav =
  "max-lg:bottom-[calc(5rem+env(safe-area-inset-bottom))]";
