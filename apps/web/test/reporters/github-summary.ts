/**
 * Writes the e2e run's own condition to the GitHub job summary (#2971).
 *
 * The job exits 0 for three different outcomes: a test that passed, a test
 * that failed and passed on its `retries: 1` retry (`flaky`), and a test whose
 * runtime data guard skipped it (`test.skip(count < 2, …)`). Only the first
 * actually verified anything, and until this reporter existed the other two
 * were visible nowhere but the raw log — three consecutive green runs were
 * hiding 1, 4 and 5 such tests respectively.
 *
 * A Playwright reporter rather than a `json` report parsed by a later workflow
 * step: `test.outcome()` already classifies each test across its retries, so
 * there is nothing to re-derive and no intermediate file to keep in sync.
 *
 * ponytail: reports, never fails the run — a retry is still the right tool for
 * genuine environment noise (#2971 explicitly keeps `retries: 1`). Make it
 * visible first; decide what to do about it from real numbers.
 */

import { appendFileSync } from "node:fs";
import { relative } from "node:path";
import type { FullResult, Reporter, TestCase } from "@playwright/test/reporter";

/** One test worth naming in the summary, already reduced to strings. */
export interface TallyEntry {
  /** Human title, e.g. `scroll-spy fills the chip … › OrganigramSectionNav on /hulp`. */
  title: string;
  /** `section-nav.spec.ts:140` — where to look. */
  location: string;
  /** Playwright's own reason for a skip, when the guard supplied one. */
  reason?: string;
}

export interface RunTally {
  passed: number;
  failed: number;
  flaky: TallyEntry[];
  skipped: TallyEntry[];
}

function list(entries: TallyEntry[]): string {
  return entries
    .map(
      (entry) =>
        `- \`${entry.location}\` — ${entry.title}${entry.reason ? ` _(${entry.reason})_` : ""}`,
    )
    .join("\n");
}

/**
 * The summary's markdown. Pure, so the wording and the "did everything
 * actually run" arithmetic are testable without a browser.
 */
export function summaryMarkdown(tally: RunTally): string {
  const { passed, failed, flaky, skipped } = tally;
  const unverified = flaky.length + skipped.length;
  const total = passed + failed + unverified;

  const head = [
    "### E2E run",
    "",
    "| passed | failed | flaky | skipped |",
    "| -----: | -----: | ----: | ------: |",
    `| ${passed} | ${failed} | ${flaky.length} | ${skipped.length} |`,
    "",
  ];

  if (unverified === 0) {
    return [
      ...head,
      `All ${total} tests passed on the first attempt.`,
      "",
    ].join("\n");
  }

  const body = [
    `**${unverified} of ${total} tests left this job green without verifying anything.** A flaky test failed at least once before passing; a skipped test asserted nothing. Neither turns the job red, so read the passed column — not the job's tick — as this run's real coverage.`,
    "",
  ];

  if (flaky.length > 0) {
    body.push(
      "#### Flaky",
      list(flaky),
      "",
      "The failed attempt's trace, video and screenshot are in the `playwright-test-results` artifact on this run.",
      "",
    );
  }
  if (skipped.length > 0) {
    body.push("#### Skipped", list(skipped), "");
  }

  return [...head, ...body].join("\n");
}

/** `section-nav.spec.ts:140` from a Playwright `TestCase`. */
function locationOf(test: TestCase): string {
  const file = relative(process.cwd(), test.location.file);
  return `${file.split("/").pop() ?? file}:${test.location.line}`;
}

/** `titlePath()` is `["", <project>, <file>, …describes, <title>]`. */
function titleOf(test: TestCase): string {
  return test.titlePath().slice(3).filter(Boolean).join(" › ");
}

export default class GithubSummaryReporter implements Reporter {
  /** Keyed by id: a retried test reaches `onTestEnd` once per attempt. */
  private readonly tests = new Map<string, TestCase>();

  onTestEnd(test: TestCase): void {
    this.tests.set(test.id, test);
  }

  onEnd(_result: FullResult): void {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;

    const tally: RunTally = { passed: 0, failed: 0, flaky: [], skipped: [] };
    for (const test of this.tests.values()) {
      const entry: TallyEntry = {
        title: titleOf(test),
        location: locationOf(test),
      };
      switch (test.outcome()) {
        case "flaky":
          tally.flaky.push(entry);
          break;
        case "skipped":
          tally.skipped.push({
            ...entry,
            reason: test.annotations.find((a) => a.type === "skip")
              ?.description,
          });
          break;
        case "unexpected":
          tally.failed += 1;
          break;
        default:
          tally.passed += 1;
      }
    }

    appendFileSync(summaryFile, `${summaryMarkdown(tally)}\n`);
  }
}
