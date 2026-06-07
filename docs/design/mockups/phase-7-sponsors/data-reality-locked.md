# Phase 7 · /sponsors — Round 0 (DATA REALITY) — LOCKED

**Date:** 2026-06-06
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)
**Supersedes (on landing):** `docs/prd/sponsors-redesign.md`

The first checkpoint locks **what data the design is allowed to render**, before any
voice/IA/detail drilling. Mockups may only show fields the `sponsor` schema actually
provides. Source of truth: `packages/sanity-schemas/src/sponsor.ts`.

---

## 1. Schema fields (the only renderable data)

| Field                       | Type                   | Reality for design                                                                       |
| --------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `name`                      | string, **required**   | Always present. Primary content + the missing-logo fallback.                             |
| `logo`                      | image, **optional**    | **May be absent** → italic-display name fallback. Repo projects `logoUrl` at `w=400`.    |
| `url`                       | url, optional          | Outbound link. Not guaranteed — tile is non-interactive when absent.                     |
| `tier`                      | enum, **warning-only** | `hoofdsponsor` / `sponsor` / `sympathisant`. **May be absent** — untiered records exist. |
| `featured`                  | boolean                | Drives the "In de kijker" band (see §4). Orthogonal to `tier`.                           |
| `description`               | text, optional         | Spotlight blurb only — surfaces **nowhere except** the featured band.                    |
| `type`                      | legacy, hidden         | crossing/green/white/panel/other. Only a **tier fallback** for untiered legacy records.  |
| `active`                    | boolean                | Only `active == true` is queried (`SPONSORS_QUERY`).                                     |
| `metaDescription`/`ogImage` | SEO                    | Not page content.                                                                        |

**No other fields exist.** No address, no "sponsor since", no category copy, no
contact. Do not fabricate any of these in a mockup (`feedback_design_data_audit`).

## 2. Tier model (locked)

The saved-memory "main / second / regular" labels are **conceptual aliases** — the real
enum is Dutch:

| Schema value   | Alias   | Intended weight on /sponsors        |
| -------------- | ------- | ----------------------------------- |
| `hoofdsponsor` | main    | Largest cells / strongest hierarchy |
| `sponsor`      | second  | Medium cells                        |
| `sympathisant` | regular | Densest grid (smallest cells)       |

- **Untiered records default to the lowest tier** (`sympathisant`), preserving the
  current page's fallback behaviour. `type`-based legacy bucketing may be dropped at IA time.
- Tier ordering for sorting: `hoofdsponsor (0) → sponsor (1) → sympathisant (2)`, then
  `name` `localeCompare(nl)` — matches `<SponsorsBlock>`.

## 3. Reuse map (existing primitives — `feedback_reuse_approved_primitives`)

| Asset                                               | State                                                   | Disposition                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<SponsorsBlock>` (homepage)                        | **Redesign-ready**                                      | `bg-cream-deep`, `<SectionHeader>`, `bg-cream-soft` tiles, greyscale→hover-colour, italic-name fallback, jersey-deep focus ring. The **dense-grid primitive** the sympathisant tier reuses. |
| `formatSponsorAlt`                                  | Reusable                                                | Alt-text helper — keep.                                                                                                                                                                     |
| `<SponsorsSpotlight>`                               | **Legacy** (`kcvv-green-dark`, carousel, rounded, blur) | Rebuild for the "In de kijker" band.                                                                                                                                                        |
| `<SponsorGrid>` / `<SponsorCard>` / `<SponsorLogo>` | **Legacy** (size props, showNames)                      | Rebuild as `<TapedCardGrid>`-based tiers.                                                                                                                                                   |
| `SponsorsPage` + `getSponsorsSections`              | **Legacy** (`SectionStack` + `diagonal`, `kcvv-black`)  | Rebuild; `diagonal` is retiring → `<StripedSeam>`.                                                                                                                                          |
| `<SponsorCallToAction>` / `<SponsorEmptyState>`     | Legacy chrome                                           | Reskin in place.                                                                                                                                                                            |

## 4. Decisions taken at this checkpoint

1. **Hero is a sponsor-specific sibling, NOT `<EditorialHero variant="generic">`.**
   Master plan §6.8 specifies a `generic` EditorialHero, but `EditorialHero` is locked to
   articleTypes only — there is no `generic` variant, and §5.4 mandates a sibling hero per
   non-article surface (precedents: `<TeamHero>`, `<EventHero>`). The sponsors hero will be a
   lightweight composition (kicker + `<EditorialHeading>` + lead), drilled in the voice round.
   The master plan predates this lock.

2. **The "In de kijker" featured band STAYS in scope; visual treatment deferred.**
   It is a `/sponsors`-only band (homepage never reads `featured`), driven by `featured` +
   `description`, orthogonal to tier. Its exact form gets its own drill round after the
   hero + tier voice is settled. The legacy auto-rotating carousel is **not** carried over.

3. **Greyscale-by-default → full colour on hover/focus is locked** for every logo site-wide
   (master-plan decision 16, `filter: grayscale(100%)` + `--motion-base`). Already implemented
   in `<SponsorsBlock>`.

4. **Logos are the primary asset.** Italic display (Freight → Fraunces in mockups) name
   treatment is reserved for headlines, tier kickers, captions, and the missing-logo fallback.

## 5. Carry-forward into the VOICE round (7.d1)

- What register frames the page: gratitude, institutional honour-board, pitchside
  advertising-boards, or partnership/recruitment?
- Headline candidate: master plan offers both `Merci aan onze sponsors.` (decision 12) and
  `Onze sponsors.` (§6.8) — voice round picks the register, headline follows.
- Where the "Word sponsor" CTA sits (foregrounded vs. footer) is voice-dependent — defer.
