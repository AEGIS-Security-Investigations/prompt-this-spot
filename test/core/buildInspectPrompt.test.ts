import { describe, expect, it } from "bun:test";
import {
  buildDomPath,
  buildUniqueDomKey,
  describeAttributes,
  visibleText,
} from "../../src/core/buildDomPath";
import {
  buildInspectPrompt,
  buildMultiInspectPrompt,
  describeElement,
} from "../../src/core/buildInspectPrompt";
import type { InspectPromptScreenshot } from "../../src/core/types";

const render = (html: string): HTMLElement => {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
};

describe("buildDomPath", () => {
  it("climbs to a data-testid ancestor anchor and includes classes", () => {
    const host = render(
      `<section><button data-testid="save-btn"><span class="label">Save</span></button></section>`
    );
    const span = host.querySelector(".label") as Element;
    expect(buildDomPath(span)).toBe(
      'button[data-testid="save-btn"] > span.label'
    );
  });

  it("caps classes per segment for readability", () => {
    const host = render(`<span class="a b c d e">x</span>`);
    const el = host.querySelector("span") as Element;
    // id-less, so classes are embedded in the segment — but capped at 3.
    const path = buildDomPath(el);
    expect(path.endsWith("span.a.b.c")).toBe(true);
    expect(path).not.toContain(".d");
  });

  it("falls back to id", () => {
    const host = render(`<div id="hero">Hi</div>`);
    const el = host.querySelector("#hero") as Element;
    expect(buildDomPath(el)).toBe("div#hero");
  });

  it("disambiguates same-tag siblings with nth-of-type", () => {
    const host = render(`<ul><li>a</li><li id="t">b</li><li>c</li></ul>`);
    const el = host.querySelector("#t") as Element;
    // id wins on the element itself
    expect(buildDomPath(el)).toBe("li#t");

    const ul = host.querySelector("ul") as Element;
    const third = ul.children[2];
    expect(buildDomPath(third)).toContain("li:nth-of-type(3)");
  });
});

describe("buildUniqueDomKey", () => {
  it("distinguishes structurally identical siblings", () => {
    const host = render(
      `<ul><li><button>A</button></li><li><button>B</button></li></ul>`
    );
    const buttons = host.querySelectorAll("button");
    // buildDomPath can collide for repeated layouts; the unique key must not.
    expect(buildUniqueDomKey(buttons[0])).not.toBe(
      buildUniqueDomKey(buttons[1])
    );
  });
});

describe("describeAttributes", () => {
  it("surfaces descriptive attributes only", () => {
    const host = render(
      `<a href="/x" aria-label="Home" class="ignored">Home</a>`
    );
    const el = host.querySelector("a") as Element;
    const attrs = describeAttributes(el);
    expect(attrs).toContain('aria-label="Home"');
    expect(attrs).toContain('href="/x"');
    expect(attrs.some((a) => a.includes("class"))).toBe(false);
  });
});

describe("visibleText", () => {
  it("collapses whitespace and truncates long text", () => {
    const host = render(`<p>  hello   world  </p>`);
    expect(visibleText(host.querySelector("p") as Element)).toBe("hello world");

    const long = render(`<p>${"x".repeat(200)}</p>`);
    expect(visibleText(long.querySelector("p") as Element).endsWith("…")).toBe(
      true
    );
  });
});

describe("buildInspectPrompt", () => {
  it("includes pathname, selector and request placeholder", () => {
    const host = render(`<button data-testid="cta">Get started</button>`);
    const el = host.querySelector("button") as Element;
    const prompt = buildInspectPrompt({ pathname: "/dashboard", element: el });

    expect(prompt).toContain('on the page "/dashboard"');
    expect(prompt).toContain('button[data-testid="cta"]');
    expect(prompt).toContain('What it shows: "Get started"');
    expect(prompt).toContain("What I want changed here:");
  });

  it("surfaces id and full class list when present", () => {
    const host = render(
      `<a id="privacy-link" class="text-sm text-muted hover:underline" href="/legal/privacy">Privacy Policy</a>`
    );
    const el = host.querySelector("a") as Element;
    const prompt = buildInspectPrompt({ pathname: "/org/acme", element: el });

    expect(prompt).toContain("- id: privacy-link");
    expect(prompt).toContain("- Classes: text-sm text-muted hover:underline");
  });

  it("omits id and class lines when absent", () => {
    const host = render(`<p>Plain</p>`);
    const el = host.querySelector("p") as Element;
    const prompt = buildInspectPrompt({ pathname: "/x", element: el });

    expect(prompt).not.toContain("- id:");
    expect(prompt).not.toContain("- Classes:");
  });
});

describe("describeElement", () => {
  it("returns label, selector and a request-free block", () => {
    const host = render(`<button data-testid="cta">Get started</button>`);
    const el = host.querySelector("button") as Element;
    const description = describeElement({
      pathname: "/dashboard",
      element: el,
    });

    expect(description.pathname).toBe("/dashboard");
    expect(description.selector).toBe('button[data-testid="cta"]');
    expect(description.label).toContain("button");
    expect(description.label).toContain("Get started");
    // The stored block carries the bullets but never the request line.
    expect(description.block).toContain('What it shows: "Get started"');
    expect(description.block).toContain("Location (DOM path):");
    expect(description.block).not.toContain("What I want changed here:");
    expect(description.id.length).toBeGreaterThan(0);
  });

  it("falls back to href/aria-label/tag for the label", () => {
    const host = render(`<a href="/legal/privacy"></a>`);
    const el = host.querySelector("a") as Element;
    expect(describeElement({ pathname: "/x", element: el }).label).toContain(
      "/legal/privacy"
    );
  });
});

describe("buildMultiInspectPrompt", () => {
  const describe1 = (html: string, pathname = "/dashboard") => {
    const host = render(html);
    const el = host.firstElementChild as Element;
    return describeElement({ pathname, element: el });
  };

  it("matches the single-element phrasing for one selection", () => {
    const description = describe1(
      `<button data-testid="cta">Get started</button>`
    );
    const prompt = buildMultiInspectPrompt({
      descriptions: [description],
      request: "",
    });

    expect(prompt).toContain(
      'on the page "/dashboard", I\'m pointing at this element:'
    );
    expect(prompt).not.toContain("[1]");
    expect(prompt).toContain(
      "What I want changed here: <describe your request>"
    );
  });

  it("numbers multiple selections and keeps one request line", () => {
    const first = describe1(
      `<button data-testid="cta">Get started</button>`,
      "/a"
    );
    const second = describe1(`<a id="privacy" href="/legal">Privacy</a>`, "/b");
    const prompt = buildMultiInspectPrompt({
      descriptions: [first, second],
      request: "",
    });

    expect(prompt).toContain("these 2 spots");
    expect(prompt).toContain('[1] On the page "/a":');
    expect(prompt).toContain('[2] On the page "/b":');
    expect(prompt).toContain('button[data-testid="cta"]');
    expect(prompt).toContain("a#privacy");
    // Exactly one trailing request line.
    expect(prompt.match(/What I want changed here:/g)?.length).toBe(1);
  });

  it("substitutes a non-empty request and falls back when empty", () => {
    const description = describe1(`<p>Plain</p>`);
    expect(
      buildMultiInspectPrompt({
        descriptions: [description],
        request: "Make it blue",
      })
    ).toContain("What I want changed here: Make it blue");
    expect(
      buildMultiInspectPrompt({ descriptions: [description], request: "   " })
    ).toContain("What I want changed here: <describe your request>");
  });
});

describe("buildMultiInspectPrompt test-coverage request", () => {
  const describe1 = (html: string, pathname = "/dashboard") => {
    const host = render(html);
    const el = host.firstElementChild as Element;
    return describeElement({ pathname, element: el });
  };

  it("asks for unit and e2e coverage when the box is ticked", () => {
    const prompt = buildMultiInspectPrompt({
      descriptions: [describe1(`<button data-testid="cta">Go</button>`)],
      request: "Make it blue",
      testCoverage: true,
    });

    expect(prompt).toContain("Also cover this change with automated tests:");
    // Both layers are named explicitly — "add tests" alone reliably yields one.
    expect(prompt).toContain("Unit tests (`bun test`)");
    expect(prompt).toContain("Playwright e2e spec (`bun run test:e2e`)");
    expect(prompt).toContain("run them until they pass");
  });

  it("leaves the prompt untouched when the box is unticked", () => {
    const description = describe1(`<button data-testid="cta">Go</button>`);
    const withoutFlag = buildMultiInspectPrompt({
      descriptions: [description],
      request: "Make it blue",
    });

    expect(withoutFlag).not.toContain("automated tests");
    // Explicit `false` must match omitting the flag byte for byte, so unticking
    // the box restores exactly the prompt the reviewer had before.
    expect(
      buildMultiInspectPrompt({
        descriptions: [description],
        request: "Make it blue",
        testCoverage: false,
      })
    ).toBe(withoutFlag);
  });

  it("keeps the ask under the request line it qualifies", () => {
    const prompt = buildMultiInspectPrompt({
      descriptions: [describe1(`<p>Plain</p>`)],
      request: "Tighten the spacing",
      testCoverage: true,
    });

    expect(prompt.indexOf("What I want changed here:")).toBeLessThan(
      prompt.indexOf("Also cover this change with automated tests:")
    );
    // Separated by a blank line, so it reads as its own paragraph.
    expect(prompt).toContain(
      "What I want changed here: Tighten the spacing\n\nAlso cover this change with automated tests:"
    );
  });

  it("sits before the screenshot footnote, not inside it", () => {
    const prompt = buildMultiInspectPrompt({
      descriptions: [],
      request: "Why is this cut off?",
      testCoverage: true,
      screenshots: [
        {
          id: "s1",
          kind: "page",
          selectionId: null,
          label: "Page",
          pathname: "/dashboard",
          previewDataUrl: null,
          url: "https://cdn.example.test/page.png",
          expiresAt: "2026-08-19T00:00:00.000Z",
          status: "ready",
          error: null,
          note: "",
        },
      ],
    });

    // The screenshot caveat is a footnote about the links; the coverage ask is
    // part of the request, so it must not be pushed below it.
    expect(
      prompt.indexOf("Also cover this change with automated tests:")
    ).toBeLessThan(prompt.indexOf("Screenshot links are public PNGs"));
  });

  it("attaches the ask to a screenshot-only prompt too", () => {
    // No selection is needed for the reviewer to want tests — a page shot plus
    // a request is a complete ask on its own.
    const prompt = buildMultiInspectPrompt({
      descriptions: [],
      request: "",
      testCoverage: true,
    });

    expect(prompt).toContain(
      "What I want changed here: <describe your request>"
    );
    expect(prompt).toContain("Also cover this change with automated tests:");
  });
});

describe("buildMultiInspectPrompt screenshots", () => {
  const describe1 = (html: string, pathname = "/dashboard") => {
    const host = render(html);
    const el = host.firstElementChild as Element;
    return describeElement({ pathname, element: el });
  };

  const shot = (
    overrides: Partial<InspectPromptScreenshot>
  ): InspectPromptScreenshot => ({
    id: "shot-1",
    kind: "page",
    selectionId: null,
    label: "Page",
    pathname: "/dashboard",
    previewDataUrl: null,
    url: "https://cdn.example.com/shot.png",
    expiresAt: "2026-08-13T00:00:00.000Z",
    status: "ready",
    error: null,
    note: "",
    ...overrides,
  });

  it("attaches an element screenshot to the selection it shows", () => {
    const description = describe1(`<button data-testid="cta">Go</button>`);
    const prompt = buildMultiInspectPrompt({
      descriptions: [description],
      request: "",
      screenshots: [
        shot({
          kind: "element",
          selectionId: description.id,
          url: "https://cdn.example.com/element.png",
        }),
      ],
    });

    expect(prompt).toContain(
      "- Screenshot (this element, with surrounding page for context): https://cdn.example.com/element.png"
    );
    expect(prompt).toContain("deleted after 7 days");
  });

  it("lists standalone page screenshots after the selections", () => {
    const first = describe1(`<button data-testid="a">A</button>`, "/a");
    const second = describe1(`<button data-testid="b">B</button>`, "/b");
    const prompt = buildMultiInspectPrompt({
      descriptions: [first, second],
      request: "Fix the spacing",
      screenshots: [
        shot({
          id: "s1",
          pathname: "/a",
          url: "https://cdn.example.com/a.png",
        }),
        shot({
          id: "s2",
          pathname: "/b",
          url: "https://cdn.example.com/b.png",
        }),
      ],
    });

    expect(prompt).toContain("Full-page screenshots (2):");
    expect(prompt).toContain("- /a: https://cdn.example.com/a.png");
    expect(prompt).toContain("- /b: https://cdn.example.com/b.png");
    // The request line still comes last, once, after the screenshot section.
    expect(prompt.match(/What I want changed here:/g)?.length).toBe(1);
    expect(prompt.indexOf("Full-page screenshots")).toBeLessThan(
      prompt.indexOf("What I want changed here:")
    );
  });

  it("omits screenshots that have not finished uploading", () => {
    const description = describe1(`<button data-testid="cta">Go</button>`);
    const prompt = buildMultiInspectPrompt({
      descriptions: [description],
      request: "",
      screenshots: [
        shot({ id: "s1", status: "uploading", url: null }),
        shot({ id: "s2", status: "failed", url: null, error: "boom" }),
        shot({
          id: "s3",
          kind: "element",
          selectionId: description.id,
          status: "capturing",
          url: null,
        }),
      ],
    });

    expect(prompt).not.toContain("Full-page screenshot");
    expect(prompt).not.toContain("- Screenshot (this element");
    expect(prompt).not.toContain("deleted after 7 days");
  });

  it("carries a per-shot note beside the image it belongs to", () => {
    const description = describe1(`<button data-testid="cta">Go</button>`);
    const prompt = buildMultiInspectPrompt({
      descriptions: [description],
      request: "Fix these",
      screenshots: [
        shot({
          id: "s1",
          kind: "element",
          selectionId: description.id,
          url: "https://cdn.example.test/el.png",
          note: "  the arrow is misaligned  ",
        }),
        shot({
          id: "s2",
          pathname: "/a",
          url: "https://cdn.example.test/a.png",
          note: "this column is too wide",
        }),
        // A shot with no note must not emit an empty "Note:" line.
        shot({
          id: "s3",
          pathname: "/b",
          url: "https://cdn.example.test/b.png",
        }),
      ],
    });

    // Notes are trimmed and sit directly under their own image.
    expect(prompt).toContain(
      "- Screenshot (this element, with surrounding page for context): https://cdn.example.test/el.png\n  Note: the arrow is misaligned"
    );
    expect(prompt).toContain(
      "- /a: https://cdn.example.test/a.png\n  Note: this column is too wide"
    );
    expect(prompt).toContain("- /b: https://cdn.example.test/b.png");
    expect(prompt.match(/Note:/g)?.length).toBe(2);
  });

  it("tells the agent the shots are renderings, not browser screenshots", () => {
    const prompt = buildMultiInspectPrompt({
      descriptions: [],
      request: "",
      screenshots: [shot({ url: "https://cdn.example.test/p.png" })],
    });

    // Guards against the agent over-trusting pixel-level styling: html2canvas
    // does not implement CSS masks, backdrop filters or animations.
    expect(prompt).toContain("html2canvas renderings rather than real browser");
    expect(prompt).toContain("Trust the DOM details above over pixel-level");
  });

  it("builds a screenshot-only prompt when nothing was picked", () => {
    const prompt = buildMultiInspectPrompt({
      descriptions: [],
      request: "Why is this cut off?",
      screenshots: [shot({ url: "https://cdn.example.com/page.png" })],
    });

    expect(prompt).toContain("In our app, here is what I'm looking at:");
    expect(prompt).toContain("Full-page screenshot:");
    expect(prompt).toContain("- /dashboard: https://cdn.example.com/page.png");
    expect(prompt).toContain("What I want changed here: Why is this cut off?");
    expect(prompt).not.toContain("spots");
  });
});
