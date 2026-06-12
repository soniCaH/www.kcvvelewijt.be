# Phase 7 · `/hulp` hub — Round 9 (FINAL-ASSEMBLY UX DECISIONS) — LOCKED

**Date:** 2026-06-12
**Mockup:** `7o9-assembly-ux-decisions-compare.html` (4 decisions × 3–4 variants).
**Owner:** @climacon · **Tracker:** #2058 (Phase 7 assembly) · **Milestone:** `redesign-retro-terrace-fanzine`
**Basis:** a 3-pass UX review of the assembled hub (heuristic/flow · competitive best-practice · a11y/mobile).

## Decisions

1. **Hero voice → B: help-forward headline, keep the structure-index card.** Hero H1 becomes **"Waarmee kunnen we je helpen?"** (warm "?") with a help-forward lead; the cream structure-index artefact stays. The finder section heading changes to avoid the duplicate ("Veelgestelde vragen").
2. **Verkenner prominence → B: directory-first, verkenner demoted.** The big "Volledig overzicht — De hele structuur in beeld" co-section becomes a quiet **"Bekijk het volledige organigram →"** trigger below the directory. The fullscreen verkenner (#2054) stays, opened on demand.
3. **Vacant cards → C: dimmed + sorted last.** Vacant ("deze plek is vrij") cards keep their per-position title but render **muted and grouped at the end of each afdeling**, so real people lead and recruitment stays without scan-noise. (Degrades to look like the current peers when there are 0 vacancies.)
4. **Search signposting → D: example placeholder + browse bridge.** The hero search placeholder teaches natural language (**"bv. 'mijn kind is geblesseerd' …"**) and a **"↓ of blader hieronder door de categorieën"** bridge sits under it.

## Clear fixes (not forks — implemented directly, from the UX passes)

- **Cross-links:** "Helpt met" chips deep-link the question **slug** (not bare `#hulp`); a **person search-selection opens the panel** (not just scroll to the grid).
- **A11y:** background **`inert`** while a dialog is open; resolve the **two-dialogs-open** case (panel over verkenner); sticky **nav doors move focus** into the section; **tap targets ≥ 44px** (panel close, chips); search **SR live-region** ("N resultaten"); search **Escape keeps focus** in the input; **reduced-motion** honored (verkenner pop, press-downs).
- **Search no-results** → "Contacteer de club →" escape.
- **Centralize the audience list** (one `HUB_AUDIENCE_FILTERS`, kills the 3-way drift) + add **"Nieuw lid"** (niet-lid) — a named audience that had no door.
- **Scrollspy** active door in the sticky nav.

## Assembly ACs (#2058)

FAQPage + BreadcrumbList + Organization JSON-LD; Structuur ⇄ Hulp cross-links; analytics events + **full umbrella (#1974) GTM/GA4 steps**; retire legacy on hub surfaces (`UnifiedOrganigramClient`/`SectionStack`/`InteriorPageHero`/`SectionCta`/`diagonal`, `git grep` clean); `/hulp` e2e; `check-all` green. **VR baselines deferred** (owner). Storybook checkpoint per implemented chunk.
