/**
 * Decides, from a registry response, whether one exact version of a package
 * is on npm. Fails closed: only two answers count.
 *
 * - "published" / "unpublished" from a 200 JSON document for THIS package
 *   (its `name` must match and `versions` must be an object), which proves
 *   whether the version exists.
 * - "unpublished" from the registry's own "no such package" answer: a 404
 *   with a JSON body that is exactly `{"error":"Not found"}`.
 *
 * Everything else is an error: other statuses (401, 403, 429, 5xx),
 * redirects, HTML or other non-JSON bodies (a proxy's 404 page), a 404 with
 * any other body, malformed JSON, metadata for a different package, and
 * network failures. The publish workflow stops on an error rather than
 * treating "couldn't tell" as "not published".
 */

export type VersionStatus = "published" | "unpublished";

export type VersionStatusResult =
  | { ok: true; status: VersionStatus }
  | { ok: false; error: string };

export interface RegistryResponse {
  status: number;
  contentType: string | null;
  body: string;
}

const fail = (error: string): VersionStatusResult => ({ ok: false, error });
const ok = (status: VersionStatus): VersionStatusResult => ({ ok: true, status });

/** npm package names: optional `@scope/`, lower-case URL-safe characters. */
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJson = (contentType: string | null): boolean =>
  /^application\/(?:[\w.+-]*\+)?json\b|^application\/vnd\.npm\.install-v1\+json\b/i.test(
    contentType ?? ""
  );

/** The registry path for a package: `@scope/name` becomes `@scope%2fname`. */
export const registryPackagePath = (name: string): string => {
  if (!PACKAGE_NAME.test(name)) {
    throw new Error(`Not a valid npm package name: ${JSON.stringify(name)}`);
  }
  return name.replace("/", "%2f");
};

export const classifyRegistryResponse = (
  response: RegistryResponse,
  name: string,
  version: string
): VersionStatusResult => {
  const { status, contentType, body } = response;
  const data = isJson(contentType) ? parseJson(body) : undefined;

  if (status === 200) {
    if (!isPlainObject(data)) {
      return fail(`200 without a JSON package document (content-type ${contentType})`);
    }
    if (data.name !== name) {
      return fail(`200 for a different package: ${JSON.stringify(data.name)}`);
    }
    if (!isPlainObject(data.versions)) {
      return fail("200 package document without a versions object");
    }
    return ok(Object.hasOwn(data.versions, version) ? "published" : "unpublished");
  }

  if (status === 404) {
    if (
      isPlainObject(data) &&
      Object.keys(data).length === 1 &&
      typeof data.error === "string" &&
      data.error.toLowerCase() === "not found"
    ) {
      return ok("unpublished");
    }
    return fail(
      `404 that is not the registry's "Not found" answer (content-type ${contentType})`
    );
  }

  return fail(`unexpected HTTP ${status} from the registry`);
};

export interface LookupOptions {
  name: string;
  version: string;
  registry?: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

/** Ask the registry about `name@version`; never throws. */
export const lookupVersionStatus = async ({
  name,
  version,
  registry = "https://registry.npmjs.org",
  fetch = globalThis.fetch,
  timeoutMs = 30_000,
}: LookupOptions): Promise<VersionStatusResult> => {
  let url: string;
  try {
    url = `${registry.replace(/\/+$/, "")}/${registryPackagePath(name)}`;
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
  try {
    const response = await fetch(url, {
      headers: { accept: "application/vnd.npm.install-v1+json" },
      // A redirect could land on anything (a captive portal, a proxy page),
      // so it is an error rather than an answer.
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return classifyRegistryResponse(
      {
        status: response.status,
        contentType: response.headers.get("content-type"),
        body: await response.text(),
      },
      name,
      version
    );
  } catch (error) {
    return fail(
      `could not reach ${url}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
