# Phase 7 · `/club/organigram` — Round 2 (VIEW MODEL / IA + FINDING MODEL) — LOCKED

**Date:** 2026-06-07
**Mockups:** `7o2-view-model-ia-compare.html` (view models A–D) · `7o2b-finding-model-compare.html`
(finding models I–III) → `7o2-view-model-locked.html` (the resolved page)
**Owner:** @climacon
**Tracker:** #1529 · **Milestone:** `redesign-retro-terrace-fanzine`

## Decision (four locks, one coherent page)

1. **View model = D — single-scroll + opt-in fullscreen "verkenner".**
   The page body is a calm single-scroll (house style, matches 6.C team + /jeugd) with a sticky in-page
   section nav. The relational diagram is **not** an inline section that fights the page; it is an
   **opt-in fullscreen focused mode** launched from a button. This fixes **scroll-jacking by
   construction** (a canvas that owns the whole screen cannot hijack page scroll) and gives the literal
   **3-D investigation its natural home** (rotate/zoom is expected in a verkenner, not in a page band).

2. **Finding model = I — one search front door; the sections are the browse backup.**
   The hero search is the single fast path and spans **both** intents: typing returns **Personen**
   (name·function → contact) **and** **Antwoorden/hulpvragen** (question → answer+contact), typed and
   labelled. The three sections below are the **same dataset reached by browsing instead of typing** —
   Structuur = browse people, Hulp = browse the answers by theme, Verkenner = browse relationships.
   **Nothing is duplicated:** Hulp is the *catalogue you land in if you click instead of type*, never a
   second search box. Resolves the "is this duplicated?" confusion: **search is the verb, sections are
   the nouns.**

3. **Search intelligence = semantic/AI (investigate, scoped issue).**
   Today's `UnifiedSearchBar` is keyword/substring ranking. Upgrade it to **semantic search over the
   `responsibility` docs** using the **existing bge-m3 + Vectorize stack** that already powers `/zoeken`,
   so natural language ("mijn kind heeft zich bezeerd") resolves to the right Hulp answer without keyword
   overlap. This is **extra BFF/embeddings build → its own PRD phase/issue**, not free; people-search can
   stay keyword. (Reinforces the order decision below: typed questions resolve at the very top.)

4. **Section order = A — hero → (compact) Structuur → Hulp → Verkenner → CTA.**
   Hulp sits **above** the heavy Verkenner so a scroller reaches it; the immersive explorer is the opt-in
   finale. Structuur is **compact** (department headers + a few cards + "Toon alle N functies →") so it
   doesn't wall off Hulp.

### Why Hulp is reachable despite being section 2 (the burial worry)

A question-asker is routed to help **from the hero**, three ways, before scrolling past anything:

- the **search returns answers directly** (semantic makes this strong) — often no scroll needed;
- the **hero audience chips** ("Ik ben ouder / Speler / Trainer / Supporter") **deep-link into Hulp**,
  pre-filtered by `responsibility.audience`;
- the **sticky nav** keeps **Hulp** one tap away at every scroll position.

## Locked page spine (see `7o2-view-model-locked.html`)

```text
<OrganigramHero>            7o1 dark band + embedded UNIFIED search (semantic) + audience chips → Hulp
<OrganigramSectionNav>      sticky: Structuur · Hulp · Verkenner
① #structuur  — <StructureDirectory>   people by department (compact, "Toon alle N →"); states: single/shared/vacant
   <StripedSeam>
② #hulp       — <ResponsibilityFinder>  browse answers by theme (the catalogue; same data the search returns)
   <StripedSeam>
③ #verkenner  — <OrganigramExplorer>    inline teaser → OPT-IN FULLSCREEN spotlight drill-down (2-D)
                                          (persistent breadcrumb + zoom/fit + Esc → never scroll-jacks)
<CtaBand>                   jersey-deep-dark "Niemand gevonden?" → contact
```

## What this locks vs defers

- **Locks:** single-scroll + sticky nav; the fullscreen-verkenner container; one unified search as the
  front door; sections = browse-the-same-data; semantic-search as a scoped build; order Structuur→Hulp→Verkenner.
- **Resolved in 7o3:** the verkenner's internal interaction is a **spotlight drill-down, 2-D only**
  (3-D investigated and removed) inside that fullscreen container.
- **Defers to 7o4:** Structuur people-card states (single / shared / **vacant**) chrome.
- **Defers to 7o5:** what opens when you click a person (modal vs panel vs sheet).
- **Defers to 7o6:** Hulp finder layout (category-grid vs audience-first) + contact/steps treatment +
  the audience-chip deep-link behaviour.
- **Defers to 7o7:** final copy, exact stat labels, empty states, analytics/SEO wiring.

## Component seeds (new, `apps/web/src/components/organigram/`)

`<OrganigramHero>` · `<OrganigramSectionNav>` · `<StructureDirectory>` (replaces `<CardHierarchy>` as the
calm browse) · `<ResponsibilityFinder>` (reskin) · `<OrganigramExplorer>` (the fullscreen verkenner —
absorbs/replaces `<EnhancedOrgChart>` + `<MobileNavigationDrawer>` + `<ContactOverlay>`) ·
reuse-reskin `<UnifiedSearchBar>` (now semantic-capable) + `<MemberDetailsModal>` (7o5).

## Rejected

- **View model C** (3 tabs reskin) — solves none of the four pains; keeps cards≈diagram redundancy.
- **View model A** (everything inline incl. diagram) — an inline interactive explorer competes with the
  page for scroll/focus; the fullscreen verkenner keeps it a deliberate, focused mode.
- **View model B** (2 modes) — better, but a mode-switch rather than the house single-scroll.
- **Finding II** (two scoped search boxes) — zero overlap but forces the user to self-diagnose intent.
- **Finding III** (Hulp-led) — demotes the structure explorer the owner explicitly wanted central.
- **Order B/C** — B (Hulp-first) over-prioritises help and pushes structure down toward III; C
  (two-door split) adds a router the hero chips already provide.
