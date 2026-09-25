import {
  buildDomPath,
  buildUniqueDomKey,
  describeAttributes,
  elementClasses,
  elementId,
  visibleText,
} from "./buildDomPath";
import { makeInspectPromptId } from "./makeInspectPromptId";
import type { ElementDescription, InspectPromptScreenshot } from "./types";

export interface InspectPromptContext {
  /** Route the element was captured on (e.g. window.location.pathname). */
  pathname: string;
  /** The clicked element. */
  element: Element;
}

/** Trailing line the user fills in (or edits in the drawer) before sending. */
const REQUEST_PLACEHOLDER = "<describe your request>";

const requestLine = (request: string): string => {
  const trimmed = request.trim();
  return `What I want changed here: ${trimmed.length > 0 ? trimmed : REQUEST_PLACEHOLDER}`;
};

/** Short, human-friendly label for a selection row: `tag · descriptor`. */
const buildLabel = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const text = visibleText(element);
  const descriptor =
    (text && `"${text.length > 40 ? `${text.slice(0, 40)}…` : text}"`) ||
    element.getAttribute("data-testid") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("href") ||
    null;
  return descriptor ? `${tag} · ${descriptor}` : tag;
};

/** The bullet lines describing one element (no page line, no request line). */
const buildBlock = (element: Element): string => {
  const attributes = describeAttributes(element);
  const text = visibleText(element);
  const tag = element.tagName.toLowerCase();
  const id = elementId(element);
  const classes = elementClasses(element);

  return [
    text ? `- What it shows: "${text}"` : "- What it shows: (no visible text)",
    `- Element: <${tag}>${
      attributes.length > 0 ? ` ${attributes.join(" ")}` : ""
    }`,
    ...(id ? [`- id: ${id}`] : []),
    ...(classes.length > 0 ? [`- Classes: ${classes.join(" ")}`] : []),
    `- Location (DOM path): ${buildDomPath(element)}`,
  ].join("\n");
};

/**
 * Derive a stored {@link ElementDescription} from a clicked element. Called
 * synchronously on click so the data survives the element being unmounted
 * later (e.g. when its host dialog closes).
 */
export const describeElement = ({
  pathname,
  element,
}: InspectPromptContext): ElementDescription => ({
  id: makeInspectPromptId(),
  label: buildLabel(element),
  selector: buildDomPath(element),
  dedupeKey: `${pathname}|${buildUniqueDomKey(element)}`,
  block: buildBlock(element),
  pathname,
});

export interface MultiInspectPromptContext {
  /** Selections to describe, in pick order. */
  descriptions: ElementDescription[];
  /** Shared free-text request; empty falls back to the placeholder. */
  request: string;
  /** Uploaded screenshots; only `ready` ones with a URL make it into the text. */
  screenshots?: InspectPromptScreenshot[];
  /**
   * When true, append {@link TEST_COVERAGE_REQUEST} — the reviewer ticked "Ask
   * for test coverage" in the drawer.
   */
  testCoverage?: boolean;
  /**
   * Days before the host app deletes the screenshots, which the prompt tells
   * the agent. Defaults to 7.
   */
  screenshotRetentionDays?: number;
}

/**
 * Standing ask appended when the reviewer ticks the test-coverage box. Names
 * both layers this repo actually runs, because a bare "add tests" reliably
 * produces one of them and not the other.
 */
const TEST_COVERAGE_REQUEST = [
  "Also cover this change with automated tests:",
  "- Unit tests (`bun test`) for any logic you add or change.",
  "- A Playwright e2e spec (`bun run test:e2e`) for the user-visible behaviour.",
  "Follow the test patterns already in the repo, and run them until they pass.",
].join("\n");

/** Only uploaded shots are quotable — a pending/failed one has no URL yet. */
const readyScreenshots = (
  screenshots: InspectPromptScreenshot[] | undefined
): InspectPromptScreenshot[] =>
  (screenshots ?? []).filter(
    (screenshot) => screenshot.status === "ready" && Boolean(screenshot.url)
  );

/** The reviewer's per-shot note, if they wrote one. */
const noteLine = (screenshot: InspectPromptScreenshot): string[] => {
  const trimmed = screenshot.note.trim();
  return trimmed.length > 0 ? [`  Note: ${trimmed}`] : [];
};

/** The element shot belonging to one selection, if it uploaded successfully. */
const elementScreenshotLine = (
  description: ElementDescription,
  screenshots: InspectPromptScreenshot[]
): string[] => {
  const shot = screenshots.find(
    (screenshot) =>
      screenshot.kind === "element" && screenshot.selectionId === description.id
  );
  if (!shot?.url) {
    return [];
  }
  return [
    `- Screenshot (this element, with surrounding page for context): ${shot.url}`,
    ...noteLine(shot),
  ];
};

/** Trailing section listing the standalone full-page shots (no blank lines). */
const pageScreenshotLines = (
  screenshots: InspectPromptScreenshot[]
): string[] => {
  const pageShots = screenshots.filter(
    (screenshot) => screenshot.kind === "page"
  );
  if (pageShots.length === 0) {
    return [];
  }

  return [
    pageShots.length === 1
      ? "Full-page screenshot:"
      : `Full-page screenshots (${pageShots.length}):`,
    ...pageShots.flatMap((shot) => [
      `- ${shot.pathname}: ${shot.url}`,
      ...noteLine(shot),
    ]),
  ];
};

/**
 * Tells the agent the links are openable images — and that they are scratch,
 * so it never writes one into code, docs, or a ticket as a durable reference.
 */
const screenshotNote = (retentionDays: number) =>
  [
    "(Screenshot links are public PNGs you can open directly.",
    `They are deleted after ${retentionDays} days, so don't store them anywhere — read them now.`,
    "They are html2canvas renderings rather than real browser screenshots:",
    "layout and text are reliable, but CSS masks, backdrop filters and animations",
    "may differ from the live page. Trust the DOM details above over pixel-level",
    "styling.)",
  ].join("\n");

/**
 * Assemble a friendly, copy-pasteable prompt describing the one-or-more spots a
 * (possibly non-technical) user clicked, so an AI coding agent knows exactly
 * which spots in the app they mean. A single shared request line covers them
 * all.
 *
 * A single selection keeps the original, un-numbered phrasing; multiple
 * selections are numbered and each carries its own page context (pick can span
 * navigations). Screenshot URLs are attached inline to the selection they show,
 * with any standalone page shots listed after.
 */
export const buildMultiInspectPrompt = ({
  descriptions,
  request,
  screenshots,
  testCoverage,
  screenshotRetentionDays = 7,
}: MultiInspectPromptContext): string => {
  const ready = readyScreenshots(screenshots);
  const pageShotLines = pageScreenshotLines(ready);
  const note =
    ready.length > 0 ? ["", screenshotNote(screenshotRetentionDays)] : [];
  const trailer = [
    ...(pageShotLines.length > 0 ? ["", ...pageShotLines] : []),
    "",
    requestLine(request),
    // Directly under the request it qualifies, and before the screenshot
    // caveat — which is a footnote about the links, not part of the ask.
    ...(testCoverage ? ["", TEST_COVERAGE_REQUEST] : []),
    ...note,
  ];

  // Screenshot-only: the reviewer captured the page without picking anything.
  // The image alone is the context, so say that rather than describing zero
  // spots.
  if (descriptions.length === 0) {
    return ["In our app, here is what I'm looking at:", ...trailer].join("\n");
  }

  const [only] = descriptions;
  if (descriptions.length === 1 && only) {
    return [
      `In our app on the page "${only.pathname}", I'm pointing at this element:`,
      "",
      only.block,
      ...elementScreenshotLine(only, ready),
      ...trailer,
    ].join("\n");
  }

  const lines: string[] = [
    `In our app, I'm pointing at these ${descriptions.length} spots:`,
    "",
  ];
  descriptions.forEach((description, index) => {
    lines.push(`[${index + 1}] On the page "${description.pathname}":`);
    lines.push(description.block);
    lines.push(...elementScreenshotLine(description, ready));
    lines.push("");
  });
  // Each block already ends with a blank line, so drop the trailer's leading one.
  lines.push(...trailer.slice(1));

  return lines.join("\n");
};

/**
 * Back-compat single-element builder. Delegates to {@link describeElement} +
 * {@link buildMultiInspectPrompt} so the output matches the original tool.
 *
 * The "What I want changed here" line is intentionally left as a placeholder
 * for the user to fill in before copying.
 */
export const buildInspectPrompt = ({
  pathname,
  element,
}: InspectPromptContext): string =>
  buildMultiInspectPrompt({
    descriptions: [describeElement({ pathname, element })],
    request: "",
  });
