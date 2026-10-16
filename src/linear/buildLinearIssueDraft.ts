import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../core/types";
import type { LinearIssueDraft } from "./linearIssueTypes";

/** Linear accepts longer titles, but a ticket list shows about this much. */
const TITLE_MAX_LENGTH = 80;

export interface LinearIssueDraftInput {
  /** What the reviewer typed into "What do you want changed?". */
  request: string;
  /** The assembled prompt, including any hand-edits from the raw editor. */
  prompt: string;
  selections: ElementDescription[];
  screenshots: InspectPromptScreenshot[];
  /** The page the drawer is on, used when no capture carries its own URL. */
  currentPageUrl?: string;
}

const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/**
 * The ticket title the dialog starts with: the first line of the request, or
 * the page the spots are on when the reviewer hasn't typed anything.
 */
export const defaultLinearIssueTitle = ({
  request,
  selections,
  screenshots,
}: Pick<
  LinearIssueDraftInput,
  "request" | "selections" | "screenshots"
>): string => {
  const firstLine = request
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (firstLine) {
    return truncate(firstLine, TITLE_MAX_LENGTH);
  }
  const pathname = selections[0]?.pathname ?? screenshots[0]?.pathname;
  return pathname ? `Change on ${pathname}` : "Change from Prompt this spot";
};

/** A fence longer than any run of backticks inside the prompt. */
const codeFence = (text: string): string => {
  const longestRun = Math.max(
    0,
    ...Array.from(text.matchAll(/`+/g), ([run]) => run.length)
  );
  return "`".repeat(Math.max(3, longestRun + 1));
};

/** Keeps a label from closing the `![label](url)` image syntax early. */
const imageAlt = (label: string): string => label.replace(/[[\]\n]/g, " ");

const pageUrls = ({
  selections,
  screenshots,
  currentPageUrl,
}: LinearIssueDraftInput): string[] => {
  const urls = [...selections, ...screenshots]
    .map((capture) => capture.pageUrl)
    .filter((url): url is string => Boolean(url));
  const unique = [...new Set(urls)];
  if (unique.length === 0 && currentPageUrl) {
    return [currentPageUrl];
  }
  return unique;
};

/**
 * Turns what's in the "Prompt this spot" drawer into a Linear ticket: the
 * request on top, the page and screenshots next, and the full AI prompt at the
 * bottom, so whoever picks up the ticket can hand it to a coding agent as is.
 */
export const buildLinearIssueDraft = (
  input: LinearIssueDraftInput,
  title: string
): LinearIssueDraft => {
  const request = input.request.trim();
  const urls = pageUrls(input);
  const shots = input.screenshots.filter(
    (shot): shot is InspectPromptScreenshot & { url: string } =>
      shot.status === "ready" && Boolean(shot.url)
  );
  const fence = codeFence(input.prompt);

  const sections = [
    request.length > 0 ? request : null,
    urls.length === 1
      ? `**Page:** ${urls[0]}`
      : urls.length > 1
        ? ["**Pages:**", ...urls.map((url) => `- ${url}`)].join("\n")
        : null,
    shots.length > 0
      ? [
          "### Screenshots",
          ...shots.map((shot) =>
            [
              `![${imageAlt(shot.label)}](${shot.url})`,
              shot.note.trim() ? `_${shot.note.trim()}_` : null,
            ]
              .filter(Boolean)
              .join("\n")
          ),
        ].join("\n\n")
      : null,
    [
      "### Prompt for an AI coding agent",
      `${fence}text\n${input.prompt.trim()}\n${fence}`,
    ].join("\n\n"),
    "_Created with Prompt this spot._",
  ];

  return {
    title: title.trim(),
    description: sections.filter(Boolean).join("\n\n"),
    screenshots: shots.map((shot) => ({ url: shot.url, label: shot.label })),
    ...(urls[0] ? { pageUrl: urls[0] } : {}),
  };
};
