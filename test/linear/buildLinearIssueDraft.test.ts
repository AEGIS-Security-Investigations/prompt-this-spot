import { describe, expect, test } from "bun:test";
import type {
  ElementDescription,
  InspectPromptScreenshot,
} from "../../src/core/types";
import {
  buildLinearIssueDraft,
  defaultLinearIssueTitle,
} from "../../src/linear/buildLinearIssueDraft";

const PAGE = "https://app.example.com/orders?status=open";

const SELECTION: ElementDescription = {
  id: "sel-1",
  label: 'button · "Export"',
  selector: 'button[data-testid="export"]',
  dedupeKey: '/orders|button[data-testid="export"]',
  block: '- What it shows: "Export"',
  pathname: "/orders",
  pageUrl: PAGE,
};

const shot = (
  overrides: Partial<InspectPromptScreenshot>
): InspectPromptScreenshot => ({
  id: "shot-1",
  kind: "page",
  selectionId: null,
  label: "Page · /orders",
  pathname: "/orders",
  pageUrl: PAGE,
  previewDataUrl: null,
  url: "https://app.example.com/shots/1.png",
  expiresAt: null,
  status: "ready",
  error: null,
  note: "",
  ...overrides,
});

describe("defaultLinearIssueTitle", () => {
  test("uses the request's first non-empty line", () => {
    expect(
      defaultLinearIssueTitle({
        request: "\n  Make export full width  \nand blue",
        selections: [SELECTION],
        screenshots: [],
      })
    ).toBe("Make export full width");
  });

  test("shortens a long request to fit a ticket list", () => {
    const title = defaultLinearIssueTitle({
      request: "x".repeat(200),
      selections: [],
      screenshots: [],
    });
    expect(title.length).toBe(80);
    expect(title.endsWith("…")).toBe(true);
  });

  test("falls back to the page when nothing is typed", () => {
    expect(
      defaultLinearIssueTitle({
        request: " ",
        selections: [SELECTION],
        screenshots: [],
      })
    ).toBe("Change on /orders");
  });
});

describe("buildLinearIssueDraft", () => {
  test("puts the request, page, screenshots and prompt in the description", () => {
    const draft = buildLinearIssueDraft(
      {
        request: "Make export full width",
        prompt: "Repository: acme/web\n\nDo the thing",
        selections: [SELECTION],
        screenshots: [shot({ note: "this one" })],
      },
      "  Export button  "
    );

    expect(draft.title).toBe("Export button");
    expect(draft.pageUrl).toBe(PAGE);
    expect(draft.screenshots).toEqual([
      { url: "https://app.example.com/shots/1.png", label: "Page · /orders" },
    ]);
    expect(draft.description).toBe(
      [
        "Make export full width",
        `**Page:** ${PAGE}`,
        "### Screenshots\n\n![Page · /orders](https://app.example.com/shots/1.png)\n_this one_",
        "### Prompt for an AI coding agent\n\n```text\nRepository: acme/web\n\nDo the thing\n```",
        "_Created with Prompt this spot._",
      ].join("\n\n")
    );
  });

  test("leaves out screenshots that aren't uploaded yet", () => {
    const draft = buildLinearIssueDraft(
      {
        request: "",
        prompt: "p",
        selections: [],
        screenshots: [shot({ status: "uploading", url: null })],
        currentPageUrl: PAGE,
      },
      "t"
    );
    expect(draft.screenshots).toEqual([]);
    expect(draft.description).not.toContain("### Screenshots");
    expect(draft.description).toContain(`**Page:** ${PAGE}`);
  });

  test("lists every page when spots come from several", () => {
    const other = "https://app.example.com/billing";
    const draft = buildLinearIssueDraft(
      {
        request: "r",
        prompt: "p",
        selections: [SELECTION, { ...SELECTION, id: "2", pageUrl: other }],
        screenshots: [],
      },
      "t"
    );
    expect(draft.description).toContain(`**Pages:**\n- ${PAGE}\n- ${other}`);
  });

  test("fences a prompt that itself contains backticks", () => {
    const draft = buildLinearIssueDraft(
      {
        request: "",
        prompt: "use ```code``` here",
        selections: [],
        screenshots: [],
      },
      "t"
    );
    expect(draft.description).toContain("````text\nuse ```code``` here\n````");
  });

  test("keeps a label from breaking the image syntax", () => {
    const draft = buildLinearIssueDraft(
      {
        request: "",
        prompt: "p",
        selections: [],
        screenshots: [shot({ label: "a [b] c" })],
      },
      "t"
    );
    expect(draft.description).toContain("![a  b  c](");
  });
});
