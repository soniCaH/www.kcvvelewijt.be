# Phase 7 · `/club/organigram` — Round 1 (VOICE / REGISTER) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7o1-voice-register-compare.html` (A/B/C) → `7o1-register-locked.html` (grafted result)
**Owner:** @climacon
**Tracker:** #1529 · **Milestone:** `redesign-retro-terrace-fanzine`

## Decision

**A + C graft — dark "roster spotlight" band with an embedded search.**

The hero is the board-page **jersey-deep-dark roster-spotlight band** (authoritative, ties
`/club/organigram` to `/club/bestuur` et al.) but wears the **find-a-contact tool's search affordance**
inside it. This resolves the register tension directly: the page keeps the editorial club voice **and**
puts the page's single most useful job — "find the right person/answer" — above the fold, attacking the
"Hulp is buried / 3-view discoverability" pain at the very top of the page rather than hoping users find
the 3rd tab.

Rejected the pure editorial heroes because a tool people arrive at *with a task* should not make them
hunt: **B** (cream sibling-editorial) was the quietest but lowest-energy for a task; **A alone** kept
search in the chrome strip (one scroll-step too far down); **C alone** (search-led, browse demoted below
a seam) fixed discoverability but abandoned the editorial sibling language and pre-committed too much IA.
The graft keeps A's voice and borrows only C's search placement.

## Locked hero spine (see `7o1-register-locked.html`)

```text
<OrganigramHero>  — jersey-deep-dark · 2px ink border · 6px paper-shadow · radial jersey wash
├─ LEFT (1.2fr)
│  ├─ Kicker (warm)            "De club"           — mono 12px / 0.18em / uppercase
│  ├─ EditorialHeading (cream) "Wie doet wat."     — italic serif 900, warm "." period accent
│  ├─ Lead (cream / .82 op.)   one editorial line, ≤42ch
│  ├─ Search (cream, ink-bordered, 4px shadow)     — the <UnifiedSearchBar> entry point
│  └─ Audience chips           ouder · speler · trainer · supporter   (jump into Hulp — confirm in 7o6)
└─ RIGHT (0.8fr)
   └─ Structure artefact (cream taped card on the dark band): abstract paper org-tree motif (no names) +
      an index strip of real derivable counts. NO individual faces.
```

### Hero right-column artefact — RESOLVED (no people)

There is **no `featured`/`heroSpotlight` field** on `organigramNode` (verified), so a face-roster would
have to be either a deterministic rule, a non-person artefact, or a new editorial field. **Chosen: a
non-person structure artefact** — abstract paper org-tree motif + an index built from **only derivable
counts**: `posities` = active node count, `mensen` = distinct non-archived staff, `afdelingen` =
populated departments (hoofdbestuur/jeugdbestuur). Rationale: avoids per-node editorial upkeep, can't go
stale, and previews the diagram concept at the top of the page. **Do not foreground vacancies** in the
index (lead with positions/people/departments); exact labels are a copy detail for 7o7. Rejected:
*top-of-structure roster* (deterministic but could surface a vacant/odd top node + needs a shared-node
rule) and *editor-curated `heroSpotlight`* (ongoing editorial burden the owner consistently drops).

Contrast: small text on jersey-deep / jersey-deep-dark uses **`text-white`/cream per the 6.C AA rule**;
the warm period + warm kicker carry the accent. **No Ultras heavy-sans** — `EditorialHeading` italic serif.

## What this locks vs defers

- **Locks:** the dark roster-spotlight register; the warm-accent editorial heading; search lives **in the
  hero**; people rendered with the 6.C `<TeamStaff>` idiom.
- **Defers to 7o2 (IA):** everything *below* the hero — whether browse is one mode or two, whether the
  diagram is an inline section / a 2nd mode / an opt-in focused experience, and how Hulp is arranged. The
  audience chips are a **hero placeholder** for the find-a-contact entry, not an IA commitment.
- **Defers to 7o3:** the diagram interaction (and the literal 3-D investigation).
- **Defers to 7o6:** the audience chips' exact behaviour (filtering the Hulp finder by `audience`).

## Carry-forward

- Name the hero component `<OrganigramHero>` (new, `apps/web/src/components/organigram/`).
- The embedded search is the existing `<UnifiedSearchBar>` reskinned — same people+responsibility ranking,
  same `organigram_search_used` event; only the chrome changes.
- Keep the kicker "De club" (matches the board-page hero kicker) for cross-/club cohesion.
