# Match Story Image Generator

> GitHub issue: #702
> Status: Draft
> Last updated: 2026-03-27

## 1. Problem statement

During live matches, KCVV's social media presence relies on Instagram Stories for real-time match updates — goals, cards, kickoff, halftime, and full-time results. The old Gatsby-based system used a lambda that called a third-party screenshot service (screenshotapi.net) to capture a server-rendered page as a 1080x1920 PNG. This pipeline broke 2+ years ago due to external service dependencies and has not been replaced. Without it, there is no quick way to generate branded, on-brand story images from a phone during a live game.

## 2. Scope

### Packages touched

| Package                 | Changes                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `apps/web`              | New `/share` route, template components, Storybook stories, client-side image export |
| `apps/studio`           | None — `celebrationImage` field already exists on player schema                      |
| `apps/api`              | None — no new BFF endpoints needed                                                   |
| `packages/api-contract` | None — player data comes from Sanity, not BFF                                        |

### Explicitly OUT of scope

- **Sponsor logos on templates** — future enhancement with automatic sponsor rotation
- **Automated trigger from PSD API** — always manual
- **Second yellow = red card template** — use the red card template
- **Penalty awarded/missed template** — use goal template if scored, skip if missed
- **Authentication / access control** — page is public but unlisted
- **Server-side image generation** — no lambda, no headless browser, no screenshot API
- **New Sanity schema changes** — `celebrationImage` already exists
- **New BFF/api-contract endpoints** — player data fetched via Sanity GROQ

## 3. Tracer bullet

A single hardcoded "Goal KCVV" template component rendered at `/share` with:

- Static player data (hardcoded name, shirt number, placeholder celebration image)
- Static match name and score
- The green background from the legacy design (or a placeholder)
- Client-side PNG export via `html-to-image` at 1080x1920
- A "Download" button that saves the file

No Sanity queries, no match API calls, no template picker, no mobile optimization. This proves the core architecture: React component → client-side rasterization → downloadable PNG at correct dimensions.

## 4. Phases

### Phase 1: Tracer bullet — client-side image export proof (#919)

Prove that a React component can be reliably exported as a 1080x1920 PNG in the browser, including on iOS Safari.

### Phase 2: Template component library (#920)

Build all 9 template components as pure, presentational React components with Storybook stories. Each template accepts typed props and renders at 1080x1920. No data fetching — just visual composition. This is the phase where background assets get designed (by Kevin) against real Storybook layouts.

### Phase 3: Share page — form and data fetching (#921)

Build the `/share` page with:

- Match auto-detection (today's matches from BFF) with manual override
- Player search dropdown (all players from Sanity)
- Template picker (icon + text grid)
- Template-specific dynamic fields (score, minute, player, mood)
- Session persistence (match + score persist across generations)

### Phase 4: Image export and mobile UX (#922)

Wire up the image generation pipeline:

- Client-side PNG export from the template component
- Web Share API integration (mobile share sheet)
- Download fallback (desktop / unsupported browsers)
- Mobile-optimized layout for the form
- `noindex` meta tag

## 5. Acceptance criteria per phase

### Phase 1: Tracer bullet

- [ ] `/share` route exists and renders without errors
- [ ] A hardcoded "Goal KCVV" template renders visually at 1080x1920 in the DOM
- [ ] Clicking "Download" produces a PNG file at exactly 1080x1920 pixels
- [ ] PNG export works on iOS Safari 16+ (manual test on phone)
- [ ] PNG export works on Chrome desktop (manual test)
- [ ] Cross-origin images (Sanity CDN URLs) render correctly in the exported PNG
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2: Template component library

- [ ] 9 template components exist, each accepting typed props:
  - `GoalKcvvTemplate` — props: `playerName, shirtNumber, celebrationImageUrl?, score, matchName, minute`
  - `GoalOpponentTemplate` — props: `score, matchName, minute`
  - `KickoffTemplate` — props: `matchName`
  - `HalftimeTemplate` — props: `matchName, score`
  - `FullTimeTemplate` — props: `matchName, score, mood: "win" | "draw" | "loss"`
  - `RedCardKcvvTemplate` — props: `playerName, shirtNumber, matchName, minute`
  - `RedCardOpponentTemplate` — props: `matchName, minute`
  - `YellowCardKcvvTemplate` — props: `playerName, shirtNumber, matchName, minute`
  - `YellowCardOpponentTemplate` — props: `matchName, minute`
- [ ] Each template has a Storybook story under `Features/Share/`
- [ ] Templates without a celebration image gracefully show player name + shirt number only
- [ ] KCVV SVG patterns from the site design system are integrated into templates
- [ ] Club branding (crest/logo) present where it fits the design
- [ ] Each template renders at exactly 1080x1920 in Storybook
- [ ] Placeholder backgrounds used until Kevin provides final assets
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3: Share page — form and data fetching

- [ ] `/share` page renders a template picker with 9 options (icon + text, large tap targets)
- [ ] Selecting a template shows only the relevant input fields
- [ ] Match combo-box: shows today's matches from BFF, allows free-text override
- [ ] Player search: fetches all players from Sanity, searchable by name, shows quickly
- [ ] Score input: free text (e.g. "2 - 0")
- [ ] Minute input: free text (e.g. "45+2")
- [ ] Mood dropdown on full-time template: win / draw / loss
- [ ] Match and score persist across template switches within a session
- [ ] Form is usable on a mobile phone (no tiny inputs, no horizontal scroll)
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 4: Image export and mobile UX

- [ ] "Generate" button produces a preview of the composed image
- [ ] On mobile (iOS Safari, Android Chrome): "Share" triggers native share sheet with the PNG file
- [ ] Share sheet allows: save to camera roll, share to Instagram Stories, share via WhatsApp
- [ ] On desktop / unsupported: "Download" button saves PNG directly
- [ ] Page has `<meta name="robots" content="noindex">` — not discoverable
- [ ] Page is not linked from site navigation
- [ ] Celebration images from Sanity CDN load correctly in exported PNGs (CORS)
- [ ] Generated PNG is exactly 1080x1920 pixels
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract changes

None. Player data is fetched directly from Sanity via existing `PLAYERS_QUERY`. Match data for auto-detection uses the existing BFF `next-matches` endpoint (already consumed by the web app).

## 7. Open questions

- [x] **Which `html-to-image` library?** — Chose `html-to-image` v1.11.13. iOS Safari and CORS verified manually during Phase 1.
- [x] **Sanity CDN CORS for canvas export** — Sanity CDN serves CORS headers compatible with `html-to-image`. `crossOrigin="anonymous"` on `<img>` is required. Verified during Phase 1.
- [ ] **Background asset format** — PNG or JPG or SVG for the 9 template backgrounds? JPG is smaller but no transparency. Kevin to decide when designing assets — resolved during Phase 2
- [ ] **Today's matches endpoint** — does the existing `next-matches` BFF endpoint return matches for today specifically, or only future matches? If it doesn't include "in progress" matches, we may need to adjust the query or use a different endpoint — investigate during Phase 3
- [ ] **Web Share API file sharing on iOS Safari** — `navigator.share({ files: [pngFile] })` support varies. iOS 15+ supports it but with caveats. Need to test on actual device — will be answered by Phase 4

## 8. Discovered unknowns (filled during implementation)

- [2026-03-27] Discovered: worktree needs `.env.local` copied from main worktree for `next build` to succeed (Sanity projectId missing otherwise) → resolved inline (not a code change)

---

## Appendix: Legacy system reference

The old implementation lived across three systems:

| Component          | Location                                                       | Role                                                           |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Creation form      | `KCVV-Elewijt-Gatsby/src/pages/share.tsx`                      | Player dropdown + match/score inputs                           |
| Visual composition | `KCVV-Elewijt-Gatsby/src/components/PlayerShare.tsx` + `.scss` | 1080x1920 DOM composition with layered elements                |
| Image capture      | `kcvv-api-psd/api/api-share-instagram-get.js`                  | Lambda calling screenshotapi.net to screenshot the Gatsby page |

Key design elements from legacy: green background (`--color-green--bright`), `header-pattern.png` overlay, scattered "GOAL" text with random positioning/opacity (SCSS `@for` loop), player celebration image as background-image, text-stroke effects on shirt number and "Goal!" title.

The new system replaces the lambda + screenshot service with client-side `html-to-image` export, eliminating all external dependencies.
