import { withScreenshotTimeout } from "../core/withScreenshotTimeout";
import type {
  CreatedLinearIssue,
  LinearIssueCreator,
} from "./linearIssueTypes";

/** Copying screenshots into Linear makes this slower than an upload. */
const CREATE_TIMEOUT_MS = 45_000;

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") {
      return body.error;
    }
  } catch {
    // Fall through to the status text below.
  }
  return (
    response.statusText || `Couldn't create the ticket (${response.status})`
  );
};

const isCreatedIssue = (value: unknown): value is CreatedLinearIssue =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as CreatedLinearIssue).identifier === "string" &&
  typeof (value as CreatedLinearIssue).url === "string";

/**
 * Build a {@link LinearIssueCreator} that POSTs the draft as JSON to one of the
 * host app's routes and expects `{ identifier, url }` back. A non-2xx response
 * rejects with the route's `error` string, which the dialog shows.
 *
 * The route holds the Linear API key; the browser never sees it. Pair it with
 * `createLinearIssueRoute` from `@brotskyllc/prompt-this-spot/server`.
 */
export const createLinearIssueSubmitter =
  (path: string): LinearIssueCreator =>
  async (draft) => {
    const controller = new AbortController();
    try {
      return await withScreenshotTimeout(
        (async () => {
          const response = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draft),
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }
          const body: unknown = await response.json();
          if (!isCreatedIssue(body)) {
            throw new Error("The ticket route sent back an unexpected reply.");
          }
          return { identifier: body.identifier, url: body.url };
        })(),
        CREATE_TIMEOUT_MS,
        "Creating the Linear ticket timed out. Check Linear before retrying."
      );
    } finally {
      controller.abort();
    }
  };
