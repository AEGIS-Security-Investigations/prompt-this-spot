import { LinearApiError, linearGraphql } from "./linearGraphql";

/** Linear's own limit is higher; a screenshot is far below this. */
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 15_000;

const FILE_UPLOAD = `
  mutation PromptThisSpotFileUpload($contentType: String!, $filename: String!, $size: Int!) {
    fileUpload(contentType: $contentType, filename: $filename, size: $size) {
      success
      uploadFile {
        uploadUrl
        assetUrl
        headers { key value }
      }
    }
  }
`;

interface FileUploadData {
  fileUpload: {
    success: boolean;
    uploadFile: {
      uploadUrl: string;
      assetUrl: string;
      headers: { key: string; value: string }[];
    } | null;
  };
}

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/**
 * Whether the route may download `url` to copy it into Linear. Only https URLs
 * under one of the host app's own screenshot prefixes qualify, so a caller
 * can't make the server fetch an arbitrary address.
 */
export const isCopyableScreenshotUrl = (
  url: string,
  allowedPrefixes: readonly string[]
): boolean => {
  const target = parseUrl(url);
  if (target?.protocol !== "https:" || target.username || target.password) {
    return false;
  }
  return allowedPrefixes.some((prefix) => {
    const allowed = parseUrl(prefix);
    // Compare the origin, not the raw string, so a prefix naming one host
    // doesn't admit a longer host that merely starts with the same letters.
    return (
      allowed?.protocol === "https:" &&
      allowed.origin === target.origin &&
      target.pathname.startsWith(allowed.pathname)
    );
  });
};

const download = async (
  url: string,
  fetchImpl: typeof fetch
): Promise<{ bytes: ArrayBuffer; contentType: string }> => {
  const response = await fetchImpl(url, {
    redirect: "error",
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Screenshot download failed (${response.status})`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Screenshot URL did not return an image");
  }
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_SCREENSHOT_BYTES) {
    throw new Error("Screenshot is too large to copy");
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_SCREENSHOT_BYTES) {
    throw new Error("Screenshot is too large to copy");
  }
  return { bytes, contentType: contentType.split(";")[0] ?? "image/png" };
};

const filenameFor = (url: string, contentType: string): string => {
  const last = new URL(url).pathname.split("/").pop() ?? "";
  if (/^[\w.-]+\.\w+$/.test(last)) {
    return last;
  }
  return `screenshot.${contentType.split("/")[1] ?? "png"}`;
};

/**
 * Copies one screenshot into Linear's file storage and returns the asset URL
 * to use in the ticket instead. Screenshot links from the host app often
 * expire after a few days; a copy in Linear lasts as long as the ticket.
 */
export const copyScreenshotToLinear = async (
  apiKey: string,
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> => {
  const { bytes, contentType } = await download(url, fetchImpl);
  const { fileUpload } = await linearGraphql<FileUploadData>(
    apiKey,
    FILE_UPLOAD,
    {
      contentType,
      filename: filenameFor(url, contentType),
      size: bytes.byteLength,
    },
    fetchImpl
  );
  const target = fileUpload.uploadFile;
  if (!fileUpload.success || !target) {
    throw new LinearApiError("Linear didn't accept the screenshot.");
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000",
  });
  for (const { key, value } of target.headers) {
    headers.set(key, value);
  }
  const put = await fetchImpl(target.uploadUrl, {
    method: "PUT",
    headers,
    body: bytes,
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!put.ok) {
    throw new Error(`Screenshot upload to Linear failed (${put.status})`);
  }
  return target.assetUrl;
};
