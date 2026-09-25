"use client";

import { lazy, Suspense, useEffect, useState } from "react";

// Client-only; adds nothing to the server bundle.
//
// A lazily imported component fetches its chunk as soon as the element mounts,
// so mounting `InspectPromptTool` unconditionally would make every ineligible
// user download and parse its chunk (`@uiw/react-codemirror` + the capture core)
// on every page view just to have the in-component gate render nothing. This
// gate decides whether to mount at all; the in-component gate is unchanged and
// remains the authoritative one.
const InspectPromptTool = lazy(() =>
  import("./InspectPromptTool").then((mod) => ({
    default: mod.InspectPromptTool,
  }))
);

/**
 * Pre-gate so ineligible users never download the inspect tool's chunk.
 *
 * `eligible` is the host app's decision — typically "is an engineer or admin",
 * plus anyone signed in on a preview deployment. The tool is rendered only
 * after the client mounts, so it never takes part in server rendering.
 */
export function InspectPromptToolGate({ eligible }: { eligible: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!eligible || !mounted) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <InspectPromptTool eligible={eligible} />
    </Suspense>
  );
}
