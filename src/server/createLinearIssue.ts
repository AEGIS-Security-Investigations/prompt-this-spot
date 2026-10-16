import type {
  CreatedLinearIssue,
  LinearIssueDraft,
} from "../linear/linearIssueTypes";
import {
  copyScreenshotToLinear,
  isCopyableScreenshotUrl,
} from "./copyScreenshotToLinear";
import { LinearApiError, linearGraphql } from "./linearGraphql";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TEAM_BY_KEY = `
  query PromptThisSpotTeam($key: String!) {
    teams(filter: { key: { eq: $key } }, first: 1) { nodes { id } }
  }
`;

const ISSUE_CREATE = `
  mutation PromptThisSpotIssueCreate($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue { identifier url }
    }
  }
`;

interface TeamByKeyData {
  teams: { nodes: { id: string }[] };
}

interface IssueCreateData {
  issueCreate: {
    success: boolean;
    issue: CreatedLinearIssue | null;
  };
}

export interface CreateLinearIssueOptions {
  /** A Linear personal or workspace API key. Keep it server-side. */
  apiKey: string;
  /** The team's key (such as `ENG`) or its ID. */
  team: string;
  /** Label IDs to put on every ticket. */
  labelIds?: string[];
  /** Project ID to file every ticket under. */
  projectId?: string;
  /** Workflow state ID new tickets start in; Linear's default otherwise. */
  stateId?: string;
  /**
   * URL prefixes of the app's own screenshot storage, such as
   * `https://app.example.com/screenshots/`. Screenshots
   * under one are copied into Linear so they outlive the app's retention; any
   * other screenshot stays a plain link.
   */
  copyScreenshotsFrom?: readonly string[];
  /** Called when a screenshot couldn't be copied (the ticket still goes in). */
  onScreenshotCopyError?: (url: string, error: unknown) => void;
  /** For tests. */
  fetch?: typeof fetch;
}

const resolveTeamId = async (
  apiKey: string,
  team: string,
  fetchImpl: typeof fetch
): Promise<string> => {
  if (UUID.test(team)) {
    return team;
  }
  const { teams } = await linearGraphql<TeamByKeyData>(
    apiKey,
    TEAM_BY_KEY,
    { key: team },
    fetchImpl
  );
  const id = teams.nodes[0]?.id;
  if (!id) {
    throw new LinearApiError(`No Linear team has the key "${team}".`);
  }
  return id;
};

/**
 * Swaps each copyable screenshot URL in the description for a copy in Linear.
 * Runs one at a time so a ticket with many shots doesn't burst Linear's rate
 * limit, and leaves the original link when a copy fails.
 */
const copyScreenshots = async (
  draft: LinearIssueDraft,
  options: CreateLinearIssueOptions,
  fetchImpl: typeof fetch
): Promise<string> => {
  const prefixes = options.copyScreenshotsFrom ?? [];
  let description = draft.description;
  const urls = new Set(draft.screenshots.map((shot) => shot.url));
  for (const url of urls) {
    if (!isCopyableScreenshotUrl(url, prefixes)) {
      continue;
    }
    try {
      const assetUrl = await copyScreenshotToLinear(
        options.apiKey,
        url,
        fetchImpl
      );
      description = description.split(url).join(assetUrl);
    } catch (error) {
      options.onScreenshotCopyError?.(url, error);
    }
  }
  return description;
};

/**
 * Creates a Linear ticket from a "Prompt this spot" draft through Linear's
 * GraphQL API, after copying the app's screenshots into Linear. Throws a
 * {@link LinearApiError} with a message safe to show the reviewer.
 */
export const createLinearIssue = async (
  draft: LinearIssueDraft,
  options: CreateLinearIssueOptions
): Promise<CreatedLinearIssue> => {
  const fetchImpl = options.fetch ?? fetch;
  const teamId = await resolveTeamId(options.apiKey, options.team, fetchImpl);
  const description = await copyScreenshots(draft, options, fetchImpl);

  const { issueCreate } = await linearGraphql<IssueCreateData>(
    options.apiKey,
    ISSUE_CREATE,
    {
      input: {
        teamId,
        title: draft.title,
        description,
        ...(options.labelIds?.length ? { labelIds: options.labelIds } : {}),
        ...(options.projectId ? { projectId: options.projectId } : {}),
        ...(options.stateId ? { stateId: options.stateId } : {}),
      },
    },
    fetchImpl
  );
  if (!issueCreate.success || !issueCreate.issue) {
    throw new LinearApiError("Linear didn't create the ticket.");
  }
  return {
    identifier: issueCreate.issue.identifier,
    url: issueCreate.issue.url,
  };
};
