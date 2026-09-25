# prompt-this-spot

Two in-app tools for React apps that share one capture core:

- **Prompt this spot**: an engineer clicks the parts of a page they want changed, types what they want, and gets a prompt for an AI coding agent. The prompt describes each element (DOM path, visible text, styles) and links a screenshot of it. They can copy the prompt, open it in Claude Code on the web, or open it in a local Claude Code install. The keyboard shortcut is ⌘/Ctrl + Shift + P.
- **Send feedback**: a user of the app points at what's wrong, adds screenshots, picks a category and describes the problem. The report goes to your backend with the same AI prompt already assembled, so someone triaging it can hand it straight to an agent.

Both tools open as a left-hand drawer that pushes the app aside, so the page stays visible and clickable. Pick mode works inside open dialogs and popovers, and both launchers can be dragged to any corner.

The package ships as TypeScript source. It uses React 19, Tailwind CSS classes, shadcn/ui theme tokens, Radix primitives and `html2canvas`. It has no backend: your app supplies the pieces that differ between apps (who may use each tool, where screenshots are stored, where feedback goes) through one provider.

## Install

This package is installed from GitHub, not from npm. Pin it to a tag or a commit:

```bash
bun add github:AEGIS-Security-Investigations/prompt-this-spot#v0.1.0
# peer dependencies, if the app does not have them already
bun add lucide-react @uiw/react-codemirror @codemirror/view
```

### Next.js

The package is TypeScript source, so let Next compile it:

```js
// next.config.js
module.exports = {
  transpilePackages: ["prompt-this-spot"],
};
```

### Tailwind

Tailwind only generates classes it finds in files it scans, and it does not scan `node_modules` by default. Add the package to the scan:

```js
// Tailwind v3: tailwind.config.js
content: [
  // ...
  "./node_modules/prompt-this-spot/src/**/*.{ts,tsx}",
],
```

```css
/* Tailwind v4: your global stylesheet */
@source "../../node_modules/prompt-this-spot/src";
```

The tools use shadcn/ui theme tokens (`bg-card`, `text-muted-foreground`, `bg-popover`, `ring-ring`, `bg-primary`, `text-destructive`) and `tailwindcss-animate` classes (`animate-in`, `fade-in-0`, `zoom-in-95`). If your app uses shadcn/ui, these are already defined. Dark mode follows the `class` strategy (`<html class="dark">`).

## Set up

### 1. Mark the app shell

Put `data-app-push-root` on the element that wraps your app. The drawers push this element aside when they open. Keep the tool gates outside it so the drawers stay fixed at the left edge.

```tsx
<div data-app-push-root className="min-h-svh">
  {children}
</div>
```

### 2. Supply your adapters and mount the gates

```tsx
"use client";

import {
  createScreenshotUploader,
  FloatingLauncherStackProvider,
  InspectPromptPreferencesProvider,
  InspectPromptToolGate,
  type PromptThisSpotConfig,
  PromptThisSpotProvider,
  UserFeedbackToolGate,
} from "prompt-this-spot";
import { useMemo } from "react";

export function DevTools({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser(); // your auth
  const { toast } = useToast(); // your toasts

  const config = useMemo<PromptThisSpotConfig>(
    () => ({
      notify: toast,
      repoSlug: "your-org/your-repo",
      uploadPromptScreenshot: createScreenshotUploader("/api/prompt-this-spot/screenshot"),
      uploadFeedbackScreenshot: createScreenshotUploader("/api/feedback/screenshot"),
      submitFeedback: async (submission) => {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submission),
        });
        if (!res.ok) throw new Error("Couldn't save your feedback.");
      },
    }),
    [toast]
  );

  return (
    <PromptThisSpotProvider config={config}>
      <InspectPromptPreferencesProvider>
        <FloatingLauncherStackProvider>
          <div data-app-push-root className="min-h-svh">
            {children}
          </div>
          <InspectPromptToolGate eligible={Boolean(user?.isAdmin)} />
          <UserFeedbackToolGate eligible={Boolean(user)} />
        </FloatingLauncherStackProvider>
      </InspectPromptPreferencesProvider>
    </PromptThisSpotProvider>
  );
}
```

Each gate renders nothing until `eligible` is true, and a user who isn't eligible never downloads the tools' heavy code (`html2canvas`, CodeMirror). The feedback tool goes further and waits for the first click on its launcher, because it's usually shown to every signed-in user. Only mount the gates you want.

### 3. Add the backend routes

The package never talks to storage or a database itself. You provide:

| Adapter | Receives | Must return |
|---|---|---|
| `uploadPromptScreenshot`, `uploadFeedbackScreenshot` | a PNG `data:` URL | `{ url, expiresAt? }`, where `url` is publicly readable (an AI agent opens it from the prompt) and `expiresAt` is an ISO date, or null if the image is kept |
| `submitFeedback` | a `UserFeedbackSubmission` (message, category, pathname, assembled prompt, selections, screenshots, viewport) | nothing; throw an `Error` to show its message in the drawer |

`createScreenshotUploader(path)` covers the common case: it POSTs `{ dataUrl }` as JSON to your route and returns the JSON response. Your route should check that the caller is allowed, decode the PNG, store it in public object storage (S3, Vercel Blob, and so on), and respond with `{ url, expiresAt }`. On an error it should return `{ error }` with a non-2xx status.

## Configuration

Every field of `PromptThisSpotConfig` is optional:

| Field | Default | What it does |
|---|---|---|
| `notify(toast)` | no-op | Shows `{ title, description?, variant? }` toasts (shadcn/ui's `toast()` fits) |
| `logError(message, context)` | `console.error` | Reports a screenshot that failed |
| `repoSlug` | none | GitHub `owner/name` that "Send to Claude Code" opens |
| `uploadPromptScreenshot` / `uploadFeedbackScreenshot` | throws | Screenshot storage (see above) |
| `submitFeedback` | throws | Feedback storage (see above) |
| `feedbackCategories` | Broken / Confusing / Idea / Praise / Other | `{ value, label }[]` for the feedback form; the first one is preselected |
| `feedbackTheme` | neutral blue | Tailwind class overrides for any part of the feedback widget (see `defaultUserFeedbackTheme`) |
| `feedbackE2eOptInStorageKey` | `prompt-this-spot:e2e-user-feedback` | Automated browsers (`navigator.webdriver`) don't see the feedback launcher unless this `sessionStorage` key is `"1"` |

The "Prompt this spot" preferences are stored per browser in `localStorage`: whether the launcher shows, its corner, whether screenshots are captured, and whether the prompt asks for test coverage. Read and set them with `useInspectPromptPreferences()` to build your own settings UI.

### Matching your brand

Pass any subset of `defaultUserFeedbackTheme`'s keys. Unset keys keep the defaults:

```ts
feedbackTheme: {
  userFeedbackLauncher: "… your launcher classes …",
  userFeedbackPrimaryAction: "… your button classes …",
},
```

If the classes live in your app's source files, Tailwind already scans them.

## Keeping apps up to date

An app pinned to a commit doesn't pick up changes by itself. [`docs/consumer-update-workflow.yml`](docs/consumer-update-workflow.yml) is a GitHub Actions workflow you can copy into an app's `.github/workflows/`. On a schedule (and whenever this repo notifies it), it finds the newest commit on `main`, updates the dependency and lockfile, and opens a pull request that lists the changes. You review and merge it like any other PR.

To get those PRs right after a merge here, not just on the schedule, add a `CONSUMER_DISPATCH_TOKEN` secret to this repository and list the apps in `.github/workflows/notify-consumers.yml`. The token needs permission to send `repository_dispatch` events to those apps (for a fine-grained token, contents read and write).

## Developing

```bash
bun install
bun run check   # typecheck + biome + tests
```

To try a change in an app before it's merged, link your local checkout:

```bash
# in this repo
bun link
# in the app
bun link prompt-this-spot
```

Keep the package app-neutral. Anything that differs between apps (auth, storage, copy about a specific product, brand colors) belongs behind `PromptThisSpotConfig`, not in the code. Keep `data-testid` values stable, because apps' end-to-end tests select on them.

## License

MIT
