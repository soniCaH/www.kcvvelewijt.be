# Phase 7 · `/club/organigram` — Round 3 (EXPLORER INTERACTION) — LOCKED

**Date:** 2026-06-07 (3-D removed 2026-06-08)
**Mockups:** `7o3-explorer-interaction-compare.html` (A–D) · `7o3-explorer-at-scale-compare.html`
(A–D re-mocked at ~25 nodes / 4 levels) → `7o3-explorer-locked.html`
**Owner:** @climacon
**Tracker:** #1529 · **Milestone:** `redesign-retro-terrace-fanzine`

## Decision

**The explorer is B (spotlight drill-down), 2-D only. 3-D is removed entirely.**

Inside the locked fullscreen verkenner (7o2), the everyday — and only — interaction is **focus +
context**: the selected node sits centred, its parent floats above (and in the breadcrumb), siblings
flank it, children fan below — you navigate by **clicking**, never by free-panning. Re-mocked at the
**real ~25-node / 4-level** bestuur, this was the only base that looks **identical at 25 or 250 nodes**
and the only one genuinely usable on a phone.

The orbital 3-D idea was **investigated and rejected** (owner, 2026-06-08: *"doesn't add value, au
contraire — remove this 3D completely"*). The at-scale mock (option D) showed 3-D as a label-fragile
cloud with real cost (three.js, perf, mobile/a11y) and no navigational payoff over the spotlight.
**No 3-D ships — no toggle, no spatial mode, no WebGL dependency, no 3-D build phase.**

## Why spotlight (the scale test)

At ~25 nodes / 4 levels: **A** (collapsible tree) reads with one branch open but pans when fully
expanded; **C** (radial) crowds at 20+ outer labels and can't hold the 4th level without a B-style zoom
underneath; **D** (3-D) becomes a label-fragile cloud and is risky for mobile/a11y. Only **B** stays calm
at any size — so B *is* the explorer.

## Locked spec (see `7o3-explorer-locked.html`)

```text
layout    parent (above + breadcrumb) · selected (centre, warm-shadow) · siblings (flank) · children (fan below)
navigate  click child → new centre · click parent/crumb → ascend · click sibling → lateral · "↤ terug" · "⤢ overzicht" (root)
keyboard  ↑ parent · ↓ first child · ← / → siblings · Enter focus · Esc closes the verkenner
orient    persistent breadcrumb "KCVV ▸ afdeling ▸ node" · never free-pan, never drag · always centred on someone
leaf      click a person/leaf → opens the 7o5 member detail (contact)
states    single / shared (+N badge) / vacant (warm, dashed) — chrome decided in 7o4
mobile    tap-only; no pinch/drag required; children grid wraps/scrolls
container fullscreen focused mode (7o2) — breadcrumb + zoom/fit + Esc; cannot scroll-jack
```

## What this locks vs defers

- **Locks:** spotlight focus+context as the **entire** explorer interaction + accessibility model;
  click/keyboard navigation + breadcrumb orientation; **2-D only, no 3-D**.
- **Defers to 7o4:** node chrome for single / shared / vacant states (`<TeamStaff>` idiom on explorer
  nodes + directory cards).
- **Defers to 7o5:** the leaf-click detail surface (modal vs panel vs sheet).
- **Defers to 7o7:** whether to also ship an **A-style collapsible "volledig organigram / print"**
  secondary mode (candidate, not locked); explorer analytics (`organigram_member_clicked` view value;
  a possible `organigram_explorer_opened`).

## Component seed

`<OrganigramExplorer>` (new) — owns the fullscreen container + the spotlight interaction; **absorbs/replaces**
`<EnhancedOrgChart>`, `<MobileNavigationDrawer>`, and `<ContactOverlay>`. **No `three.js` / r3f dependency.**
The d3-org-chart dependency is **retired** unless A-as-print (7o7) revives a contained tree.

## Rejected

- **A as base** — fine as a print/overview, pans when fully expanded; weaker on mobile; kept only as a
  7o7 candidate secondary mode.
- **C** — beautiful whole-club figure but crowds at real scale and can't express 4-level depth without
  becoming B underneath.
- **D / 3-D (any form)** — investigated at scale, **removed by owner**: cost + label-fragility +
  mobile/a11y risk, no navigational value over the spotlight. The compare files are retained only as
  drill history.
