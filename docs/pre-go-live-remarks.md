# Pre-Go-Live Remarks & Maintenance

Captured during an owner-led walkthrough (2026-06-23) of every renderable page on
the new Next.js site (reviewed via `https://kcvv-nextjs.vercel.app`, staging
dataset where noted). This is a **spec backlog**, not a plan — each item is a
discrete remark to triage into issues.

Type tags: `[copy]` `[layout]` `[design]` `[bug]` `[schema]` `[content]`
`[infra]` `[a11y]` `[seo]` `[perf]` `[nav]` `[feature]`

Status legend: ☐ open · ◐ owner-handled · ✔ done

## Issue tracking

Filed as grouped issues across themed milestones (2026-06-23). Tracer-bullet /
blockedBy intentionally skipped — this is a backlog, not a single feature.

**go-live-seo-migration** — #2227 (SEO-7/8/9) · #2228 (SEO-1/2/3/4) · #2229 (OG-1/2/3) · #2230 (SEO-5b, LLM-1/2/3/4) · #2231 (ICON-1/2/3)
**go-live-mobile-a11y-perf** — #2232 (MOB-1..4) · #2233 (MOB-5..10) · #2234 (A11Y-1..6) · #2235 (PERF-1..3)
**go-live-ux-polish** — #2236 (HP-1..8) · #2237 (NEWS-1, ART-1..3) · #2238 (TEAMS/TEAM/JEUGD/NAV) · #2239 (KAL/EVT) · #2240 (BEST/ULTRAS/LID/HULP-1/HIST/SPON) · #2241 (ZOEK/TEGEN) · #2242 (CMS/SHARE-1/PLAYER-6)
**go-live-ops-content** — #2243 (PLAYER-1/STAFF-3) · #2244 (STAFF-4) · #2245 (DOC-1)
**sanity-studio-editor-ux-rework** _(existing)_ — #2246 (STUDIO-1, PLAYER-2/3/4) · #2247 (STUDIO-2/4/6/7, PLAYER-5, STAFF-1/2) · #2248 (STUDIO-3/5/8/9/10/11)

Excluded: **HULP-2** (organigram — owner-handled).

---

## A. Documentation

- ☐ **DOC-1** `[infra]` Review **all README(s)** across the monorepo for accuracy — still up to date? Same pass for **all SECURITY.md** files.

---

## B. Homepage (`/`)

- ☐ **HP-1** `[layout]` MatchStrip — inner container isn't full viewport width on a 32" display; should span the full page width.
- ☐ **HP-2** `[layout]` MatchStrip — right-align the "Competitie" part; left-align date/aftrap.
- ☐ **HP-3** `[layout]` Featured hero — widen its container to match the "Uitgelicht" grid below it.
- ☐ **HP-4** `[copy]` "Eerste ploegen" block — "Dit weekend." copy reads weird pre-season when the next match is ~4 weeks out. Needs conditional/smarter wording.
- ☐ **HP-5** `[design]` "Laatste nieuws" — add a highlight accent (à la EditorialHeading emphasis).
- ☐ **HP-6** `[design]` "Met dank aan onze sponsors" — same: add a highlight accent.
- ☐ **HP-7** `[layout]` "ALLE SPONSORS & SYMPATHISANTEN" link — right-align like all other "browse all" links.
- ☐ **HP-8** `[design]` Footer ("KCVV Elewijt — Er is maar één plezante compagnie") — add a retro/monochrome version of the **actual club logo**, in the same illustration vocabulary as the jersey illustration but based on the logo. (Footer is global — applies site-wide.)

---

## C. Pages

### `/nieuws` (news listing)

- ☐ **NEWS-1** `[feature]` Replace truly-infinite scroll with a "load more" button. Initial batch 24 or 36, then +12 per click.

### `/nieuws/[slug]` (article detail)

- ☐ **ART-1** `[layout]` Huge vertical gap between the "Einde artikel" divider and the "Verder lezen" section — tighten.
- ☐ **ART-2** `[layout]` "Verder lezen" related-articles grid is cramped — give cards more breathing room.
- ☐ **ART-3** `[design]` **Event articleType needs design love.** Specifically the hoisted event-fact bar between hero and body (`EventDetailBlock` / `EventFactInline`, e.g. `SPORTPARK DRIESPUT … · 19 SEPTEMBER 2026 · 10:00–17:00`) is full-bleed with no container — wrap it + redesign pass.

### `/ploegen` (teams listing)

- ☐ **TEAMS-1** `[layout]` B-ploeg row — text + "Bekijk ploeg" button are awkwardly aligned; right-align to mirror the A-ploeg row.
- ☐ **TEAMS-2** `[bug]` Youth directory renders identical "U9" labels for distinct same-age teams (U9 wit / groen / prov…). Add a distinguisher. **Shared fix with JEUGD-1.**

### `/ploegen/[slug]` (team detail)

- ☐ **TEAM-1** `[design]` Spelers/Staf tab nav has top border + bottom border **and** a striped seam. If nothing ever sits between the border and the seam, drop the border + attach the seam to its content — border+seam doubling is inconsistent with in-page seams below.
- ☐ **TEAM-2** `[layout]` Squad cards — force equal height regardless of player-name length (a name wrapping to 2 lines makes that card taller).

### `/spelers/[slug]` (player detail)

- ☐ **PLAYER-1** `[content]` No production player has a bio/pullquote/quotes → the editorial sections never render on the live site. Decide before go-live: populate a few bios, or accept the minimal hero-only page. (Staging has 3 bios, no pullquotes.) Ties to STAFF-3.
- ☐ **PLAYER-2** `[schema]` Pullquote decorator (`packages/sanity-schemas/src/player.ts:124`) has no `icon` → shows the default `?` placeholder. Add a proper icon. (See STUDIO-1 — also affects `team.body` + the `accent` decorator.)
- ☐ **PLAYER-3** `[schema]` Pullquote decorator has no `component` render → zero WYSIWYG feedback in the editor. Add an editor render that mirrors the frontend pull-quote.
- ☐ **PLAYER-4** `[schema]` Editor guidance: make marked text visibly distinct + add field help explaining the dual-surface rule and the **2-quote cap** (1st marked run → side card, 2nd → dark interlude card, 3rd+ inline-only).
- ☐ **PLAYER-5** `[schema]` `player.bio` exposes Sanity's default style dropdown (H1–H6 + **Quote**) but the frontend only renders the pullquote decorator — a "Quote" block style is a **silent no-op** (renders as plain paragraph). Lock `styles` to Normal-only (+ `lists: []`). (See STUDIO-7.)
- ☐ **PLAYER-6** `[bug]` Sticky sidebar pull-quote scrolls **under the sticky nav** — `BioBlock.tsx:90` uses `lg:top-8` (32px) < header height. Bump the sticky `top` offset to clear the header + gap.

### `/staf/[slug]` (staff detail)

- ☐ **STAFF-1** `[schema]` **Bring staff bio to parity with the player bio.** Staff `bio` is a bare `of: [{type:'block'}]` (`staffMember.ts:70`) — no pullquote, full default dropdown, renders via `<ArticleBody>` (different model than player's `<BioBlock>`). Unify: same pullquote decorator (icon + component), same locked styles (Normal-only), same rendering model.
- ☐ **STAFF-2** `[bug]` Cross-type inconsistency to resolve in the unification: "Quote" style works on staff (ArticleBody serializer) but is a no-op on player; pullquote works on player but not staff.
- ☐ **STAFF-3** `[content]` No player **or** staff bios exist in **production** (only staging). Decide canonical dataset + ensure preview reads it + revalidation fires on publish.
- ☐ **STAFF-4** `[infra]` Vercel **Deployment Protection (SSO) on preview deployments blocks the Sanity `/api/revalidate` webhook** (401 before reaching the route) → editor edits never revalidate on previews. Confirm the **production** webhook target isn't similarly gated; decide preview-content strategy (Protection Bypass token vs redeploy-only).

### `/kalender`

- ☐ **KAL-1** `[design]` Filter controls have **rounded corners** — the only page that does. Make them square (`rounded-none`) to match the design system.

### `/evenementen` (events listing)

- ☐ **EVT-1** `[design]` The `<StripedSeam>` may be overkill here — consider dropping/reducing it.
- ☐ **EVT-2** `[design]` Add a highlight accent to the month-group heading (highlight either the month **or** the year, not both) — mirror the month-subtitle treatment on `/ploegen/[slug]/wedstrijden`.

### `/evenementen/[slug]`

- ✔ OK — no remarks.

### `/sponsors`

- ☐ **SPON-1** `[copy]` Intro copy repeats "plezant(st)e compagnie" twice ("Er is maar één plezante compagnie" + "…blijven we de plezantste compagnie"). Rephrase or remove the top line.

### `/jeugd`

- ☐ **JEUGD-1** `[bug]` Duplicate same-age teams need a distinguisher in the team-directory labels here too. **Shared fix with TEAMS-2.**

### `/zoeken`

- ☐ **ZOEK-1** `[layout]` Huge empty gap in the initial/empty search state (masthead at top, footer far below). Fix layout (min-height fill / center content / suggestions / recent searches).
- ☐ **ZOEK-2** `[feature]` Add **debounced auto-search** (typeahead, small delay) instead of submit-only.
- ☐ **ZOEK-3** `[feature]` Semantic/AI search **already exists** in the BFF (Vectorize + bge-m3, via `/api/search` POST). Confirm `/zoeken` actually uses it; if not, wire it up / surface AI results.

### `/club/geschiedenis`

- ☐ **HIST-1** `[design]` Timeline scroll animation — only the card/image should fly in. The timeline bullet should stay anchored and animate by **colouring in** (filling) as the scroll reaches it, rather than flying in with the card.

### `/club/bestuur` (+ all `createBoardPage` boards)

- ☐ **BEST-1** `[design]` Clickable vs non-clickable cards look identical — add a visual affordance. (Rule: clickable iff `psdId !== "" && !archived` — `team.repository.ts:170`; manually-created members without a PSD id are never clickable.)
- ☐ **BEST-2** `[bug]` A card is clickable on `psdId` + not-archived alone, regardless of content → can open an empty hero-only profile. Gate clickability on actual detail content (bio), or backfill staff bios. Ties to STAFF-3.

### `/club/ultras`

- ☐ **ULTRAS-1** `[design]` Last image's tape strip is almost invisible — make it larger. (Rest OK.)

### `/club/word-lid` (membership)

- ☐ **LID-1** `[copy]` Title "Er is maar één plezante." is weirdly shaped — reword/reshape.
- ☐ **LID-2** `[copy]` Reframe the whole form as an **enquiry / expression of interest**, not a definitive membership signup. Convey "we'll contact you," that a spot depends on team availability; position as "I'm interested — send me info."

### `/club/[slug]` (CMS pages) + global

- ☐ **CMS-1** `[bug]` **Global link bug:** when a link wraps onto multiple lines (or around the external-link icon), the hover underline only shows on a tiny segment instead of the whole link. Fix the link hover-underline for wrapped links. (Likely the single-line CSS-bg marker — same class as the known HighlighterStroke multi-line gap.)
- ☐ **CMS-2** `[design]` Style social-media links into attractive affordances/icons instead of plain text links.

### `/hulp`

- ☐ **HULP-1** `[design]` "Contactgegevens" element design should be prettier.
- ◐ **HULP-2** `[design]` Organigram to be **completely revised by the owner** — do not redesign now.

### `/share` (noindex)

- ☐ **SHARE-1** `[bug]` Player-name text auto-fit is broken — long names (e.g. "Jonas Aelbrecht") overflow the canvas instead of scaling down. Fix shrink-to-fit so names always fit.

### `/tegenstander/[clubId]` (noindex)

- ☐ **TEGEN-1** `[layout]` Huge empty gap between the last match row and the footer (short content doesn't fill the viewport). Same class as ZOEK-1. (Rest looks very good.)

### Skipped (no remarks this pass)

`/ploegen/[slug]/wedstrijden`, `/wedstrijd/[matchId]`, `/galerij`, `/galerij/[slug]`, `/club`, `/club/jeugdbestuur`, `/club/angels`, `/club/contact`, `/privacy`, `/scheurkalender` (no matches scheduled to verify), `/club/[slug]` content, system routes (404/500, OG images, sitemap, robots, API).

---

## D. Navigation

- ☐ **NAV-1** `[nav]` Move "Reserven" under the **Jeugd** menu.

---

## E. Social share / Open Graph images

- ☐ **OG-1** `[bug]` **Fallback OG image 404s.** `DEFAULT_OG_IMAGE.url = "/opengraph-image.png"` (`apps/web/src/lib/constants.ts:26`) → resolves to a non-existent static file (the working generated image is at `/opengraph-image`, no `.png`). Homepage + every fallback page (listings, club pages, jeugd, sponsors…) emit a broken `og:image` **and** `twitter:image`. Per-article/event/gallery/team/player/staff images are fine. **Fix:** point the constant at `/opengraph-image`, or (cleaner) drop the `DEFAULT_OG_IMAGE` indirection and rely on the root `opengraph-image.tsx` file-convention so Next injects the correct host-correct URL per deploy. Note: OG host is hardcoded to `www` via `metadataBase`, so previews resolve OG against the old Gatsby `www` until DNS cutover.
- ☐ **OG-2** `[design]` Off-brand greens: generated OG gradient uses `#008755`; theme-color/manifest use `#4acf52` (retired bright jersey green). Align to jersey-deep.
- ☐ **OG-3** `[design]` (optional) Default OG is just gradient+logo — consider a richer branded template.

**Already in place (no action):** per-article (`article.ogImageUrl`), per-event (`coverImageUrl`), per-gallery (first photo), and generated per-team/player/staff OG routes; Twitter cards (`summary_large_image`) emitted site-wide.

---

## F. Favicon / app icons / manifest / theme-color

- ☐ **ICON-1** `[bug]` Maskable icon is wrong: `manifest.ts` reuses the same `/icon.png` for both `any` and `maskable`. Maskable needs ~20% safe-zone padding or Android crops the logo. Add a dedicated padded maskable PNG, and add a **192×192** variant (currently only 512).
- ☐ **ICON-2** `[design]` Off-brand colors: `theme_color`/`viewport.themeColor` = `#4acf52` (retired green); `background_color` = `#fefefe` (near-white, not site cream `#f5f1e6`). Decide final brand values (jersey-deep theme + cream bg).
- ☐ **ICON-3** `[infra]` `icon.png` + `apple-icon.png` exist in both `app/` and `public/` (manifest references the public copies). Pick canonical, avoid drift.

**Already in place (no action):** `favicon.ico`, `icon.png` (512²), `apple-icon.png` (180²) via app conventions; `manifest.ts`; `viewport.themeColor` in the correct export + `viewportFit: cover`.

---

## G. Sanity Studio editorial UX

(From the editorial-UX audit. All schema-side in `packages/sanity-schemas/src`; ships to both studios.)

### High

- ☐ **STUDIO-1** `[schema]` Blank custom-decorator buttons — `pullquote` (`player.ts:124`, `team.ts:188`) **and** `accent` (`article.ts:118`, `qaSectionDivider.ts:35`) have no `icon`/`component` → blank toolbar button + no WYSIWYG. Add icon + editor render; define once and share. (Superset of PLAYER-2/PLAYER-3.)
- ☐ **STUDIO-2** `[schema]` Picking **H2** in `staffMember.bio` or `page.body` renders the green interview "act divider" (`QASectionDivider`); **H1/H3–H6 silently degrade to plain paragraphs** (`<ArticleBody>` only serializes `h2`+`blockquote`). Lock these fields' `styles` to what actually renders; decide H2 intentionally.
- ☐ **STUDIO-3** `[schema]` `photoGallery.description` is rich-text Portable Text but the frontend renders it as **plain text** (`descriptionText`, `galerij/[slug]/page.tsx:135`) — all formatting discarded. Either downgrade the field to `type:'text'` or render via `<PortableText>`.
- ☐ **STUDIO-4** `[schema]` Bio authoring-model parity across player/team/staff (see STAFF-1) — unify to one shared block definition with locked styles.
- ☐ **STUDIO-5** `[schema]` Validation gaps: `staffMember.firstName/lastName` not `required()` (blank-name docs possible); `articleImage.alt` is a soft warning while `banner.alt` hard-errors — align the content-image alt policy.

### Med

- ☐ **STUDIO-6** `[schema]` Unify the bio/description authoring model (extract a shared `of:[…]` constant in the schemas package).
- ☐ **STUDIO-7** `[schema]` `player.bio` / `team.body` keep default `styles` + `lists` though only `pullquote` + paragraphs render → H1–H6/Quote are no-ops, lists unstyled. Add `styles: [Normal]` + `lists: []` (mirror `qaBlock.ts:35`). (Superset of PLAYER-5.)
- ☐ **STUDIO-8** `[a11y]` Add `alt` subfields to content images lacking them (`event.coverImage`, gallery covers, etc.); audit decorative vs content.
- ☐ **STUDIO-9** `[schema]` `htmlTable.html` raw-HTML field is editor-selectable (Drupal migration artifact, now decommissioned) — clarify it's `<table>`-only/sanitized, or hide from the new-block menu.

### Low

- ☐ **STUDIO-10** `[copy]` Translate English validation/help copy on body-block object types to Dutch teaching copy (`qaBlock`, `transferFact`, `eventFact`, `subject`).
- ☐ **STUDIO-11** `[infra]` `responsibility.ts:245` `@ts-expect-error` on `Rule.uri()` — minor cleanup.

**Verified OK (no action):** no array-index-deref preview bug (deliberately avoided), strong previews + desk structure, studio structure files byte-identical (parity good), sync plumbing properly `readOnly`/`hidden`.

---

## H. Mobile / responsive

Static audit of `apps/web/src` at 360–414px. Overall the site stacks/collapses
well; below are the real risks. (Header is `sticky top-0 h-16` = 64px on all
breakpoints — relevant to sticky offsets.)

### High

- ☐ **MOB-1** `[bug]` **MatchStrip fixture row overflows on phones** → horizontal page scroll site-wide. `apps/web/src/components/layout/MatchStrip/MatchStripView.tsx:40` row has no `min-w-0`, so the `truncate` on `<TeamName>` (`:88`) is inert; long opponent names blow out the band. Add `min-w-0` to the row + each name span (optionally `max-w-[40%]`).
- ☐ **MOB-2** `[bug]` **Team-detail sticky section nav hides under the sticky header.** `apps/web/src/app/(main)/ploegen/[slug]/TeamSectionNav.tsx:29` (route-co-located, not under `components/`) pins `top-0` like the header → invisible when scrolled. Use `sticky top-16`; bump section anchor `scroll-mt-16` → ~`scroll-mt-[6.5rem]` (`apps/web/src/app/(main)/ploegen/[slug]/page.tsx` ~228/249/268/283/296/305). _(Same class as PLAYER-6.)_
- ☐ **MOB-3** `[layout]` **ClippedCard form padding not responsive** — hard `px-10 pt-9 pb-7` (`apps/web/src/components/design-system/ClippedCard/ClippedCard.tsx:38`) leaves ~248px usable at 360px for the membership form. Make responsive, e.g. `px-5 pt-7 pb-6 md:px-10 …`.
- ☐ **MOB-4** `[layout]` **Organigram verkenner A++ scale clips on phones** — `scale(1.3)` on the tree (`apps/web/src/components/organigram/OrganigramExplorer/OrganigramExplorer.tsx:84` `SCALE_STEPS`, applied at `:341`) can push the centre card under sibling carets at 360px. Cap scale steps to `[1, 1.15]` on small viewports or wrap in `overflow-x-auto`. (Full org tree `VolledigOrganigram` already handles overflow.)

### Medium

- ☐ **MOB-5** `[a11y]` **Tap targets < 44px:** hamburger (`SiteHeader.tsx:105`, ~36px), NavTakeover close (`NavTakeover.tsx:111`), submenu rows (`NavTakeoverItem.tsx:32`, ~27px), HulpFinder chips (`HulpFinder.tsx:283/301/323/381`), MemberDetailPanel chips + close (`:365`, h-9), SearchForm buttons (`SearchForm.tsx:105`), footer social icons (`SiteFooter.tsx:96/107`, 24px). Raise to ≥44px. _(Overlaps A11Y-5.)_
- ☐ **MOB-6** `[bug]` **Calendar 7-col grids never collapse on phone.** `CalendarMonth.tsx:221` (`grid-cols-7`, ~41px cells) — the "Maand" tab isn't mobile-hidden (only Week is). `CalendarWeek.tsx:104` forced `grid-cols-7`; `?view=week` URL forces it on any viewport. Hide Maand on phones / coerce `view` away from week when `isPhone` in `CalendarWidget`.
- ☐ **MOB-7** `[layout]` **Event TicketStub starves the title column** — `pr-28` (112px) reserved for a desktop-only hover cue (`TicketStub.tsx:141`) leaves the title ~100px at 360px. Use `pr-4 sm:pr-28`.
- ☐ **MOB-8** `[layout]` **Long-text overflow (no wrap):** StaffRoles position row (`StaffRoles.tsx:77` — add `flex-wrap`+`min-w-0`), ContactPage mailto links (`ContactPage.tsx` ~109/243/286 — `break-all`), SiteFooter colofon (`SiteFooter.tsx:71` — `flex-wrap`, drop fixed `h-6`).
- ☐ **MOB-9** `[layout]` **Non-wrapping organigram toolbars:** `VolledigOrganigram.tsx:156` (`w-full sm:w-auto` buttons), `OrganigramSectionNav.tsx:130` (`flex-wrap` so search drops to a 2nd line).

### Low

- ☐ **MOB-10** `[layout]` Copy-fragility / minor squeeze: UltrasHero h1 needs `break-words`/`hyphens-auto` (`UltrasHero.tsx:55`); HeroMatchScoreBar `min-w-0`/`max-w-full` (`_variant-parts.tsx:411`); MemberDetailPanel name `break-words` (`:262`); MatchEvents name columns very short at 360px (`:407`); CalendarWidget toolbar wraps loosely (`CalendarWidget.tsx:198`).

**Verified clean (no action):** StandingsTable, MatchHero, TeamAgendaRow, MatchLineup, PlayerHero/TeamHero/TeamFlagship/SquadGrid/YouthDirectory, HtmlTableBlock, VideoBlock, gallery/lightbox, sponsors/jeugd grids, history timeline, MemberDetailPanel bottom sheet — all collapse/scroll correctly. (`Scheurkalender` fixed-width table is out of scope — private print source.)

---

## I. Performance / Accessibility / SEO meta

### Performance

- ☐ **PERF-1** `[perf]` **Homepage hero LCP image has no `priority`** (`EditorialHero.tsx:215`, `<Image fill>`) → the LCP element on the highest-traffic page lazy-loads. Thread a `priority?` prop and set it only from the homepage hero call site (`(landing)/page.tsx`), not the below-fold rows.
- ☐ **PERF-2** `[perf]` `next.config.ts:108` images config at defaults — add `formats: ["image/avif","image/webp"]` + `minimumCacheTTL` for optimizer-served heroes; confirm `picsum.photos`/`placehold.co` remotePatterns aren't referenced by any production path. (Low — most photos use pre-transformed Sanity CDN URLs.)
- ☐ **PERF-3** `[perf]` `revalidate = 86400` (24h) on `/spelers/[slug]` (`:233`) + `/staf/[slug]` (`:214`) — PSD squad/staff data changes mid-season. OK **iff** Sanity webhook tag-revalidation covers player/staff edits; else shorten to ~6h. Verify wiring. _(Ties to STAFF-4.)_

**Verified OK:** no `<img>` misuse (raw `<img>` all justified), every `fill` has `sizes`, `unoptimized` on Sanity photos deliberate, fonts non-blocking, GTM consent-gated + `afterInteractive`, `"use client"` boundaries all legitimate, match ISR 300s correct. _(Note: agent reports Montserrat was replaced by Freight Sans in #2174 — the memory index saying "Montserrat KEPT" is stale.)_

### Accessibility

- ☐ **A11Y-1** `[a11y]` Membership-form submit error is a plain `<p>`, not announced (`MembershipForm.tsx:450`). Wrap in `role="alert" aria-live="assertive"` or route through `<AlertBadge variant="error">`.
- ☐ **A11Y-2** `[a11y]` Small cream text on `bg-jersey-deep` (#008755 = 4.04:1, below AA) → swap `text-cream`→`text-white` at `OrgPersonCard.tsx:302`, `HtmlTableBlock.tsx:69` (thead), `EditorialHero/_variant-parts.tsx:64` (credit chip), `HulpFinder/QuestionCard.tsx:114`. _(`jersey-deep-dark`/`bg-ink` cream text PASS — not violations.)_
- ☐ **A11Y-3** `[a11y]` `<DownloadButton>` anchor has hover press-down but no keyboard focus ring (`DownloadButton.tsx:170`). Add `focus-visible:outline-2 focus-visible:outline-offset-2`.
- ☐ **A11Y-4** `[a11y]` `<NavDropdown>` desktop trigger has no focus-visible state (`NavDropdown.tsx:303`). Add `focus-visible:ring-2` (verify no global focus style already applies).
- ☐ **A11Y-5** `[a11y]` Hamburger missing `aria-controls` (`SiteHeader.tsx:98-108`) — add an `id` to `NavTakeover` and reference it.
- ☐ **A11Y-6** `[a11y]` `CalendarSubscribePanel` filter + copy buttons lack focus-visible rings (`:157/:174`).

**Verified OK:** skip link present; `prefers-reduced-motion` coverage thorough (incl. timeline fly-in); NavTakeover is an exemplary modal (role=dialog, focus trap, return focus); lightbox + thumbnails labeled; one h1/page (sr-only pattern intentional); form primitives wire labels/`aria-invalid`/`aria-describedby`; FilterTabs proper tablist.

### SEO meta

- ☐ **SEO-1** `[seo]` **`<title>` doubling — systemic across ~25 indexable pages.** Pages hardcode a full `| KCVV Elewijt` suffix AND the root template `%s | KCVV Elewijt` (`layout.tsx:28-31`) wraps it again → `"Foo | KCVV Elewijt | KCVV Elewijt"`. Fix: pass a **bare** segment everywhere; let the template add the suffix. (Confirms the pre-existing #2209 bug — full file list in the audit; includes homepage, all listings, all club pages, all detail routes.)
- ☐ **SEO-2** `[seo]` Homepage `/` has no canonical — `generateMetadata` sets `openGraph.url` but not `alternates.canonical` (`(landing)/page.tsx:66`). Add `alternates: { canonical: SITE_CONFIG.siteUrl }`.
- ☐ **SEO-3** `[seo]` `/nieuws` listing has no canonical or openGraph, and `?categorie=` views have no canonical (duplicate-content risk) (`(landing)/nieuws/page.tsx:22-37`). Route through `buildPageMetadata` (bare title); canonicalize category views to `/nieuws`.
- ☐ **SEO-4** `[seo]` Sitemap omits 5 indexable static routes (`sitemap.ts:9-23`): `/evenementen`, `/club/word-lid`, `/club/bestuur`, `/club/jeugdbestuur`, `/club/angels`. Add them. (Dynamic detail items are covered.)
- ☐ **SEO-5** `[seo]` Low/cosmetic: inconsistent manual `- KCVV Elewijt` suffix on `ogTitle` in several `buildPageMetadata` callers; `robots.ts:13` advertises the prod sitemap URL on disallowed previews; optional JSON-LD (`ImageGallery`/`ItemList`) on `/galerij/[slug]` + the gallery/event indexes.

> **Twitter cards — NOT an issue (audit false-positive).** The audit reported "no Twitter Card metadata," but the live HTML emits `twitter:card=summary_large_image` + `twitter:image` site-wide (verified on `kcvv-nextjs.vercel.app`). The only real defect is that `twitter:image` inherits the same broken fallback URL as **OG-1** — fixing OG-1 fixes both. No twitter config work needed.

**Verified OK:** noindex routes correct (`/share`, `/tegenstander`, `/scheurkalender`, 404 — no canonical, not in sitemap, don't use `buildPageMetadata`); dynamic per-item canonicals correct; news detail emits `og:type=article`+`publishedTime`; JSON-LD strong (NewsArticle, Event, Person [adults only], SportsTeam, ItemList, FAQPage, SportsClub+Organization, BreadcrumbList); robots prod-allow/preview-disallow logic correct.

---

## J. LLM / AI-chatbot optimization

Already in good shape — `public/llms.txt` (LLM-summary standard, served 200, robots-referenced), production robots allows all crawlers (AI ingestible), and strong JSON-LD across entities. Fixes:

- ☐ **LLM-1** `[content]` **`llms.txt` founding year is wrong** — says "Opgericht in **1924**"; canonical is **1909** (owner-confirmed; `jsonld.ts:140 foundingDate` is correct). LLMs will repeat the wrong year. Fix to 1909.
- ☐ **LLM-2** `[content]` `llms.txt` lists `/club/organigram`, which **is not a route** (organigram moved to `/hulp`). Fix the link. Also: `llms.txt` is hand-written/static → drift risk; add it to the "Plan & Doc Audit Before Closing a Branch" checklist (or generate it from the route map).
- ☐ **LLM-3** `[infra]` _(decision)_ AI-training crawlers (GPTBot, CCBot, Google-Extended, ClaudeBot, PerplexityBot) are allowed **by omission** in `robots.ts`. Decide consciously: keep open (max chatbot/answer-engine visibility — recommended for a club) vs add per-bot `disallow`.
- ↪ **LLM-4** OG-1 (broken `og:image`/`twitter:image`) + SEO-1 (`<title>` doubling) also degrade AI answer-card / link-unfurl presentation. Fixing those (already captured) covers the LLM angle.

**Verified OK (no action):** `llms.txt` structure (overview, nav map, content inventory, contact/socials, "what this site does NOT contain" anti-hallucination section); sitemap declared in robots; JSON-LD grounding strong.

---

## K. Search-engine setup & migration

New sitemap verified live (490 URLs, dynamic). **But the Gatsby→Next redirect coverage
is NOT complete** — diffed against the live old Gatsby sitemap (~870 URLs): the English
top-level renames are handled, but the bulk content (player + staff profiles, ~680 URLs
≈ 78%) would **404** on cutover because old keyed by name-slug and the new routes key by `psdId`.

- ☐ **SEO-7** `[seo]` **🔴 ~680 legacy URLs 404 on cutover** — `/player/<name-slug>` (~553) and `/staff/<name-slug>` (~127). Two causes: (a) the redirect rule is `/players/` (plural) so singular `/player/*` isn't matched at all; (b) new `/spelers/[slug]` + `/staf/[slug]` resolve by **psdId**, not name, so a fixed-prefix static redirect still 404s. **Fix:** add a legacy resolver route/middleware for `/player/<slug>`, `/players/<slug>`, `/staff/<slug>` that looks the person up by name-slug (derive from Sanity `firstName`/`lastName`) and **301s to `/spelers/<psdId>` / `/staf/<psdId>`**. These are the highest-backlink pages — top SEO priority.
- ☐ **SEO-8** `[seo]` Verify the `/jeugd/uXX → /ploegen/:slug` redirect (14 old youth URLs `u6…u21`, `u8-wit`) actually resolves — new youth team slugs may include variant suffixes (e.g. `u9-wit`/`u9-groen`), so generic `/jeugd/u9 → /ploegen/u9` could 404. Also spot-check `/news/<slug> → /nieuws/<slug>` (~145) — works only if Sanity article slugs were preserved in migration.
- ☐ **SEO-9** `[seo]` Legacy routes with **no redirect → 404**: `/club/cashless`, `/club/cashless/voorwaarden`, `/club/downloads`, and `/kiosk/{a,b,previous,upcoming,ranking/a,ranking/b,ranking/u21}` (7). Decide per-route: redirect to the nearest equivalent or accept the 404 (cashless was intentionally dropped; kiosk pages were internal displays — likely low external value).
- ☐ **SEO-5b** `[infra]` **No Google Search Console / Bing verification.** Before go-live, verify the domain (DNS TXT = no code, or `metadata.verification.google` in `layout.tsx`) so you can submit the sitemap and monitor indexing/coverage.
- ↪ See also **SEO-1…4** (§I) and **OG-1** (§E) — title doubling, missing canonicals, 5 sitemap omissions, broken OG/twitter image.

**Verified OK (no action):** new sitemap.xml live + dynamic (490 URLs); robots prod-allow/preview-disallow with sitemap declared; canonical host (`www`) used in sitemap even on preview. **Redirects that DO work:** top-level renames `/news /events /calendar /search /teams /team/* /game` → Dutch; `/club/history`, `/club/register`, `/club/inschrijven`, `/club/organigram→/hulp#structuur`; same-slug top-level (`/sponsors /privacy /club /share /scheurkalender /jeugd`) resolve directly.
