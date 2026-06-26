# Phase 8 · `/zoeken` — Round 5 (SEMANTIC AUGMENT — "SLIM ANTWOORD" CARD) — LOCKED

**Date:** 2026-06-26
**Mockup:** `8s5-slim-antwoord-card-compare.html` (A papieren notitie · B getinte spotlight · **C fanzine-artefact**).
**Owner:** @climacon · **Tracker:** #2266 (ZOEK-3) · **Milestone:** `go-live-ux-polish`

## Context

`/zoeken` runs **lexical** search today (`GET /api/search`: substring over article/player/team/staff). The **semantic** stack (`POST /api/search` → Vectorize + `bge-m3`, `MIN_SCORE` 0.35) already exists and is wired into `/hulp`'s `<HubSearch>` via `useSemanticSearch` — but `/zoeken` never calls it. The two cover **different corpora**: semantic indexes `article`/`page`/`responsibility` only — **not players or teams**. So we **augment**, not replace: lexical stays exactly as-is; the semantic block (incl. the endpoint's LLM `answer`) renders **above** it.

This is the card **7o8 deferred** — the hub kept the LLM `answer` out of its cramped dropdown and parked it for _"een latere `/zoeken`-pagina met ruimte"_. That page is here. This round locks **how the "Slim antwoord" card presents**.

## Decision — **C: fanzine-artefact (taped memo + postmark + italic pull-quote)** ✅

When the query semantically matches and the **top score ≥ 0.5**, the LLM `answer` renders as a fanzine **memo card** above the lexical filters: a tape strip, a decorative `✦ SLIM` postmark stamp, the answer as a **Fraunces-italic pull-quote**, the source links as a footnote-style row, and a brick disclaimer. Leans into the existing TapedCard / postmark vocabulary (8s3 / #2106).

- **Why C over B ★ (recommended):** owner pick — the card earns a distinct, characterful identity rather than a disciplined panel. The artefact framing makes the AI layer unmistakably its own thing.
- **A11y / tone guardrails (mandatory, since C wraps model-written prose):**
  - The postmark stamp + tape strip are **decorative** → `aria-hidden`, not in the accessible name.
  - The italic pull-quote must keep **AA contrast** on cream; rotation is cosmetic only and must **not** alter DOM/reading order or clip text at narrow widths (cap/clamp answer length, wrap gracefully).
  - The **disclaimer stays legible** ("Door AI samengevat uit onze pagina's — controleer altijd de bron.") — never below the postmark, never rotated out of contrast.
  - Sources are real, focusable links (keyboard-reachable, visible focus ring).

## Cross-cutting (all variants)

- **Score gate:** top ≥ 0.5 → prose card (C); 0.35–0.5 → **"Gerelateerd"** (rows, title + excerpt + link, **no prose**); < 0.35 → nothing (lexical only). The semantic result already carries `score`; `answer` only arrives ≥ 0.5 (backend `LLM_SCORE_THRESHOLD`).
- **Smart signal:** sparkle + "Slim antwoord" mono label. **No new brand colour** — jersey-deep + existing iconography (`Sparkle` already in `@/lib/icons.redesign`).
- **Source URLs:** `article → /nieuws/{slug}` · `page → /club/{slug}` · `responsibility → /hulp#{slug}` (the `<HubSearch>` hash deep-link convention — verify slug vs id against `<HulpFinder>`).
- **Augment, not replace:** lexical (spelers/teams/staf/nieuws + all four filters, counts, sort, error/empty, CDN cache) renders unchanged below. Semantic indexes **no** players/teams.
- **Graceful fallback (PRD floor):** endpoint error / 503 unconfigured → the semantic block **does not render**; lexical is untouched. No "AI" hint, no error surfaced. Empty semantic results = genuinely no match, not an error.

## Build shape (#2266)

```text
<SearchInterface>  (apps/web — wiring only; BFF + hook already exist)
├─ lexical lane   → GET /api/search (UNCHANGED — players/teams/staff/articles + filters)
└─ semantic lane  → useSemanticSearch({ limit: 5 })   // no `type` ⇒ all content types
   · triggered by the committed query (submit / URL ?q=), NOT per-keystroke (that's ZOEK-2)
   · executedQuery gate → no empty-state flash mid-flight
   · score ≥ 0.5 + answer → <SearchAnswerCard>  (variant C)
   · 0.35–0.5            → <SearchRelated> rows (no prose)
   · error / unconfigured → render nothing
```

No Sanity / Cloudflare / api-contract changes — semantic endpoint + `useSemanticSearch` already exist (used by `/hulp`). New presentational component(s) ship a `.stories.tsx` (`autodocs`) + unit test; existing `<SearchInterface>` tests stay green; `pnpm --filter @kcvv/web check-all` passes.

**Out of scope:** indexing players/teams into Vectorize (would need `sanity-index-sync` changes); ZOEK-1 (empty-state gap) + ZOEK-2 (debounced auto-search) — both tracked under #2241.
