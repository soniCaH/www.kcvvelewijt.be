# 6.d5 · BioBlock PullQuote sourcing — primitive map

**Round 1.** Per-element drill. The BioBlock pairs a paragraph (from
`player.bio` Portable Text, already wired) with an inline jersey-deep
PullQuote on the right column. This drill picks where the quote comes from.

Visual artifact: `round-1-bioblock-pullquote-comparisons.html` — four
variants showing the A-team case (data present) and the bio-empty case
(BioBlock hides) within each column.

## Reference locks consumed

- `docs/design/phase-6-player-profile-brief.md` §2 "Pull quotes"
- `6d0-data-reality/data-reality-locked.md` — Variant C scope
- `packages/sanity-schemas/src/player.ts` — `bio: array<{type: 'block'}>` exists
- `packages/sanity-schemas/src/subject.ts` — `subject.playerRef` ties articles to players
- `[[project_player_profile_all_ages]]` — minors: no quotes from minors
- `[[feedback_inline_emphasis_via_portable_text]]` — inline emphasis uses PT decorators, not flat strings + side fields
- `[[feedback_design_data_audit]]` — render only fields that exist

## Variants

- **A — Derive from related interview.** Reuse `ArticleRepository.findRelated`
  (already wired on `/spelers/[slug]`). Extend `qaBlock` PT with a
  `pullquoteCandidate` decorator; surface the first marked answer.
- **B — Decorator inside `player.bio`.** Extend the existing `bio` Portable
  Text with a `pullquote` decorator. Editor selects a substring; bio and
  quote always coherent (same text, rendered twice).
- **C — New `player.featuredQuote` field.** Independent of bio. Object:
  `{ text: portableText, source: string }`. Maximum editorial flexibility.
- **D — Drop the PullQuote.** BioBlock = kicker + heading + paragraph only.
  Single-column layout. Quotes live exclusively in QuotesBlock (6.d8).

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                                     | Notes                                                                                                               |
| ------- | ------- | -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **A**   | 1       | Low      | Add `pullquoteCandidate` decorator to `qaBlock` PT marks                 | Reuses existing related-articles plumbing. ~30% A-team coverage at launch (interview-dependent).                    |
| **B**   | 1       | Low      | Add `pullquote` decorator to `bio` PT marks                              | Editor opt-in per bio. Same text rendered twice — viewer reads inline highlight + side card.                        |
| **C**   | 1       | Medium   | New `player.featuredQuote: { text: portableText, source: string }` field | Most flexible; cleanest privacy story (field empty for minors = quietly hidden). Adds per-player editorial backlog. |
| **D**   | 0       | Low      | No schema work; remove PullQuote slot from BioBlock                      | Cleanest scope. Quotes live in QuotesBlock (6.d8) only. Loses canonical mockup's bio-as-poster pairing.             |

## Cross-age behaviour (all variants)

Across A/B/C/D, the whole BioBlock hides when `player.bio` is empty. Since
~60% of squad-wide profiles (U6-U21 plus some B-team) likely have empty
bios, **BioBlock is an A-team-mostly section**. This is fine — same
graceful-degradation pattern as the StatsStrip drop in 6.d4. No A/B/C/D
choice changes this behaviour.

## Privacy callout for minors

`[[project_player_profile_all_ages]]` rule: no quotes from minors. Each
variant's exposure:

- **A — interview-derived:** safest. No interview articles exist for U18
  by editorial policy → no quote can leak.
- **B — bio decorator:** editor could mark a quote within a minor's bio.
  Editor must police; no schema-level safeguard.
- **C — featuredQuote field:** editor could populate the field for a minor.
  Editor must police; no schema-level safeguard.
- **D — no quote:** N/A; no surface to leak through.

If A wins, the privacy guarantee comes for free via the data flow. If B
or C wins, editorial guidance must explicitly forbid quotes from minors
(documented in Studio descriptions + PRD).

## Dark-band repurpose candidacy

Each variant A/B/C could host the parked dark-band aesthetic from 6.d4 —
pull the inline jersey-deep PullQuote out to a full-bleed ink band between
paragraphs. That's a **presentation** decision, separate from sourcing.
Park as a follow-up sub-drill (6.d5.a) only if a sourcing variant wins
that justifies the visual treatment. Variant D drops the surface entirely
so the dark-band parking moves to a different downstream surface.

## Things this drill does NOT decide

- Presentation: inline right-column PullQuote (canonical) vs full-bleed dark
  interlude band — deferred to 6.d5.a if sourcing variant wins
- Quote-card tone (jersey-deep canonical; ink and cream PullQuote variants
  exist via existing `<PullQuote tone>` API)
- Number of quotes per bio (single in this drill)
- Whether QuotesBlock (6.d8) is also dropped — separate drill
- Editorial workflow for vetting quotes from minors — handled in PRD /
  Studio guidance
- BioBlock's behaviour when bio exists but no quote source — handled per
  variant; renders paragraph alone

## Drop-section escape hatch

Variant D is the explicit drop-section variant per the 6.d0 lock. If D
wins:

- BioBlock simplifies to a single-column composition
- Editorial backlog stays unchanged (just the existing bio field)
- The two-column "story + voice" rhythm of the canonical mockup is lost
- Quotes still appear on the page via QuotesBlock (6.d8), assuming that
  section survives its own drill
