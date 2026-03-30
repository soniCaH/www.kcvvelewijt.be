# PRD: SEO / GEO / AI-Ready Go-Live

## 1. Problem Statement

KCVV Elewijt's website is functionally complete and nearly live, but it lacks the signals that search engines and AI-powered answer engines need to surface it accurately. Without `metadataBase`, Open Graph images resolve to relative paths and break on social shares. Without a sitemap, crawlers won't discover content reliably. Without JSON-LD structured data, Google can't extract the club as an entity, and AI-powered engines (Perplexity, ChatGPT search, Google AI Overviews) can't ground their answers in verified facts about the club, its news, or its players. These are not post-launch optimisations — they are table-stakes for go-live.

## 2. Scope

**Packages:** `apps/web` only (all changes live in `src/app/`).

**In scope:**

- `metadataBase` in root layout (unblocks correct absolute URL resolution for all OG images and social tags)
- `robots.ts` — allow full crawl on production, noindex on staging/preview
- `sitemap.ts` — XML sitemap covering all indexable routes, fed by Sanity + BFF
- Twitter Card metadata (`twitter.card`, `twitter.site`, `twitter.creator`) in root layout and per-page
- Canonical URL (`alternates.canonical`) on all dynamic page routes
- JSON-LD structured data:
  - `SportsClub` / `Organization` — homepage (entity anchor for AI engines)
  - `NewsArticle` — article detail pages
  - `BreadcrumbList` — all pages
  - `Person` — player and staff pages
  - `SportsTeam` — team pages
  - `SportsEvent` — match detail pages
- `llms.txt` — AI-readable site summary at `https://www.kcvvelewijt.be/llms.txt`
- Open graph image coverage audit — ensure every public page has at least a default OG image

**Out of scope:**

- Schema changes in `packages/sanity-schemas` — no new fields needed
- BFF (`apps/api`) changes — all data already available via existing endpoints
- Content changes in Sanity (e.g. author bio enrichment)
- Internationalization / `hreflang` (site is Dutch-only)
- Rich result testing / Google Search Console setup (manual post-launch step)
- Paid search / ad campaign tags
- Performance optimisations (Core Web Vitals) — separate concern
- Storybook stories for SEO utilities (no visual surface)

## 3. Tracer Bullet

Add `metadataBase` to the root layout, create `robots.ts` and a minimal `sitemap.ts` (static routes only, no dynamic fetch), and add `twitter.card: "summary_large_image"` + `twitter.site: "@kcvve"` to the root metadata export.

Deploy to Vercel preview. Verify with:

1. `curl -I https://<preview>.vercel.app/robots.txt` → 200
2. `curl https://<preview>.vercel.app/sitemap.xml` → valid XML with `/` in it
3. Open Graph debugger (LinkedIn Post Inspector or similar) on a share URL → OG image renders as absolute URL

This proves the infrastructure layer works before adding any JSON-LD.

## 4. Phases

```
Phase 1: Foundation — metadataBase + robots.ts + sitemap.ts + Twitter cards    (tracer bullet)  — #1125
Phase 2: Canonical URLs — alternates.canonical on all dynamic pages                             — #1126 (blocked by #1125)
Phase 3: JSON-LD Organization + NewsArticle — homepage and article pages                        — #1127 (blocked by #1125)
Phase 4: JSON-LD BreadcrumbList — all pages via shared utility                                  — #1129 (blocked by #1127)
Phase 5: JSON-LD Person + SportsTeam + SportsEvent — remaining entity pages                     — #1130 (blocked by #1129)
Phase 6: llms.txt + GEO polish — AI crawler readiness                                           — #1131 (blocked by #1130)
```

## 5. Acceptance Criteria per Phase

### Phase 1 — Foundation

- [ ] `metadataBase: new URL(SITE_CONFIG.siteUrl)` set in root `layout.tsx`
- [ ] `apps/web/src/app/robots.ts` returns `{ rules: { userAgent: "*", allow: "/" }, sitemap: "https://www.kcvvelewijt.be/sitemap.xml" }` in production; adds `disallow: "/"` when `VERCEL_ENV !== "production"`
- [ ] `apps/web/src/app/sitemap.ts` returns all static routes with lastModified + changeFrequency + priority (see static route list below)
- [ ] Root metadata export includes `twitter: { card: "summary_large_image", site: "@kcvve", creator: "@kcvve" }`
- [ ] OG image URL on `/nieuws/[slug]` resolves to absolute `https://www.kcvvelewijt.be/...` (verified via `<meta property="og:image">` in page source)
- [ ] `pnpm --filter @kcvv/web check-all` passes

**Static routes for sitemap (priority / changeFreq):**

| Route                | Priority | changeFreq |
| -------------------- | -------- | ---------- |
| `/`                  | 1.0      | weekly     |
| `/nieuws`            | 0.9      | daily      |
| `/ploegen`           | 0.8      | weekly     |
| `/jeugd`             | 0.8      | weekly     |
| `/sponsors`          | 0.7      | monthly    |
| `/kalender`          | 0.8      | daily      |
| `/zoeken`            | 0.5      | monthly    |
| `/club`              | 0.7      | monthly    |
| `/club/geschiedenis` | 0.6      | yearly     |
| `/club/organigram`   | 0.6      | monthly    |
| `/club/ultras`       | 0.6      | monthly    |
| `/club/contact`      | 0.7      | monthly    |
| `/privacy`           | 0.3      | yearly     |

### Phase 2 — Canonical URLs

- [ ] All dynamic routes include `alternates: { canonical: \`${SITE_CONFIG.siteUrl}/path\` }`in`generateMetadata`
- [ ] Affected routes: `/nieuws/[slug]`, `/spelers/[slug]`, `/staf/[slug]`, `/ploegen/[slug]`, `/wedstrijd/[matchId]`
- [ ] `/tegenstander/[clubId]` and `/share` retain `robots: { index: false }` and do NOT get canonical tags
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3 — JSON-LD: Organization + NewsArticle

- [ ] `src/lib/seo/jsonld.ts` — shared factory functions returning typed JSON-LD objects (no `any`, no `dangerouslySetInnerHTML` in components other than a single `<JsonLd>` primitive)
- [ ] `<JsonLd>` component: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`
- [ ] Homepage (`/`) renders `SportsClub` schema:
  - `@type: ["SportsClub", "Organization"]`
  - `name: "KCVV Elewijt"`
  - `url: "https://www.kcvvelewijt.be"`
  - `logo`: absolute URL to `/icon.png`
  - `foundingDate: "1924"` (stamnummer 55 club, research founding year — see open questions)
  - `sameAs`: array of verified social URLs (Facebook, etc.)
  - `sport: "Soccer"`
  - `address`: club address (see open questions)
- [ ] Article detail page renders `NewsArticle` schema:
  - `headline`, `datePublished`, `dateModified`
  - `author` (from Sanity article author field, or fallback "KCVV Elewijt")
  - `image`: absolute URL to cover image
  - `publisher`: nested `Organization` stub (name + logo)
  - `url`: canonical article URL
- [ ] Sitemap Phase 1 extended with dynamic article slugs fetched from Sanity (with `lastModified` from `_updatedAt`)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4 — JSON-LD: BreadcrumbList

- [ ] `buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>)` factory in `src/lib/seo/jsonld.ts`
- [ ] All page routes pass a `BreadcrumbList` via `<JsonLd>`:
  - Homepage: `[{ name: "Home", url: "/" }]` (single-item breadcrumb)
  - `/nieuws`: `[Home, Nieuws]`
  - `/nieuws/[slug]`: `[Home, Nieuws, <title>]`
  - `/ploegen`: `[Home, Ploegen]`
  - `/ploegen/[slug]`: `[Home, Ploegen, <teamName>]`
  - `/jeugd`: `[Home, Jeugd]`
  - `/spelers/[slug]`: `[Home, <teamName (from player.team)>, <playerName>]`
  - `/staf/[slug]`: `[Home, Club, Staf, <name>]`
  - `/wedstrijd/[matchId]`: `[Home, Kalender, <matchLabel>]`
  - `/sponsors`: `[Home, Sponsors]`
  - `/club/…`: `[Home, Club, <subpage>]`
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 5 — JSON-LD: Person + SportsTeam + SportsEvent

- [ ] Player detail page renders `Person` schema:
  - `name`, `image` (absolute), `jobTitle` (position), `affiliation` (club Organization stub)
  - `url`: canonical player URL
- [ ] Staff detail page renders `Person` schema:
  - `name`, `image`, `jobTitle` (role/title from Sanity)
- [ ] Team detail page renders `SportsTeam` schema:
  - `name`, `sport: "Soccer"`, `memberOf` (club Organization stub)
  - `url`: canonical team URL
- [ ] Match detail page renders `SportsEvent` schema:
  - `name` (`homeTeam vs awayTeam`), `startDate` (ISO 8601), `location` (stadium if known, else omit)
  - `homeTeam` / `awayTeam` as `SportsTeam` stubs
  - `eventStatus` derived from match status (`EventScheduled` | `EventCancelled` | `EventPostponed` | `EventCompleted`)
- [ ] Sitemap extended with slugs for `/spelers/`, `/staf/`, `/ploegen/`, and `/wedstrijd/` (past 90 days only — future matches not yet indexable)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 6 — llms.txt + GEO polish

- [ ] `apps/web/public/llms.txt` created at site root. Contains:
  - Club identity block (name, stamnummer, motto, colours, founding year)
  - Factual summary of the club (senior teams, youth divisions, location)
  - Navigation index (list of top-level routes and their purpose)
  - Content types available (news articles, match results, player profiles, etc.)
  - Contact info + social handles
  - Short paragraph on what the site does NOT contain (e.g. ticketing, betting)
- [ ] `robots.ts` updated to allow `User-agent: *` for `/llms.txt`
- [ ] Default OG image (`/opengraph-image.png`) present in `apps/web/public/` as the fallback for any page that doesn't define its own OG image
- [ ] Root metadata `openGraph.images` points to this default image (using `metadataBase`-resolved URL)
- [ ] All pages that currently return a static `metadata` export with no `openGraph.images` are updated to at least inherit the default via `metadataBase`
- [ ] Google Rich Results Test (manual) on: homepage, one article page, one player page, one team page — passes structured data validation with no errors
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. All data needed for structured data is already available via:

- Sanity repositories (articles, players, staff, teams) — consumed in Server Components
- BFF match endpoints — `/matches/:matchId` already returns home/away team names and status

No new API endpoints or Effect Schema types are required.

## 7. Analytics

SEO/GEO is a discovery layer, not a tracked interaction layer. No new GTM events are needed. However:

- [ ] Verify GTM `gtag('consent', 'default', ...)` call does not suppress crawl-time rendering (it doesn't — consent is client-side only, JSON-LD is server-rendered)
- [ ] Confirm Google Search Console is connected post-launch to monitor crawl coverage and rich result appearance (manual step, not a code task)
- [ ] No new GA4 custom dimensions or event parameters needed

## 8. Open Questions

- `[ ]` **Club founding year** — stamnummer 55 was assigned in 1924? Verify exact founding date for `Organization.foundingDate`. Who resolves: Kevin (club records) or Wikipedia entry.
- `[ ]` **Club address** — exact postal address for `Organization.address` (PostalAddress schema). Who resolves: Kevin.
- `[ ]` **Social `sameAs` URLs** — which profiles are canonical? (Facebook page URL, possible Wikipedia entry, possible Wikidata entry). Who resolves: Kevin.
- `[ ]` **Stadium / ground name** — for `SportsEvent.location`. Is there a named ground? Who resolves: Kevin.
- `[ ]` **`llms.txt` content** — factual club summary text needs review/approval by Kevin before publish. Will be drafted by Claude, reviewed by Kevin.
- `[ ]` **Staging robots.txt gating mechanism** — `VERCEL_ENV` is available in Vercel deployments; confirm whether preview deploys set `VERCEL_ENV=preview`. To be answered by tracer bullet deploy.
- `[ ]` **Match `SportsEvent` indexability window** — indexing match pages older than N days is debatable. 90 days chosen as default; confirm or adjust.
- `[ ]` **Default OG image design** — a static fallback is needed (club logo on dark background). To be created as part of Phase 6 or handled by Kevin's design team.

## 9. Discovered Unknowns

_(Filled during implementation — leave blank now)_

```
- [date] Discovered: [what was found] → [action taken: new issue #N / PRD updated / resolved inline]
```
