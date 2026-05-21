# 6.d8 · QuotesBlock — primitive map

**Round 1.** Final per-element drill. §5.3 specs a 2-card pair
(`<PullQuote tone="ink">` + `<PullQuote tone="cream">`). With
RecentMatchesGrid dropped at 6.d7, QuotesBlock is the **only remaining
home for the parked 6.d4 dark-band aesthetic**.

Visual artifact: `round-1-quotesblock-comparisons.html` — four variants
showing the A-team case and the bio-empty / youth case (auto-hide).

## Reference locks consumed

- `docs/design/phase-6-player-profile-brief.md` §2 "Pull quotes" + §5 Q5
- `6d0-data-reality/data-reality-locked.md` — Variant C scope (now schema-empty)
- `6d4-statsstrip/statsstrip-locked.md` — dark band parked
- `6d5-bioblock-pullquote/bioblock-pullquote-locked.md` — bio PT decorator (Variant B locked, A "impossible")
- `6d7-recentmatches/recentmatches-locked.md` — RecentMatches dropped; QuotesBlock is last dark-band candidate
- `[[project_player_profile_all_ages]]` — no quotes from minors

## Variants

- **A — Extend bio decorators (2 quotes).** Same `pullquote` PT decorator
  from 6.d5. Spans #2 and #3 from `player.bio` populate the ink + cream
  pair. Zero new schema. Extends the locked pattern.
- **B — `featuredQuotes[]` new field.** New
  `player.featuredQuotes: array<{text, source}>` (length 0-2). Quotes
  independent of bio; per-player editorial backlog.
- **C — Single quote, ink only.** Bio decorator span #2 → one full-width
  ink card. Halves the editorial bar vs A. Loses pair rhythm but keeps
  the dark-band home.
- **D — Drop entirely.** No QuotesBlock. Dark-band aesthetic retires.
  Page composition reaches its minimum: Hero + BioBlock + chrome.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                                             | Notes                                                                                                |
| ------- | ------- | -------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **A**   | 0       | Low      | Reuses 6.d5 decorator; spans #2 + #3 populate the pair                           | "Intuitive + least invasive" reasoning that won 6.d5 applies here too.                               |
| **B**   | 1       | Medium   | New `featuredQuotes: array<{text, source}>` field + per-player editorial backlog | Same cost class that lost out at 6.d6 CareerLog. Likely fails the same editorial-cost-aversion test. |
| **C**   | 0       | Low      | Reuses 6.d5 decorator; span #2 only → single full-width ink card                 | Halves the bio decorator bar (need ≥2 marks instead of ≥3). Dark band lives here naturally.          |
| **D**   | 0       | Low      | Removes the section; dark band retires from the page entirely                    | Continues the 5-drop trend. Page composition becomes Hero → BioBlock → footer.                       |

## Dark-band home decision

Per the 6.d4 parking, the dark band's home is decided here:

- **A**: lives in the left (ink) card of the pair
- **B**: lives in the left (ink) card of the pair
- **C**: full-width ink card — strongest dark-band presence on the page
- **D**: dark band retires from the player profile

Variant C is the **strongest dark-band candidate** because it removes the
right (cream) card competing for visual weight. If the user wants the
dark band to live as a strong page element, C wins for that reason alone.

## Cross-age behaviour

- All variants auto-hide when no quote source is present
- Minors: variants A and C are privacy-safe (minors don't have bios → no
  bio decorator marks → section hides). Variants B and D need editorial
  policing OR are N/A.

## Comparing to the 6.d5 lock rationale

Owner picked Variant B at 6.d5 ("intuitive + least invasive"). Variant A
here is **the same pattern extended** — the most rationale-consistent
choice. Variant C is the same pattern at lower editorial cost. Variant B
introduces a new field, same cost class as the dropped CareerLog. Variant
D continues the drop-trend.

The path most aligned with prior locks:

- **A** if the 2-card ink+cream pair feels worth the 3-marked-spans bar
- **C** if 1 marked span over the bar is enough and the dark band wants
  to be the page's punctuation
- **D** if the page is best left minimal

## Things this drill does NOT decide

- Presentation/placement of the bio inline pullquote — that's 6.d5.a
  (still queued), interlocked with where the dark band ends up
- Whether `featuredQuotes[]` is added in a later phase if Variant D wins
  here — Phase 6.A scope-discipline doesn't preclude future expansion
- Attribution format ("INTERVIEW · DATE") — handled by existing
  `<PullQuote attribution>` API; no drill
- Multi-language quotes — out of scope

## Page composition after 6.d8 (per variant)

**If A / B / C wins:**

```text
MatchStrip
PlayerHero
StripedSeam
BioBlock (with inline pullquote)
QuotesBlock (1 or 2 cards depending on variant)
MatchStrip
SiteFooter
```

**If D wins:**

```text
MatchStrip
PlayerHero
StripedSeam
BioBlock (with inline pullquote — only quote surface)
MatchStrip
SiteFooter
```

## Drop-section escape hatch

Variant D is the final drop-section variant per the 6.d0 lock. If D wins:

- Cumulative drops: 5 sections (NIEUW, StatsStrip, CareerLog, RecentMatches, QuotesBlock)
- Page becomes Hero + BioBlock only (~25% mockup fidelity)
- Dark-band aesthetic dies with the section
- 6.d5.a (PullQuote presentation) becomes a non-question: there's nowhere
  for an interlude dark band to live
- Phase 6.A is the leanest possible: one new component (PlayerHero) + a
  rebuild of BioBlock with the bio PT decorator
