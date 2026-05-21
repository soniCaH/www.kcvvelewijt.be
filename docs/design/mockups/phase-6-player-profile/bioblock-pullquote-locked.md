# 6.d5 · BioBlock PullQuote sourcing — LOCKED

**Decision:** Variant **B — decorator inside `player.bio`**, locked 2026-05-21.

**Owner rationale at lock time:** _"B is the most intuitive and least invasive
it seems."_ Intuitive = editor marks the quote inline while writing the bio,
no separate field to remember. Least invasive = extends the existing
`bio` Portable Text vs adding a new schema field.

**Variant A explicitly rejected:** _"A is completely impossible."_ — the
related-interview derivation pattern is off the table for this surface and
should not be re-proposed in downstream drills. Reasons (inferred — capture
in compare doc for future sessions):

- Interview-article coverage across the squad is too thin to be a reliable
  primary source for a per-player feature
- Coupling the BioBlock to article data flow creates a fragile dependency
- "Pullquote from a related interview" duplicates the QuotesBlock's job

This rejection is **load-bearing** for downstream drills too: do not
propose "derive from related articles" patterns for any future Phase 6
player-profile surface (avatar caption, hero kicker, etc.). Quotes live
in the QuotesBlock; bio-adjacent content lives in `bio`.

## What this locks

| Decision                  | Locked value                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| BioBlock PullQuote source | Substring of `player.bio` marked with a new `pullquote` Portable Text decorator                                                               |
| Render behaviour          | Marked substring renders both inline (subtle highlight within the paragraph) AND in the right-column PullQuote card. Same text, two surfaces. |
| Schema delta              | Extend `bio` Portable Text marks: add `pullquote` decorator alongside existing marks                                                          |
| Empty fallback            | No `pullquote` decorator → render bio paragraph alone (no PullQuote card). Layout collapses to single-column on this player.                  |
| Cross-age behaviour       | Whole BioBlock hides when `player.bio` is empty (~60% of squad). Same auto-hide branch as other sections.                                     |
| Privacy guardrail         | Editor must not place `pullquote` decorator on minors' bios. Document in Studio field description + Phase 6.A PRD.                            |

## Downstream consequences

- **`@kcvv/sanity-schemas` migration** — `player.bio` block decorators
  extended with a `pullquote` mark. Migration is additive (no existing
  documents change). Studio description text needs a no-minors caveat.
- **Studio UX** — editors get a new mark button when editing the bio
  field; same UX as bold/italic/link.
- **`<ArticleBody>` / `<SanityArticleBody>` serializers don't change** —
  the new decorator only applies to `player.bio`, not to article body
  Portable Text.
- **No new BFF surface** — pure CMS.
- **No editorial backlog increase per se** — editors apply the decorator
  while writing bios, not as a separate task. Existing bio-less profiles
  stay bio-less.
- **Variant A path closed forever** — any future drill or PR proposing
  "derive content from related articles" for a player profile surface
  must justify against this rejection or get explicit owner sign-off.

## Open sub-drill — 6.d5.a presentation

Per the 6.d4 dark-band parking, the PullQuote _presentation_ remains open:

- **Inline right-column** (canonical retro-terrace-fanzine mockup)
- **Full-bleed ink interlude band** between paragraphs (consumes the
  parked dark-band aesthetic)
- **Side-bar mono treatment** (no card; quote in italic display set
  off by a left rule)

Defer to **6.d5.a** once we've seen 6.d6 + 6.d7 + 6.d8 lock and we know
where the dark-band naturally wants to live across the whole page.

## What this does NOT lock

- Presentation of the PullQuote (inline vs dark band vs other) — 6.d5.a
- Number of pullquote decorators allowed per bio (assume 1 for now;
  multiple would need a "first-marked-wins" rule)
- Whether QuotesBlock (6.d8) is also dropped — separate drill
- The presence of a separate `featuredQuote` field on player schema in
  future phases — Phase 6.A does not add it; future PRDs can revisit

## Drill state after this lock

- 6.d0 — Data-reality reconciliation · LOCKED (Variant C upper-bound)
- 6.d1 — Player-name typography · LOCKED (first Black + last italic)
- 6.d2 — Hero photo fallback · LOCKED (PlayerFigure illustration)
- 6.d2.a — Illustration refinement at hero scale · QUEUED
- 6.d3 — Hero NIEUW badge · LOCKED (dropped)
- 6.d4 — StatsStrip · LOCKED (dropped; dark-band aesthetic parked)
- **6.d5 — BioBlock PullQuote sourcing · LOCKED (Variant B — bio PT decorator)**
- 6.d5.a — PullQuote presentation (inline vs dark band) · QUEUED (after 6.d6 / 6.d7 / 6.d8)
- 6.d6 — CareerLogTable anchor-row emphasis (brief Q2) · NEXT
- 6.d7 — RecentMatchesGrid card treatment · pending
- 6.d8 — QuotesBlock pairing + sourcing · pending
- 6.d9 — Cross-age section availability matrix · QUEUED
