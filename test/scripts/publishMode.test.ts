import { describe, expect, it } from "bun:test";
import { decidePublishMode } from "../../scripts/lib/publishMode";

const MAIN = "refs/heads/main";

describe("decidePublishMode", () => {
  it("publishes a push to main once publishing is on", () => {
    expect(
      decidePublishMode({
        enabled: "true",
        event: "push",
        ref: MAIN,
        requested: "false",
      }).real
    ).toBe(true);
  });

  it("publishes a manual run on main only with the publish input ticked", () => {
    expect(
      decidePublishMode({
        enabled: "true",
        event: "workflow_dispatch",
        ref: MAIN,
        requested: "true",
      }).real
    ).toBe(true);
    expect(
      decidePublishMode({
        enabled: "true",
        event: "workflow_dispatch",
        ref: MAIN,
        requested: "false",
      }).real
    ).toBe(false);
  });

  it("never publishes a manual run from a feature branch, even with everything switched on", () => {
    const decision = decidePublishMode({
      enabled: "true",
      event: "workflow_dispatch",
      ref: "refs/heads/feature/unreviewed",
      requested: "true",
    });
    expect(decision.real).toBe(false);
    expect(decision.reason).toContain("refs/heads/feature/unreviewed");
  });

  it("never publishes from a tag or a pull request ref", () => {
    for (const ref of [
      "refs/tags/v1.0.0",
      "refs/pull/1/merge",
      "refs/heads/main-copy",
    ]) {
      expect(
        decidePublishMode({
          enabled: "true",
          event: "workflow_dispatch",
          ref,
          requested: "true",
        }).real
      ).toBe(false);
    }
  });

  it("never publishes while NPM_PUBLISH is off, whatever else is set", () => {
    for (const enabled of ["false", "", undefined, "TRUE", "1"]) {
      expect(
        decidePublishMode({
          enabled,
          event: "push",
          ref: MAIN,
          requested: "true",
        }).real
      ).toBe(false);
    }
  });

  it("does not treat other events or loose input values as a publish request", () => {
    expect(
      decidePublishMode({
        enabled: "true",
        event: "pull_request",
        ref: MAIN,
        requested: "true",
      }).real
    ).toBe(false);
    expect(
      decidePublishMode({
        enabled: "true",
        event: "workflow_dispatch",
        ref: MAIN,
        requested: "TRUE",
      }).real
    ).toBe(false);
  });
});
