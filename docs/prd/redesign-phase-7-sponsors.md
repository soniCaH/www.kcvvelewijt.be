# PRD: Redesign Phase 7 — Sponsors (`/sponsors`)

**Status**: Ready for implementation (design locked)
**Date**: 2026-06-07
**Design contract**: `docs/design/mockups/phase-7-sponsors/7-design-summary-locked.md` (rounds `7d0`–`7d5`)
**Epic**: #1529 (Redesign Phase 7) · **Milestone**: `redesign-retro-terrace-fanzine`
**Supersedes**: `docs/prd/sponsors-redesign.md` (delete on landing)

---

## 1. Problem statement

`/sponsors` is a pre-redesign route. Today it renders a dark `kcvv-black` hero + a green
auto-rotating `<SponsorsSpotlight>` carousel + size-graded `<SponsorGrid>`s, all composed through
`<SectionStack>` with `diagonal` transitions — i.e. retired tokens (`kcvv-black`,
`kcvv-green-dark`) and the legacy diagonal seam that the StripedSeam migration is retiring (#1701).

Phase 7 rebuilds it in the retro-terrace-fanzine language with a **grateful** register (the club
thanks its partners; it is not a sales funnel). The homepage `<SponsorsBlock>` already proves the
target tile vocabulary — this PRD brings the full page up to it and folds the two surfaces onto a
shared tile.

## 2. Scope

### In scope (packages touched)

- **`apps/web`** only.
  - Rebuild `src/app/(landing)/sponsors/page.tsx` + `src/components/sponsors/SponsorsPage/` onto
    the locked spine (hero → hoofd grid → unlabeled wall → footer band), dropping `SectionStack` +
    `diagonal` + `getSponsorsSections` + the dark header.
  - New `<SponsorHero>`, `<FeaturedSponsorCard>`, `<SponsorCtaBand>`.
  - Extract the homepage `<SponsorsBlock>`'s inner `SponsorTile` into a shared
    `src/components/sponsors/SponsorTile/` consumed by both the wall and the homepage block.
  - Retire legacy `<SponsorsSpotlight>`, `<SponsorGrid>`, `<SponsorCard>`, `<SponsorLogo>`.
  - `sponsor_*` analytics + GTM regex update.

### Out of scope

- **No Sanity schema change.** Every field the design renders already exists on `sponsor`
  (`name`, `logo`, `url`, `tier`, `featured`, `description`). The hidden legacy `type` field is
  untouched (its tier-fallback bucketing may simply stop being read).
- **No BFF / api-contract change.** Sponsors are read natively from Sanity via
  `SponsorRepository`, not the PSD BFF.
- Homepage `SponsorsSection` behaviour (hoofd+sponsor only) is unchanged beyond consuming the
  extracted shared `<SponsorTile>`.

## 3. Tracer bullet

**Phase 1** below is the tracer: the page renders end-to-end on the new vocabulary (no
`SectionStack`/`diagonal`/dark header) with a headline-only hero + a single reused tile grid,
proving the data path + route + e2e smoke before any new components land.

## 4. Phases

1. **Tracer** — rebuild route + `<SponsorsPage>` skeleton on new vocabulary; extract shared `<SponsorTile>`.
2. **`<SponsorHero>` + `<FeaturedSponsorCard>`** — split hero + marquee.
3. **Tier bodies** — hoofd `<TapedCardGrid>` + unlabeled merged wall + tier/empty logic.
4. **`<SponsorCtaBand>`** + page-level empty states.
5. **Analytics + SEO + legacy retirement** + final VR / check-all.

## 5. Acceptance criteria per phase

### Phase 1 — Tracer (route + skeleton + shared tile)

- [ ] `src/components/sponsors/SponsorTile/` extracted from `<SponsorsBlock>`'s inner tile
      (logo `<Image>` greyscale→hover-colour, italic-name fallback, jersey-deep focus ring,
      optional `url` link) with `SponsorTile.stories.tsx` (`tags: ["vr"]`) + test + barrel.
- [ ] `<SponsorsBlock>` refactored to consume the shared `<SponsorTile>` (no visual change → VR
      baselines for `features-home-sponsorsblock--*` unchanged; if they move, justify).
- [ ] `src/app/(landing)/sponsors/page.tsx` no longer uses `SectionStack` / `getSponsorsSections`
      / `kcvv-black`; renders headline + a `<SponsorTile>` grid of all sponsors on cream.
- [ ] `getSponsorsSections.tsx` + its test deleted; `SponsorsPage` simplified.
- [ ] e2e `/sponsors` smoke stays green; `pnpm --filter @kcvv/web check-all` passes.

### Phase 2 — `<SponsorHero>` + `<FeaturedSponsorCard>`

- [ ] `<SponsorHero>` — split: MonoLabel kicker `ER IS MAAR ÉÉN PLEZANTE COMPAGNIE` +
      `<EditorialHeading>` "Merci aan onze sponsors." (italic display, jersey-deep period) +
      italic-display lead + right-column `<FeaturedSponsorCard>`.
- [ ] **0 featured →** left column spans full width, no card (collapse).
- [ ] `<FeaturedSponsorCard>` — F3: `bg-jersey-deep` mono-caps tab "In de kijker"
      (`border-b-2 border-ink`, `text-cream`/`text-white` per contrast rule) + cream-soft body
      (`border-2 border-ink`, `shadow-paper`) with logo inset → italic name → blurb
      (`description`, ~3-line clamp, omitted when absent) → mono `Bezoek website ↗` when `url`.
- [ ] Marquee selection: **one** sponsor, `tier` order (hoofd→sponsor→sympathisant, untiered last)
      then `name` `localeCompare("nl")`.
- [ ] Logo-absent featured → italic-name fills the inset.
- [ ] Stories (`vr`) cover: featured present, 0-featured collapse, no-logo, no-blurb. Unit tests
      cover selection + collapse branches. VR baselines committed.

### Phase 3 — Tier bodies (hoofd grid + unlabeled wall)

- [ ] Hoofdsponsors: `<MonoLabel>` kicker + paper-edge rule + `<TapedCardGrid>` of large tiles
      (logo or italic-name fallback + italic-display name caption), canonical press-down hover.
- [ ] Merged wall: `sponsor` + `sympathisant` in one **unlabeled** dense `<SponsorTile>` grid,
      ordered `sponsor` before `sympathisant` then `name`; **no header, no blurb, no tier label**.
- [ ] Untiered sponsors fall into the wall.
- [ ] `<StripedSeam colorPair="ink-cream" height="md">` between hero and hoofd.
- [ ] Empty branches: 0 hoofd → wall only; 0 wall → hoofd only. Stories (`vr`) per state + tests.

### Phase 4 — `<SponsorCtaBand>` + empty states

- [ ] `<SponsorCtaBand>` — jersey-deep-dark band (`border-y-2 border-ink`), italic-display heading
      "Ook jouw zaak langs de lijn?" + sub-line + `warm` paper-stamp "Word sponsor +" with
      canonical press-down. Copy finalised (see §7).
- [ ] Legacy `<SponsorCallToAction>` either reskinned into this or retired.
- [ ] 0-sponsors-total state: headline-only hero → reskinned `<SponsorEmptyState>` → CTA band.
- [ ] Stories (`vr`) + tests; `<StripedSeam>` before the band.

### Phase 5 — Analytics, SEO, legacy retirement, final pass

- [ ] Analytics per §6 wired; **`sponsor_` added to the live GTM Custom-Event trigger regex**
      (manual step, called out in PR body).
- [ ] Retire `<SponsorsSpotlight>`, `<SponsorGrid>`, `<SponsorCard>`, `<SponsorLogo>` — files +
      stories + tests + barrel exports; `git grep` confirms zero consumers.
- [ ] Optional `ItemList` JSON-LD of sponsors (keep existing breadcrumb).
- [ ] `Pages/Sponsors` story refreshed (not `vr`); e2e `/sponsors` smoke green.
- [ ] Final `pnpm --filter @kcvv/web check-all` + VR green.

## 6. Analytics

| Event                    | Trigger                            | Params                        |
| ------------------------ | ---------------------------------- | ----------------------------- |
| `sponsor_view`           | `/sponsors` page view              | —                             |
| `sponsor_featured_click` | featured marquee card / link click | `sponsor_id` (hashed), `tier` |
| `sponsor_click`          | any tier/wall tile click           | `sponsor_id` (hashed), `tier` |
| `sponsor_cta_click`      | "Word sponsor +" band button       | —                             |

- GTM: append `sponsor_` to the single live Custom-Event trigger RegEx (do **not** add a new
  trigger). New params (`sponsor_id`, `tier`) need DLVs + GA4 Event-tag param mapping.
- No PII: hash internal Sanity ids via `hashMemberId`; never send raw ids or sponsor `url`.

## 7. Open questions

1. Exact footer-band copy + sub-line wording ("Ook jouw zaak langs de lijn?" is the design draft).
2. `<SponsorCtaBand>` as a new component vs. a reskinned `<SponsorCallToAction>` (lean: fold the
   reskin into the band, retire the old name).
3. Bump `logoUrl` projection from `w=400` → `w=600` for the marquee + hoofd tiles? (wall stays 400).

## 8. Discovered unknowns

- Real per-tier counts are unknown (no speculative Sanity query per API-budget policy) — grids
  must scale gracefully from 0 to many; state-coverage stories enforce this.
- Whether any sponsor currently has `featured=true` with no `description` in production — the
  no-blurb branch is built defensively regardless.
