# Phase 7 · `/hulp` hub — Round 6 (HULP FINDER) — LOCKED

**Date:** 2026-06-08
**Mockups:** `7o6-finder-reskin-compare.html` (answer disclosure) · `7o6b-finder-initial-state-compare.html`
(“Alles” at scale). Supersedes the `7o6` *bridge* decision (`7o6-hulp-bridge-compare.html`) — the hub
makes Hulp a first-class half, not a teaser. Reskins the existing `<HulpPage>`.
**Owner:** @climacon
**Tracker:** #1529 (fused Phase 7+8) · **Milestone:** `redesign-retro-terrace-fanzine`

## Decision

The **Hulp half** of the hub is the existing `<HulpPage>` finder, **reskinned** to the fanzine vocabulary:

- **One unified search above the browse.** The hub's single hero search **repeats in the sticky nav**, so
  it sits right above the Hulp browse when scrolled. It returns **people + answers** (the same unified
  search). The finder's old `HulpSearchInput` is **folded into it** — no separate finder search, no second
  behaviour. (Confirms the 7o2c "one search" thesis.)
- **Browse = category-led**, with the hero **audience chips** (`ouder`/`speler`/`trainer`/`supporter`) as a
  filter and **category chips** (`Medisch`/`Sportief`/`Administratief`/`Gedrag`/`Algemeen`/`Commercieel`,
  **Phosphor Fill** icons) for switching.
- **"Alles" landing = capped category preview (A).** Each category shows its **top 3** questions + an
  **"Alle N →"** affordance; selecting a category chip filters to that category's full list. Caps the
  initial render no matter how the corpus grows; reuses the Structuur "Toon alle 23 →" pattern. "Top 3"
  ordering uses existing declaration/`sortOrder`/alphabetical — **no fabricated "most asked"** (no
  popularity data).
- **Answer disclosure = inline accordion (A).** Click a question → it expands in place to **summary +
  numbered steps + contact**. Matches master §6.11 ("FAQ accordions in TapedCard"), keeps the browse
  context, and keeps all answers in the DOM for the FAQ rich-results JSON-LD.
- **Contact reuses the locked person vocabulary** — monogram/photo · name · function · ✉/☎ (only if
  present) — and a **"toon in structuur →"** cross-link that opens that node in the explorer + the person
  panel (Structuur ⇄ Hulp). `team-role` / `manual` / `position` contact resolution
  (`team-role-resolution.ts`, `resolveContact.ts`) is preserved unchanged.

## Locked Hulp-half spine

```text
#hulp  — <HulpFinder> (reskinned <HulpPage>)
├─ (unified search lives in hero + sticky bar, above this section)
├─ audience filter chips  (from the hero) + category chips
├─ "Alles" → capped category preview: per category → top 3 <QuestionCard> + "Alle N →"
│            category chip → that category's full accordion list
├─ <QuestionCard> → inline accordion → summary · numbered <steps> · <ContactCard>
└─ <ContactCard> → person vocab + ✉/☎ + "toon in structuur →" (deep-link into <OrganigramExplorer>)
```

## Reskinned components (from `apps/web/src/components/hulp/HulpPage/`)

`HulpPage` → hub `<HulpFinder>` · `BrowseContent`/`CategorySection` → capped category preview · `QuestionCard`
→ accordion card · `AnswerCard` → accordion body (summary + steps) · `ContactCard` → person vocab + structuur
cross-link · `HulpSearchInput` → **retired** (unified search) · `resolveContact`/`categoryMeta` → kept.

## Defers to 7o7

- Whether the hub also carries the master §6.11 **general contact form + address/hours** (`Driesstraat 32`
  + openingsuren) below the finder.
- Section order in the hub (finder-first vs structure-first) + the unified-search sticky behaviour.
- FAQ JSON-LD ownership on the hub; analytics (`responsibility_*` events preserved/renamed).

## Superseded / rejected

- **7o6 bridge ("teaser → /hulp")** — obsolete after the hub merge.
- **7o6 answer = side-panel (B)** — list + answer compete for width; answers not in initial DOM (weaker FAQ
  SEO). The person panel stays the idiom for *people*, the accordion for *answers*.
- **7o6b category-accordion (B) / search-led (C)** — B buries every question two clicks deep; C shows
  nothing to scan on load. Capped preview is browsable **and** scales.
