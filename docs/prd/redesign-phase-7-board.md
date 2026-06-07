# PRD: Redesign Phase 7 — Board pages (`/club/bestuur`, `/jeugdbestuur`, `/angels`)

**Status**: Ready for implementation (design locked — reuse-confirm)
**Date**: 2026-06-07
**Design contract**: `docs/design/mockups/phase-7-board/7b1-board-reuse-locked.md` (+ `7b2` accent)
**Epic**: #1529 (Redesign Phase 7) · **Milestone**: `redesign-retro-terrace-fanzine`
**Supersedes**: board portion of `docs/prd/club-landing-page-redesign.md`

---

## 1. Problem statement

The three board pages (`/club/bestuur`, `/club/jeugdbestuur`, `/club/angels`) render via
`createBoardPage` → `<BestuurPage>` in pre-redesign vocabulary: `<InteriorPageHero>` +
`<SectionStack>` (`diagonal`, `kcvv-black`) + a `<TeamRoster>`/`<StaffCard>` member roster +
`<SectionCta>`. They were the **last consumers of `<TeamRoster>`/`<StaffCard>`** — retiring them
**unblocks the remaining half of #1960**.

This is a **reuse-confirm**, not a redesign drill: the locked 6.C `<TeamStaff>` roster + a hero +
an editorial description + the existing `<CtaBand>` cover the page with no new component design.

## 2. Scope

### In scope (`apps/web` only)

- Rebuild `createBoardPage` / `<BestuurPage>` onto the locked spine (drop `SectionStack` +
  `InteriorPageHero` + `diagonal` + `SectionCta`).
- New `<BoardHero>` (jersey-deep-dark, group photo, warm "." accent) — or reuse a shared dark hero.
- Reuse 6.C `<TeamStaff>` for the member roster (with the role-label fix, §5).
- Editorial description block (sanitised HTML), jersey-deep left-accent, auto-hide on empty.
- Organigram `<CtaBand>` (jersey-deep-dark) → `/club/organigram`.
- Retire `<TeamRoster>` + `<StaffCard>`.

### Out of scope

- **`/club/ultras`** — NOT a board page (custom `UltrasPage`). Separate Phase 7 item (#TBD).
- **No Sanity schema change.** Board = existing `team` doc (header + `staff[]` + rare `players`).
- **No BFF change.**

## 3. Phases

1. **Reskin** — rebuild board pages on the locked spine (hero + description + `<TeamStaff>` +
   `<CtaBand>`) incl. the role-label fix.
2. **Retire + cleanup** — delete `<TeamRoster>`/`<StaffCard>`; comment/close-out #1960; analytics +
   final checks.

## 4. Acceptance criteria

### Phase 1 — Reskin

- [ ] `<BestuurPage>` recomposed: `<BoardHero>` (jersey-deep-dark, kicker "De club" +
      `<EditorialHeading>` team name + **warm "." accent** + tagline lead + `team.teamImage` group
      photo) → `<StripedSeam>` → description block (sanitised HTML, jersey-deep left rule,
      auto-hide) → "De leden" `<TeamStaff>` → organigram `<CtaBand>`.
- [ ] No `SectionStack` / `InteriorPageHero` / `diagonal` / `kcvv-black` / `<SectionCta>`.
- [ ] **Role-label fix:** board `role` (free text e.g. "Voorzitter") renders as the staff function
      label — extend `resolveFunctionLabel` to pass through unrecognised free-text `role` before the
      "Staf" fallback (preferred), or map `role → functionTitle` at the board build site. Add a
      regression test: a "Voorzitter" role renders "Voorzitter", not "Staf".
- [ ] `players` (rare on boards) handled — staff-only roster by default.
- [ ] All three routes (bestuur/jeugdbestuur/angels) render; e2e smokes green.
- [ ] Stories (`vr`) for `<BoardHero>` + the board page composition states (photo/no-photo,
      empty-description). `check-all` passes.

### Phase 2 — Retire + cleanup

- [ ] `git grep` confirms zero remaining consumers of `<TeamRoster>` + `<StaffCard>`; delete them
      (files + stories + tests + barrels).
- [ ] **#1960:** comment that both halves (TeamOverview/TeamCard via /jeugd; TeamRoster/StaffCard
      via boards) are now retired → ready to close once both PRs land.
- [ ] Analytics: `board_view` page view (param: `board` slug); add `board_` to the GTM trigger
      regex (manual, note in PR). No PII.
- [ ] Keep breadcrumb JSON-LD; metadata via `createBoardPage`. `check-all` + VR green.

## 5. Reuse caveat — role-label fix (carried from 7b1)

Board titles live in `team.staff[].role` (free text); `member.functionTitle` is PSD-empty for board
members. `<TeamStaff>`'s `resolveFunctionLabel` treats `role` only as a bucket → unrecognised board
roles fall to "Staf". Fix at build (pass-through free-text role, or map role→functionTitle).

## 6. Open questions

1. `<BoardHero>` as a new component vs. a shared dark hero primitive with `<TeamHero>`?
2. Confirm whether any board team carries `players` in production (Sanity budget — defensive
   staff-only default regardless).
