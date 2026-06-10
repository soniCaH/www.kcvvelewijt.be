# PRD: Redesign Phase 7 — Jeugd (`/jeugd`)

**Status**: Ready for implementation (design locked)
**Date**: 2026-06-07
**Design contract**: `docs/design/mockups/phase-7-jeugd/7j-design-summary-locked.md` (rounds `7j0`–`7j3` + `7j0b`)
**Epic**: #1529 (Redesign Phase 7) · **Milestone**: `redesign-retro-terrace-fanzine`
**Supersedes**: `docs/prd/jeugd-landing-page.md` (delete on landing)

---

## 1. Problem statement

`/jeugd` is a pre-redesign route: a dark `kcvv-black` `InteriorPageHero` + `SectionStack` with
`diagonal` transitions + a dark `<TeamOverview>` youth grid + a green `<MissionBanner>` + a legacy
`<SectionCta>`. Retired tokens, retiring diagonal seam.

Phase 7 rebuilds it for **parents** in the retro-terrace-fanzine language with a **development-through-
plezier** register, reusing the 6.C `<YouthDirectory>` (which **retires `<TeamOverview>`/`<TeamCard>`
→ unblocks half of #1960**). Non-commercial: **no sponsors, no trainers grid** (locked 7j0).

## 2. Scope

### In scope (`apps/web` only)

- Rebuild `src/app/(landing)/jeugd/page.tsx` onto the locked spine (drop `SectionStack` +
  `getJeugdSections` + `InteriorPageHero` + `SectionCta`); use `<StripedSeam>`.
- New `<JeugdHero>` (photo) + `<JeugdCtaBand>`.
- Reskin `<JeugdEditorialGrid>` → **nav hub**: uniform 16:9 image-top cards, two variants
  (news photographic / nav graphic), fixed-position bubbling preserved.
- Filosofie/visie block (`#visie`) replacing `<MissionBanner>`.
- Reuse `<YouthDirectory>` (6.C); retire `<TeamOverview>`/`<TeamCard>`.
- Repoint dead nav/CTA targets (7j0b).
- `jeugd_*` analytics + GTM regex.

### Out of scope

- **No Sanity schema change.** `jeugdLandingPage.editorialCards` reused as-is (render changes only:
  uniform 16:9, `position` = placement not size).
- **No new routes.** `/jeugd/visie` → `#visie` anchor; `/jeugd/medisch`, `/club/inschrijven` →
  existing surfaces (`/hulp` / a Jeugd article). Building a real membership form is #1473, separate.
- **No BFF change.** Youth teams + articles read from Sanity via existing repositories.
- Board pages / organigram / geschiedenis (other Phase 7 landings) — separate.

## 3. Tracer bullet

**Phase 1**: rebuild the route + page skeleton on the new vocabulary (no SectionStack/diagonal/dark
hero), swap `<TeamOverview>` for `<YouthDirectory>`, render the existing nav cards in a plain
cream grid. Proves route + data + e2e before new components land.

## 4. Phases

1. **Tracer** — route rebuild + `<YouthDirectory>` swap (retires TeamOverview/TeamCard).
2. **`<JeugdHero>` (photo) + filosofie/visie block** (`#visie`).
3. **Nav hub** — reskin to uniform 16:9 + news/nav card variants + bubbling + repointed targets.
4. **`<JeugdCtaBand>`** + empty states + repoint "word lid".
5. **Analytics + SEO + legacy retirement** + final VR / check-all.

## 5. Acceptance criteria per phase

### Phase 1 — Tracer

- [ ] `/jeugd/page.tsx` no longer uses `SectionStack` / `getJeugdSections` / `InteriorPageHero` /
      `kcvv-black`; renders on cream with a temporary plain composition.
- [ ] `<YouthDirectory>` renders the division grid (Bovenbouw/Middenbouw/Onderbouw via
      `groupTeamsForLanding`); `<TeamOverview>`/`<TeamCard>` removed from `/jeugd`.
- [ ] `getJeugdSections.tsx` (+ test) deleted.
- [ ] e2e `/jeugd` smoke green; `pnpm --filter @kcvv/web check-all` passes.

### Phase 2 — Hero + filosofie/visie

- [ ] `<JeugdHero>` — MonoLabel kicker `DE JEUGDOPLEIDING · U6 TOT U21` + `<EditorialHeading>`
      "Beter worden begint met plezier." + lead (incl. "gediplomeerde trainers") + right-column
      `<TapedFigure>` youth photo.
- [ ] Filosofie/visie block with `id="visie"` (PullQuote/TapedCard), copy distinct from the hero
      lead; replaces `<MissionBanner>`.
- [ ] `<StripedSeam>` between hero and visie. Stories (`vr`) + tests; VR baselines committed.

### Phase 3 — Nav hub

- [ ] `<JeugdEditorialGrid>` reskinned: uniform **16:9 image-top** cards; **fixed-position bubbling**
      preserved (article slots auto-fill latest Jeugd articles; nav cards pinned).
- [ ] Two card variants: **news** (photographic, jersey-deep tag, **newsprint colour** —
      greyscale→hover is sponsor-logo-only, corrected 2026-06-10) vs **nav**
      (jersey-deep glyph panel via `@/lib/icons.redesign`, cream tag, `text-white`, no photo).
- [ ] Tag pill (both variants) is **editorially managed**: news/article cards use `article.tags[0]`
      → `Jeugd` (`editorialCards.tag` is **not** read for article slots); nav cards use
      `editorialCards.tag` → the card's hardcoded `NAV_CARDS` label (e.g. `Praktisch`).
      `editorialCards.tag` stays in use for nav cards.
- [ ] `position` drives placement/order only (not size); `cardType` selects variant + bubbling.
- [ ] Repointed targets: jeugdvisie → `#visie`; medisch → Jeugd article / `/hulp`; word lid →
      `/hulp` (or mailto). Editor overrides via the singleton still honoured.
- [ ] Stories (`vr`) cover news + nav variants + the no-articles fallback. Tests for the build logic.

### Phase 4 — CTA band + empty states

- [ ] `<JeugdCtaBand>` — jersey-deep-dark (`border-y-2 border-ink`), "Interesse in onze jeugd?" +
      "Schrijf je in +" paper-stamp, canonical press-down; target `/hulp` (see open §7). Shares
      chrome with `<SponsorCtaBand>` (extract a `<CtaBand>` if clean).
- [ ] Empty states: 0 divisions → drop section; 0 articles → nav-only hub.
- [ ] `<StripedSeam>` before the band. Stories (`vr`) + tests.

### Phase 5 — Analytics, SEO, legacy retirement, final pass

- [ ] `jeugd_view` + `jeugd_card_click` (`card_type`, `tag`, hashed article id) wired;
      **`jeugd_` added to the live GTM Custom-Event trigger regex** (manual, called out in PR).
- [ ] Retire `<TeamOverview>` + `<TeamCard>` (files + stories + tests + barrels); `git grep`
      confirms zero consumers → **comment on #1960** (its youth-grid half is now unblocked).
- [ ] Retire/relocate `<MissionBanner>`, `<SectionCta>`, `<InteriorPageHero>` if `/jeugd` was the
      last consumer (`git grep` first; some may still back other pages — keep if so).
- [ ] Keep breadcrumb JSON-LD; metadata exists. `Pages/Jeugd` story refreshed (not `vr`).
- [ ] Final `pnpm --filter @kcvv/web check-all` + VR green.

## 6. Analytics

| Event              | Trigger            | Params                                                          |
| ------------------ | ------------------ | --------------------------------------------------------------- |
| `jeugd_view`       | `/jeugd` page view | —                                                               |
| `jeugd_card_click` | nav-hub card click | `card_type` (news/nav), `tag`, `article_id` (hashed, news only) |

GTM: append `jeugd_` to the single live trigger RegEx. DLVs + GA4 mapping for `card_type`/`tag`.
No PII — hash internal ids.

## 7. Open questions

1. CTA + "word lid" target: defaulting to `/hulp`; revisit when membership form (#1473) ships.
2. "medisch" card target: specific Jeugd article slug vs `/hulp`.
3. Extract a shared `<CtaBand>` from `<SponsorCtaBand>` + `<JeugdCtaBand>`?
4. Hero photo aspect (`16-9` vs `4-3`) + which youth asset.

## 8. Discovered unknowns

- Production `jeugdLandingPage` singleton hrefs not verified (Sanity budget) — the hardcoded
  fallback ships repointed targets regardless.
- Whether `<MissionBanner>`/`<InteriorPageHero>`/`<SectionCta>` have other consumers — `git grep`
  at retirement time; keep any still in use.
