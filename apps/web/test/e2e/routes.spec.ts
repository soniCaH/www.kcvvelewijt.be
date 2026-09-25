import { expect, test } from "@playwright/test";
import { ARTICLE_TYPES, discoverMatchId, FIXTURES } from "./helpers/fixtures";
import { smokeTest } from "./helpers/smoke";

// Page-level smoke contract per PRD `docs/prd/page-level-testing-rework.md`
// §Decisions item 3 (route list) and item 4 (per-route assertions).
//
// Dynamic routes test the pinned `staging` subjects in `helpers/fixtures.ts`
// (#3148). Only the match is read off `/sitemap.xml` — see `discoverMatchId`.

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

  test("/evenementen", async ({ page }) => {
    await smokeTest(page, { path: "/evenementen" });
  });

  test("/sponsors", async ({ page }) => {
    await smokeTest(page, { path: "/sponsors" });
  });

  test("/club/bestuur", async ({ page }) => {
    await smokeTest(page, { path: "/club/bestuur" });
  });

  test("/club/word-lid", async ({ page }) => {
    await smokeTest(page, { path: "/club/word-lid" });
  });

  test("/club/jeugdbestuur", async ({ page }) => {
    await smokeTest(page, { path: "/club/jeugdbestuur" });
  });

  test("/club/angels", async ({ page }) => {
    await smokeTest(page, { path: "/club/angels" });
  });

  test("/club/geschiedenis", async ({ page }) => {
    await smokeTest(page, { path: "/club/geschiedenis" });
  });

  test("/club/ultras", async ({ page }) => {
    await smokeTest(page, { path: "/club/ultras" });
  });

  test("/hulp", async ({ page }) => {
    await smokeTest(page, { path: "/hulp" });
  });

  // The finder must ship in the prerendered HTML. Rendered client-only, it
  // arrives ~1900px taller than its placeholder and shoves the rest of the
  // page down after hydration. Raw HTML, no browser JS: a unit test mocks
  // this seam away.
  test("/hulp prerenders the finder", async ({ request }) => {
    const html = await (await request.get("/hulp")).text();
    // Only the finder's own section: a bailout elsewhere on the page is not
    // this test's business.
    const section = html.slice(
      html.indexOf('id="hulp"'),
      html.indexOf('id="structuur"'),
    );
    expect(section).toContain('aria-label="Filter op categorie"');
    expect(section).toContain('aria-label="Filter op doelgroep"');
    expect(section).not.toContain("BAILOUT_TO_CLIENT_SIDE_RENDERING");
  });

  test("/zoeken", async ({ page }) => {
    await smokeTest(page, { path: "/zoeken" });
  });

  test("/privacy", async ({ page }) => {
    await smokeTest(page, { path: "/privacy" });
  });

  test("/inhoud", async ({ page }) => {
    await smokeTest(page, { path: "/inhoud" });
  });
});

test.describe("dynamic routes", () => {
  for (const articleType of ARTICLE_TYPES) {
    test(`/nieuws/[slug] articleType=${articleType}`, async ({ page }) => {
      await smokeTest(page, {
        path: `/nieuws/${FIXTURES.articleSlugByType[articleType]}`,
      });
    });
  }

  test("/spelers/[slug]", async ({ page }) => {
    await smokeTest(page, { path: `/spelers/${FIXTURES.playerSlug}` });
  });

  test("/ploegen/[slug]", async ({ page }) => {
    await smokeTest(page, { path: `/ploegen/${FIXTURES.teamSlug}` });
  });

  test("/wedstrijd/[matchId]", async ({ page, request }) => {
    const id = await discoverMatchId(request);
    test.skip(!id, "no match ids in sitemap");
    await smokeTest(page, { path: `/wedstrijd/${id}` });
  });

  test("/evenementen/[slug]", async ({ page }) => {
    // The legacy `/events/[slug]` → `/evenementen/[slug]` redirect is
    // covered by next.config.test.ts.
    await smokeTest(page, { path: `/evenementen/${FIXTURES.eventSlug}` });
  });

  test("/galerij/[slug]", async ({ page }) => {
    await smokeTest(page, { path: `/galerij/${FIXTURES.gallerySlug}` });
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
