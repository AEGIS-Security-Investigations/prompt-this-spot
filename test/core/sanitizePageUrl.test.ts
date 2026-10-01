import { describe, expect, test } from "bun:test";
import {
  isSecretParamName,
  REDACTED,
  sanitizePageUrl,
} from "../../src/core/sanitizePageUrl";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJleGFtcGxlIn0.c2lnbmF0dXJl";

describe("sanitizePageUrl keeps what identifies the page", () => {
  test("scheme, host, port, path, ordinary query and anchor survive", () => {
    expect(
      sanitizePageUrl(
        "https://app.example.com:8443/orders?status=open&page=2&sort=-date#details"
      )
    ).toBe(
      "https://app.example.com:8443/orders?status=open&page=2&sort=-date#details"
    );
  });

  test("localhost ports and preview hosts are kept as observed", () => {
    expect(sanitizePageUrl("http://localhost:3000/dashboard?tab=billing")).toBe(
      "http://localhost:3000/dashboard?tab=billing"
    );
    expect(
      sanitizePageUrl("https://web-git-feature-x.preview.example.dev/dashboard")
    ).toBe("https://web-git-feature-x.preview.example.dev/dashboard");
  });

  test("untouched parameters keep their original encoding", () => {
    expect(
      sanitizePageUrl("https://app.example.com/search?q=hello%20world&debug")
    ).toBe("https://app.example.com/search?q=hello%20world&debug");
  });

  test("filters that merely contain a secret-ish word are kept", () => {
    // `author` contains "auth" and `state` is a common filter (US state,
    // workflow state); neither is a credential.
    expect(
      sanitizePageUrl("https://app.example.com/list?author=jane&state=CA")
    ).toBe("https://app.example.com/list?author=jane&state=CA");
  });

  test("a hash-router route keeps its path and safe params", () => {
    expect(sanitizePageUrl("https://app.example.com/#/reports?tab=2")).toBe(
      "https://app.example.com/#/reports?tab=2"
    );
  });
});

describe("sanitizePageUrl removes secrets", () => {
  test("userinfo credentials are dropped", () => {
    expect(
      sanitizePageUrl("https://someone:hunter2@app.example.com/settings")
    ).toBe("https://app.example.com/settings");
  });

  test("OAuth authorization codes in the query", () => {
    expect(
      sanitizePageUrl("https://app.example.com/callback?code=abc123&state=xyz")
    ).toBe(`https://app.example.com/callback?code=${REDACTED}&state=xyz`);
  });

  test("tokens in a query-like fragment (implicit flow)", () => {
    const result = sanitizePageUrl(
      "https://app.example.com/#access_token=s3cr3t&expires_in=3600"
    );
    expect(result).toBe(
      `https://app.example.com/#access_token=${REDACTED}&expires_in=3600`
    );
    expect(result).not.toContain("s3cr3t");
  });

  test("tokens in a hash-router route's params", () => {
    expect(
      sanitizePageUrl(`https://app.example.com/#/login?tab=2&id_token=${JWT}`)
    ).toBe(`https://app.example.com/#/login?tab=2&id_token=${REDACTED}`);
  });

  test("signed-URL signatures and credentials", () => {
    const result = sanitizePageUrl(
      "https://files.example.com/a.png?X-Amz-Credential=AKEXAMPLE%2F2026&X-Amz-Signature=deadbeef&X-Amz-Security-Token=tok&X-Amz-Expires=300&sig=abc"
    );
    expect(result).toBe(
      `https://files.example.com/a.png?X-Amz-Credential=${REDACTED}&X-Amz-Signature=${REDACTED}&X-Amz-Security-Token=${REDACTED}&X-Amz-Expires=300&sig=${REDACTED}`
    );
  });

  test("API keys, sessions and client secrets in any spelling", () => {
    const result = sanitizePageUrl(
      "https://app.example.com/p?apiKey=1&api_key=2&x-api-key=3&sessionId=4&client_secret=5&refreshToken=6&password=7&page=3"
    );
    expect(result).toBe(
      `https://app.example.com/p?apiKey=${REDACTED}&api_key=${REDACTED}&x-api-key=${REDACTED}&sessionId=${REDACTED}&client_secret=${REDACTED}&refreshToken=${REDACTED}&password=${REDACTED}&page=3`
    );
  });

  test("a JWT under an innocent name, as a bare fragment or as a path segment", () => {
    expect(sanitizePageUrl(`https://app.example.com/x?invite=${JWT}`)).toBe(
      `https://app.example.com/x?invite=${REDACTED}`
    );
    expect(sanitizePageUrl(`https://app.example.com/x#${JWT}`)).toBe(
      `https://app.example.com/x#${REDACTED}`
    );
    expect(sanitizePageUrl(`https://app.example.com/reset/${JWT}`)).toBe(
      `https://app.example.com/reset/${REDACTED}`
    );
  });

  test("secrets inside an encoded nested URL", () => {
    const nested = encodeURIComponent(
      "https://app.example.com/after?session=abc&tab=1"
    );
    const result = sanitizePageUrl(
      `https://app.example.com/login?next=${nested}`
    );
    expect(result).not.toContain("abc");
    expect(decodeURIComponent(result ?? "")).toContain(
      `https://app.example.com/after?session=${REDACTED}&tab=1`
    );
  });

  test("a nested URL's userinfo and fragment token", () => {
    const nested = encodeURIComponent(
      "https://u:p@idp.example.com/cb#access_token=zzz"
    );
    const result = decodeURIComponent(
      sanitizePageUrl(`https://app.example.com/?returnTo=${nested}`) ?? ""
    );
    expect(result).not.toContain("u:p@");
    expect(result).not.toContain("zzz");
  });

  test("malformed escapes are withheld rather than shown half-decoded", () => {
    expect(
      sanitizePageUrl("https://app.example.com/search?filter=%E0%A4%A&page=1")
    ).toBe(`https://app.example.com/search?filter=${REDACTED}&page=1`);
  });

  test("deeply nested URLs stop at a fixed depth", () => {
    let url = "https://app.example.com/end?tab=1";
    for (let i = 0; i < 6; i++) {
      url = `https://app.example.com/hop?next=${encodeURIComponent(url)}`;
    }
    const result = sanitizePageUrl(url) ?? "";
    expect(result).toContain(REDACTED);
    expect(decodeURIComponent(decodeURIComponent(result))).not.toContain(
      "/end"
    );
  });
});

describe("sanitizePageUrl rejects what is not a page URL", () => {
  test.each([
    ["not a url"],
    ["/relative/path"],
    [""],
    ["about:blank"],
    ["javascript:alert(1)"],
    ["data:text/html,hi"],
  ])("%p returns null", (input) => {
    expect(sanitizePageUrl(input)).toBeNull();
  });
});

describe("isSecretParamName", () => {
  test.each([
    "token",
    "access_token",
    "Access-Token",
    "code",
    "auth",
    "Authorization",
    "oauth_verifier",
    "code_verifier",
    "SAMLResponse",
    "X-Goog-Signature",
  ])("%p is secret", (name) => {
    expect(isSecretParamName(name)).toBe(true);
  });

  test.each([
    "tab",
    "page",
    "sort",
    "q",
    "author",
    "state",
    "status",
    "id",
  ])("%p is not", (name) => {
    expect(isSecretParamName(name)).toBe(false);
  });
});
