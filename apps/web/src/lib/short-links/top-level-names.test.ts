import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RESERVED_SHORT_LINK_NAMES } from "@kcvv/sanity-schemas";
import nextConfig from "../../../next.config";
import {
  collectTopLevelNames,
  firstSegmentOf,
  type TopLevelName,
} from "./top-level-names";

const APP_DIR = path.resolve(__dirname, "../../app");
const PUBLIC_DIR = path.resolve(__dirname, "../../../public");

const describeMissing = (found: TopLevelName[]) =>
  found
    .filter(({ name }) => !RESERVED_SHORT_LINK_NAMES.includes(name))
    .map(({ name, origin }) => `${name} (${origin})`);

describe("RESERVED_SHORT_LINK_NAMES covers the real top level (#3573)", () => {
  it("holds every top-level name the site serves today", async () => {
    const found = collectTopLevelNames({
      appDir: APP_DIR,
      publicDir: PUBLIC_DIR,
      redirects: await nextConfig.redirects!(),
      rewrites: (await nextConfig.rewrites?.()) ?? [],
    });

    // Not vacuous: a derivation that finds nothing would pass anything.
    expect(found.map((f) => f.name)).toEqual(
      expect.arrayContaining(["nieuws", "club", "api", "ongeval", "darts"]),
    );
    // On failure the diff names each missing entry and the place it came from.
    expect(describeMissing(found)).toEqual([]);
  });

  it("no longer sees the stopgap /stage and /tornooi redirects (they are short links now)", async () => {
    const sources = (await nextConfig.redirects!()).map((r) => r.source);
    expect(sources).not.toContain("/stage");
    expect(sources).not.toContain("/tornooi");
    expect(RESERVED_SHORT_LINK_NAMES).not.toContain("stage");
    expect(RESERVED_SHORT_LINK_NAMES).not.toContain("tornooi");
  });
});

describe("collectTopLevelNames", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  function fixture(tree: { app: string[]; public: string[] }) {
    const root = mkdtempSync(path.join(tmpdir(), "top-level-names-"));
    dirs.push(root);
    for (const [base, entries] of [
      ["app", tree.app],
      ["public", tree.public],
    ] as const) {
      mkdirSync(path.join(root, base), { recursive: true });
      for (const entry of entries) {
        const target = path.join(root, base, entry);
        if (entry.endsWith("/")) mkdirSync(target, { recursive: true });
        else {
          mkdirSync(path.dirname(target), { recursive: true });
          writeFileSync(target, "");
        }
      }
    }
    return {
      appDir: path.join(root, "app"),
      publicDir: path.join(root, "public"),
    };
  }

  const names = (found: TopLevelName[]) => found.map((f) => f.name).sort();

  it("looks through route groups, nested ones too", () => {
    const dirs = fixture({
      app: [
        "(main)/club/page.tsx",
        "(landing)/(home)/page.tsx",
        "(landing)/jeugd/",
      ],
      public: [],
    });
    expect(
      names(collectTopLevelNames({ ...dirs, redirects: [], rewrites: [] })),
    ).toEqual(["club", "jeugd"]);
  });

  it("skips private _folders, dynamic [segments] (the catch-all itself) and @slots", () => {
    const dirs = fixture({
      app: [
        "_components/",
        "[shortLink]/page.tsx",
        "@modal/",
        "[...rest]/",
        "spelers/",
      ],
      public: [],
    });
    expect(
      names(collectTopLevelNames({ ...dirs, redirects: [], rewrites: [] })),
    ).toEqual(["spelers"]);
  });

  it("takes the first segment of every redirect and rewrite source, skipping parameters", () => {
    const dirs = fixture({ app: [], public: [] });
    const found = collectTopLevelNames({
      ...dirs,
      redirects: [
        { source: "/team/:slug" },
        { source: "/ongeval" },
        { source: "/:path*" },
      ],
      rewrites: [{ source: "/proxy/:path*" }],
    });
    expect(names(found)).toEqual(["ongeval", "proxy", "team"]);
  });

  it("takes public/ directories and extension-less files, not dotted files (a name cannot hold a dot)", () => {
    const dirs = fixture({
      app: [],
      public: [
        "images/a.png",
        "downloads/",
        "robots.txt",
        "llms.txt",
        "humans",
      ],
    });
    expect(
      names(collectTopLevelNames({ ...dirs, redirects: [], rewrites: [] })),
    ).toEqual(["downloads", "humans", "images"]);
  });

  it("takes the dotless metadata routes in the app root", () => {
    const dirs = fixture({
      app: [
        "opengraph-image.tsx",
        "icon.tsx",
        "robots.ts",
        "sitemap.ts",
        "layout.tsx",
      ],
      public: [],
    });
    expect(
      names(collectTopLevelNames({ ...dirs, redirects: [], rewrites: [] })),
    ).toEqual(["icon", "opengraph-image"]);
  });

  it("names the folder when a dummy top-level route is added", () => {
    const dirs = fixture({
      app: ["(main)/club/page.tsx", "(main)/zzz-dummy/page.tsx"],
      public: [],
    });
    const found = collectTopLevelNames({
      ...dirs,
      redirects: [],
      rewrites: [],
    });
    expect(describeMissing(found)).toEqual([
      "zzz-dummy (app/(main)/zzz-dummy)",
    ]);
  });
});

describe("firstSegmentOf", () => {
  it.each([
    ["/news/:slug", "news"],
    ["/ongeval", "ongeval"],
    ["/club/:path*", "club"],
    ["/:path*", null],
    ["/(a|b)/x", null],
    ["/", null],
    ["/Stage", "Stage"],
  ])("%s → %s", (source, expected) => {
    expect(firstSegmentOf(source)).toBe(expected);
  });
});
