# Redesign — Phase 9: Cleanup (legacy token + orphan retirement)

**Milestone:** redesign-retro-terrace-fanzine (#51)
**Capstone issue:** #1531
**Master design doc:** `docs/plans/2026-04-27-redesign-master-design.md` §7 (rollout), §8 (decision-log)
**Status:** spec'd 2026-06-14

## Context

Phase 9 is the final cleanup of the editorial-redesign series. The original #1531
body assumed _"all consumers have migrated — just delete the tokens."_ A pre-spec
audit (2026-06-14) found that premise is **false**, and surfaced a much larger
dead-code surface than the issue listed. Corrected reality:

- **`<Badge>` / `<PageHero>` are already gone.** No `Badge` component exists
  (retired in Phase 1; `MatchStatusBadge` is self-contained). There is no
  `PageHero` — the live heroes are `InteriorPageHero` / `EditorialHero`. Both
  original "retire these consumers" bullets are no-ops.
- **Legacy tokens still have live consumers.** Before any deletes, **37** files
  use `kcvv-*` colour classes and **24** files use `font-title` / `font-body` /
  `font-alt`. `--font-family-body` (Montserrat) is the **live body font**
  (`body {}` default + 24 consumers), so the issue's "retire Montserrat" was
  wrong.
- **Freight is on the same Adobe Typekit kit** as Quasimoda + Stenciletta
  (`--font-display` / `--font-display-big` → `freight-display-pro` /
  `freight-big-pro`). The `layout.tsx` comment "only serves quasimoda +
  stenciletta" is stale. **Dropping Typekit entirely would break Freight
  site-wide.**
- **There is a large orphan surface beyond the `_legacy/` trio** — feature
  components, design-system primitives, the whole `organigram/shared/` kit, and
  three hooks, all reachable only from their own stories/tests. Verified by a
  production-reachability sweep (knip with stories/tests ignored, then
  per-component import-trace).

Because the legacy tokens cannot be removed while live consumers exist, Phase 9
splits into a **gated capstone (#1531)** plus **two migration spin-outs** that
must land first. A small `_jersey-paths` DRY refactor is logged as a separate,
non-blocking follow-up.

## Goals

- Delete all verified production-orphan code (zero route-reachable consumers).
- Migrate the residual legacy-token consumers onto retro-terrace tokens so the
  legacy tokens can be removed.
- Retire Quasimoda + Stenciletta and trim them from the Adobe Fonts kit, keeping
  Freight served.
- Remove every retired token / utility / legacy global-element rule from
  `globals.css`; leave the codebase on a single (retro-terrace) vocabulary.
- Record a final "redesign complete" entry in the master-design decision-log and
  reconcile `apps/web/CLAUDE.md`.

## Non-goals

- **No new design.** No new primitives, no visual redesign of any surface beyond
  faithful token migration. (Phase 9 ships behind Storybook iteration alone per
  master-design §15 — no design checkpoint.)
- **No body-font change.** Montserrat stays the body/UI font; the "Quasimoda
  flips to body" idea is rejected (it would be a site-wide visible change needing
  a checkpoint).
- **No full reskin of never-redesigned surfaces** beyond the token migration
  needed to clear legacy references (see §7 open question).

## 1. Decomposition & gating

| #                                         | Issue                                                             | Role                                                                           | Blocks / blocked-by                    |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| **#1531**                                 | **Phase 9 capstone**                                              | Phase A safe deletes (now) + Phase B gated token/Typekit retirement + closeout | **blocked-by** font + colour spin-outs |
| **(new) Font spin-out**                   | Migrate `font-title` (Quasimoda) consumers → Freight / Montserrat | unblocks Quasimoda + Typekit-trim                                              | blocks #1531                           |
| **(new) Colour spin-out**                 | Migrate residual `kcvv-*` colour consumers → retro-terrace tokens | unblocks colour-token removal                                                  | blocks #1531                           |
| **(new) `<JerseyIllustration>` refactor** | Extract the duplicated two-pass jersey renderer                   | follow-up, **non-blocking**                                                    | —                                      |

The decomposition decisions (owner, 2026-06-14): **split** (not big-bang);
**#1531 is the gated capstone**; **two spin-outs** (fonts, colours); **final font
stack = Freight / Montserrat / IBM Plex Mono, Typekit trimmed not dropped**.

## 2. Capstone — Phase A: safe deletes (do immediately, not gated)

All items below have **zero route-reachable consumers** (only their own
stories/tests/dead barrels). Verified by import-trace. Delete source + stories +
tests + barrel lines.

### 2.1 Feature-component orphans

- `article/EventStrip/`
- `article/TransferStrip/`
- `article/QASection/` (the live one is the separate `design-system/QASectionDivider`)
- `article/blocks/EventFactStrip/`
- `article/blocks/SubjectsStrip/`
- `article/blocks/TransferFactStrip/`
- `player/PlayerCard/` (the **player** one — `team/SquadGrid/PlayerCard` is live and stays)
- `responsibility/FeedbackWidget.tsx`, `responsibility/RelatedPaths.tsx`,
  `responsibility/ResponsibilityBlock.tsx` (whole responsibility **display**
  layer + its barrel; `/hulp` uses `ResponsibilityRepository` + `HulpFinder`)
- `ui/url-tabs.tsx` (entire `ui/` dir is dead)

### 2.2 `_legacy/` trio

- `home/_legacy/FeaturedArticles/`
- `home/_legacy/HomepageHeroCarousel/`
- `home/_legacy/MatchWidget/`

### 2.3 `organigram/shared/` (entire directory)

`SkipLink`, `MobileBottomNav`, `SearchBar`, `UnifiedSearchBar`,
`ScreenReaderAnnouncer`, `KeyboardShortcuts`, `ContactQuickActions`,
`DepartmentFilter`, `ContactCard` (the shared one — `hulp/HulpFinder/ContactCard`
is the live one). **Keep** the live chart components
(`OrganigramExplorer`, `SpotlightNodeCard`, `VolledigOrganigram`, `HubSearch`,
`StructureDirectory`) — they survive via `/hulp`.

### 2.4 Design-system primitive orphans (owner-confirmed per item)

- **Delete:** `BrandedTabs/` (superseded by live `FilterTabs`),
  `SocialLinks/` (orphan + still on `kcvv-green-bright`; footer uses icons
  directly), `ShieldFigure/`, `PlayerFigure/` (superseded — see §8).
- **Keep:** `Label/` (pairs with the form atoms), the **form cluster**
  (`Input`, `Select`, `Textarea`, `TextareaCounter`, `AlertBadge`, `fieldChrome`)
  — already retro-styled (Phase 2.A.4 Direction C); held for a planned form;
  `Alert` and `Spinner` stay (live).

### 2.5 Export-level orphans (keep the file, drop the dead export + barrel line)

- `article/SubjectAttribution/` → remove the `SubjectAttribution` + `SubjectPhoto`
  **components**; keep `resolveSubject` / `resolvePairRespondent` utils (live).
- `design-system/Divider/` → remove base `Divider` + `SolidDivider` exports; keep
  `DottedDivider` (live: privacy, BodyQuote) + `DashedDivider` (live: CalendarAgenda).
- `design-system/Spinner/` → remove `FullPageSpinner`; keep `Spinner` (live).

### 2.6 Orphan hooks / utils

- `hooks/useKeyboardNavigation.ts`, `hooks/useScrollReveal.ts`,
  `hooks/useSwipeGesture.ts`
- `lib/utils/image.ts`

### 2.7 `<NewsCard>` transitional dead props

Remove `eventDate`, `eventTime`, `countdown`, `isExternal` from `NewsCardProps`
and the render body, plus the `FeaturedEvent` / `FeaturedEventNoImage` stories +
the matching tests. No live route passes these (the live event surface is
`<FeaturedEventBand>`). Keep `variant` (`"standard"` + `"featured"` are both
live); `variant="listing"` is already gone.

### 2.8 Doc reconciliation (in the same PR)

- `apps/web/CLAUDE.md`: the documented `/club/organigram` route no longer exists
  (replaced by `/hulp`) — fix the "Implemented Routes" line. Remove the retired
  primitives from the Phase-N additions notes.

## 3. Capstone — Phase B: gated token + Typekit retirement (blocked-by spin-outs)

Runs only after the font + colour spin-outs land. At that point grep for the
retired identifiers under `apps/web/src/` returns zero (modulo the kept
`font-body`/Montserrat and `font-mono`/IBM Plex).

- Remove all `--color-kcvv-*` tokens (`:root` + `@theme`).
- Remove all `--color-green--*` tokens + the "Legacy CSS Variables" block
  (`--color-black`, `--color-green`, `--color-gray--*`, `--color-gray-blue`, …).
- Remove `--font-family-title` + `--font-family-alt` and the `.font-title` /
  `.font-alt` utility classes (globals.css §"Font Family Utilities"). **Keep**
  `--font-family-body` (Montserrat) + `--font-family-mono` (IBM Plex) and their
  `.font-body` / `.font-mono` utilities — or rename them to non-`-family-`
  tokens if the font spin-out establishes canonical names; nothing visible
  changes either way.
- Rewrite the legacy global-element rules that reference retired tokens:
  - `body { background: var(--color-kcvv-white); color: var(--color-kcvv-gray-dark) }`
    → `bg-cream` / `text-ink` equivalents.
  - `h1–h6 { font-family: var(--font-family-title); color: var(--color-kcvv-gray-blue) }`
    → redesign default (`--font-display` / Freight) + `text-ink`. Verify
    un-redesigned raw headings still read correctly. (The base
    `h1–h6 { margin-bottom: 1em }` is a separate known gotcha —
    `reference_global_h1_margin_bottom` — leave it unless it regresses.)
  - `--cc-bg` / `--cc-font-family` cookie-consent vars currently point at
    `--color-kcvv-black` / `--font-family-body` → repoint to `--color-ink` /
    kept body token.
- Trim the spinner/legacy CSS blocks (`.kcvv-spinner-*`) only if they have no
  remaining consumer (verify `Spinner` first).
- **Typekit:** remove **Quasimoda + Stenciletta** from the Adobe Fonts kit (manual
  dashboard step — document in the PR body and §4). **Keep** the `<Script>`
  loader + `NEXT_PUBLIC_TYPEKIT_ID` (Freight still needs it). Fix the stale
  `layout.tsx` comment to "serves freight-display-pro + freight-big-pro".
- Final `grep` gate + `pnpm --filter @kcvv/web check-all` green.
- Master-design decision-log: add the **"redesign complete"** entry.

## 4. Font end-state & Typekit handling

| Role               | Font                          | Token                                        | Loader                   |
| ------------------ | ----------------------------- | -------------------------------------------- | ------------------------ |
| Display / headings | Freight Display Pro / Big Pro | `--font-display` / `--font-display-big`      | Adobe Typekit (**kept**) |
| Body / UI          | Montserrat                    | `--font-family-body` (kept)                  | `next/font/google`       |
| Mono               | IBM Plex Mono                 | `--font-family-mono` (kept)                  | `next/font/google`       |
| ~~Title~~          | ~~Quasimoda~~                 | retire `--font-family-title` / `.font-title` | trim from kit            |
| ~~Accent~~         | ~~Stenciletta~~               | retire `--font-family-alt` / `.font-alt`     | trim from kit            |

Note: Stenciletta's only direct consumer is the inline
`fontFamily: "stenciletta"` in `player/PlayerCard` — an **orphan being deleted in
Phase A** — so `font-alt`/Stenciletta has zero consumers immediately after the
deletes; the font spin-out only has to handle `font-title` (Quasimoda).

## 5. Colour token mapping (guidance for the colour spin-out)

Starting map — every consumer still needs per-use visual verification (contrast,
`text-white` on `jersey-deep`, "photos in colour not greyscale"):

| Legacy                           | Hex       | Retro target                                                                                    |
| -------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `kcvv-black`                     | `#1e2024` | `ink-soft` (`#1f1f1f`) / `ink` (`#0a0a0a`) for max contrast                                     |
| `kcvv-white`                     | `#fefefe` | `cream` (`#f5f1e6`); keep literal white only where contrast on `jersey-deep` needs `text-white` |
| `kcvv-green-bright`              | `#4acf52` | **`jersey-deep` (`#008755`)** — no bright jersey green (`feedback_no_bright_jersey`)            |
| `kcvv-green` / `kcvv-green-dark` | `#008755` | `jersey-deep`                                                                                   |
| `kcvv-gray`                      | `#62656a` | `ink-muted` (`#6b6b6b`)                                                                         |
| `kcvv-gray-dark`                 | `#292c31` | `ink-soft` / `ink`                                                                              |
| `kcvv-gray-blue`                 | `#31404b` | `ink-soft`                                                                                      |
| `kcvv-gray-light`                | `#ccc`    | `paper-edge` (`#d9d2bd`) borders / `ink-muted` muted text                                       |
| `kcvv-dark-blue`                 | `#1e2836` | `ink` / `jersey-deep-dark` (`#133d28`)                                                          |
| `kcvv-success`                   | `#3adb76` | `jersey` (`#4acf52`) — positive status                                                          |
| `kcvv-warning`                   | `#ffae00` | `warm` (`#f0c264`)                                                                              |
| `kcvv-alert`                     | `#cc4b37` | `--color-alert` / `card-red` (`#c93f1c`)                                                        |

## 6. Spin-out — font migration (blocks #1531)

Migrate the residual `font-title` (Quasimoda) consumers off the legacy class.
**11 files** after Phase A deletes (was 24 — orphan deletes removed the rest):

```text
src/app/(main)/wedstrijd/[matchId]/not-found.tsx
src/components/article/SanityArticleBody/SanityArticleBody.tsx
src/components/article/blocks/EventFact/EventFactOverview.tsx
src/components/article/blocks/TransferFact/TransferFactOverview.tsx
src/components/club/ClubEditorialGrid/ClubEditorialGrid.tsx
src/components/club/ContactPage/ContactPage.tsx
src/components/club/EditorialCard/EditorialCard.tsx
src/components/club/MissionBanner/MissionBanner.tsx
src/components/design-system/SectionCta/SectionCta.tsx
src/components/layout/InteriorPageHero/InteriorPageHero.tsx
src/components/scheurkalender/ScheurkalenderPage.tsx
```

Map each `font-title` use → `font-display` (Freight) for display/heading text, or
`font-body` (Montserrat) for UI/label text, deciding per element. `font-body`
consumers need **no** change (Montserrat is kept). To be spec'd as its own
`ready` issue.

## 7. Spin-out — colour migration (blocks #1531)

Migrate the residual `kcvv-*` colour-class consumers → retro-terrace tokens
(§5). **24 files** after Phase A deletes (was 37):

Two sub-classes —

- **Shipped-redesign components carrying legacy classes as debt** (mechanical
  token swap, low risk): `SectionCta`, `SectionTransition`, `AccentStrip`,
  `InteriorPageHero`, `EditorialCard`, `ClubEditorialGrid`,
  `RelatedArticlesSection`, `SharePage`, `ArticleMetadata`, `SanityArticleBody`,
  `EventFactOverview`, `QaBlock`, `TransferFactOverview`, landing `page.tsx`,
  `getClubSections`.
- **Never-redesigned surfaces** (need care): `staf/[slug]` (page + loading +
  not-found), `tegenstander/[clubId]` (page + loading), `spelers`/`ploegen`
  not-found, `/nieuws` archive (`NewsListingClient` + loading).

**Open question for this spin-out's spec:** do the never-redesigned surfaces get
a faithful token recolour now (to clear legacy refs so #1531 can remove the
tokens), or is their token migration deferred until each gets its own redesign
(in which case #1531's token removal is partial / deferred)? Resolve with the
owner before labelling this spin-out `ready`. To be spec'd as its own issue.

## 8. Follow-up — `<JerseyIllustration>` refactor (non-blocking)

`PlayerFigure` is deleted in Phase A. The genuine duplication it leaves is the
two near-identical inline two-pass renderers — `HeroIllustration` in
`player/PlayerHero` and `CardIllustration` in `team/SquadGrid/PlayerCard` — both
built directly on the shared `_jersey-paths` geometry. Extract them into one lean
`<JerseyIllustration>` sub-component (just the underprint + overprint, no
framing). Separate refactor issue; does **not** block #1531.

## 9. Analytics

No analytics impact — Phase 9 adds no user-facing features or events, and deletes
no instrumented surface (the deleted orphans have no `trackEvent` calls). No GTM
trigger-regex change, no new GA4 dimensions. (Stated explicitly per the
analytics-PRD requirement.)

## 10. Testing & VR

- `pnpm --filter @kcvv/web check-all` green is the gate for both phases.
- Page-level e2e smoke must stay green (deleted orphans are off-route, so no
  route smoke changes; verify no import breaks).
- **VR:** baselines for changed/deleted stories are **deferred to the
  end-of-series batch capture** (standing redesign decision —
  `RUN_VISUAL_REGRESSION` is off; never block on Docker per-PR). The colour
  migration will change many baselines; capture them in the batch, not per-PR.
- Each spin-out PR enumerates its deleted/updated story files.

## 11. Acceptance criteria (capstone #1531)

- [ ] **Phase A** — all §2 orphans deleted (source + stories + tests + barrel
      lines); `<NewsCard>` dead props removed; `apps/web/CLAUDE.md` route +
      primitive notes reconciled.
- [ ] Font + colour spin-outs merged (this issue is **blocked-by** both).
- [ ] **Phase B** — all `--color-kcvv-*`, `--color-green--*`, legacy CSS-var
      block, `--font-family-title` / `--font-family-alt` + `.font-title` /
      `.font-alt` utilities removed; legacy global-element rules rewritten to
      retro tokens.
- [ ] Quasimoda + Stenciletta trimmed from the Adobe Fonts kit (manual step
      documented in the PR body); Typekit loader kept for Freight; stale
      `layout.tsx` comment fixed.
- [ ] `grep` for the retired identifiers under `apps/web/src/` returns zero
      (excluding kept `font-body` / `font-mono`).
- [ ] `pnpm --filter @kcvv/web check-all` green.
- [ ] Master-design decision-log has the final "redesign complete" entry.

## 12. Out of scope

- Body-font change (Montserrat stays).
- Full visual redesign of never-redesigned surfaces (§7).
- The `<JerseyIllustration>` extraction (§8 — separate issue).
- Re-enabling VR / batch baseline capture (separate, end-of-series).

## 13. References

- `docs/plans/2026-04-27-redesign-master-design.md` — §7 rollout, §8 decision-log,
  §15 checkpoint gating.
- `apps/web/CLAUDE.md` — redesign primitive inventory, VR contract.
- `docs/prd/redesign-phase-0.md` §4 — Adobe Typekit kit baseline.
- Pre-spec audits (2026-06-14): legacy-surface map; production-orphan reachability
  sweep.
