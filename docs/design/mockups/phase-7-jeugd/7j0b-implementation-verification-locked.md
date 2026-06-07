# Phase 7 · /jeugd — Round 0b (IMPLEMENTATION VERIFICATION) — LOCKED

**Date:** 2026-06-07
**Owner:** @climacon
**Why:** owner asked to verify the current implementation so the redesign drops nothing.
Audit of `getJeugdSections.tsx`, `JeugdEditorialGrid.tsx`, `EditorialCard`, `TeamOverview`,
`MissionBanner`, and route existence.

## Findings

1. **The editorial grid is the page's primary NAVIGATION HUB, not a minor section.**
   `<JeugdEditorialGrid>` is a 9-item magazine grid = **3 auto-filled Jeugd-article slots + 6 nav
   cards** to the practical parent tasks: _Word lid · Onze jeugdvisie · Trainingen &
   ProSoccerData · Organigram · Wie contacteer ik? · Blessure/afmelding_. Driven by the
   `jeugdLandingPage` singleton's `editorialCards` when present; falls back to hardcoded
   `NAV_CARDS`. **The redesign must preserve all six affordances + the 3 article slots.**

2. **Three nav/CTA destinations are dead routes (hardcoded fallback):**
   `/club/inschrijven` (404), `/jeugd/visie` (404), `/jeugd/medisch` (404).
   `/club/organigram` + `/hulp` exist. `/nieuws/prosoccerdata` depends on an article slug.
   The Sanity singleton _may_ override these in prod (not verified — Sanity budget).

3. **Hero is photo-based today** (`/images/youth-trainers.jpg`) with copy
   _"Meer dan 200 jonge voetballers. Gediplomeerde trainers. Eén missie: plezier, techniek en
   teamspirit."_ — concrete parent reassurance.

4. **No loss from `TeamOverview` → `<YouthDirectory>`:** TeamOverview already buckets youth by
   division internally + links each team to `/ploegen/[slug]`; YouthDirectory preserves both.
   Filter buttons are not enabled on /jeugd. (Correction to 7j0: MissionBanner's _default_
   attribution already reads "sinds 1909"; /jeugd passes a custom attribution anyway, so the
   founding-year note does not apply here.)

## Decisions

1. **Repoint dead links to existing surfaces (no new routes built in this redesign):**
   - **"Onze jeugdvisie"** → folds into the **filosofie section on /jeugd itself** (anchor
     `#visie`); no separate `/jeugd/visie` page. ⇒ the filosofie/visie section **STAYS** (it now
     absorbs the visie content — resolves the 7j2 keep/drop question in favour of KEEP).
   - **"Blessure of afmelding?"** → a Jeugd article or `/hulp`.
   - **"Word lid" + the page CTA** → `/hulp` or a `mailto:` until a real membership form exists
     (#1473). Exact target finalised at the CTA detail round.
   - Editor can still override any card href via the `jeugdLandingPage` singleton.
2. **Hero artefact = youth team/training photo** in a `<TapedFigure>` newsprint frame (NOT
   `<JerseyShirt>`). Warmer/more human for parents. Keep the **"gediplomeerde trainers"**
   reassurance in the hero lead/meta.
3. **Nav hub preserved** — reskin `<JeugdEditorialGrid>` to cream-paper TapedCard editorial cards
   (featured/medium/third positions retained), all 6 nav affordances + 3 article slots intact.

## Impact on the IA round (7j2 rebuilt)

- Filosofie/visie section is now KEPT in every variant (absorbs jeugdvisie).
- The "editorial cards" block is relabelled **"Nav hub"** and treated as primary functional content.
- Hero shows a photo artefact, not an illustration.
