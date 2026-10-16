import { afterEach, describe, expect, mock, test } from "bun:test";
import { createLinearIssueSubmitter } from "../../src/linear/createLinearIssueSubmitter";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const DRAFT = { title: "t", description: "d", screenshots: [] };

const stubFetch = (response: Response) => {
  const fetchMock = mock(
    async (_input: RequestInfo | URL, _init?: RequestInit) => response
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

describe("createLinearIssueSubmitter", () => {
  test("POSTs the draft and returns the created ticket", async () => {
    const fetchMock = stubFetch(
      Response.json({
        identifier: "ENG-1",
        url: "https://app.example.com/ENG-1",
        extra: true,
      })
    );
    await expect(
      createLinearIssueSubmitter("/api/linear")(DRAFT)
    ).resolves.toEqual({
      identifier: "ENG-1",
      url: "https://app.example.com/ENG-1",
    });
    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe("/api/linear");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(DRAFT);
  });

  test("rejects with the route's error message", async () => {
    stubFetch(Response.json({ error: "Not allowed." }, { status: 403 }));
    await expect(createLinearIssueSubmitter("/x")(DRAFT)).rejects.toThrow(
      "Not allowed."
    );
  });

  test("rejects a reply that isn't a ticket", async () => {
    stubFetch(Response.json({ ok: true }));
    await expect(createLinearIssueSubmitter("/x")(DRAFT)).rejects.toThrow(
      "unexpected reply"
    );
  });
});
