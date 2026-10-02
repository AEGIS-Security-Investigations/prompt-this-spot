/**
 * Says whether `<name>@<version>` from package.json is already on npm, and
 * fails closed on anything it cannot be sure of (see lib/npmVersionStatus).
 *
 * Prints `published` or `unpublished` and exits 0; exits 1 otherwise.
 *
 *   bun scripts/npm-version-status.ts [--registry <url>]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lookupVersionStatus } from "./lib/npmVersionStatus";

const manifest = JSON.parse(
  readFileSync(join(import.meta.dir, "..", "package.json"), "utf8")
) as { name: string; version: string };

const registryFlag = process.argv.indexOf("--registry");
const registry =
  registryFlag === -1 ? undefined : process.argv[registryFlag + 1];

const result = await lookupVersionStatus({
  name: manifest.name,
  version: manifest.version,
  registry,
});

if (result.ok) {
  console.log(result.status);
} else {
  console.error(
    `Could not tell whether ${manifest.name}@${manifest.version} is on npm; refusing to guess: ${result.error}`
  );
  process.exit(1);
}
