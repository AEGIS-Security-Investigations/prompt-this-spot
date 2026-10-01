/**
 * Makes a page URL safe to show in the drawer and to paste into a prompt.
 *
 * The prompt leaves the browser: it is copied to the clipboard, sent to Claude
 * Code and stored with feedback reports. A raw `location.href` can carry
 * whatever the app or its auth provider put there — a password in userinfo, an
 * OAuth `code` or `access_token`, a signed-URL signature, a session id — so
 * every URL goes through here before it enters any state.
 *
 * What survives: scheme, host, port, path, ordinary query parameters (filters,
 * tabs, pagination) and plain `#anchor` fragments, so the agent can tell which
 * deployment and which view the user meant. Secret values are replaced with
 * {@link REDACTED}; their parameter NAMES stay, because "this page was reached
 * with a `code`" is useful context and not a secret.
 */

/** Placeholder written in place of a secret value. */
export const REDACTED = "REDACTED";

/**
 * Parameter names that always carry a secret, compared after lower-casing and
 * dropping `-`, `_` and `.` (so `access_token`, `Access-Token` and
 * `accessToken` all match `accesstoken`).
 */
const SECRET_PARAM_NAMES = new Set([
  "code", // OAuth / OIDC authorization code
  "auth",
  "authorization",
  "authcode",
  "authkey",
  "key",
  "sig", // Azure SAS, many signed-URL schemes
  "sid",
  "jwt",
  "otp",
  "pin",
  "pass",
  "pwd",
  "ticket", // CAS
  "samlresponse",
  "samlrequest",
  "nonce",
  "hash",
  "hmac",
]);

/** Name fragments that mark a parameter as secret wherever they appear. */
const SECRET_PARAM_FRAGMENTS = [
  "token", // access_token, id_token, refresh_token, x-amz-security-token
  "secret", // client_secret
  "password",
  "passwd",
  "apikey", // api_key, apiKey, x-api-key
  "accesskey",
  "session", // session, sessionid, session_state
  "signature", // x-amz-signature, x-goog-signature
  "credential", // x-amz-credential, x-goog-credential
  "verifier", // code_verifier, oauth_verifier
  "assertion",
  "privatekey",
  "cookie",
];

/** A JSON Web Token: three base64url parts, the first starting `eyJ`. */
const JWT_PATTERN = /^eyJ[\w-]*\.[\w-]+\.[\w-]*$/;

/** Schemes a page the tools run on can have. */
const PAGE_PROTOCOLS = new Set(["http:", "https:", "file:"]);

/** How deep to follow URLs nested inside other URLs' parameters. */
const MAX_NESTED_DEPTH = 3;

const normalizeName = (name: string): string =>
  name.toLowerCase().replace(/[-_.]/g, "");

/** Whether a query/fragment parameter's value must be withheld. */
export const isSecretParamName = (name: string): boolean => {
  const normalized = normalizeName(name);
  return (
    SECRET_PARAM_NAMES.has(normalized) ||
    SECRET_PARAM_FRAGMENTS.some((fragment) => normalized.includes(fragment))
  );
};

/** `decodeURIComponent` that returns null instead of throwing on bad input. */
const safeDecode = (value: string): string | null => {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return null;
  }
};

/** An absolute http(s) URL, possibly one level percent-encoded. */
const looksLikeNestedUrl = (decoded: string): boolean =>
  /^https?:\/\//i.test(decoded);

/**
 * Sanitize one parameter value. Secrets by name or by shape become
 * {@link REDACTED}; a value that is itself a URL (a `redirect_uri`,
 * `returnTo`, `next`) is sanitized recursively, so a token inside it is caught
 * too. Everything else is returned exactly as written.
 */
const sanitizeParamValue = (
  name: string,
  rawValue: string,
  depth: number
): string => {
  if (rawValue.length === 0) {
    return rawValue;
  }
  if (isSecretParamName(name)) {
    return REDACTED;
  }
  const decoded = safeDecode(rawValue);
  if (decoded === null) {
    // Malformed escapes: nothing trustworthy to show.
    return REDACTED;
  }
  if (JWT_PATTERN.test(decoded)) {
    return REDACTED;
  }
  if (looksLikeNestedUrl(decoded)) {
    if (depth >= MAX_NESTED_DEPTH) {
      return REDACTED;
    }
    const nested = sanitizeUrl(decoded, depth + 1);
    return nested === null ? REDACTED : encodeURIComponent(nested);
  }
  return rawValue;
};

/**
 * Sanitize an `a=1&b=2` string pair by pair, leaving untouched pairs byte for
 * byte as they were (URLSearchParams would re-encode every one of them).
 */
const sanitizeParamString = (params: string, depth: number): string =>
  params
    .split("&")
    .map((pair) => {
      const equals = pair.indexOf("=");
      if (equals === -1) {
        // A bare flag (`?debug`) — or a bare token (`#eyJ…`).
        const decoded = safeDecode(pair);
        return decoded !== null && JWT_PATTERN.test(decoded) ? REDACTED : pair;
      }
      const rawName = pair.slice(0, equals);
      const name = safeDecode(rawName) ?? rawName;
      const value = sanitizeParamValue(name, pair.slice(equals + 1), depth);
      return `${rawName}=${value}`;
    })
    .join("&");

/**
 * Sanitize the fragment. Implicit-flow OAuth and some SPAs put a query string
 * after `#` (`#access_token=…`, `#/route?code=…`), so a fragment containing
 * `=` is treated as parameters; a plain `#section` anchor passes through.
 */
const sanitizeHash = (hash: string, depth: number): string => {
  if (hash.length <= 1) {
    return hash;
  }
  const body = hash.slice(1);
  if (!body.includes("=")) {
    const decoded = safeDecode(body);
    return decoded !== null && JWT_PATTERN.test(decoded)
      ? `#${REDACTED}`
      : hash;
  }
  const question = body.indexOf("?");
  if (question !== -1) {
    // Hash router: `#/route?params` — keep the route, sanitize the params.
    return `#${body.slice(0, question + 1)}${sanitizeParamString(
      body.slice(question + 1),
      depth
    )}`;
  }
  return `#${sanitizeParamString(body, depth)}`;
};

/** A path segment that is a bare JWT (`/reset/eyJ…`) is withheld. */
const sanitizePath = (pathname: string): string =>
  pathname
    .split("/")
    .map((segment) => {
      const decoded = safeDecode(segment);
      return decoded !== null && JWT_PATTERN.test(decoded) ? REDACTED : segment;
    })
    .join("/");

const sanitizeUrl = (href: string, depth: number): string | null => {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  // Only page URLs are meaningful here; `about:blank`, `data:`, `blob:` and
  // `javascript:` carry no deployment to name and may carry content.
  if (!PAGE_PROTOCOLS.has(url.protocol)) {
    return null;
  }
  // Credentials in userinfo never leave the browser.
  url.username = "";
  url.password = "";

  const origin =
    url.protocol === "file:" ? "file://" : `${url.protocol}//${url.host}`;
  const search =
    url.search.length > 1
      ? `?${sanitizeParamString(url.search.slice(1), depth)}`
      : "";
  return `${origin}${sanitizePath(url.pathname)}${search}${sanitizeHash(url.hash, depth)}`;
};

/**
 * Sanitize an absolute URL for display and prompts. Returns null when the
 * input is not a parseable absolute http(s) or file URL, so callers fall back
 * to the pathname rather than showing something half-parsed.
 */
export const sanitizePageUrl = (href: string): string | null =>
  sanitizeUrl(href, 0);
