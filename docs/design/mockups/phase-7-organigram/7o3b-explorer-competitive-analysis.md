# Phase 7 · `<OrganigramExplorer>` — Competitive & prior-art analysis (`7o3b`)

**Date:** 2026-06-11
**For:** #2054 (Phase 3 — fullscreen spotlight explorer)
**Method:** four parallel source-grounded research passes — commercial org-chart products · genealogy + focus+context/DOI systems · dev libraries (incl. the `d3-org-chart` we retire) · cross-domain "always-centred" navigations + failure-mode literature.
**Benchmark judged against:** our locked `7o3` model — fullscreen 2-D spotlight, selected node centred · parent above + persistent breadcrumb · siblings flank (cycle) · children fan below · click + keyboard nav (↑ parent · ↓ child · ←/→ siblings · Enter · Esc) · never pan/drag/pinch · always centred · tap-only mobile · 2-D only. Real data: 5-level reporting tree, 39 nodes, branching up to 12.

---

## 0. Headline findings

1. **No off-the-shelf component does what we want.** Every org/tree/graph library (`d3-org-chart`, `react-d3-tree`, React Flow/xyflow, Reaflow, GoJS, yFiles, dabeng, `@nivo/network`) is a **pan/zoom camera canvas with zero keyboard nav** — the exact opposite of a fixed-viewport, node-recentred, keyboard-driven spotlight. **Decision: build from scratch.**
2. **The empirical backbone is on our side.** SpaceTree's controlled study (IEEE VIS test-of-time) found its win came specifically from a **stable, predictable layout** so users recall where nodes reappear; the Hyperbolic-browser study found its clever geometric distortion gave **no measured speed gain** (only subjective preference). → Our fixed-slot, no-distortion, no-pan model is the evidence-backed choice; spend effort on **clear labels ("scent")**, not geometry.
3. **The whole industry converges on one answer to large fan-out: count-then-expand** ("Expand (N)" / "+N meer"), never pagination, never a 12-wide auto-fan. This is the single most reused pattern and it's exactly what our 12-children / 11-siblings case needs.
4. **The closest _validated_ real-world analogs aren't org charts — they're genealogy apps** (Ancestry "Family view", FamilySearch, MyHeritage, Geni, WikiTree, and the open-source **Topola** "hourglass" viewer), which have solved "centre a person, ancestors one way, descendants the other, siblings inline, click to re-centre" for millions of non-technical people on phones. **Topola is our build-time reference** (MIT-ish, D3/SVG, its hourglass chart _is_ our spotlight).
5. **Our persistent breadcrumb is a genuine differentiator** — no incumbent ships a strong always-visible spine (the best, Ancestry/FamilySearch, only show a weak "path back home" in a corner). This is our biggest "never get lost" advantage; keep it first-class.

---

## 1. Build vs adopt — decision: **build from scratch** (plain React + CSS + FLIP)

Every candidate library fails ≥1 hard constraint:

| Library                    | Model                                        | Why it's wrong for us                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `d3-org-chart` (retiring)  | pan/zoom one transformed `<g>`               | `setCentered→fit→zoomTreeBounds` moves the **camera**, not the nodes; main-thread SVG attribute tweens; `d3.zoom`'s default `wheel.zoom` handler `preventDefault`s **every** wheel event → the **page scroll-jack**. |
| `react-d3-tree`            | SVG + d3.tree, `zoomable/draggable` defaults | camera-translate "centring", no controlled focused-node, no keyboard.                                                                                                                                                |
| React Flow / Reaflow       | infinite pan/zoom editor canvas              | `setCenter`/`fitView` = camera move; ships a whole flow engine to use ~none of it; would fight `panOnDrag`/`zoomOnScroll`.                                                                                           |
| GoJS / yFiles              | Canvas / commercial                          | license + Canvas (can't DOM-style paper cards or DOM-FLIP); viewport-centric.                                                                                                                                        |
| dabeng/OrgChart            | jQuery + CSS pan/zoom                        | jQuery dep, pan/zoom, no keyboard.                                                                                                                                                                                   |
| react-organizational-chart | pure CSS, React nodes                        | philosophically aligned but **too minimal** — no focus, collapse, keyboard, or animation (the actual hard parts).                                                                                                    |

**What we keep conceptually** from `d3-org-chart`: only the `children`/`_children` collapse model and the `_pagingStep` paging idea. Everything else (camera-pan, d3-zoom, SVG tweens) is retired.

**Recommended architecture (assembled from prior art):**

- **Layout = CSS Grid, 5 fixed slots** — top row (breadcrumb + parent), middle row (`left-siblings · CENTRE · right-siblings`), bottom row (children fan). A 39-node depth-limited spotlight needs _placement_, not a tree-layout solver — no `d3.tree`/Dagre.
- **State** = a `useReducer({ focusedId })` + a pure `selectSpotlight(tree, focusedId)` returning `{ ancestors (breadcrumb), parent, leftSiblings, focused, rightSiblings, children }`. **Mount only the current neighbourhood**, not the whole tree (perf + simplicity; we have 39 nodes, render ≤ ~25 at once).
- **Transition = shared-element FLIP** so the clicked node visibly **travels** to the centre seat. Three viable mechanisms, in order of preference to evaluate at build time: hand-rolled FLIP (First/Last/Invert/Play on `transform`+`opacity`, zero deps, GPU-composited) → Motion `layoutId` (robust, ~auto, HTML-only) → the View Transitions API (`view-transition-name`, compositor-driven, newest). **HTML/CSS cards, not SVG** (so FLIP/Motion/VT all apply).
- **Children fan = centred `flex-wrap` row + "+N meer" paging** (≈5–7 visible, wrap to a 2nd row, page the rest) — never horizontal scroll, never a 12-wedge radial.
- **Keyboard + a11y = hand-rolled** (no library has any): `role="tree"`/`treeitem` taxonomy in a `role="dialog"`, **roving tabindex** on the centred node, polite live-region, our locked key scheme.

---

## 2. Closest analogs — what to steal

### Genealogy / family-tree apps (the strongest analog — battle-tested, non-technical users, phones)

- **Topola** (`pewu.github.io/topola-viewer`, open-source D3/SVG) — "**click a person to focus**" + "**cool transition animations**" + an **hourglass chart** (ancestors above, descendants below, focus centre = _our exact grammar_). **Study its focus-change + transition code as the reference implementation.**
- **Ancestry "Family view"** — ancestors one axis, descendants the other, **siblings inline**; shows the "**path back to home in the lower-left corner**" when off-home (a weak breadcrumb — we do better).
- **FamilySearch** — **"only one expanded line per generation"** (deliberately caps lateral breadth), one-press **Home/target reset**, children tucked behind a tab (desktop-ism we drop for tap).
- **Geni** — invented **both** our core verbs independently: an explicit **"re-centre on this node" icon** and a **"cycle through a person's other positions" control** (≈ our sibling cycle). Proves the cycle metaphor reads naturally.
- **MyHeritage** — a **side panel listing all immediate relatives → click a name to re-root** (keyboard/SR-friendly, never aims at a tiny canvas target — complements our ←/→/↑/↓).
- **Consensus caution — "inspect ≠ re-root":** 5 of 6 separate "show this person's details" from "make this person the centre" via a dedicated icon, because conflating them disorients. **Implication for us:** give person cards a clear, distinct **"Volledig profiel →"** affordance (→ `/staf/{psdId}`, our Phase-3 leaf decision) separate from the body-tap that re-centres/descends.

### Other domains

- **XMind "Walk Through"** — darkens the background and **auto-centres the selected topic**; built as a _separate mode_ over a pannable canvas → validates making spotlight the **only** mode. Steal the **dimmed-context** treatment so "this is the focus" is unambiguous.
- **Built for Teams** — closest commercial: **click a person → they become the centred root**, with **Go-to-parent / Go-to-root** (a manual breadcrumb). Our model + a real persistent breadcrumb.
- **Pingboard** — its engineers documented rebuilding org-chart keyboard a11y on the **WAI-ARIA tree pattern**, key-for-key our scheme (←/→ siblings, ↓ child, ↑ parent, Enter = act on centre), plus an **async focus-polling** trick so focus lands on a node that loads after re-centre. **Adopt their reviewed key map.**
- **Kumu Focus** — keyboard-mature degree traversal (`+`/`−`, `0–9` depth, `Esc`); "walk in/out by degree" is also a clean way to phrase traversal for a screen reader.
- **The Org / Lattice / Lucidchart / BALKAN lib** — the count-badge convergence: "Expand (145)", indirect-report count+popover, Direct/Total report counts; BALKAN explicitly **does not paginate** a wide fan, it count-collapses.

### Focus+context research

- **DOI Trees (Card & Nation)** — large fan-out solved with a **free zone + aggregation zone** that collapses the tail into **counted "+N" cluster nodes**; unexpanded branches show a **triangle sized to the subtree's node count** ("scent" of how much lies below). Animated layout morph ≈0.5–1.0s.
- **D3 collapsible tree** — children **enter from the parent's previous position** (a shared-element-style cue that ties child to parent) — the orientation trick to copy for our fan/centre travel.

---

## 3. Large fan-out (12 children / 11 siblings) — the converged answer

**Count-then-expand, cap visible breadth, signpost overflow. Never auto-fan all 12, never paginate, never a full radial.**

- **Children:** render the nearest ~5–7 in full; collapse the rest into **"+N meer"** (expands in place on tap). A child that itself has a deep subtree shows its **own count badge** (DOI triangle / "Expand (N)" idea = scent).
- **Siblings:** prev/next **cycler** + a **"3 / 11" position indicator** that opens a full sibling pick-list (Geni cycle + ChartHop sibling-indicator). ←/→ cycles; the breadcrumb already names the shared parent so siblings never repeat context.
- **Hard guardrail:** the **radial tap-target ceiling is ~8–12 items** — our max fan sits exactly there, so an equal-angle 12-wedge radial would mean hand-occlusion + sub-44px targets. Use wrapped rows / partial arc with paging, every target ≥ 44px.
- **Overflow signposting:** weak horizontal information scent is a documented severe-discovery failure — **peek the cut-off edge + show "n of N" + explicit arrows**; never hide overflow behind an unsignposted scroll.

---

## 4. Failure modes → mitigations (all cited)

| Failure mode                                                   | Real example                                                                 | Our mitigation (locked)                                                                                                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scroll-jacking / gesture capture                               | the `d3-org-chart` canvas we retire; amCharts touch-capture                  | **Tap-only; never pan/drag/pinch.** Page scrolls normally; explorer never steals the gesture. Our #1 correctness win.                                                    |
| Pinch-zoom dependence (Baymard: 40% of mobile sites fail zoom) | Every Noise grid; Neo4j Bloom                                                | **Centred node renders full-size, legible; reading never needs zoom.**                                                                                                   |
| Disorientation from reflow / teleport                          | Obsidian "please pin the graph"; Music-Map regenerate; Bloom needs a minimap | **Deterministic fixed slots + shared-element travel.** Same node → same slots, every time. **No minimap needed** (name this as a feature).                               |
| Tiny radial tap targets (8–12 ceiling)                         | radial menus past ~12; Every Noise tiles                                     | **Cap ~5–7 visible + paging/cycling, ≥44px targets, no 12-wedge radial.**                                                                                                |
| Horizontal-scroll discovery failure                            | carousels / horizontal tabs (Baymard)                                        | **Peek next/prev + "n of N" + explicit arrows.**                                                                                                                         |
| Keyboard / SR inaccessibility of canvas viz                    | InMaps, Bloom, Obsidian graph (SR-invisible)                                 | **Real focusable DOM nodes + `role=tree` + breadcrumb + a parallel accessible tree/list fallback of all 39 nodes** (W3C/Deque: complex viz needs a DOM/text equivalent). |
| Over-animation / vestibular (WCAG 2.3.3; ~69M affected)        | zoom/pan canvases, big scale recentres                                       | **`prefers-reduced-motion` → snap/cross-fade**; default motion small, position-only, no big zoom.                                                                        |
| Performance at scale                                           | InMaps sluggish; Bloom large scenes                                          | **Mount only the current neighbourhood** (≤ ~25 cards), not the whole tree. 39 nodes total — no force-layout cliffs.                                                     |

---

## 5. What this _changes / refines_ in our build plan

1. **Build from scratch, retire `d3-org-chart` entirely** (CSS Grid + FLIP + hand-rolled a11y). No new graph dependency. ✅ aligns with the AC's "remove `d3-org-chart` from package.json".
2. **Add an accessible "volledig organigram" tree/list fallback** — a plain nested-list view of all 39 nodes, fully keyboard/SR navigable, offered alongside the spotlight. This satisfies the W3C/Deque "DOM equivalent for complex viz" rule **and** doubles as the deferred `7o7` "volledig organigram / print" candidate. _(New scope to confirm — small, high a11y value.)_
3. **Person cards get a distinct "Volledig profiel →" affordance** (→ `/staf/{psdId}`) separate from the body-tap that re-centres — resolves the genealogy "inspect ≠ re-root" caution and cleanly houses our Phase-3 leaf decision.
4. **Deep-link the focused node** (`/hulp#structuur?member=<id>` or a hash) so back-button + sharing + the Phase-4 `?member=` deep-link all anchor "you are here" outside the canvas (Every Noise precedent; already foreseen in the PRD).
5. **Dimmed-context treatment** (XMind) on the dark verkenner so the centred node unambiguously reads as the focus.
6. **Reference implementation to study at build time: Topola** (hourglass chart) + Pingboard's keyboard write-up + the D3 collapsible-tree enter-from-parent animation.

---

## 6. Sources (consolidated)

**Commercial:** ChartHop docs · Pingboard/Workleap + [freeCodeCamp keyboard-a11y write-up](https://www.freecodecamp.org/news/designing-keyboard-accessibility-for-complex-react-experiences/) · Built for Teams · BambooHR · Lattice · The Org · Functionly · Deel · Organimi · Lucidchart · Sociomap · [BALKAN OrgChart JS](https://balkan.app/OrgChartJS/Docs/ExpandCollapse).
**Genealogy:** [Ancestry](https://support.ancestry.com/s/article/Navigating-an-Ancestry-Family-Tree) · FamilySearch · MyHeritage · Geni · WikiTree · [Topola](https://pewu.github.io/topola-viewer/).
**Focus+context research:** [SpaceTree (UMD HCIL)](http://www.cs.umd.edu/projects/hcil/spacetree/) · [DOI Trees (Card & Nation)](https://faculty.cc.gatech.edu/~stasko/7450/Papers/card-avi02.pdf) · [Hyperbolic browser](https://dl.acm.org/doi/fullHtml/10.1145/223904.223956) · [D3 collapsible tree](https://observablehq.com/@d3/collapsible-tree).
**Libraries / technical:** [d3-org-chart](https://github.com/bumbeishvili/org-chart) · [d3-zoom wheel scroll-jack](https://github.com/d3/d3-zoom/issues/80) · React Flow · react-d3-tree · [FLIP](https://css-tricks.com/animating-layouts-with-the-flip-technique/) · [Motion layout](https://motion.dev/docs/react-layout-animations) · [React `<ViewTransition>`](https://react.dev/reference/react/ViewTransition).
**Cross-domain + failure modes:** XMind Walk-Through · Music-Map · Every Noise · Obsidian local graph + "pin it" thread · Kumu Focus · MindMeister · Neo4j Bloom · LinkedIn InMaps (discontinued) · [NN/g Scrolljacking](https://www.nngroup.com/articles/scrolljacking-101/) · [Baymard horizontal tabs](https://baymard.com/blog/avoid-horizontal-tabs) · radial-menu limits · [Material shared-element motion](https://medium.com/androiddevelopers/material-motion-with-mdc-c1f09bb90bf9) · [WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) · [Deque accessible charts](https://www.deque.com/blog/how-to-make-interactive-charts-accessible/).
