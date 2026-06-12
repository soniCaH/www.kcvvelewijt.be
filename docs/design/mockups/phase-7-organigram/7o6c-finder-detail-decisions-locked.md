# Phase 7 · `/hulp` hub — Round 6c (FINDER DETAIL DECISIONS) — LOCKED

**Date:** 2026-06-11
**Mockup:** `7o6c-finder-detail-decisions-compare.html` (4 decisions, rendered side-by-side in the locked fanzine vocabulary).
**Builds on:** `7o6-finder-locked.md` (IA: category-led browse · capped "Alles" preview · inline accordion · person-vocab contact). This round locks the four per-element details that `7o6` left open, grounded in fresh UX research against the real audience.
**Owner:** @climacon
**Tracker:** #2056 (fused Phase 7+8) · **Milestone:** `redesign-retro-terrace-fanzine`

## Audience anchor

Every call below is judged against the person who actually shows up: a **Flemish parent on a phone at the sideline**, non-technical, often older, arriving with a concrete life-question ("mijn kind is geblesseerd — wat nu?"). Research streams (NN/g audience-navigation, NHS-111 triage, GOV.UK plain-language, FAQ-accordion a11y, older-adult mobile guidelines, club/school people-directories) confirmed the `7o6` IA and surfaced these four refinements.

## Decisions

### 1 — Category colour → **A: restrained + Medical exception** ✅

- Phosphor-Fill glyph per category. Default glyph = **ink** on a `cream-soft` disc; the **active category chip** = `jersey-deep` fill.
- **Medical** alone carries the **`--brick` (#c93f1c)** accent (an in-palette fanzine red, not a generic Tailwind red) — the one colour break that _carries meaning_ (the highest-stakes category), not decoration.
- Rejected **B (full 6-colour)** — 6 brights break fanzine cohesion (reads generic/Bootstrap) and green/orange/grey on cream fail 4.5:1. Rejected **C (pure monochrome)** — calmest but nothing flags Medical and the whole distinction rides on one glyph.
- Retires the generic `text-red-600 / text-green-600 / …` map for the finder. (`getCategoryInfo` in `responsibility-utils.ts` keeps its `label` for `<HubSearch>`; the finder owns the new `categoryMeta` with Phosphor icons + the restrained palette.)

### 2 — Accordion behaviour → **A: single-open** ✅

- Opening a question **auto-closes the previous** one. Keeps the mobile scroll short and you never lose your place — the research consensus for non-technical / mobile users with long structured answers (summary + numbered steps + contact).
- Both behaviours keep all answers in the DOM for the **FAQ JSON-LD**; every question is `#<slug>` deep-linkable (a coach pastes it straight into a WhatsApp group).

### 3 — Medical urgency → **B: uniform answer body** ✅ (owner override)

- **No emergency "112-first" banner.** Owner rationale: _"parents will call 112 before looking up our site"_ — a banner on every minor knock is noise, and the genuine-emergency reflex doesn't route through the website.
- Medical still reads as the attention category via its **`--brick` glyph accent from decision 1** (scanning), but the **answer layout is identical** to every other category (summary · numbered steps · one contact). No emergency banner, no step reordering, no full-card urgency stripe.

### 4 — "toon in structuur →" → **A: person panel + scroll** ✅

- The cross-link opens the **`<MemberDetailPanel>`** for that person and scrolls to `#structuur`. Reuses the shipped Phase-4 deep-link infra exactly — the `?member=<nodeId>` param + the exported `useHubMemberPanel()` context (the same opener the explorer already uses).
- The **dead** `resolveContact` href (`/club/organigram?node=` — a retired route) is rewired to `/hulp?member=<nodeId>#structuur` (the semantic / no-JS fallback href); on the live page the finder calls the context opener for a smooth in-page open.
- Implementation note: the one `<HubMemberPanel>` now wraps **both** hub halves (`#hulp` + `#structuur`) so the finder sits inside the provider. Fires `responsibility_organigram_link {node_id}` (hashed).
- Rejected **B (also auto-open the fullscreen verkenner)** — nicer "see them in the org" moment, but the verkenner isn't URL-driven yet (opens via its own "Open verkenner ⤢" button); deferred as a possible fast-follow.

## Net build shape (Phase 5 / #2056)

```text
<HulpFinder>  (pure browse — unified search is owned by <HubSearch> in hero + sticky nav)
├─ audience chips (ouder/speler/trainer/supporter) — filter, from ?audience (hero deep-links set it)
├─ category chips (Alles + 6 · Phosphor glyph · Medical=brick · active=jersey-deep)
├─ "Alles"   → capped category preview: per category → top-3 <QuestionCard> + "Alle N →" (selects that category)
├─ category  → that category's full single-open accordion list
├─ <QuestionCard> (inline accordion, single-open) → summary · numbered steps · <ContactCard>  · id=<slug> deep-link
└─ <ContactCard> (person vocab: monogram/newsprint photo · first-bold+last-italic name · mono function · ✉/☎ if present)
                 + "toon in structuur →" → useHubMemberPanel().openMemberById(nodeId) + scroll #structuur
```

Preserves `resolveContact` / `team-role-resolution` (position / team-role / manual). Retires `ResponsibilityFinder` + `HulpSearchInput` (+ the stale legacy `loading.tsx`). Stories + `vr` + baselines per component.
