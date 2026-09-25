# prompt-this-spot: click any element in your React app and get a ready-made prompt for an AI coding agent

**prompt-this-spot** is an open-source React component library that turns "this button here" into a precise prompt for an AI coding agent such as Claude Code, Cursor or GitHub Copilot. You click the parts of a page you want changed, type what you want, and it writes a prompt that names each element by its visible text, HTML tag, attributes, CSS classes and DOM path, with a screenshot link attached. The same capture core also powers an in-app **user feedback widget** with screenshots and bug reports.

- **License:** MIT
- **Works with:** React 19, Next.js, Tailwind CSS v3 and v4, shadcn/ui
- **Output:** plain-text prompts you can paste into any AI coding assistant, plus one-click links for Claude Code on the web and the Claude Code desktop and CLI app
- **Backend:** none included; you plug in your own screenshot storage and feedback endpoint

## Contents

- [Why prompt-this-spot](#why-prompt-this-spot)
- [Features](#features)
- [Example prompt](#example-prompt)
- [How it works](#how-it-works)
- [Install](#install)
- [Set up](#set-up)
- [Configuration](#configuration)
- [Keeping apps up to date](#keeping-apps-up-to-date)
- [FAQ](#faq)
- [Developing](#developing)

## Why prompt-this-spot

AI coding agents are good at changing code but bad at guessing which part of the UI you mean. "Make the upgrade button bigger" leaves the agent searching the codebase for the right button on the right page. prompt-this-spot gives the agent the missing context: the route, the exact element, its classes and test ID, its location in the DOM, and a picture of it. The agent can go straight to the component instead of guessing.

It helps two groups of people:

- **Developers, designers and product reviewers** doing visual QA who want to hand UI changes to an AI agent without describing the page in words.
- **Users of your app** who want to report a bug or suggest an improvement by pointing at it. Their report arrives with the same AI-ready prompt already written, so triage can go straight to an agent.

## Features

It ships two tools that share one capture core:

- **Prompt this spot** (element inspector for AI prompts): an engineer clicks the parts of a page they want changed, types what they want, and gets a prompt for an AI coding agent. The prompt describes each element (DOM path, visible text, styles) and links a screenshot of it. They can copy the prompt, open it in Claude Code on the web, or open it in a local Claude Code install. The keyboard shortcut is ⌘/Ctrl + Shift + P.
- **Send feedback** (in-app feedback and bug report widget): a user of the app points at what's wrong, adds screenshots, picks a category and describes the problem. The report goes to your backend with the same AI prompt already assembled, so someone triaging it can hand it straight to an agent.

Both tools also:

- Select several elements at once, even across page navigations, and describe them in one numbered prompt.
- Capture element and full-page screenshots in the browser with `html2canvas`, with an optional note on each.
- Open as a left-hand drawer that pushes the app aside, so the page stays visible and clickable.
- Pick elements inside open dialogs, popovers and menus.
- Offer launchers that can be dragged to any corner and remember their position.
- Support light and dark mode, and take your brand colors through Tailwind class overrides.
- Stay out of the bundle for users who aren't allowed to use them (the heavy code loads on demand).

## Example prompt

Clicking an "Upgrade plan" button on `/settings/billing` and typing a request produces this prompt:

```text
In our app on the page "/settings/billing", I'm pointing at this element:

- What it shows: "Upgrade plan"
- Element: <button> data-testid="upgrade-plan"
- Classes: btn btn-primary
- Location (DOM path): button[data-testid="upgrade-plan"]

What I want changed here: Make this button full width on mobile
```

When screenshots are on, each element also gets a public screenshot URL the agent can open. An optional checkbox appends a request for unit and end-to-end test coverage.

## How it works

1. **Pick.** Pick mode highlights the element under the cursor. A click records a description of the element straight away, so it survives the element unmounting later (for example, when its dialog closes).
2. **Capture.** The package renders a screenshot of the element and its surroundings in the browser and hands the PNG to your upload function, which returns a public URL.
3. **Assemble.** It builds a plain-text prompt from the page path, element descriptions, screenshot links and your request.
4. **Hand off.** "Prompt this spot" copies the prompt or opens it in Claude Code. "Send feedback" passes it, with the rest of the report, to your `submitFeedback` function.

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

## FAQ

### What is prompt-this-spot?

A React library that lets you click an element in a running web app and get a text prompt describing that element for an AI coding agent. It also includes an in-app feedback widget that attaches the same prompt and screenshots to user bug reports.

### Which AI coding agents does it work with?

Any agent that accepts text. The prompt is plain text, so you can paste it into Claude Code, Cursor, GitHub Copilot, Windsurf, ChatGPT or another assistant. There are also one-click buttons that open the prompt in Claude Code on the web (with your repository pre-selected) or in a local Claude Code install.

### Does it work with Next.js?

Yes. Add the package to `transpilePackages` and to Tailwind's content scan, as shown in [Install](#install). Other React 19 setups should work too, as long as their bundler compiles TypeScript from `node_modules` and Tailwind scans the package's source.

### Does it need a backend or a paid service?

No hosted service is involved. You provide two small routes of your own: one that stores a PNG and returns a public URL, and one that saves feedback. `createScreenshotUploader` handles the client side of the upload.

### Can end users see it?

Only if you let them. Each tool has an `eligible` flag, so you can show "Prompt this spot" to admins or internal staff and "Send feedback" to every signed-in user, or neither.

### How are screenshots taken?

In the browser with `html2canvas`, so no extension or screen-recording permission is needed. Layout and text are accurate; some effects (CSS masks, backdrop filters, animations) may render differently from the live page, and the prompt tells the agent to trust the DOM details over pixel-level styling.

### Is it on npm?

Not yet. Install it from GitHub, pinned to a tag or commit.

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
