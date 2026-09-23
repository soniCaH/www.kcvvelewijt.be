/**
 * A dynamic segment exporting `revalidate` but no `generateStaticParams` is
 * server-rendered per request (`ƒ` in `next build`), so the ISR window is inert
 * config. Returning `[]` costs no build-time fetches and flips it to `●`.
 *
 * And the list stays empty (#3135, flake class H): an enumerated slug is
 * rendered at build, so its page's own content read runs on the live
 * network, and one Sanity 503 there killed the build (`/staf/259`,
 * `/evenementen/ploegvoorstelling-kampioenenviering`). With `[]` the build
 * reads nothing for the route; each slug renders on its first request and ISR
 * caches it. A failed first request is a 500 that is never cached. Skipping
 * only the failed slug is not an option: the one hook Next offers
 * (`connection()` at build) flips the whole route to `no-store`.
 *
 * A page with no slug has no list to empty: it is always prerendered, so its
 * subject read goes through `orDieOrRenderOnDemand`, never a bare
 * `Effect.orDie` — at build a failed read leaves that one page out instead of
 * killing the build. That `no-store` cost lands on one page until the next
 * deploy, not on a whole route.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2391
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/3135
 */

import { describe, it, expect } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const appDir = resolve(__dirname, "..");

// Every dynamic-segment page under app/, route group or not. Both extensions:
// a page needs `.tsx` only if it contains JSX, so a `page.ts` is a legal route
// and would otherwise slip past the one guard that exists to catch this. An
// empty list fails the run on its own — vitest rejects an `it.each` with no
// cases.
const dynamicSegmentPages = globSync(["**/page.tsx", "**/page.ts"], {
  cwd: appDir,
}).filter((relPath) => relPath.includes("["));

// Every file that renders a prerendered page with no slug: outside any
// dynamic segment, and not a runtime-only file (route handlers and
// `force-dynamic` pages never render at build). Server actions stay in: a
// page may call one to render its first window (`/galerij`).
const prerenderedStaticFiles = globSync(["**/*.tsx", "**/*.ts"], {
  cwd: appDir,
}).filter(
  (relPath) =>
    !relPath.includes("[") &&
    !/(\.test|\.stories)\.tsx?$|(^|\/)route\.ts$/.test(relPath) &&
    !relPath.startsWith("api/") &&
    !relPath.startsWith("__tests__/") &&
    !/^export const dynamic = "force-dynamic"/m.test(
      readFileSync(resolve(appDir, relPath), "utf8"),
    ),
);

describe("ISR route config", () => {
  it.each(dynamicSegmentPages)(
    "%s — declaring `revalidate` requires `generateStaticParams`",
    (relPath) => {
      const source = readFileSync(resolve(appDir, relPath), "utf8");
      if (!/^export const revalidate\b/m.test(source)) return;

      expect(source).toMatch(
        /^export (async )?function generateStaticParams\b/m,
      );
    },
  );

  it.each(dynamicSegmentPages)(
    "%s — `generateStaticParams` enumerates nothing at build",
    (relPath) => {
      const source = readFileSync(resolve(appDir, relPath), "utf8");
      if (!/^export (async )?function generateStaticParams\b/m.test(source))
        return;

      expect(source).toMatch(
        /^export (async )?function generateStaticParams\(\)(: [^{]+)? \{\n  return \[\];\n\}/m,
      );
    },
  );

  it.each(prerenderedStaticFiles)(
    "%s — a prerendered read without a slug never bare-`orDie`s",
    (relPath) => {
      const source = readFileSync(resolve(appDir, relPath), "utf8");
      expect(source).not.toMatch(/\.pipe\(\s*Effect\.orDie\b/);
    },
  );
});
