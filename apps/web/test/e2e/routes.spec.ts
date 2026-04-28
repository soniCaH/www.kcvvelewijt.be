import { test } from "@playwright/test";
import {
  ARTICLE_TYPES,
  discoverRouteFixtures,
  type RouteFixtures,
} from "./helpers/fixtures";
import { smokeTest } from "./helpers/smoke";

// Page-level smoke contract per PRD `docs/prd/page-level-testing-rework.md`
// §Decisions item 3 (route list) and item 4 (per-route assertions).
//
// Dynamic-route slugs are discovered from `/sitemap.xml` at suite startup so
// the suite stays robust to CMS content changes. If a route family has no
// entries in the sitemap, that test is skipped (visible in the runner output)
// rather than failing.

let fixtures: RouteFixtures;

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) {
    throw new Error("playwright config baseURL is required");
  }
  fixtures = await discoverRouteFixtures(baseURL);
});

test.describe("static routes", () => {
  test("/", async ({ page }) => {
    await smokeTest(page, { path: "/" });
  });

  test("/nieuws", async ({ page }) => {
    await smokeTest(page, { path: "/nieuws" });
  });

  test("/ploegen", async ({ page }) => {
    await smokeTest(page, { path: "/ploegen" });
  });

  test("/jeugd", async ({ page }) => {
    await smokeTest(page, { path: "/jeugd" });
  });

  test("/kalender", async ({ page }) => {
    await smokeTest(page, { path: "/kalender" });
  });

  test("/events", async ({ page }) => {
    await smokeTest(page, { path: "/events" });
  });

  test("/sponsors", async ({ page }) => {
    await smokeTest(page, { path: "/sponsors" });
  });

  test("/club/organigram", async ({ page }) => {
    await smokeTest(page, { path: "/club/organigram" });
  });

  test("/club/geschiedenis", async ({ page }) => {
    await smokeTest(page, { path: "/club/geschiedenis" });
  });

  test("/hulp", async ({ page }) => {
    await smokeTest(page, { path: "/hulp" });
  });

  test("/zoeken", async ({ page }) => {
    await smokeTest(page, { path: "/zoeken" });
  });

  test("/privacy", async ({ page }) => {
    await smokeTest(page, { path: "/privacy" });
  });
});

test.describe("dynamic routes", () => {
  for (const articleType of ARTICLE_TYPES) {
    test(`/nieuws/[slug] articleType=${articleType}`, async ({ page }) => {
      const slug = fixtures.articleSlugByType[articleType];
      test.skip(!slug, `no published article of type "${articleType}"`);
      await smokeTest(page, { path: `/nieuws/${slug}` });
    });
  }

  test("/spelers/[slug]", async ({ page }) => {
    const slug = fixtures.playerSlug;
    test.skip(!slug, "no player slugs in sitemap");
    await smokeTest(page, { path: `/spelers/${slug}` });
  });

  test("/ploegen/[slug]", async ({ page }) => {
    const slug = fixtures.teamSlug;
    test.skip(!slug, "no team slugs in sitemap");
    await smokeTest(page, { path: `/ploegen/${slug}` });
  });

  test("/wedstrijd/[matchId]", async ({ page }) => {
    const id = fixtures.matchId;
    test.skip(!id, "no match ids in sitemap");
    await smokeTest(page, { path: `/wedstrijd/${id}` });
  });

  test("/events/[slug]", async ({ page }) => {
    const slug = fixtures.eventSlug;
    test.skip(!slug, "no event slugs in sitemap");
    await smokeTest(page, { path: `/events/${slug}` });
  });
});

test("404 — unknown route", async ({ page }) => {
  // Use a path that doesn't match any SSG route pattern. Unknown slugs under
  // SSG routes (e.g. /nieuws/[slug]) are served by Next as 200 with cached
  // not-found content per `x-nextjs-prerender: 1`. Routing to a path with no
  // matching segment exercises the global `not-found.tsx` and returns 404.
  await smokeTest(page, {
    path: "/totally-unknown-path-no-matching-route",
    expectedStatus: 404,
  });
});
