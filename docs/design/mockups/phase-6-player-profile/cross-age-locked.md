# 6.d9 · Cross-age availability + privacy — LOCKED

**Decision:** Variant **B — privacy-graded meta** (with L/G correction),
locked 2026-05-21.

**Owner direction at lock time:** _"I prefer B, but is adding this complexity
worth it? If not, go fully for B. Also note: we dont have L/G."_

Two corrections to the round-1 mockup:

1. **Height + weight are not populated.** The fields exist on `player` schema
   (per brief audit 2026-05-14), but the data is not authored in practice.
   Production `<PlayerProfile>` already renders without them. Meta row
   drops to two fields: **position · birthDate** (height + weight + nationality all removed from schema per cleanup sections below).

2. **The complexity I implied was inflated.** Variant B is not "engineering
   work" — it's one render branch:
   `age >= 18 ? fullBirthDate : ageAndYear`. Worth it.

## What this locks

| Decision                          | Locked value                                                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meta-row field list (canonical)   | **`position · birthDate`** (2 fields, age computed at render). Drops `height` + `weight` from the render (schema fields stay, unrendered). Drops `nationality` entirely — see migration below. |
| Adults (≥18) birthDate display    | Full date — `14·03·1999`                                                                                                                                                                       |
| Minors (<18) birthDate display    | Age + year only — `16 jaar · '09`                                                                                                                                                              |
| Photo treatment                   | Same for all ages — psdImage when present (no minor-specific photo gate; not Variant C)                                                                                                        |
| BioBlock / QuotesBlock for minors | Auto-hide via existing data-driven flow + editorial policy (don't author bios for minors)                                                                                                      |
| Age threshold                     | 18 (Belgian majority age)                                                                                                                                                                      |
| Implementation                    | Single age-derived branch in the meta-row renderer; one date-format util switch                                                                                                                |

## L/G correction — REMOVED FROM SCHEMA (revised 2026-05-21)

**Owner direction:** _"same request for height and length. Just do it, we
will never populate these for our teams!"_

Schema fields `player.height` and `player.weight` are removed entirely
(same cleanup model as nationality, smaller blast radius — they were
editorial-only, never PSD-synced).

| Surface                                                         | Was                                                    | Now                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| `<PlayerHero>` meta row                                         | `position · birthDate · height · weight · nationality` | **`position · birthDate`**                                        |
| Brief §2 "Header as poster" final field list (2026-05-14 audit) | Listed 5 fields                                        | Render drops to 2                                                 |
| Schema migration                                                | n/a — fields stay                                      | **Three removals: `nationality`, `height`, `weight`** — see below |

The brief audit captured "fields exist" — this lock captures "fields
render". They are not the same; future audit passes should note both
levels explicitly.

## Nationality removal — full cleanup (revised lock 2026-05-21)

**Owner direction:** _"nationality is not something we want either. Drop
this entirely from mockups, references and schema."_

Unlike `height` / `weight` (kept in schema, just unrendered), nationality
is removed from the schema entirely. Cleanup touches:

| Touch point                                          | Change                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/sanity-schemas/src/player.ts` (line 34)    | Remove field declaration                                                           |
| `apps/web/src/lib/repositories/player.repository.ts` | Remove from GROQ projection + TS types                                             |
| `apps/web/src/lib/sanity/sanity.types.ts`            | Regenerates from queries                                                           |
| `apps/api/src/sync/psd-sanity-sync.ts` (line 34)     | Stop writing nationality on sync                                                   |
| `apps/api/src/sanity/mutation.ts`                    | Remove from mutation payload                                                       |
| `apps/api/src/psd/schemas-player-team.ts`            | **Keep** — that's PSD's response schema, we just stop forwarding                   |
| `apps/studio/migrations/drop-player-nationality/`    | New migration to unset nationality on existing docs                                |
| Test fixtures                                        | Update `psd-sanity-sync.test`, `mutation.test`, `repository.test`, `run-sync.test` |

UI consumers: **zero**. A grep found `player.nationality` is queried but
never read by any React component. Removing it is a pure data-flow
simplification.

## Height + weight removal — full cleanup (revised 2026-05-21)

Same cleanup pattern as nationality, with a smaller blast radius (no PSD
sync code involvement):

| Touch point                                                                              | Change                                                                                          |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/sanity-schemas/src/player.ts` (lines 69-77)                                    | Remove `height` + `weight` field declarations                                                   |
| `apps/web/src/lib/repositories/player.repository.ts` (lines 15, 25, 44-45, 57-58, 77-78) | Remove from GROQ projection + TS types + row mapping                                            |
| `apps/web/src/lib/sanity/sanity.types.ts`                                                | Regenerates from queries                                                                        |
| `apps/studio/migrations/drop-player-physical/`                                           | New migration to unset height + weight on existing docs (use `unset` to clean up authored data) |
| `apps/api/src/psd/schemas-player-team.ts`                                                | **No change** — these aren't PSD fields                                                         |
| `apps/api/src/sync/psd-sanity-sync.ts`                                                   | **No change** — sync never wrote height / weight                                                |
| `apps/api/src/sanity/mutation.ts`                                                        | **No change** — mutation payload never carried them                                             |
| Test fixtures                                                                            | Update `repository.test.ts` if it references height / weight                                    |

UI consumers: **zero**. The values were read by the repository's row
mapper but never surfaced to a React component. Pure data-flow
simplification.

## Phase 6.A scope correction (final)

Schema migrations are no longer "zero". Phase 6.A now ships:

- **One additive:** `pullquote` PT decorator on `player.bio` block marks (6.d5)
- **Three removals:** drop `player.nationality` + `player.height` + `player.weight`

The three removals share a migration script pattern (`unset` on existing
docs) and ship as separate migrations or one combined `drop-player-fields-26-q2`
migration — PRD decision.

"ZERO new editorial backlog" claim still holds — removals are
editor-cost-free.

## Cross-age behaviour summary (final)

```text
Meta row by age (per locked field list above — nationality / height / weight all removed from schema):
  Adult (≥18):   position · birthDate (DD·MM·YYYY)
  Minor (<18):   position · "<age> jaar · '<YY>"

Photo:
  All ages: psdImage when present; <PlayerFigure> illustration when missing
  (per 6.d2 lock — no separate minor gate)

BioBlock:
  Hides when player.bio is empty (~60% of squad)
  Editorial policy: don't author bios for minors

QuotesBlock:
  Hides when bio decorator span #2 is absent
  Editorial policy follows BioBlock

Privacy implications:
  - Full DOB for minors not published
  - Photo still rendered when authored (federation-consent path)
  - No bio / quotes surfaces for minors via editorial policy
```

## Why not C or D

- **C** (no-photo for minors) was more aggressive than the federation
  consent model justifies. PSD photos ARE shared with consent; making
  them invisible on the website would be over-correcting. The federation
  consent model is operative; the website renders within it.
- **D** (minimal hero for minors) renders youth profiles as
  near-empty placeholders. Reads disrespectful ("their page is empty")
  for the same act of registering with the club that earns a full page
  for an A-team player.

B is the defensible default: same shape, same effort, age-graded sensitive
fields.

## Forward path for opt-in privacy controls

A future `player.publicConsent: boolean` field could be added later to
opt-OUT (default true → render normally; flag flip → render reduced).
Out of Phase 6.A scope. Captured here so the design contract doesn't
foreclose it.

## What this does NOT lock

- `player.publicConsent` schema field (deferred)
- Behaviour of search results / squad-grid avatars for minors (Phase 6.B)
- Whether age-threshold of 18 is right (Belgian majority; future PRD
  could revisit if club preference differs)
- Whether height / weight should ever render (data-availability question,
  not design)

## Drill state — DESIGN-DOMAIN COMPLETE

- 6.d0 — Data-reality reconciliation · LOCKED
- 6.d1 — Player-name typography · LOCKED
- 6.d2 — Hero photo fallback · LOCKED
- 6.d2.a — Illustration refinement at hero scale · QUEUED (deferred to Storybook)
- 6.d3 — NIEUW badge · LOCKED (dropped)
- 6.d4 — StatsStrip · LOCKED (dropped)
- 6.d5 — BioBlock PullQuote sourcing · LOCKED
- 6.d5.a — PullQuote presentation · RESOLVED-BY-CASCADE
- 6.d6 — CareerLog · LOCKED (dropped)
- 6.d7 — RecentMatchesGrid · LOCKED (dropped)
- 6.d8 — QuotesBlock · LOCKED (single ink card)
- **6.d9 — Cross-age availability + privacy · LOCKED (Variant B + L/G correction)**

## Remaining work (non-design)

1. **Q6** — Seed matrix for staging verification
2. **Q7** — Master design doc audit (§5.3 + §5.4 + §6.7 + brief)
3. **Q8** — Build slice shape for 6.A
4. **PRD writing** — Phase 6.A PRD with all locks as input
5. **6.d2.a** — PlayerFigure illustration refinement (deferred to Storybook)
