import { describe, expect, test } from "bun:test";

import { floatingLauncherExpandLabelClass } from "../../src/floating-launchers/floatingLauncherExpandLabel";

describe("floating launcher expand-label animation", () => {
  test("starts collapsed so the pill is icon-only until hover or focus", () => {
    const className = floatingLauncherExpandLabelClass(false);

    expect(className).toContain("max-w-0");
    expect(className).toContain("opacity-0");
    expect(className).toContain("overflow-hidden");
    expect(className).toContain("transition-all");
    expect(className).toContain("duration-300");
  });

  test("a right-edge launcher grows its label leftward on hover and focus", () => {
    const className = floatingLauncherExpandLabelClass(true);

    expect(className).toContain("group-hover:mr-2");
    expect(className).toContain("group-hover:max-w-[12rem]");
    expect(className).toContain("group-hover:opacity-100");
    expect(className).toContain("group-focus-visible:mr-2");
    expect(className).toContain("group-focus-visible:max-w-[12rem]");
    expect(className).toContain("group-focus-visible:opacity-100");
    expect(className).not.toContain("group-hover:ml-2");
  });

  test("a left-edge launcher grows its label rightward on hover and focus", () => {
    const className = floatingLauncherExpandLabelClass(false);

    expect(className).toContain("group-hover:ml-2");
    expect(className).toContain("group-hover:max-w-[12rem]");
    expect(className).toContain("group-hover:opacity-100");
    expect(className).toContain("group-focus-visible:ml-2");
    expect(className).not.toContain("group-hover:mr-2");
  });
});
