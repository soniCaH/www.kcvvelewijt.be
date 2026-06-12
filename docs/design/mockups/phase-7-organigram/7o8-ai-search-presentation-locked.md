# Phase 7 · `/hulp` hub — Round 8 (AI/SEMANTIC SEARCH PRESENTATION) — LOCKED

**Date:** 2026-06-12
**Mockup:** `7o8-ai-search-presentation-compare.html` (A list-only · **B answer-forward** · C LLM-answer).
**Owner:** @climacon · **Tracker:** #2057 (Phase 6) · **Milestone:** `redesign-retro-terrace-fanzine`

## Context

The semantic stack already exists (`@cf/baai/bge-m3` + Vectorize `kcvv-search` index + `POST /api/search` + nightly cron / webhook indexer + `useSemanticSearch` + api-contract — all tested). #2057 is **frontend wiring** in `<HubSearch>`: route the **answer lane** through semantic; people stay keyword. This round locks **how the smart results present**.

## Decision — **B: answer-forward with the real CMS summary** ✅

When a query semantically matches a `responsibility` and the **top match's score ≥ 0.5** (the threshold the backend already uses for its LLM gate), the dropdown shows that match **expanded**: category · question · the path's **own CMS summary** (1–2 lines) · contact (name + short role) · **"Lees volledig antwoord →"**. Remaining answers + people render as compact rows below.

- **Why not C (LLM `answer`):** Llama-3.1-8B formulating club-specific procedures (the 48u aangifte deadline, who to mail) is a high-stakes hallucination risk — a parent acting on a subtly-wrong answer misses a real deadline. Needing a "controleer hieronder" disclaimer undercuts the trust it tries to build. The LLM `answer` stays **out of the hub dropdown** (candidate for a future `/zoeken` page).
- **Why not A (list-only):** a user who types a full question wants an answer, not a list. B serves that — with the club's **own words**, not the model's. Zero hallucination.
- **Score gate:** strong top match (≥ 0.5) → answer-forward; weaker → falls back to the plain list (= A). The semantic result already carries `score`.

## Cross-cutting (all variants)

- **Smart signal:** a sparkle + "Slim gezocht / Beste match" mono hint atop the dropdown so users see natural language worked. No new brand colour — jersey-deep + existing iconography (add `Sparkle` to `@/lib/icons.redesign`).
- **Async:** people (keyword) appear instantly; the answer lane shows a shimmer then fills when semantic settles. Keep the last settled results visible while refining (no flash).
- **Graceful fallback (PRD floor):** on endpoint error/unavailable → silent keyword fallback (`searchResponsibilities`), **no** AI hint, **no** answer-forward (list only). Empty semantic results = genuinely no answer match (people-only), not an error.
- **No fake "enter for more":** the dropdown **is** the result set this phase (no separate results page). A row / "Lees volledig antwoord →" → `window.location.hash = <slug>` opens the finder accordion (the #2056 mechanism). People → `#structuur`.

## Build shape (#2057)

```text
<HubSearch>  (hero + sticky nav)
├─ people lane   → searchMembers (keyword, sync, instant)
├─ answer lane   → useSemanticSearch({ type: "responsibility" })
│                  · map results → ResponsibilityPath by slug · keep score
│                  · loading → shimmer; error → keyword searchResponsibilities (fallback)
├─ answer-forward → top answer, expanded (summary + contact + "Lees volledig antwoord →"), only when score ≥ 0.5 and semantic (not fallback)
└─ assemble      → answer-forward (if any) · then interleave remaining answers + people · smart hint header
```

No Sanity / Cloudflare / api-contract changes — infra ACs are met by existing code (note in PR). Tests + `check-all` (web + api). Stories + `vr` tag (baselines deferred).
