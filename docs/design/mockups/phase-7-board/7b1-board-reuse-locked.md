# Phase 7 · Board pages (bestuur / jeugdbestuur / angels) — REUSE CONFIRM — LOCKED

**Date:** 2026-06-07
**Mockup:** `7b1-board-hero-and-reuse-compare.html`
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master)
**Supersedes (on landing):** `docs/prd/club-landing-page-redesign.md` (board portion)

Per the epic, this is a **confirm-the-6.C-`<TeamStaff>`-reuse**, not a full design drill. Confirmed.

## Scope

- **In:** `/club/bestuur`, `/club/jeugdbestuur`, `/club/angels` — all via `createBoardPage` →
  `<BestuurPage>`. Each board is a Sanity `team` doc (header + staff [+ rare players]).
- **OUT:** `/club/ultras` — it is **NOT** a board page. `UltrasPage` is a custom component
  (`InteriorPageHero` + bespoke content), not `createBoardPage`/`BestuurPage`. Needs its own
  treatment — flagged as a separate Phase 7 item (see §5).

## Decision

**Reuse the 6.C `<TeamStaff>` roster verbatim. Hero B = dark group-photo.**

Reskinned board page spine:

```text
/club/{bestuur,jeugdbestuur,angels}
├─ Hero (B) — jersey-deep-dark band: kicker "De club" + EditorialHeading {team name} with a
│             **warm "." accent** (D1 — gold period; the cream hero's jersey-deep "." recoloured
│             warm so it pops on dark green; on-brand CtaBand colour; bright-jersey green retired)
│             + tagline lead + group photo (team.teamImage). The group photo pops on dark;
│             jersey-deep-dark is the redesign dark (NOT retired kcvv-black) → in-system.
├─ <StripedSeam>
├─ Over het … — editorial description block (sanitised HTML from team.body/tagline),
│               jersey-deep left-accent rule. Auto-hides when empty.
├─ De leden — <TeamStaff> (6.C) verbatim: round newsprint photo / jersey-deep monogram,
│             name first-semibold + last-italic, mono function label. Auto-hides when empty.
└─ <CtaBand> — jersey-deep-dark "Wie doet wat?" → /club/organigram (Organigram bekijken).
```

## Reuse caveat — role-label fix (BUILD-TIME, required)

Board titles ("Voorzitter", "Secretaris", "Penningmeester", "Bestuurslid") live in
**`team.staff[].role`** (free text). `member.functionTitle` is PSD-synced and **empty** for board
members. `<TeamStaff>`'s `resolveFunctionLabel` only treats `role` as a _bucket_
(trainer/afgevaardigde) → an unrecognised board role falls through to **"Staf"**.

**Fix (pick one at build):**

1. Extend `resolveFunctionLabel`: after the bucket check, **pass through free-text `role`**
   before the "Staf" fallback. (Safe — trainer pages pass recognised buckets first.) — preferred,
   benefits any free-text role.
2. Or map `role → functionTitle` when building `TeamStaffMemberData` at the board build site.

## Consequences

- **Retires `<TeamRoster>` + `<StaffCard>`** (the board pages were their last consumer) →
  **unblocks the other half of #1960** (combined with /jeugd retiring TeamOverview/TeamCard).
- Drops `<InteriorPageHero>`, `<SectionStack>`, `diagonal`, `<SectionCta>` from board pages.
- `players` on a board team are rare; render via `<TeamStaff>` only (titles via role) or ignore —
  boards are staff-by-role, no squad. Decide at build (default: staff-only).

## §5 — ultras follow-up

`/club/ultras` (custom supporters page) is un-redesigned and outside board scope. Flag a separate
Phase 7 item to redesign it (or fold into the club-landings work). Not covered by this lock.
