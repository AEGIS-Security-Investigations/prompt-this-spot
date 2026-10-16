/**
 * Shapes shared by the browser half ("Create Linear ticket" in the drawer) and
 * the server half (`@brotskyllc/prompt-this-spot/server`) of the Linear
 * integration. Kept free of React and of any credential so both halves can
 * import it.
 */

/** A screenshot the ticket should show, as it appears in `description`. */
export interface LinearIssueDraftScreenshot {
  /** Public URL used in `description`; the server may copy it into Linear. */
  url: string;
  label: string;
}

/**
 * What the drawer sends to the host app when someone creates a ticket. The
 * description is Markdown and already holds the request, the page, the
 * screenshots and the full AI prompt, so a route can pass it straight on.
 */
export interface LinearIssueDraft {
  title: string;
  /** Markdown body of the ticket. */
  description: string;
  /** Every screenshot URL that appears in `description`. */
  screenshots: LinearIssueDraftScreenshot[];
  /** Sanitized URL of the page the spots were picked on, when known. */
  pageUrl?: string;
}

/** The ticket Linear created. */
export interface CreatedLinearIssue {
  /** Linear's human ID, such as `ENG-123`. */
  identifier: string;
  /** Link to the ticket in Linear. */
  url: string;
}

/**
 * Hands a draft to the host app's backend, which holds the Linear API key and
 * creates the ticket. Reject with an `Error` to show its message.
 */
export type LinearIssueCreator = (
  draft: LinearIssueDraft
) => Promise<CreatedLinearIssue>;
