import { afterEach, describe, expect, jest, mock, test } from "bun:test";
import { createScreenshotUploader } from "../../src/lib/createScreenshotUploader";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  jest.useRealTimers();
});

const stubFetch = (response: Response) => {
  const fetchMock = mock(
    async (_input: RequestInfo | URL, _init?: RequestInit) => response
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

describe("createScreenshotUploader", () => {
  test("aborts a hung HTTP request and rejects with an actionable timeout", async () => {
    jest.useFakeTimers();
    let signal: AbortSignal | null | undefined;
    globalThis.fetch = mock((_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal;
      return new Promise<Response>(() => {});
    }) as unknown as typeof fetch;
    const pending = createScreenshotUploader("/api/shots")("data:");
    expect(signal?.aborted).toBe(false);
    jest.advanceTimersByTime(20_000);
    await expect(pending).rejects.toThrow("Screenshot upload timed out");
    expect(signal?.aborted).toBe(true);
  });

  test("the deadline also bounds a response body that never completes", async () => {
    jest.useFakeTimers();
    const response = Response.json({ url: "https://cdn.example.com/shot.png" });
    response.json = () => new Promise(() => {});
    const fetchMock = stubFetch(response);
    const pending = createScreenshotUploader("/api/shots")("data:");
    await Promise.resolve();
    jest.advanceTimersByTime(20_000);
    await expect(pending).rejects.toThrow("Screenshot upload timed out");
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

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
