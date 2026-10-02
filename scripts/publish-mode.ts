/**
 * Writes `real=true|false` to $GITHUB_OUTPUT for the publish workflow (see
 * lib/publishMode). Reads ENABLED, EVENT, REF and REQUESTED from the
 * environment.
 */
import { appendFileSync } from "node:fs";
import { decidePublishMode } from "./lib/publishMode";

const { real, reason } = decidePublishMode({
  enabled: process.env.ENABLED,
  event: process.env.EVENT,
  ref: process.env.REF,
  requested: process.env.REQUESTED,
});

console.log(real ? `Real publish: ${reason}.` : `Dry run, nothing will be uploaded: ${reason}.`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `real=${real}\n`);
}
