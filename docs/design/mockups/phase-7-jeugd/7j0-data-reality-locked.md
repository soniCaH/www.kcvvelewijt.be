# Phase 7 · /jeugd — Round 0 (DATA REALITY) — LOCKED

**Date:** 2026-06-07
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)
**Supersedes (on landing):** `docs/prd/jeugd-landing-page.md`

Locks what data the /jeugd redesign may render, before voice/IA/detail drilling.

---

## 1. Live data sources (the only renderable data)

1. **`jeugdLandingPage` Sanity singleton → `editorialCards[]`** (editor-curated grid):
   `tag`, `title`, `description?`, `arrowText`, `href`, `image` (→ `imageUrl w=900`),
   `position` (`featured` / `medium` / `third`), `cardType` (`nav` | `article`). The `article`
   type auto-fills from Jeugd-category articles. Source: `jeugd-landing-page.repository.ts`.
2. **Youth `team` docs** (via `TeamRepository`): `name`, `slug`, `age` (U6–U21), `tagline`,
   `divisionFull`/`division`, `teamImage`. `groupTeamsForLanding` buckets by **division**:
   Bovenbouw (U17–U21) / Middenbouw (U12–U16) / Onderbouw (U6–U11).
3. **Jeugd-category articles** (`category: "Jeugd"`, limit 3) — feed the `article` editorial cards.

**No jeugd-wide trainer field. No jeugd-specific sponsor field.** (See §3 decisions.)

## 2. Reuse map

| Asset                                                | State                                                                                        | Disposition                                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `<YouthDirectory>` (6.C)                             | **Redesign-ready** (division groups, mono/jersey-deep, `font-display-big`)                   | **Reuse** for the divisions section → **retires `<TeamOverview>`/`<TeamCard>`** (unblocks half of #1960) |
| `groupTeamsForLanding` / `YouthDivisionGroup`        | Reusable                                                                                     | Reuse the division buckets                                                                               |
| `<JeugdEditorialGrid>`                               | **Legacy** (`bg-kcvv-green`, `font-title`, `text-kcvv-gray-blue`)                            | Rebuild on cream-paper vocabulary (TapedCard editorial cards)                                            |
| `<MissionBanner>` (quote)                            | Legacy + **wrong founding year** (says 1948; canonical 1909, `reference_club_founding_year`) | Reskin as the filosofie/quote block; fix year in passing                                                 |
| `<SectionCta>` / `SectionStack` + `getJeugdSections` | Legacy (`kcvv-black`, dark)                                                                  | Rebuild; drop SectionStack/dark header                                                                   |
| `<JerseyShirt>` (Phase 4.5)                          | Redesign primitive                                                                           | Hero jersey-illustration artefact                                                                        |

## 3. Decisions taken at this checkpoint

1. **NO sponsors on /jeugd.** Resolves the §6.9-vs-must-avoid conflict in favour of the
   must-avoid ("no commercial sponsor placement on jeugd page"). The youth page stays
   non-commercial / parent-facing; sponsors live on `/sponsors` + homepage only. The §6.9
   "supporting sponsors" line is overruled.
2. **DROP the trainers grid.** §6.9 wanted one, but there is no jeugd-wide trainer data source
   (staff is per-team only). Aggregating it is noisy + an editorial/eng burden with no curation
   control. Trainers stay on each team-detail page. (`feedback_editorial_cost_discipline`.)
3. **Hero is a sibling component, NOT `<EditorialHero variant="announcement">`** (§5.4
   sibling-per-surface lock; same as sponsors). Headline "De toekomst van Elewijt." carries over;
   jersey-illustration artefact via `<JerseyShirt>`.
4. **Youth grouped by division** (Bovenbouw/Middenbouw/Onderbouw), not by age — reuse
   `<YouthDirectory>`. (`project_youth_divisions`.)
5. **Voice constraint locked: "for parents, not players."**

## 4. Known issue to resolve at CTA round

- 🐞 The current "Word ook lid" CTA targets **`/club/inschrijven`, which does not exist (404)**.
  The redesign CTA must point somewhere real — contact/email, or the membership intake form
  (#1473, nice-to-have, unbuilt). Decide at the CTA detail round.

## 5. Page scope after decisions (lean)

```text
/jeugd  (parent-facing, non-commercial)
├─ Hero (sibling)        — "De toekomst van Elewijt." + jersey-illustration artefact
├─ Editorial cards grid  — jeugdLandingPage editorialCards (nav + article), reskinned
├─ Filosofie / quote     — spelplezier mission (MissionBanner reskin, fix founding year)
├─ Youth divisions       — <YouthDirectory> Bovenbouw / Middenbouw / Onderbouw
└─ "Schrijf je in" CTA   — target TBD (current /club/inschrijven is 404)
   (NO sponsors · NO trainers grid)
```

## 6. Carry-forward into VOICE round (7j1)

- Register for a **parent-facing** youth page: proud/aspirational, fun-first/reassuring,
  invitational/onboarding, or developmental/academy?
- Headline candidate "De toekomst van Elewijt." (master plan) vs. alternatives — voice picks
  the register, headline follows.
