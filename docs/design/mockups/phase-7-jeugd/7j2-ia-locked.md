# Phase 7 · /jeugd — Round 2 (IA: section order) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7j2-ia-compare.html` (rebuilt post-verification)
**Owner:** @climacon

## Decision

**Order = Visie → Hub → Teams → CTA** (a variant the owner specified, not one of the three drawn).

```text
/jeugd  (parent-facing, non-commercial)
├─ Hero (sibling)        — "Beter worden begint met plezier." + youth PHOTO (TapedFigure)
├─ Filosofie / visie     — the jeugdvisie content; anchor target #visie
├─ Nav hub               — reskinned <JeugdEditorialGrid>: 3 Jeugd-article slots + 6 nav cards
│                          (word lid · jeugdvisie→#visie · trainingen/PSD · organigram · hulp · medisch)
├─ Divisions             — <YouthDirectory> Bovenbouw / Middenbouw / Onderbouw (reuse 6.C)
└─ CTA                    — "Schrijf je in" → /hulp or mailto (final target at CTA round)
   (NO sponsors · NO trainers grid)
```

Rationale: pitch (hero) → why/approach (visie) → practical links + news (hub) → the actual teams
(divisions) → join (CTA). Visie leads the body so the "Onze jeugdvisie" hub card can anchor up to
`#visie` on the same page (no separate `/jeugd/visie` route).

## Reminder (scope, not re-decided here)

- This locks ORDER + section inventory + data only. **Each section's visual design is a separate
  DETAIL round** (low-fidelity blocks in the mockup are not the design).

## Carry-forward into DETAIL rounds

1. **Nav hub** — the magazine layout (featured/medium/third), TapedCard card chrome, how `article`
   vs `nav` cards differ, greyscale/photo treatment. (Biggest remaining drill.)
2. **Hero** — youth-photo `<TapedFigure>` treatment (frame, overlap, sizing); fold "gediplomeerde
   trainers" into the lead.
3. **Filosofie / visie** — quote vs richer block; the `#visie` anchor; distinct copy from the hero lead.
4. **Divisions** — reuse 6.C `<YouthDirectory>` (already locked) — confirm, minimal drilling.
5. **CTA** — band chrome + final target (the `/club/inschrijven` 404 fix).
