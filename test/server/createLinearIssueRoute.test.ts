import { describe, expect, mock, test } from "bun:test";
import { isCopyableScreenshotUrl } from "../../src/server/copyScreenshotToLinear";
import { createLinearIssueRoute } from "../../src/server/createLinearIssueRoute";
import { LINEAR_GRAPHQL_URL } from "../../src/server/linearGraphql";

const SHOT_URL = "https://app.example.com/shots/1.png";
const OTHER_URL = "https://elsewhere.example.org/2.png";
const ASSET_URL = "https://app.example.com/linear-assets/1.png";
const TEAM_ID = "0b0b0b0b-1111-4222-8333-444455556666";

const draft = {
  title: "Export button",
  description: `![a](${SHOT_URL})\n![b](${OTHER_URL})\n\n${SHOT_URL}`,
  screenshots: [
    { url: SHOT_URL, label: "a" },
    { url: OTHER_URL, label: "b" },
  ],
};

interface Call {
  url: string;
  init?: RequestInit;
  graphql?: { query: string; variables: Record<string, unknown> };
}

/** Plays Linear's API and the screenshot host, and records every request. */
const fakeNetwork = (
  overrides: { issueCreate?: () => Response } = {}
): { fetch: typeof fetch; calls: Call[] } => {
  const calls: Call[] = [];
  const fetchImpl = mock(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === LINEAR_GRAPHQL_URL) {
        const graphql = JSON.parse(String(init?.body));
        calls.push({ url, init, graphql });
        if (graphql.query.includes("teams(")) {
          return Response.json({
            data: { teams: { nodes: [{ id: TEAM_ID }] } },
          });
        }
        if (graphql.query.includes("fileUpload(")) {
          return Response.json({
            data: {
              fileUpload: {
                success: true,
                uploadFile: {
                  uploadUrl: "https://app.example.com/upload-target",
                  assetUrl: ASSET_URL,
                  headers: [{ key: "x-goog-meta", value: "1" }],
                },
              },
            },
          });
        }
        if (overrides.issueCreate) {
          return overrides.issueCreate();
        }
        return Response.json({
          data: {
            issueCreate: {
              success: true,
              issue: {
                identifier: "ENG-42",
                url: "https://app.example.com/ENG-42",
              },
            },
          },
        });
      }
      calls.push({ url, init });
      if (url === SHOT_URL) {
        return new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "image/png" },
        });
      }
      if (url === "https://app.example.com/upload-target") {
        return new Response(null, { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    }
  );
  return { fetch: fetchImpl as unknown as typeof fetch, calls };
};

const post = (body: unknown) =>
  new Request("https://app.example.com/api/linear", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const route = (
  network: { fetch: typeof fetch },
  overrides: Partial<Parameters<typeof createLinearIssueRoute>[0]> = {}
) =>
  createLinearIssueRoute({
    authorize: () => true,
    apiKey: "lin_api_test",
    team: "ENG",
    copyScreenshotsFrom: ["https://app.example.com/shots/"],
    fetch: network.fetch,
    logError: () => {},
    ...overrides,
  });

describe("createLinearIssueRoute", () => {
  test("creates the ticket with the team, key and copied screenshots", async () => {
    const network = fakeNetwork();
    const response = await route(network)(post(draft));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      identifier: "ENG-42",
      url: "https://app.example.com/ENG-42",
    });

    const linearCalls = network.calls.filter((c) => c.graphql);
    for (const call of linearCalls) {
      expect(new Headers(call.init?.headers).get("authorization")).toBe(
        "lin_api_test"
      );
    }
    expect(linearCalls[0]?.graphql?.variables).toEqual({ key: "ENG" });

    const create = linearCalls.at(-1)?.graphql?.variables.input as {
      teamId: string;
      title: string;
      description: string;
    };
    expect(create.teamId).toBe(TEAM_ID);
    expect(create.title).toBe("Export button");
    // Every mention of the app's screenshot now points at Linear's copy; the
    // other host's link is left alone and never fetched.
    expect(create.description).toBe(
      `![a](${ASSET_URL})\n![b](${OTHER_URL})\n\n${ASSET_URL}`
    );
    expect(network.calls.some((c) => c.url === OTHER_URL)).toBe(false);

    const upload = network.calls.find(
      (c) => c.url === "https://app.example.com/upload-target"
    );
    expect(upload?.init?.method).toBe("PUT");
    const headers = new Headers(upload?.init?.headers);
    expect(headers.get("content-type")).toBe("image/png");
    expect(headers.get("x-goog-meta")).toBe("1");
  });

  test("uses a team ID as is, without looking it up", async () => {
    const network = fakeNetwork();
    await route(network, { team: TEAM_ID, copyScreenshotsFrom: [] })(
      post(draft)
    );
    const queries = network.calls.map((c) => c.graphql?.query ?? "");
    expect(queries.some((q) => q.includes("teams("))).toBe(false);
    expect(queries).toHaveLength(1);
  });

  test("refuses a caller the app doesn't authorize", async () => {
    const network = fakeNetwork();
    const response = await route(network, { authorize: () => false })(
      post(draft)
    );
    expect(response.status).toBe(403);
    expect(network.calls).toHaveLength(0);
  });

  test("answers 503 when the key isn't configured", async () => {
    const network = fakeNetwork();
    const response = await route(network, { apiKey: undefined })(post(draft));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("isn't set up");
  });

  test("rejects a draft without a title", async () => {
    const network = fakeNetwork();
    const response = await route(network)(post({ ...draft, title: " " }));
    expect(response.status).toBe(400);
    expect(network.calls).toHaveLength(0);
  });

  test("passes Linear's own message back without the key", async () => {
    const network = fakeNetwork({
      issueCreate: () =>
        Response.json(
          {
            errors: [
              {
                message: "Argument Validation Error",
                extensions: { userPresentableMessage: "Title is too long." },
              },
            ],
          },
          { status: 400 }
        ),
    });
    const response = await route(network, { copyScreenshotsFrom: [] })(
      post(draft)
    );
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe("Title is too long.");
    expect(JSON.stringify(body)).not.toContain("lin_api_test");
  });

  test("still files the ticket when a screenshot can't be copied", async () => {
    const network = fakeNetwork();
    const errors: string[] = [];
    const response = await route(network, {
      copyScreenshotsFrom: ["https://elsewhere.example.org/"],
      onScreenshotCopyError: (url) => errors.push(url),
    })(post(draft));
    expect(response.status).toBe(200);
    expect(errors).toEqual([OTHER_URL]);
  });
});

describe("isCopyableScreenshotUrl", () => {
  const prefixes = ["https://app.example.com/shots/"];

  test("accepts a URL under an allowed prefix", () => {
    expect(isCopyableScreenshotUrl(SHOT_URL, prefixes)).toBe(true);
  });

  test("rejects other paths, hosts, look-alike hosts and plain http", () => {
    expect(
      isCopyableScreenshotUrl("https://app.example.com/private/1.png", prefixes)
    ).toBe(false);
    expect(
      isCopyableScreenshotUrl("https://app.example.com.evil.test/shots/1.png", [
        "https://app.example.com",
      ])
    ).toBe(false);
    expect(
      isCopyableScreenshotUrl("http://app.example.com/shots/1.png", prefixes)
    ).toBe(false);
    expect(isCopyableScreenshotUrl("not a url", prefixes)).toBe(false);
  });

  test("copies nothing without prefixes", () => {
    expect(isCopyableScreenshotUrl(SHOT_URL, [])).toBe(false);
  });
});
