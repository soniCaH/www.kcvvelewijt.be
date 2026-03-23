# PRD: Sponsors Section Redesign

**Parent issue:** #816
**Design reference:** `docs/mockups/homepage-v2.html` (sponsors section)
**Epic:** #807 (visual redesign)

## 1. Problem Statement

The sponsors section — both the homepage block and the dedicated `/sponsors` page — was built with AI-generated component soup: emoji badges, gradient tier labels (gold/silver/bronze), a carousel spotlight, a benefits grid with emoji icons, and filter/search UI that nobody uses. The visual language clashes with the dark, diagonal-cut design system used across the rest of the site. The Sanity schema uses legacy field names (`crossing`, `training`, `white`, `green`, `panel`, `other`) that map to physical panel locations at the club and no longer carry meaning for editors. Sponsors should feel like a clean, confident showcase — not a template demo.

## 2. Scope

**Packages:** `apps/web`, `apps/studio`

**In scope:**

- Sanity `sponsor` schema: replace `type` field with `tier` (`hoofdsponsor` | `sponsor` | `sympathisant`), add `featured` boolean
- Homepage sponsors section: dark green bg, diagonal transition (conditional on bannerSlotC), semi-transparent white slots, flex-wrap layout, shows hoofdsponsor + sponsor tiers at same size
- Sponsors page: kill stats/tiers/filters, add intro text, restyle spotlight (dark, diagonal, only when featured sponsors exist), size-differentiated logo grid (no labels), minimal dark CTA with diagonal
- Component cleanup: delete `SponsorsTier`, `TierDivider`, `SponsorsFilters`, `SponsorsWithFilters`, `SponsorsStats`
- Storybook stories updated for all changed/new components
- Tests updated

**Out of scope:**

- Sponsor logo asset cleanup (dimensions, transparency) — editorial work
- Footer sponsor logos (if any exist separately)
- Sanity migration tooling — manual re-tagging of ~30 sponsors by editor
- `packages/api-contract` or `apps/api` — sponsors come from Sanity, not the BFF

## 3. Tracer Bullet

Update the Sanity `sponsor` schema (add `tier` + `featured` fields, deprecate `type`). Update the GROQ query to fetch `tier` and `featured`. Render the homepage sponsors section with dark green bg and semi-transparent white logo slots using hardcoded test data, proving the dark-variant card styling works end-to-end. No diagonal yet, no sponsors page changes, no component deletion.

## 4. Phases

```
Phase 1: Sanity schema + homepage sponsors dark section (tracer bullet)         — #1013
Phase 2: Sponsors page redesign (intro, spotlight restyle, size-differentiated grid, CTA) — #1014 (blocked by #1013)
Phase 3: Component cleanup + diagonal transitions                               — #1015 (blocked by #1014)
```

## 5. Acceptance Criteria

### Phase 1: Sanity schema + homepage sponsors dark section

- [ ] Sanity `sponsor` schema has `tier` field with values `hoofdsponsor`, `sponsor`, `sympathisant`
- [ ] Sanity `sponsor` schema has `featured` boolean field (default `false`)
- [ ] Legacy `type` field kept temporarily for backward compat during migration (hidden or deprecated in Studio UI)
- [ ] GROQ query fetches `tier` and `featured` fields
- [ ] `SanitySponsor` type in `SanityService` includes `tier` and `featured`
- [ ] `Sponsor` interface gains `tier: "hoofdsponsor" | "sponsor" | "sympathisant"` field
- [ ] Homepage sponsors section: `bg-kcvv-green-dark`, `SectionHeader` dark variant with title "Onze sponsors", link "Alle partners" → `/sponsors`, `border-kcvv-green-bright` accent
- [ ] Logo slots: semi-transparent white bg (`bg-white/15`), logos in original colors (no `filter invert`)
- [ ] Flex-wrap centered layout with gap
- [ ] Only `hoofdsponsor` + `sponsor` tier sponsors shown on homepage
- [ ] Storybook story updated for homepage `SponsorsSection`
- [ ] `SponsorCard` dark variant updated: white slot instead of invert
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 2: Sponsors page redesign

- [ ] `SponsorsStats` component removed from page (component deletion in Phase 3)
- [ ] Intro text below `PageTitle`: short paragraph thanking/pitching sponsors
- [ ] `SponsorsSpotlight` restyled: dark green bg, only renders when ≥1 sponsor has `featured: true`
- [ ] Main grid: light bg, three visual size groups (hoofdsponsor largest → sponsor medium → sympathisant smallest), no headings, no tier labels, no dividers
- [ ] Logos only, no sponsor names shown
- [ ] `SponsorCallToAction` redesigned: dark green bg, headline "Word sponsor", one sentence, primary button (`mailto:sponsoring@kcvvelewijt.be`), secondary link (`/contact`)
- [ ] No filters, no search, no sort
- [ ] Storybook stories updated for `SponsorsPage`, `SponsorsSpotlight`, `SponsorCallToAction`
- [ ] `pnpm --filter @kcvv/web check-all` passes

### Phase 3: Component cleanup + diagonal transitions

- [ ] Delete: `SponsorsTier`, `TierDivider`, `SponsorsFilters`, `SponsorsWithFilters`, `SponsorsStats`, `SponsorEmptyState` (if unused)
- [ ] Delete associated Storybook stories and test files
- [ ] Barrel export (`sponsors/index.ts`) updated — no dead exports
- [ ] Homepage: diagonal `SectionTransition` between bannerSlotC and sponsors section (only when bannerSlotC exists)
- [ ] Sponsors page: diagonal transition above CTA section
- [ ] Sponsors page: diagonal transition above spotlight section (when rendered)
- [ ] All dead code removed, no unused imports
- [ ] Sanity `type` field removed (only if migration is complete — coordinate with editor)
- [ ] `pnpm --filter @kcvv/web check-all` passes

## 6. Effect Schema / api-contract Changes

None. Sponsors are fetched directly from Sanity via `SanityService` in `apps/web`. No BFF involvement.

## 7. Open Questions

- [ ] Sanity `type` field removal timing — depends on when editor has re-tagged all ~30 sponsors to new `tier` values. Phase 3 acceptance criterion is conditional. — **Resolved by editor confirmation**
- [ ] Exact intro text copy for sponsors page — placeholder drafted, final copy from editor. — **Non-blocking, can iterate**
- [ ] `SponsorsSpotlight` restyle details — dark green bg is decided, but exact card layout within the dark section TBD during implementation. — **Resolved by implementation**
- [ ] Should `SponsorEmptyState` survive cleanup? Only relevant if Sanity has zero active sponsors. — **Decide during Phase 3**

## 8. Discovered Unknowns

_Filled during implementation._
