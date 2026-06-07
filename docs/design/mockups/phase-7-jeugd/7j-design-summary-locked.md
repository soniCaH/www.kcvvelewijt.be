# Phase 7 · /jeugd — DESIGN SUMMARY (LOCKED)

**Date:** 2026-06-07
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)
**Supersedes (on landing):** `docs/prd/jeugd-landing-page.md`
**Drill record:** `7j0`–`7j3` lock docs + `7j0b` verification + `*-compare.html` + `7j-final-page.html`.

The `/jeugd` redesign in the retro-terrace-fanzine system. Audience: **parents**. Register:
**development through plezier** — serious opleiding, fun as the engine. Non-commercial.

---

## 1. Final page spine

```text
/jeugd  (cream paper, parent-facing, NO sponsors, NO trainers grid)
├─ <JeugdHero> (split)
│   ├─ left:  MonoLabel "DE JEUGDOPLEIDING · U6 TOT U21"
│   │         + EditorialHeading "Beter worden begint met plezier."
│   │         + lead "Een doordachte opleiding … met gediplomeerde trainers en plezier als motor…"
│   └─ right: youth team/training photo in <TapedFigure> (newsprint)
├─ <StripedSeam>
├─ Filosofie / visie  (#visie anchor) — PullQuote/TapedCard, the jeugdvisie copy
├─ Nav hub  (reskinned <JeugdEditorialGrid>) — uniform 16:9, fixed-position bubbling
│     · NEWS cards (photographic, jersey-deep tag) ← bubble latest Jeugd articles
│     · NAV cards (jersey-deep glyph panel, cream tag, NO photo) ← pinned: word lid ·
│       jeugdvisie→#visie · trainingen/PSD · organigram · hulp · medisch
├─ Divisions — <YouthDirectory> Bovenbouw / Middenbouw / Onderbouw (reuse 6.C)
└─ <JeugdCtaBand> — jersey-deep-dark "Interesse in onze jeugd?" + "Schrijf je in" → /hulp
```

## 2. Locked decisions (index)

| Round | Lock                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7j0   | Data reality: 3 sources (jeugdLandingPage cards · youth teams · Jeugd articles); reuse YouthDirectory (retires TeamOverview/TeamCard); sibling hero; voice = for parents |
| 7j0b  | Verification: editorial grid IS the nav hub (6 nav + 3 articles); 3 dead routes repointed; hero = photo; filosofie/visie STAYS (absorbs jeugdvisie)                      |
| 7j1   | Voice = "Beter worden begint met plezier." (BD3 title + BD2 lead); artefact = youth photo; keep "gediplomeerde trainers"                                                 |
| 7j2   | Order = Hero → Visie → Nav hub → Divisions → CTA                                                                                                                         |
| 7j3   | Nav hub = uniform 16:9 image-top cards, fixed-position bubbling (articles auto-fill slots, nav pinned)                                                                   |
| —     | Nav cards visually distinct from news cards (per /nieuws variant precedent): NEWS = photographic + jersey-deep tag; NAV = jersey-deep graphic panel + glyph + cream tag  |

## 3. Derived detail specs (mapped to primitives — NOT re-drilled)

- **Hero:** `<EditorialHeading>` (italic display, jersey-deep period) + `<MonoLabel>` kicker +
  `<TapedFigure>` youth photo (newsprint filter, `landscape-4-3` or `16-9`). Split mirrors the
  sponsors `<SponsorHero>` structure.
- **Nav-hub cards (uniform 16:9 image-top):**
  - **News variant** — `<TapedFigure>`-style 16:9 cover photo, greyscale→hover-colour,
    jersey-deep tag pill, italic-display title, mono "Lees meer →".
  - **Nav variant** — 16:9 `bg-jersey-deep` panel (no photo) with a Phosphor-fill glyph
    (`@/lib/icons.redesign`) + cream tag pill + italic-display title + mono arrow. `text-white`
    on jersey-deep (contrast rule). One distinct, coherent variant — not a new vocabulary.
  - Both: `border-2 border-ink`, `shadow-paper`, canonical press-down hover.
  - **Tag pill — editorially managed (per variant; see 7j3 data audit for the full rule):** news
    cards use `article.tags[0]` → `Jeugd`; nav cards use `editorialCards.tag` → the card's hardcoded
    `NAV_CARDS` label (e.g. `Praktisch`). `editorialCards.tag` is **not** read for news/article cards.
    Real CMS data, not invented (7j3 refinement). News pill = jersey-deep on photo; nav pill = cream
    on the jersey-deep panel.
  - Fixed-position template preserved; `cardType` selects variant + bubbling; `position` =
    placement order only (no longer drives size).
- **Filosofie/visie:** `<PullQuote>` or a `<TapedCard>` block, jersey-deep quote mark, italic
  display body, `#visie` id. Copy distinct from the hero lead. Replaces `<MissionBanner>`.
- **Divisions:** reuse `<YouthDirectory>` verbatim (6.C locked) — Bovenbouw/Middenbouw/Onderbouw
  age chips → `/ploegen/[slug]`.
- **CTA band:** mirror the locked sponsors `<SponsorCtaBand>` chrome (jersey-deep-dark,
  `border-y-2 border-ink`, warm paper-stamp button, canonical press-down). Target → `/hulp`
  (see §6 open).
- **Hover / focus / border triples:** identical conventions to the sponsors summary §3.

## 4. Empty states

- **0 youth teams:** `<YouthDirectory>` already hides empty division groups; if all empty, drop the
  divisions section.
- **0 Jeugd articles:** the nav hub's article slots fall back to nav-only (current
  `buildItemsFromHardcoded` behaviour) — no empty article cards.
- **0 editorialCards (singleton unset):** fall back to the hardcoded nav set (repointed targets).

## 5. Build deltas (PRD seed)

**New (under `apps/web/src/components/jeugd/`):**

- `<JeugdHero>` — sibling hero (kicker + EditorialHeading + lead + `<TapedFigure>` photo).
- `<JeugdCtaBand>` — or reuse a shared CTA band extracted with `<SponsorCtaBand>`.

**Reskin / reuse:**

- `<JeugdEditorialGrid>` → nav hub: uniform 16:9, two card variants (news/nav), fixed-position
  bubbling preserved. `<EditorialCard>` reskinned (or a new `<JeugdHubCard>`) to 16:9 image-top
  TapedCard chrome with `variant: "news" | "nav"`.
- `<MissionBanner>` → reskinned into the filosofie/visie block (or replaced by `<PullQuote>`).
- `<YouthDirectory>` (6.C) — reuse verbatim → **retires `<TeamOverview>` + `<TeamCard>`** (unblocks
  half of #1960).
- `/jeugd/page.tsx` — drop `SectionStack` + `getJeugdSections` + `InteriorPageHero` + `SectionCta`
  (legacy `kcvv-black`/`diagonal`); recompose on the locked spine with `<StripedSeam>`.

**Repoint dead targets (no new routes):** jeugdvisie → `#visie`; medisch → a Jeugd article or
`/hulp`; word lid + CTA → `/hulp` (or mailto). Editor can override via the singleton.

**Data / repositories:** `TeamRepository` (youth) + `ArticleRepository` (Jeugd, limit 3) +
`JeugdLandingPageRepository` (editorialCards) — all exist, **no change**. `groupTeamsForLanding`
for divisions.

**Analytics (required):** `jeugd_view` (page view), `jeugd_card_click` (params: `card_type`
news/nav, `tag`, hashed article id for news). **Add `jeugd_` to the live GTM trigger regex**
(manual step). No PII.

**Testing:** stories + `vr` for `<JeugdHero>`, the nav-hub card (news + nav variants), the
filosofie/visie block, `<JeugdCtaBand>` (+ empty states). Pages/\* story (not vr) + e2e `/jeugd`
smoke already exists.

## 6. Open for PRD time (not design)

- **CTA + "word lid" target:** defaulting to `/hulp`; revisit if/when the membership intake form
  (#1473) ships.
- **medisch** card target: a specific Jeugd article slug vs `/hulp`.
- Whether `<JeugdCtaBand>` and `<SponsorCtaBand>` share one extracted `<CtaBand>` primitive.
- Hero photo aspect (`16-9` vs `4-3`) + which youth photo asset.
