// @vitest-environment node
/**
 * The test-file self-count (#3277). `vitest run` exits 0 on a config whose
 * `include` still matches one file, so a test file dropped into a location
 * (or extension) no runner picks up passes every gate while running nowhere.
 * These are the seams: what the runners print, and which tracked files they
 * leave out.
 */
import { describe, expect, it } from "vitest";

import {
  listedByPlaywright,
  listedByVitest,
  unlistedFiles,
} from "../../scripts/test-file-coverage.mjs";

describe("listedByVitest", () => {
  it("strips the project prefix and keeps the path", () => {
    const out = [
      "[node] src/a.test.ts",
      "[workers] src/b.workerd.test.ts",
      "[storybook (chromium)] src/c.stories.tsx",
      "src/d.test.ts",
      "",
    ].join("\n");
    expect(listedByVitest(out)).toEqual([
      "src/a.test.ts",
      "src/b.workerd.test.ts",
      "src/c.stories.tsx",
      "src/d.test.ts",
    ]);
  });
});

describe("listedByPlaywright", () => {
  it("joins each spec file, found at any depth, onto the test dir", () => {
    const report = {
      suites: [
        { file: "a.spec.ts", suites: [{ file: "a.spec.ts", suites: [] }] },
        { file: "sub/b.spec.ts", suites: [] },
      ],
    };
    expect(listedByPlaywright(JSON.stringify(report), "test/e2e")).toEqual([
      "test/e2e/a.spec.ts",
      "test/e2e/sub/b.spec.ts",
    ]);
  });
});

describe("unlistedFiles", () => {
  const tracked = [
    "src/a.test.ts",
    "src/b.test.tsx",
    "src/c.spec.ts",
    "test/e2e/d.spec.ts",
    "src/helper.ts",
  ];

  it("is empty when every test-like file is listed", () => {
    expect(
      unlistedFiles(tracked, [
        "src/a.test.ts",
        "src/b.test.tsx",
        "src/c.spec.ts",
        "test/e2e/d.spec.ts",
      ]),
    ).toEqual([]);
  });

  it("names a test file no runner lists, and ignores non-test files", () => {
    expect(unlistedFiles(tracked, ["src/a.test.ts", "src/c.spec.ts"])).toEqual([
      "src/b.test.tsx",
      "test/e2e/d.spec.ts",
    ]);
  });

  it("drops files another runner owns via the skip prefix", () => {
    expect(
      unlistedFiles(
        tracked,
        ["src/a.test.ts", "src/b.test.tsx", "src/c.spec.ts"],
        { skip: "test/e2e/" },
      ),
    ).toEqual([]);
  });

  it("takes the file pattern from the layer (stories, not tests)", () => {
    expect(
      unlistedFiles(
        ["x/A.stories.tsx", "x/B.stories.tsx", "x/a.test.ts"],
        ["x/A.stories.tsx"],
        { pattern: /\.stories\.[cm]?[jt]sx?$/ },
      ),
    ).toEqual(["x/B.stories.tsx"]);
  });
});
