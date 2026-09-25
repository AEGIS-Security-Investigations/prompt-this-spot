/**
 * Pure helpers for turning a clicked DOM element into a stable, human- and
 * AI-readable description. No React / framework dependencies so these can be
 * unit tested in isolation.
 */

const MAX_DEPTH = 5;
const MAX_TEXT_LENGTH = 120;
// Cap classes embedded in a selector segment so the path stays readable even
// with utility-class-heavy markup (Tailwind). The full class list is surfaced
// separately via `elementClasses`.
const MAX_CLASSES_PER_SEGMENT = 3;

/** Attributes worth surfacing to an AI to identify what was clicked. */
const DESCRIPTIVE_ATTRIBUTES = [
  "data-testid",
  "aria-label",
  "name",
  "role",
  "type",
  "href",
] as const;

const isElement = (node: Node | null): node is Element =>
  node != null && node.nodeType === 1;

/** Escape a value so it is safe to drop inside an attribute selector. */
const cssEscape = (value: string): string => {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\\]]/g, "\\$&");
};

/** Up to {@link MAX_CLASSES_PER_SEGMENT} escaped class selectors for an element. */
const classSelectorSuffix = (element: Element): string => {
  const classes = Array.from(element.classList).slice(
    0,
    MAX_CLASSES_PER_SEGMENT
  );
  return classes.map((cls) => `.${cssEscape(cls)}`).join("");
};

/** Build the selector segment for a single element. */
const segmentForElement = (element: Element): string => {
  const tag = element.tagName.toLowerCase();

  const testId = element.getAttribute("data-testid");
  if (testId) {
    return `${tag}[data-testid="${cssEscape(testId)}"]`;
  }

  if (element.id) {
    return `${tag}#${cssEscape(element.id)}`;
  }

  // No unique anchor: combine classes (for precision) with an :nth-of-type
  // index when needed to disambiguate among same-tag siblings.
  const classes = classSelectorSuffix(element);
  const parent = element.parentElement;
  if (!parent) {
    return `${tag}${classes}`;
  }

  const sameTagSiblings = Array.from(parent.children).filter(
    (child) => child.tagName === element.tagName
  );

  if (sameTagSiblings.length <= 1) {
    return `${tag}${classes}`;
  }

  const index = sameTagSiblings.indexOf(element) + 1;
  return `${tag}${classes}:nth-of-type(${index})`;
};

/**
 * Build a CSS-style path for an element, walking up to {@link MAX_DEPTH}
 * ancestors or until a `data-testid` / `id` anchor is found.
 */
export const buildDomPath = (element: Element): string => {
  const segments: string[] = [];
  let current: Element | null = element;
  let depth = 0;

  while (isElement(current) && depth < MAX_DEPTH) {
    const segment = segmentForElement(current);
    segments.unshift(segment);

    // A test id or id is unique enough; stop climbing.
    if (segment.includes("[data-testid=") || segment.includes("#")) {
      break;
    }

    current = current.parentElement;
    depth += 1;
  }

  return segments.join(" > ");
};

/**
 * Build a full-depth, collision-free path from the element up to the document
 * root, using `tag:nth-child(n)` at every level. Unlike {@link buildDomPath}
 * (which is depth-capped and anchored on `data-testid`/`id` for readability),
 * this is NOT meant for humans — it exists purely as a stable de-duplication
 * key so two distinct nodes that happen to share a readable selector (common in
 * repeated layouts) are never treated as the same selection.
 */
export const buildUniqueDomKey = (element: Element): string => {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current) {
    const parent: Element | null = current.parentElement;
    if (!parent) {
      segments.unshift(current.tagName.toLowerCase());
      break;
    }
    const index = Array.from(parent.children).indexOf(current) + 1;
    segments.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`);
    current = parent;
  }

  return segments.join(">");
};

/** Collect descriptive attributes present on the element. */
export const describeAttributes = (element: Element): string[] => {
  return DESCRIPTIVE_ATTRIBUTES.flatMap((attr) => {
    const value = element.getAttribute(attr);
    return value ? [`${attr}="${value}"`] : [];
  });
};

/** The element's `id`, or null when it has none. */
export const elementId = (element: Element): string | null =>
  element.id ? element.id : null;

/** The element's full class list (unabridged), for AI precision. */
export const elementClasses = (element: Element): string[] =>
  Array.from(element.classList);

/** Trimmed, length-capped visible text for the element. */
export const visibleText = (element: Element): string => {
  const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= MAX_TEXT_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_TEXT_LENGTH)}…`;
};
