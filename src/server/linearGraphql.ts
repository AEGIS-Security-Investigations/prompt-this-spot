/** Linear's public GraphQL endpoint. */
export const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";

const REQUEST_TIMEOUT_MS = 20_000;

/** A Linear API failure, with a message that is safe to show the reviewer. */
export class LinearApiError extends Error {
  override name = "LinearApiError";
}

interface GraphqlError {
  message?: string;
  extensions?: { userPresentableMessage?: string };
}

interface GraphqlResponse<T> {
  data?: T;
  errors?: GraphqlError[];
}

/**
 * Runs one query or mutation against Linear with a personal or workspace API
 * key. Linear takes the key as the bare `Authorization` value, with no
 * `Bearer` prefix. The key never appears in an error message.
 */
export const linearGraphql = async <T>(
  apiKey: string,
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch
): Promise<T> => {
  let response: Response;
  try {
    response = await fetchImpl(LINEAR_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new LinearApiError("Couldn't reach Linear. Try again.");
  }

  let body: GraphqlResponse<T> | null = null;
  try {
    body = (await response.json()) as GraphqlResponse<T>;
  } catch {
    // Handled below with the status code.
  }

  const firstError = body?.errors?.[0];
  if (firstError) {
    throw new LinearApiError(
      firstError.extensions?.userPresentableMessage ??
        firstError.message ??
        "Linear rejected the request."
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new LinearApiError("Linear rejected the API key.");
  }
  if (!response.ok || !body?.data) {
    throw new LinearApiError(`Linear returned an error (${response.status}).`);
  }
  return body.data;
};
