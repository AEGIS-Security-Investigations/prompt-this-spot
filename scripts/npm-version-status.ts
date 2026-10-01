/**
 * Says whether `<name>@<version>` from package.json is already on npm, and
 * fails closed on anything it cannot be sure of.
 *
 * Prints `published` or `unpublished` and exits 0. A network failure, an auth
 * error, a rate limit or an unreadable answer exits 1 instead, so the publish
 * workflow stops rather than treating "couldn't check" as "not published".
 *
 *   bun scripts/npm-version-status.ts [--registry <url>]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const manifest = JSON.parse(
  readFileSync(join(import.meta.dir, "..", "package.json"), "utf8")
) as { name: string; version: string };
const spec = `${manifest.name}@${manifest.version}`;

const result = Bun.spawnSync(
  ["npm", "view", spec, "version", "--json", ...process.argv.slice(2)],
  { stdout: "pipe", stderr: "pipe" }
);
const stdout = result.stdout.toString().trim();
const stderr = result.stderr.toString();

const parse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

if (result.exitCode === 0) {
  // An existing package without this version answers with nothing at all.
  if (stdout === "") {
    console.log("unpublished");
    process.exit(0);
  }
  const value = parse(stdout);
  const versions = Array.isArray(value) ? value : [value];
  if (versions.includes(manifest.version)) {
    console.log("published");
    process.exit(0);
  }
  console.error(`Unexpected answer for ${spec}: ${stdout}`);
  process.exit(1);
}

// Only the registry's own "no such package" counts as unpublished.
const error = (parse(stdout) as { error?: { code?: string } } | undefined)
  ?.error;
if (error?.code === "E404" || /\bE404\b/.test(stderr)) {
  console.log("unpublished");
  process.exit(0);
}
console.error(
  `Could not tell whether ${spec} is on npm (${error?.code ?? `exit ${result.exitCode}`}); refusing to guess.\n${stderr}`
);
process.exit(1);
