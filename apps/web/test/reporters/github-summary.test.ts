import { describe, it, expect } from "vitest";
import { summaryMarkdown, type RunTally } from "./github-summary";

const clean: RunTally = { passed: 54, failed: 0, flaky: [], skipped: [] };

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
      passed: 50,
      failed: 0,
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
});
