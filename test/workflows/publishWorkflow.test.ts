import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface Step {
  name?: string;
  id?: string;
  if?: string;
  run?: string;
  env?: Record<string, string>;
}

const workflow = Bun.YAML.parse(
  readFileSync(
    join(import.meta.dir, "../../.github/workflows/publish.yml"),
    "utf8"
  )
) as {
  on: Record<string, unknown>;
  jobs: { publish: { steps: Step[]; outputs: Record<string, string> } };
};

const steps = workflow.jobs.publish.steps;
const realPublishSteps = steps.filter(
  (step) =>
    step.run &&
    /npm publish(?![^\n]*--dry-run)|gh release create/.test(step.run)
);

/** The guard every step that publishes or releases must carry. */
const GUARDS = [
  "steps.mode.outputs.real == 'true'",
  "steps.version.outputs.status == 'unpublished'",
  "github.ref == 'refs/heads/main'",
];

describe("publish.yml release guards", () => {
  it("has exactly the publish and release steps, each fully guarded", () => {
    expect(realPublishSteps.map((step) => step.name)).toEqual([
      "Publish",
      "Tag and release",
    ]);
    for (const step of realPublishSteps) {
      for (const guard of GUARDS) {
        expect(step.if ?? "").toContain(guard);
      }
    }
  });

  it("decides real vs dry run with the tested script, including the branch", () => {
    const mode = steps.find((step) => step.id === "mode");
    expect(mode?.run).toBe("bun scripts/publish-mode.ts");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a GitHub Actions expression, compared as text
    expect(mode?.env?.REF).toBe("${{ github.ref }}");
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a GitHub Actions expression, compared as text
    expect(mode?.env?.ENABLED).toBe("${{ vars.NPM_PUBLISH == 'true' }}");
  });

  it("checks the registry with the fail-closed script and stops when it fails", () => {
    const version = steps.find((step) => step.id === "version");
    expect(version?.run).toContain("bun scripts/npm-version-status.ts");
    expect(version?.run).toContain("|| exit 1");
    expect(version?.run).not.toContain("npm view");
  });

  it("audits the tarball and dry-runs the publish before any real publish", () => {
    const names = steps.map((step) => step.name ?? step.run ?? "");
    const publishAt = names.indexOf("Publish");
    expect(names.indexOf("Audit the packed tarball")).toBeLessThan(publishAt);
    expect(names.indexOf("npm publish --dry-run")).toBeLessThan(publishAt);
  });

  it("only notifies consumers after a guarded real publish", () => {
    expect(workflow.jobs.publish.outputs.published).toContain(
      "github.ref == 'refs/heads/main'"
    );
  });

  it("only publishes on pushes to main or manual runs", () => {
    expect(Object.keys(workflow.on).sort()).toEqual([
      "push",
      "workflow_dispatch",
    ]);
    expect((workflow.on.push as { branches: string[] }).branches).toEqual([
      "main",
    ]);
  });
});
