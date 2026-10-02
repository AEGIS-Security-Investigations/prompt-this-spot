import { describe, expect, it } from "bun:test";
import {
  classifyRegistryResponse,
  lookupVersionStatus,
  type RegistryResponse,
  registryPackagePath,
} from "../../scripts/lib/npmVersionStatus";

const NAME = "example-pkg";
const VERSION = "1.2.3";

const json = (
  status: number,
  body: unknown,
  contentType = "application/json"
) =>
  ({
    status,
    contentType,
    body: JSON.stringify(body),
  }) satisfies RegistryResponse;

const classify = (response: RegistryResponse) =>
  classifyRegistryResponse(response, NAME, VERSION);

describe("classifyRegistryResponse: accepted answers", () => {
  it("the registry's own 404 means the package is not on npm", () => {
    expect(classify(json(404, { error: "Not found" }))).toEqual({
      ok: true,
      status: "unpublished",
    });
  });

  it("matching metadata that lists the version means published", () => {
    const body = { name: NAME, versions: { "1.2.2": {}, [VERSION]: {} } };
    expect(
      classify(json(200, body, "application/vnd.npm.install-v1+json"))
    ).toEqual({ ok: true, status: "published" });
  });

  it("matching metadata without the version means that version is unpublished", () => {
    const body = { name: NAME, versions: { "1.2.2": {} } };
    expect(classify(json(200, body))).toEqual({
      ok: true,
      status: "unpublished",
    });
  });

  it("a scoped package is matched by its full name", () => {
    expect(
      classifyRegistryResponse(
        json(200, { name: "@acme/pkg", versions: {} }),
        "@acme/pkg",
        VERSION
      )
    ).toEqual({ ok: true, status: "unpublished" });
  });
});

describe("classifyRegistryResponse: everything else fails closed", () => {
  const cases: [string, RegistryResponse][] = [
    [
      "a proxy's HTML 404 page",
      { status: 404, contentType: "text/html", body: "<h1>404 Not Found</h1>" },
    ],
    [
      "an HTML 404 that mentions E404",
      { status: 404, contentType: "text/html", body: "npm error code E404" },
    ],
    [
      "a JSON 404 with a different error (an unrelated 404)",
      json(404, { error: "Route not found" }),
    ],
    [
      "a JSON 404 with extra fields",
      json(404, { error: "Not found", hint: "try again" }),
    ],
    ["a JSON 404 that is not an object", json(404, ["Not found"])],
    [
      "a 404 with malformed JSON",
      { status: 404, contentType: "application/json", body: '{"error":' },
    ],
    [
      "E404 text embedded in another error",
      {
        status: 500,
        contentType: "text/plain",
        body: "upstream said: npm error code E404",
      },
    ],
    ["an auth failure (401)", json(401, { error: "Unauthorized" })],
    ["a forbidden proxy (403)", json(403, { error: "Forbidden" })],
    ["a rate limit (429)", json(429, { error: "Too many requests" })],
    ["a server error (503)", json(503, { error: "Service unavailable" })],
    ["a redirect (302)", { status: 302, contentType: null, body: "" }],
    [
      "a 200 HTML page",
      { status: 200, contentType: "text/html", body: "<html>login</html>" },
    ],
    [
      "a 200 with malformed JSON",
      { status: 200, contentType: "application/json", body: "{oops" },
    ],
    [
      "a 200 for a different package",
      json(200, { name: "other-pkg", versions: { [VERSION]: {} } }),
    ],
    ["a 200 without a versions object", json(200, { name: NAME })],
    [
      "a 200 whose versions is an array",
      json(200, { name: NAME, versions: [VERSION] }),
    ],
  ];

  for (const [label, response] of cases) {
    it(label, () => {
      expect(classify(response).ok).toBe(false);
    });
  }
});

describe("registryPackagePath", () => {
  it("encodes the scope separator only", () => {
    expect(registryPackagePath("prompt-this-spot")).toBe("prompt-this-spot");
    expect(registryPackagePath("@acme/pkg")).toBe("@acme%2fpkg");
  });

  it("rejects names that are not npm package names", () => {
    expect(() => registryPackagePath("../etc")).toThrow();
    expect(() => registryPackagePath("Upper")).toThrow();
    expect(() => registryPackagePath("")).toThrow();
    expect(() => registryPackagePath("@acme/pkg/extra")).toThrow();
    expect(() => registryPackagePath("@acme/../pkg")).toThrow();
  });
});

describe("lookupVersionStatus", () => {
  const respond =
    (status: number, body: string, contentType = "application/json") =>
    async () =>
      new Response(body, { status, headers: { "content-type": contentType } });

  it("asks the given registry for the exact package, refusing redirects", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response('{"error":"Not found"}', {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof globalThis.fetch;

    const result = await lookupVersionStatus({
      name: "@acme/pkg",
      version: VERSION,
      registry: "https://registry.example.test/",
      fetch,
    });

    expect(result).toEqual({ ok: true, status: "unpublished" });
    expect(calls[0]?.url).toBe("https://registry.example.test/@acme%2fpkg");
    expect(calls[0]?.init?.redirect).toBe("manual");
  });

  it("treats a network failure as an error, not as unpublished", async () => {
    const fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof globalThis.fetch;
    const result = await lookupVersionStatus({
      name: NAME,
      version: VERSION,
      fetch,
    });
    expect(result.ok).toBe(false);
  });

  it("passes the registry's answer through the classifier", async () => {
    const published = await lookupVersionStatus({
      name: NAME,
      version: VERSION,
      fetch: respond(
        200,
        JSON.stringify({ name: NAME, versions: { [VERSION]: {} } })
      ) as unknown as typeof globalThis.fetch,
    });
    expect(published).toEqual({ ok: true, status: "published" });

    const proxyPage = await lookupVersionStatus({
      name: NAME,
      version: VERSION,
      fetch: respond(
        404,
        "<h1>Not Found</h1>",
        "text/html"
      ) as unknown as typeof globalThis.fetch,
    });
    expect(proxyPage.ok).toBe(false);
  });
});
