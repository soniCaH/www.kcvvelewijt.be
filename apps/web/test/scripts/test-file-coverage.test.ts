// @vitest-environment node
/**
 * The test-file self-count (#3277). `vitest run` exits 0 on a config whose
 * `include` still matches one file, so a test file dropped into a location
 * (or extension) no runner picks up passes every gate while running nowhere.
 * These are the seams: what the runners print, and which tracked files the
 * layers leave out or do not own.
 */
import { describe, expect, it } from "vitest";

import {
  auditFiles,
  listedByPlaywright,
  listedByVitest,
  splitNul,
} from "../../scripts/test-file-coverage.mjs";

describe("splitNul", () => {
  it("keeps non-ASCII paths whole, as `git ls-files -z` prints them", () => {
    expect(splitNul("src/Café.test.tsx\0src/b.test.ts\0")).toEqual([
      "src/Café.test.tsx",
      "src/b.test.ts",
    ]);
  });
});

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

describe("auditFiles", () => {
  const layer = (name: string, dir: string, listed: string[]) => ({
    name,
    owns: (f: string) => f.startsWith(`${dir}/`) && /\.test\.tsx?$/.test(f),
    listed,
  });

  it("is clean when every test-like file is owned and listed", () => {
    const { unowned, layers } = auditFiles(
      ["pkg/a.test.ts", "pkg/b.test.tsx", "pkg/helper.ts"],
      [layer("pkg", "pkg", ["pkg/a.test.ts", "pkg/b.test.tsx"])],
    );
    expect(unowned).toEqual([]);
    expect(layers).toEqual([{ name: "pkg", owned: 2, listed: 2, missing: [] }]);
  });

  it("names an owned file its runner does not list", () => {
    const { layers } = auditFiles(
      ["pkg/a.test.ts", "pkg/b.test.tsx"],
      [layer("pkg", "pkg", ["pkg/a.test.ts"])],
    );
    expect(layers[0]?.missing).toEqual(["pkg/b.test.tsx"]);
  });

  it("names a test file that no layer owns, in a workspace nobody listed", () => {
    const { unowned } = auditFiles(
      ["pkg/a.test.ts", "packages/sanity-schemas/src/validation/foo.test.ts"],
      [layer("pkg", "pkg", ["pkg/a.test.ts"])],
    );
    expect(unowned).toEqual([
      "packages/sanity-schemas/src/validation/foo.test.ts",
    ]);
  });

  it("names a test under a layer's directory that its pattern does not own", () => {
    // e.g. `test/e2e/login.test.ts` beside Playwright's `*.spec.ts`
    const { unowned } = auditFiles(
      ["e2e/a.test.ts", "e2e/login.spec.mts"],
      [
        {
          name: "e2e",
          owns: (f: string) => /^e2e\/.*\.spec\.ts$/.test(f),
          listed: [],
        },
      ],
    );
    expect(unowned).toEqual(["e2e/a.test.ts", "e2e/login.spec.mts"]);
  });

  it("owns stories as well as tests, and reports a layer with nothing to own", () => {
    const { unowned, layers } = auditFiles(
      ["x/A.stories.tsx", "y/a.test.ts"],
      [
        {
          name: "stories",
          owns: (f: string) => /\.stories\./.test(f),
          listed: ["x/A.stories.tsx"],
        },
        { name: "empty", owns: () => false, listed: [] },
      ],
    );
    expect(unowned).toEqual(["y/a.test.ts"]);
    expect(layers.map((l: { owned: number }) => l.owned)).toEqual([1, 0]);
  });
});
