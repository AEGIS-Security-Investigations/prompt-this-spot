import type { LinearIssueDraft } from "../linear/linearIssueTypes";
import {
  type CreateLinearIssueOptions,
  createLinearIssue,
} from "./createLinearIssue";
import { LinearApiError } from "./linearGraphql";

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 100_000;
const MAX_SCREENSHOTS = 30;

export interface CreateLinearIssueRouteOptions
  extends Omit<CreateLinearIssueOptions, "apiKey" | "team"> {
  /**
   * Whether this request may create a ticket. Check the signed-in user here
   * with the app's own auth; every ticket is filed with the API key's identity.
   */
  authorize: (request: Request) => boolean | Promise<boolean>;
  /** Usually `process.env.LINEAR_API_KEY`. Unset answers 503. */
  apiKey: string | undefined;
  /** Usually `process.env.LINEAR_TEAM`: a team key such as `ENG`, or its ID. */
  team: string | undefined;
  /** Reports an unexpected failure; defaults to `console.error`. */
  logError?: (message: string, context: Record<string, unknown>) => void;
}

const fail = (status: number, error: string) =>
  Response.json({ error }, { status });

const isString = (value: unknown): value is string => typeof value === "string";

/** Checks a request body is a {@link LinearIssueDraft}, or says what's wrong. */
export const parseLinearIssueDraft = (
  body: unknown
): LinearIssueDraft | string => {
  if (typeof body !== "object" || body === null) {
    return "Expected a ticket draft.";
  }
  const { title, description, screenshots, pageUrl } = body as Record<
    string,
    unknown
  >;
  if (!isString(title) || title.trim().length === 0) {
    return "The ticket needs a title.";
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
  }
  if (!isString(description) || description.length > MAX_DESCRIPTION_LENGTH) {
    return "The ticket description is missing or too long.";
  }
  if (
    !Array.isArray(screenshots) ||
    screenshots.length > MAX_SCREENSHOTS ||
    !screenshots.every(
      (shot) =>
        typeof shot === "object" &&
        shot !== null &&
        isString(shot.url) &&
        isString(shot.label)
    )
  ) {
    return "The ticket's screenshot list is invalid.";
  }
  if (pageUrl !== undefined && !isString(pageUrl)) {
    return "The page URL is invalid.";
  }
  return {
    title: title.trim(),
    description,
    screenshots: screenshots.map(({ url, label }) => ({ url, label })),
    ...(pageUrl ? { pageUrl } : {}),
  };
};

/**
 * A `(request: Request) => Response` handler that creates a Linear ticket from
 * the drawer's draft. It works as a Next.js App Router route as is:
 *
 * ```ts
 * export const POST = createLinearIssueRoute({
 *   authorize: async () => Boolean((await getCurrentUser())?.isAdmin),
 *   apiKey: process.env.LINEAR_API_KEY,
 *   team: process.env.LINEAR_TEAM,
 * });
 * ```
 *
 * It answers `{ identifier, url }`, or `{ error }` with a non-2xx status.
 */
export const createLinearIssueRoute =
  ({
    authorize,
    apiKey,
    team,
    logError = (message, context) => {
      console.error(`[prompt-this-spot] ${message}`, context);
    },
    ...options
  }: CreateLinearIssueRouteOptions) =>
  async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return fail(405, "Use POST.");
    }
    if (!(await authorize(request))) {
      return fail(403, "You can't create Linear tickets here.");
    }
    if (!apiKey || !team) {
      return fail(503, "Linear isn't set up for this app yet.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "Expected a JSON ticket draft.");
    }
    const draft = parseLinearIssueDraft(body);
    if (typeof draft === "string") {
      return fail(400, draft);
    }

    try {
      const issue = await createLinearIssue(draft, {
        ...options,
        apiKey,
        team,
        onScreenshotCopyError:
          options.onScreenshotCopyError ??
          ((url, error) =>
            logError("Couldn't copy a screenshot into Linear", {
              url,
              error: String(error),
            })),
      });
      return Response.json(issue);
    } catch (error) {
      if (error instanceof LinearApiError) {
        return fail(502, error.message);
      }
      logError("Creating a Linear ticket failed", { error: String(error) });
      return fail(500, "Couldn't create the Linear ticket.");
    }
  };
