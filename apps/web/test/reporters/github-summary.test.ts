import { describe, it, expect } from "vitest";
import { summaryMarkdown, type RunTally } from "./github-summary";

const clean: RunTally = {
  passed: 54,
  failed: [],
  flaky: [],
  skipped: [],
  status: "passed",
};

describe("summaryMarkdown", () => {
  it("says so plainly when every test passed on the first attempt", () => {
    const md = summaryMarkdown(clean);
    expect(md).toContain("| 54 | 0 | 0 | 0 |");
    expect(md).toContain("All 54 tests passed on the first attempt.");
    expect(md).not.toContain("without verifying anything");
  });

  it("counts flaky and skipped against the total, not as passes", () => {
    // The real shape of main's run 34843157049: green, 55 tests, but only 50
    // of them actually verified anything.
    const md = summaryMarkdown({
      ...clean,
      passed: 50,
      failed: [],
      flaky: [
        { title: "OrganigramSectionNav on /hulp", location: "a.spec.ts:140" },
      ],
      skipped: [
        { title: "one", location: "b.spec.ts:1" },
        { title: "two", location: "b.spec.ts:2" },
        { title: "three", location: "b.spec.ts:3" },
        { title: "four", location: "b.spec.ts:4" },
      ],
    });
    expect(md).toContain("| 50 | 0 | 1 | 4 |");
    expect(md).toContain(
      "**5 of 55 tests left this job green without verifying anything.**",
    );
  });

  it("names each flaky test and points at the artifact that explains it", () => {
    const md = summaryMarkdown({
      ...clean,
      flaky: [
        {
          title: "OrganigramSectionNav on /hulp",
          location: "section-nav.spec.ts:140",
        },
      ],
    });
    expect(md).toContain("#### Flaky");
    expect(md).toContain(
      "`section-nav.spec.ts:140` — OrganigramSectionNav on /hulp",
    );
    expect(md).toContain("playwright-test-results");
  });

  it("carries a skip's own reason, so the lost coverage is legible", () => {
    const md = summaryMarkdown({
      ...clean,
      skipped: [
        {
          title: "a type filter narrows the feed",
          location: "evenementen.spec.ts:58",
          reason: "no upcoming events on the dataset",
        },
      ],
    });
    expect(md).toContain("#### Skipped");
    expect(md).toContain("_(no upcoming events on the dataset)_");
  });

  it("omits a section that has no entries", () => {
    const md = summaryMarkdown({
      ...clean,
      flaky: [{ title: "x", location: "x.spec.ts:1" }],
    });
    expect(md).toContain("#### Flaky");
    expect(md).not.toContain("#### Skipped");
  });

  it("never claims a clean run when tests failed", () => {
    // The whole point of the reporter is that the summary tells the truth the
    // tick doesn't — so it must not flatter a RED run either.
    const md = summaryMarkdown({
      ...clean,
      passed: 3,
      failed: [
        { title: "one", location: "a.spec.ts:1" },
        { title: "two", location: "a.spec.ts:2" },
      ],
      status: "failed",
    });
    expect(md).toContain("**2 of 5 tests failed.**");
    expect(md).not.toContain("passed on the first attempt");
  });

  it("names each failed test", () => {
    const md = summaryMarkdown({
      ...clean,
      failed: [
        {
          title: "OrganigramSectionNav on /hulp",
          location: "section-nav.spec.ts:217",
        },
      ],
      status: "failed",
    });
    expect(md).toContain("#### Failed");
    expect(md).toContain(
      "`section-nav.spec.ts:217` — OrganigramSectionNav on /hulp",
    );
  });

  it("drops the 'left this job green' claim when the run is red", () => {
    const md = summaryMarkdown({
      ...clean,
      passed: 1,
      failed: [{ title: "y", location: "y.spec.ts:1" }],
      status: "failed",
      skipped: [{ title: "x", location: "x.spec.ts:1" }],
    });
    expect(md).toContain("**1 of 3 tests verified nothing**");
    expect(md).not.toContain("green");
  });

  it("says so when the suite never started", () => {
    // `next start` missing its boot window: zero tests, and the old wording
    // rendered "All 0 tests passed on the first attempt."
    const md = summaryMarkdown({
      ...clean,
      passed: 0,
      status: "timedout",
    });
    expect(md).toContain("**No tests ran** — the suite ended `timedout`.");
    expect(md).not.toContain("passed on the first attempt");
  });

  it("flags a run that failed nothing but ended badly anyway", () => {
    const md = summaryMarkdown({ ...clean, status: "interrupted" });
    expect(md).toContain(
      "**No test failed, but the suite ended `interrupted`.**",
    );
    expect(md).not.toContain("passed on the first attempt");
  });
});
