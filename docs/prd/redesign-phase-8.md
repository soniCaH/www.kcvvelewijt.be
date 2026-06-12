# PRD: Redesign Phase 8 — Search, Privacy, Error pages

**Status:** Ready · **Milestone:** `redesign-retro-terrace-fanzine` (the redesign
series umbrella — Phase 8 inherits it, not a new milestone) · **Umbrella issue:**
#1530

**Design checkpoint:** complete. Locked decisions + mockups in
`docs/design/mockups/phase-8-{search,privacy,errors}/` and the phase
`docs/design/mockups/phase-8-data-reality-locked.md`.

Master design: `docs/plans/2026-04-27-redesign-master-design.md` (§7 roadmap line
587, §6 shape notes, open-question 7 already resolved in Phase 7 #1529). Phase 8
is the **last design-gated batch** before the Phase 9 cleanup (#1531).

> **Re-scope (2026-06-08):** `/hulp` left Phase 8 → shipped in Phase 7 (#1529).
> Phase 8 = three edge surfaces only: `/zoeken`, `/privacy`, 404/500.

---

## 1. Problem statement

Three "edge" surfaces still render in the **legacy** visual language while the
rest of the site is on retro-terrace-fanzine tokens:

- **`/zoeken`** — green-gradient hero, white cards, gray background, lucide icons,
  emoji help block. The semantic search backend (bge-m3 / Vectorize, #2057) is
  fine; only the presentation is legacy.
- **`/privacy`** — dark `<InteriorPageHero>`, gray `prose prose-gray`,
  `<SectionStack>` `diagonal` transition.
- **404 / 500** — gray lucide-icon error states with no club character.

Phase 8 reskins all three onto the design system, retiring their legacy-token and
`diagonal`-seam usage (master design §7 line 587), so Phase 9 can delete the
legacy tokens with zero remaining consumers on these pages.

## 2. Scope

### In scope (`apps/web` only — no schema, no api-contract, no BFF)

- `/zoeken`: dark search masthead, paper result rows, football-voice empty states.
- `/privacy`: cream-minimal prose reskin.
- 404/500: shared `<ErrorState>` (football pun + `<JerseyShirt>` artefact).
- Diagonal→removal/StripedSeam migration for the privacy consumer.
- VR baselines for new component stories; e2e smoke for each route; analytics +
  SEO checklist per surface.

### Out of scope

- The search **backend** / ranking / Vectorize (shipped, #2057). No `/api/search`
  change.
- `<FilterTabs>` — already the canonical Phase 2 component; **reused unchanged**
  (8s3 lock).
- New design tokens — **zero** added this phase.
- `/hulp` (Phase 7), and the Phase 9 legacy-token deletion (#1531).

## 3. Locked design decisions (source of truth = the `8*-locked.md` files)

### `/zoeken`

- **Masthead (8s1):** softened **S3 dark masthead** — `jersey-deep-dark` full-bleed
  band (diagonal stripe + radial glow), **no kicker**, serif italic
  **"Wat _zoek_ je?"** (`<EditorialHeading>` accent, **warm-gold** on dark),
  hard-shadow search field (cream input, ink border), **magnifier-icon button**
  (Phosphor `MagnifyingGlass` Fill, warm-gold cell) — no "ZOEK" word. Results on
  cream below.
- **Result rows (8s2):** **clean paper rows**, single column. White card, `1.5px`
  ink border, **5px `jersey-deep` left edge**, `2px 2px` offset shadow, canonical
  press-down hover. Mono micro-label (type · date), bold title, snippet, article
  tags as mono chips, arrow right. **Uniform `64×64` square thumbnail** on every
  type (article = square crop; player/staff = square photo; **team = `jersey-deep`
  crest disc**; missing photo = same initial-disc fallback).
- **Filter row (8s3):** **reuse `<FilterTabs>`** as-is — no redesign.
- **Empty states (8s4):** football voice. **Pre-search** = paper card,
  "Waar ben je naar op **zoek**?" + explainer + three mono type-hint chips.
  **No-results** = paper card + small taped `<JerseyShirt>` + **"Geen treffers."**
  (8s4.1) + body naming the query + inline way-forward links (nieuws · ploegen ·
  spelers). **Loading** = existing `<Spinner>`. **Error** = paper `<Alert>` reskin.

### `/privacy` (8p1)

- **Cream minimal**, no hero band: mono kicker `JURIDISCH` → serif italic
  **"Privacyverklaring."** → mono `Laatst bijgewerkt · {LAST_UPDATED}` → Freight
  Display intro lead → prose column ≈`max-w-2xl`, **ink/cream prose (not gray)**,
  `<DottedDivider>` between H2 sections. Remove `<InteriorPageHero>`,
  `<SectionStack>` `diagonal`, and `prose-gray`. Keep all copy + `/hulp` link +
  `LAST_UPDATED` + SEO metadata.

### 404 / 500 (8e1/8e2)

- **One shared `<ErrorState>`** renders both pages, parameterised by
  `code` / `pun` / `body` / `actions`. Cream bg, reuse the shipped `<JerseyShirt>`.
- **Layout = Storybook A/B (deferred):** build **both** "centered code-as-jersey-
  number" (A) and "scoreboard" (C) as stories → **pause for owner pick** → delete
  the loser → wire the winner into the routes.
- **Copy:** 404 **"Buiten de lijnen."** + actions `Naar de homepage` (→ `/`) and
  **`Zoeken`** (→ `/zoeken`); 500 **"Technische panne."** + actions
  `Probeer opnieuw` (wired to `reset()`) and `Naar de homepage`. Buttons plain;
  wink lives in the headline only.

## 4. Tracer bullet

**`/privacy` cream-minimal reskin** — smallest, lowest-risk vertical slice.
Validates the phase-wide conventions (cream/ink prose tokens, legacy-token +
diagonal removal, e2e smoke contract, `Pages/*` story without VR) before the
meatier search + error work.

## 5. Phases (one issue = one worktree = one PR)

| # | Issue | GitHub | Depends on |
| - | ----- | ------ | ---------- |
| 8.1 | **Tracer:** `/privacy` cream-minimal reskin | #2104 | — |
| 8.2 | `/zoeken` dark masthead + page shell (SearchForm → hard-shadow + icon) | #2105 | #2104 |
| 8.3 | `/zoeken` paper result rows + football-voice empty states | #2106 | #2105 |
| 8.4 | 404/500 `<ErrorState>` — Storybook A/B, pick, wire-in, retire loser | #2107 | #2104 |
| 8.5 | Phase 8 final pass — SEO/analytics/e2e/VR sweep + master-design closeout | #2108 | #2105, #2106, #2107 |

## 6. Acceptance criteria per phase

### 8.1 — Tracer: `/privacy`

- [ ] `privacy/page.tsx` reskinned per 8p1: mono kicker, serif `<EditorialHeading>`
      "Privacyverklaring.", last-updated mono line, intro lead, cream/ink prose,
      `<DottedDivider>` between H2 sections.
- [ ] `<InteriorPageHero>`, `<SectionStack>` `diagonal`, and `prose-gray` removed
      from this page; no legacy `--color-kcvv-*` / `green-*` / `gray-*` classes
      remain in the file.
- [ ] All existing copy, the `/hulp` cross-link, `LAST_UPDATED`, and SEO metadata
      preserved.
- [ ] e2e smoke (`/privacy`) still green; `Pages/Privacy` story updated (no VR tag).
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### 8.2 — `/zoeken` masthead + page shell

- [ ] `zoeken/page.tsx` renders the softened-S3 dark masthead per 8s1: no kicker,
      serif `<EditorialHeading>` "Wat _zoek_ je?" warm-gold accent on
      `jersey-deep-dark`, hint line.
- [ ] `SearchForm` reskinned to the hard-shadow field (cream input, ink border,
      offset shadow) with a **`MagnifyingGlass` Fill** icon button (warm-gold
      cell) — no "ZOEK" text. `@/lib/icons.redesign` only (no lucide).
- [ ] Results region renders on cream below the band; `<FilterTabs>` unchanged.
- [ ] Story for the masthead (`Features/Search/*` or `Pages/Search`); e2e smoke
      green; legacy green-gradient hero removed.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### 8.3 — `/zoeken` result rows + empty states

- [ ] `SearchResult` reskinned per 8s2: paper row, jersey-deep left edge, uniform
      `64×64` square thumb, crest-disc fallback for team / missing photo, mono
      micro-label, tags, arrow, press-down hover. Lucide → Phosphor.
- [ ] `SearchInterface` empty states per 8s4: pre-search paper card (replaces emoji
      help block), no-results card with `<JerseyShirt>` + "Geen treffers." + inline
      links, error `<Alert>` reskin, loading `<Spinner>` kept.
- [ ] Analytics unchanged in shape (existing `search_*`; `trackNoResults` still
      fires on the redesigned no-results state — privacy: query sanitised as today).
- [ ] `Features/Search/*` stories cover every state (pre-search, results, no-results,
      error) and acquire **VR baselines** (`vr` tag, captured in Docker).
- [ ] e2e smoke green; `pnpm --filter @kcvv/web check-all` passes.

### 8.4 — 404/500 `<ErrorState>` (Storybook A/B)

- [ ] One shared `<ErrorState>` (`code`, `pun`, `body`, `actions`) with a
      `layout: "centered" | "scoreboard"` prop; reuses `<JerseyShirt>`; Phosphor
      icons; no lucide.
- [ ] Stories for **both** layouts × both pages (404/500). **Pause for owner
      Storybook review** (build TDD-first, do not wire into routes yet).
- [ ] After owner picks: remove the losing layout branch + its stories; wire the
      winner into `not-found.tsx` (404, copy "Buiten de lijnen." + `/` + `/zoeken`)
      and `error.tsx` (500, "Technische panne." + `reset()` + `/`). `reset()` stays
      wired; `error.tsx` stays `"use client"` + self-contained at the root segment.
- [ ] `UI/ErrorState` (or `Features/*`) story for the chosen layout acquires **VR
      baselines**; e2e smoke for the 404 route still green.
- [ ] `pnpm --filter @kcvv/web check-all` passes.

### 8.5 — Final pass

- [ ] SEO: titles/OG verified on all three surfaces; 404/500 carry `noindex` as
      appropriate; no JSON-LD entity needed (none represent a Schema.org entity).
- [ ] Analytics: optional `error_view` event wired (see §7); search events
      unchanged. Any new param/prefix appended to the GTM regex documented in the
      PR body + tracked in #1974.
- [ ] VR baselines for all new component stories committed; no unexpected diffs on
      unrelated stories.
- [ ] Grep: zero legacy `--color-kcvv-*` / `green-main` / `gray-*` / `prose-gray` /
      lucide on `/zoeken`, `/privacy`, `not-found.tsx`, `error.tsx`.
- [ ] Master-design decision-log entry: "Phase 8 complete — search/privacy/errors
      migrated; only Phase 9 cleanup (#1531) remains."
- [ ] `pnpm --filter @kcvv/web check-all` passes.

## 7. Analytics

`/zoeken` is already instrumented (`useSearchAnalytics`: `search_submitted`,
`search_results_shown`, `search_no_results`, `search_filter_changed`,
`search_result_clicked`). The reskin **keeps the event shape** — the
"Geen treffers." state is still the `search_no_results` path; the new inline
way-forward links can reuse `search_result_clicked` semantics or a small
`search_browse_click` (param `target`). Query text stays sanitised via
`sanitizeQuery`; no PII.

`/privacy` is static — no events.

404/500 (new, user-facing): propose a light **`error_`** prefix —
`error_view` (params `error_code` ∈ {404,500}, `path`) on mount, and
`error_action_click` (param `action` ∈ {home, search, retry}). New prefix →
append `error_` to the live GTM Custom-Event trigger regex; new params need DLVs +
GA4 dimensions. **Manual GTM/GA4 wiring tracked in #1974** (call it out in the 8.5
PR body — events do not reach GA4 until wired). If the owner deems error-page
analytics unnecessary, drop this and note it.

## 8. VR baselines

Per the master-design VR contract (every PR adding a `UI/*` or `Features/*` story
captures baselines in Docker):

- 8.3 — `Features/Search/*` (SearchResult + each SearchInterface state) acquire
  `vr` tag + baselines.
- 8.4 — the chosen `<ErrorState>` layout story acquires `vr` tag + baselines.
- `Pages/Privacy` and `Pages/Search` are **not** VR-tagged (Pages/* are
  e2e-covered, per `docs/prd/page-level-testing-rework.md`).

## 9. Open questions

- **Error-page analytics** (§7): wire `error_*`, or leave error pages
  un-instrumented? Owner call at 8.5.
- **404 search affordance**: a secondary `Zoeken` button vs. an inline body link
  vs. both — final at build (8.4); the lock allows either.

## 10. Discovered unknowns

- `SearchMasthead` as an extracted component vs. inline in `page.tsx` — decide at
  8.2 build (favor extraction if a story is warranted).
- Whether `error.tsx` (root segment) has the fonts/`globals.css` loaded — verify
  the cream/Freight-Display render works without the `(main)` layout; if not,
  ensure the root layout supplies tokens.
