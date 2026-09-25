# prompt-this-spot: click any element in your React app and get a ready-made prompt for an AI coding agent

**prompt-this-spot** is an open-source React component library that turns "this button here" into a precise prompt for an AI coding agent such as Claude Code, Cursor or GitHub Copilot. You click the parts of a page you want changed, type what you want, and it writes a prompt that names each element by its visible text, HTML tag, attributes, CSS classes and DOM path, with a screenshot link attached. The same capture core also powers an in-app **user feedback widget** with screenshots and bug reports.

- **License:** MIT
- **Works with:** React 19, Next.js, Tailwind CSS v3 and v4, shadcn/ui, and apps without Tailwind through a prebuilt stylesheet
- **Output:** plain-text prompts you can paste into any AI coding assistant, plus one-click links for Claude Code on the web and the Claude Code desktop and CLI app
- **Backend:** none included; you plug in your own screenshot storage and feedback endpoint

## Contents

- [Why prompt-this-spot](#why-prompt-this-spot)
- [Features](#features)
- [Example prompt](#example-prompt)
- [How it works](#how-it-works)
- [Install](#install)
- [Troubleshooting](#troubleshooting)
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
- Capture element and full-page screenshots in the browser with `modern-screenshot`, with an optional note on each.
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

The package ships as TypeScript source. It uses React 19, Tailwind CSS classes, shadcn/ui theme tokens, Radix primitives and `modern-screenshot`. It has no backend: your app supplies the pieces that differ between apps (who may use each tool, where screenshots are stored, where feedback goes) through one provider.

## Install

Adding prompt-this-spot to a React app takes six steps. The examples use Next.js with the App Router and Bun; other setups need the same pieces.

- [ ] [1. Add the package](#1-add-the-package)
- [ ] [2. Let your bundler compile it](#2-let-your-bundler-compile-it)
- [ ] [3. Let Tailwind see its classes](#3-let-tailwind-see-its-classes)
- [ ] [4. Add a provider component](#4-add-a-provider-component)
- [ ] [5. Mount it in your root layout](#5-mount-it-in-your-root-layout)
- [ ] [6. Add the backend routes](#6-add-the-backend-routes)

Then [check that it works](#check-that-it-works). If something looks wrong, see [Troubleshooting](#troubleshooting).

**Before you start**, your app needs React 19. With Tailwind CSS (v3 or v4) the package's classes compile with the rest of your app; without it, import the prebuilt stylesheet instead (see step 3). shadcn/ui is not required.

### Let an AI coding agent install it

You can hand the whole job to Claude Code or another coding agent. Paste this prompt in your app's repository:

```text
Install the prompt-this-spot package in this app by following the Install
section of https://github.com/AEGIS-Security-Investigations/prompt-this-spot#install.
Pin it to the newest commit on main. Show "Prompt this spot" to admins only and
"Send feedback" to every signed-in user, using this app's existing auth and toast
helpers. Store screenshots in the object storage this app already uses. Save
feedback where this app keeps similar records, or ask me if there is no obvious
place. Then run the app's typecheck, lint and tests.
```

Change who sees each tool to suit your app.

### 1. Add the package

This package is installed from GitHub, not from npm. Pin it to a commit so every install gets the same code:

```bash
# Find the newest commit on main
git ls-remote https://github.com/AEGIS-Security-Investigations/prompt-this-spot refs/heads/main

# Add the package pinned to that commit
bun add github:AEGIS-Security-Investigations/prompt-this-spot#<commit-sha>

# Add the peer dependencies your app doesn't already have
bun add lucide-react @uiw/react-codemirror @codemirror/view
```

npm, pnpm and Yarn take the same `github:owner/repo#sha` spec. Pinning to a commit also lets the [update workflow](#keeping-apps-up-to-date) open a pull request whenever this repository changes.

### 2. Let your bundler compile it

The package ships as TypeScript source, so your bundler has to compile it. In Next.js:

```js
// next.config.js (or next.config.mjs / next.config.ts)
module.exports = {
  transpilePackages: ["prompt-this-spot"],
};
```

### 3. Let Tailwind see its classes

Tailwind only generates classes it finds in files it scans, and it does not scan `node_modules` by default. Add the package to the scan:

```js
// Tailwind v3: tailwind.config.js
content: [
  // ...
  "./node_modules/prompt-this-spot/src/**/*.{ts,tsx}",
],
```

```css
/* Tailwind v4: your global stylesheet. The path is relative to this file. */
@source "../../node_modules/prompt-this-spot/src";
```

The tools use shadcn/ui theme tokens (`bg-card`, `text-muted-foreground`, `bg-popover`, `ring-ring`, `bg-primary`, `text-destructive`) and `tailwindcss-animate` classes (`animate-in`, `fade-in-0`, `zoom-in-95`). If your app uses shadcn/ui, these are already defined. If it doesn't, define those colors in your Tailwind theme and add `tailwindcss-animate` (or `tw-animate-css` on v4). Dark mode follows the `class` strategy (`<html class="dark">`).

#### No Tailwind? Import the prebuilt stylesheet

Apps that don't run Tailwind import the compiled stylesheet once, for example in the root layout, and skip the content scan above:

```ts
import "prompt-this-spot/styles.css";
```

It holds only the classes the package uses, a reset scoped to the tools' own elements (everything marked `data-inspect-ignore`), the enter and exit animations, and default light and dark values for the theme colors. It doesn't restyle the rest of your app. To change a theme color, set its `--pts-*` custom property, for example `:root { --pts-primary: #0f766e; }`. The properties are `--pts-background`, `--pts-foreground`, `--pts-card`, `--pts-card-foreground`, `--pts-popover`, `--pts-popover-foreground`, `--pts-primary`, `--pts-primary-foreground`, `--pts-muted`, `--pts-muted-foreground`, `--pts-accent`, `--pts-accent-foreground`, `--pts-destructive`, `--pts-border`, `--pts-input` and `--pts-ring`.

Don't import it in an app that already scans the package with Tailwind: the two would define the same classes twice.

#### Bundlers without tree shaking (Expo web)

Metro, the bundler for Expo web, doesn't tree-shake, so importing from `prompt-this-spot` bundles both tools into your first page load, even for users who never see them. An app that only mounts "Prompt this spot" imports from `prompt-this-spot/inspect-prompt` instead. It has the provider, `createScreenshotUploader`, the preferences and launcher-stack providers and `InspectPromptToolGate`, and it loads the tool itself only when the gate opens.

### 4. Add a provider component

Create one client component that wraps your app. It supplies your app's adapters and mounts the two tools:

```tsx
// src/components/PromptThisSpot.tsx
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

export function PromptThisSpot({ children }: { children: React.ReactNode }) {
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

What each part does:

- `data-app-push-root` marks the element the drawers push aside when they open. Keep the two gates outside it so the drawers stay fixed at the left edge.
- `eligible` decides who sees each tool. A gate renders nothing until it is true, and a user who isn't eligible never downloads the tools' heavy code (the screenshot renderer, CodeMirror). The feedback tool also waits for the first click on its launcher, because it's usually shown to every signed-in user.
- Only mount the gates you want. An app that only wants "Send feedback" can leave out `InspectPromptToolGate` and `uploadPromptScreenshot`.
- `repoSlug` is the GitHub repository the "Send to Claude Code" buttons open.

### 5. Mount it in your root layout

```tsx
// app/layout.tsx
import { PromptThisSpot } from "@/components/PromptThisSpot";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PromptThisSpot>{children}</PromptThisSpot>
      </body>
    </html>
  );
}
```

Put it inside your auth and toast providers so `useCurrentUser` and `useToast` work.

### 6. Add the backend routes

The package never talks to storage or a database itself. You provide:

| Adapter | Receives | Must return |
|---|---|---|
| `uploadPromptScreenshot`, `uploadFeedbackScreenshot` | a PNG `data:` URL | `{ url, expiresAt? }`, where `url` is publicly readable (an AI agent opens it from the prompt) and `expiresAt` is an ISO date, or null if the image is kept |
| `submitFeedback` | a `UserFeedbackSubmission` (message, category, pathname, assembled prompt, selections, screenshots, viewport) | nothing; throw an `Error` to show its message in the drawer |

`createScreenshotUploader(path)` covers the client side of the upload: it POSTs `{ dataUrl }` as JSON to your route and returns the JSON response. The route checks that the caller is allowed, decodes the PNG, stores it in public object storage, and responds with `{ url, expiresAt }`. On an error it returns `{ error }` with a non-2xx status, and the drawer shows that message. Here is a Next.js route that stores screenshots in Vercel Blob:

```ts
// app/api/prompt-this-spot/screenshot/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getCurrentUser(); // your auth
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const { dataUrl } = await request.json();
  const prefix = "data:image/png;base64,";
  if (typeof dataUrl !== "string" || !dataUrl.startsWith(prefix)) {
    return NextResponse.json({ error: "Expected a PNG." }, { status: 400 });
  }

  const png = Buffer.from(dataUrl.slice(prefix.length), "base64");
  const blob = await put(`prompt-this-spot/${crypto.randomUUID()}.png`, png, {
    access: "public",
    contentType: "image/png",
  });

  // Return an expiry date instead of null if you delete old screenshots.
  return NextResponse.json({ url: blob.url, expiresAt: null });
}
```

Any storage that gives back a public URL works the same way (S3, Cloudflare R2, Google Cloud Storage and so on). The feedback screenshot route is the same, with the check changed to "any signed-in user". The `/api/feedback` route receives the `UserFeedbackSubmission` as JSON and saves it wherever your app keeps records; `promptText` is the ready-made AI prompt.

Screenshot URLs are public, so anyone with a link can open the image. If your app shows sensitive data, keep the links unguessable (as above) and delete old screenshots on a schedule.

### Check that it works

1. Sign in as a user who is eligible for "Prompt this spot" and reload the app. Its launcher appears in a corner of the page.
2. Press ⌘/Ctrl + Shift + P, click a button on the page, type a request and copy the prompt. It should name the page and the button.
3. Take a screenshot in the drawer. It should upload and its link should open in a new tab.
4. Open "Send feedback", point at something, describe it and send it. The report should reach your `/api/feedback` route.
5. Switch to dark mode and a phone-width window and check both drawers still read well.

### Troubleshooting

| Symptom | Fix |
|---|---|
| The build fails with "Unexpected token" or "Module parse failed" in `prompt-this-spot` | Add the package to `transpilePackages` (step 2). |
| The drawers or launchers are unstyled, transparent or oddly placed | Tailwind isn't scanning the package (step 3), or the shadcn/ui color tokens aren't defined. Without Tailwind, import `prompt-this-spot/styles.css`. |
| The drawer covers the page instead of pushing it aside | Add `data-app-push-root` to the element that wraps your app, and keep the gates outside it (step 4). |
| No launcher appears | Check that `eligible` is true for the signed-in user. The "Prompt this spot" launcher can also be switched off through its `enabled` preference, which is stored in `localStorage`; read or reset it with `useInspectPromptPreferences()`. |
| The feedback launcher is missing in Playwright or Cypress | Automated browsers don't see it unless the `sessionStorage` key in `feedbackE2eOptInStorageKey` is `"1"` (see [Configuration](#configuration)). |
| Screenshots fail with an error on the row | The message comes from your upload route's `{ error }` response. Check the route's auth check and storage credentials. |
| An image or logo is blank in a screenshot | The image is served from another origin without CORS headers, so the browser won't let it be copied into the screenshot. Allow your app's origin on that storage bucket or CDN. |
| "Send to Claude Code" opens without a repository selected | Set `repoSlug` in the config. |

## Configuration

Every field of `PromptThisSpotConfig` is optional:

| Field | Default | What it does |
|---|---|---|
| `notify(toast)` | no-op | Shows `{ title, description?, variant? }` toasts (shadcn/ui's `toast()` fits) |
| `logError(message, context)` | `console.error` | Reports a screenshot that failed |
| `repoSlug` | none | GitHub `owner/name` that "Send to Claude Code" opens |
| `uploadPromptScreenshot` / `uploadFeedbackScreenshot` | throws | Screenshot storage (see above) |
| `promptScreenshotRetentionDays` | `7` | How many days "Prompt this spot" tells the agent the screenshot links last; match it to what your storage keeps |
| `promptScreenshotsToggle` | `false` | Shows a "Capture screenshots" checkbox in the "Prompt this spot" drawer, for apps without a settings UI of their own for that preference |
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

Yes. Add the package to `transpilePackages` and to Tailwind's content scan, as shown in [Install](#install), which uses Next.js throughout. Other React 19 setups should work too, as long as their bundler compiles TypeScript from `node_modules` and Tailwind scans the package's source.

### Does it need a backend or a paid service?

No hosted service is involved. You provide two small routes of your own: one that stores a PNG and returns a public URL, and one that saves feedback. `createScreenshotUploader` handles the client side of the upload.

### Can end users see it?

Only if you let them. Each tool has an `eligible` flag, so you can show "Prompt this spot" to admins or internal staff and "Send feedback" to every signed-in user, or neither.

### How are screenshots taken?

In the browser, with no extension or screen-recording permission. The package copies the page with every computed style inlined into an SVG `<foreignObject>` and has the browser draw it, so fonts, shadows, `object-fit`, gradients, truncated text and modern color functions look the way they do on screen. Sticky headers, fixed bars and scrolled panels are drawn where the user sees them. Embedded frames and images served from another origin without CORS headers come out blank, and the prompt tells the agent so.

### Is it on npm?

Not yet. Install it from GitHub, pinned to a commit (see [Add the package](#1-add-the-package)).

## Developing

```bash
bun install
bun run check   # typecheck + biome + tests
```

If you add or change a Tailwind class in `src`, rebuild the prebuilt stylesheet and commit it with the change (CI fails when it's out of date):

```bash
bun run build:css
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
