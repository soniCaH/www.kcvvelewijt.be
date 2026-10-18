/**
 * Weekly staff-gaps nudge (#3561). Nobody opens Studio to check staff data,
 * so this posts the gaps to the same Slack webhook the nightly jobs alert
 * through: empty team-staff roles, staff without a photo, and unfilled
 * coordinator nodes. Dispatched from its own cron in `index.ts` — never
 * inside the `0 2 * * *` sync, which has a 15-minute ceiling.
 */
import { Effect } from "effect";
import { WorkerEnvTag } from "../env";
import { SanityProjection } from "../sanity/projection";
import { buildStaffGapsMessage, postSlack } from "../psd/slack-alert";

export const STAFF_GAPS_JOB = "staff-gaps-check";

/** Cloudflare numbers weekdays 1 = Sunday, so name the day. Must match wrangler.toml. */
export const STAFF_GAPS_CRON = "0 6 * * MON";

export class StaffGapsSlackError extends Error {
  readonly _tag = "StaffGapsSlackError" as const;
  constructor() {
    super("Slack did not confirm the staff-gaps message");
    this.name = "StaffGapsSlackError";
  }
}

export const runStaffGapsCheck = Effect.gen(function* () {
  const webhook = (yield* WorkerEnvTag).SLACK_ALERT_WEBHOOK_URL;
  // No webhook (staging, local) → nothing could be delivered, so skip the read too.
  if (!webhook) return;
  const gaps = yield* (yield* SanityProjection).getStaffGaps();
  const text = buildStaffGapsMessage(gaps);
  if (text === null) return;
  const delivered = yield* Effect.promise(() => postSlack(webhook, text));
  // The message IS this job's output: undelivered means the job did not run.
  if (!delivered) return yield* Effect.fail(new StaffGapsSlackError());
});
