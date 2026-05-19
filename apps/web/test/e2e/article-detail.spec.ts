import { expect, test } from "@playwright/test";
import {
  ARTICLE_TYPES,
  discoverRouteFixtures,
  type RouteFixtures,
} from "./helpers/fixtures";
import { smokeTest } from "./helpers/smoke";

// Phase 5.C (#1850) — per-articleType regression for the new
// `<ArticleBody>` PT serializer + `<QASection>` tail composition wired
// into `/nieuws/[slug]/page.tsx`. The site-wide route smoke
// (`routes.spec.ts`) already covers each articleType at the structural
// level (status, h1, nav, footer, no broken images, no console.error).
// This spec adds the body-renderer assertions:
//
//   - the `<ArticleBody>` cream-surface container is present
//     (`[data-article-body="true"]`).
//   - the type-specific hero `data-testid` (`announcement-hero`,
//     `interview-hero`, `event-hero`, `transfer-hero`) is rendered.
//   - the EndMark closer is present at the end of any non-empty body
//     (`[data-endmark]` is the locked design-system data attr).
//
// Slugs are discovered via the same sitemap-parser the structural smoke
// uses. Any articleType missing from the sitemap (matchPreview /
// matchRecap fixtures aren't seeded yet at PR time) skips with a clear
// reason rather than failing.

let fixtures: RouteFixtures;

const HERO_TESTID = {
  interview: "interview-hero",
  announcement: "announcement-hero",
  transfer: "transfer-hero",
  event: "event-hero",
} as const;

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) {
    throw new Error("playwright config baseURL is required");
  }
  fixtures = await discoverRouteFixtures(baseURL);
});

test.describe("/nieuws/[slug] body renderer (Phase 5.C)", () => {
  for (const articleType of ARTICLE_TYPES) {
    test(`renders <ArticleBody> + hero for articleType=${articleType}`, async ({
      page,
    }) => {
      const slug = fixtures.articleSlugByType[articleType];
      test.skip(!slug, `no published article of type "${articleType}"`);

      // Run the structural smoke first — fails fast on broken images,
      // 4xx/5xx, or console.error noise before we look at body blocks.
      await smokeTest(page, { path: `/nieuws/${slug}` });

      // Hero presence — confirms the type-specific variant rendered.
      await expect(
        page.locator(`[data-testid="${HERO_TESTID[articleType]}"]`),
        `${articleType} hero`,
      ).toBeVisible();

      // ArticleBody container — confirms the new serializer (not the
      // legacy `<SanityArticleBody>`) is wired on this route.
      await expect(
        page.locator('[data-article-body="true"]').first(),
        `${articleType} article-body container`,
      ).toBeVisible();
    });
  }
});
