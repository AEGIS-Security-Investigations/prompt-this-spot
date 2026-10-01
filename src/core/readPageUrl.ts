import { sanitizePageUrl } from "./sanitizePageUrl";

/**
 * The page the user is on right now, as a sanitized absolute URL (see
 * {@link sanitizePageUrl}). Read at the moment a spot is picked or a
 * screenshot is taken, so each capture keeps the URL it was taken on even
 * after the app navigates elsewhere.
 *
 * Falls back to the pathname in the rare case the browser reports an href the
 * URL parser rejects, so callers always get something to show.
 */
export const readPageUrl = (): string =>
  sanitizePageUrl(window.location.href) ?? window.location.pathname;
