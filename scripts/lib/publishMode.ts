/**
 * Whether a run of the publish workflow may publish for real. Everything
 * else is a dry run that uploads nothing.
 *
 * A real publish needs ALL of:
 * - the NPM_PUBLISH repository variable set to exactly "true";
 * - the run to be on the reviewed release branch, `refs/heads/main`;
 * - either a push to main, or a manual run with the "publish" input ticked.
 *
 * A manual run from any other branch or tag is always a dry run, whatever
 * its inputs, so unreviewed code can never be published.
 */
export interface PublishModeInput {
  /** `vars.NPM_PUBLISH == 'true'`, as the string "true" or "false". */
  enabled: string | undefined;
  /** `github.event_name`. */
  event: string | undefined;
  /** `github.ref`. */
  ref: string | undefined;
  /** The workflow_dispatch "publish" input, as "true" or "false". */
  requested: string | undefined;
}

export const RELEASE_REF = "refs/heads/main";

export const decidePublishMode = ({
  enabled,
  event,
  ref,
  requested,
}: PublishModeInput): { real: boolean; reason: string } => {
  if (enabled !== "true") {
    return { real: false, reason: "publishing is off (NPM_PUBLISH is not \"true\")" };
  }
  if (ref !== RELEASE_REF) {
    return { real: false, reason: `${ref ?? "unknown ref"} is not ${RELEASE_REF}` };
  }
  if (event === "push") {
    return { real: true, reason: "push to main" };
  }
  if (event === "workflow_dispatch" && requested === "true") {
    return { real: true, reason: "manual run on main with publish ticked" };
  }
  return { real: false, reason: `${event ?? "unknown event"} without a publish request` };
};
