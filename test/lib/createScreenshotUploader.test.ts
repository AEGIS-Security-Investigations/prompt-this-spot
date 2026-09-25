import { afterEach, describe, expect, mock, test } from "bun:test";
import { createScreenshotUploader } from "../../src/lib/createScreenshotUploader";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const stubFetch = (response: Response) => {
  const fetchMock = mock(
    async (_input: RequestInfo | URL, _init?: RequestInit) => response
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

describe("createScreenshotUploader", () => {
  test("POSTs the data URL as JSON and returns the route's body", async () => {
    const fetchMock = stubFetch(
      Response.json({
        url: "https://cdn.example.com/a.png",
        expiresAt: "2030-01-01T00:00:00.000Z",
      })
    );
    const upload = createScreenshotUploader("/api/shots");

    await expect(upload("data:image/png;base64,AAA")).resolves.toEqual({
      url: "https://cdn.example.com/a.png",
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe("/api/shots");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      dataUrl: "data:image/png;base64,AAA",
    });
  });

  test("rejects with the route's error message", async () => {
    stubFetch(Response.json({ error: "Too large" }, { status: 413 }));
    await expect(createScreenshotUploader("/x")("data:")).rejects.toThrow(
      "Too large"
    );
  });
});
