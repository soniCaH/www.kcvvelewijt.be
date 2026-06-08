# Phase 7 · `/club/organigram` — Round 4 (NODE / PEOPLE-CARD STATES) — LOCKED

**Date:** 2026-06-08
**Mockups:** `7o4-node-card-states-compare.html` → `7o4-card-states-locked.html` (interactive hover)
**Owner:** @climacon
**Tracker:** #1529 · **Milestone:** `redesign-retro-terrace-fanzine`

## Decision

The people-card uses the locked **6.C `<TeamStaff>` idiom** in all three occupancy states. Two state
treatments were the open calls:

- **Shared (2+ holders) = S-A dual-avatar** with an "N personen" label.
- **Vacant (0 holders) = V-C recruit** — a warm volunteer call, not a dead placeholder.

## Locked spec (see `7o4-card-states-locked.html`)

```text
SINGLE   6.C card: round newsprint photo OR jersey-deep monogram (~90% have no photo) ·
         name first-semibold + last-italic · mono function label · optional roleCode pill top-right.
SHARED   two overlapping avatars + "N personen". 3+ → two avatars + a "+N" chip.
VACANT   warm card · dashed avatar with "+" · position name (italic) · "deze plek is vrij" ·
         soft CTA "Iets voor jou? →" → contact/Hulp.
SCALE    identical chrome at directory scale (64px avatar) and smaller explorer-node scale.
```

## Discovery model (REVISED 2026-06-08 — person-first, hover dropped)

Clicking a node opens a **person's contact directly**, not a function summary:

- **Single holder (~the common case):** click the card/node → that **person's contact** (7o5) opens
  immediately.
- **Shared (2+):** click → opens the **first holder's** contact with a **holder-switcher** (avatar+name
  tabs for all holders) so you flip to co-holders — that's how you reach #3/#4. Always lands on a
  contactable person.
- **Hover-to-front: REMOVED** (owner, 2026-06-08: *"the hover effect is not needed — I expected click to
  open the contact person immediately"*). The dual-avatar stays **only as a visual "2+ people" cue**; the
  "+N" chip just signals count. No per-avatar hover/tooltip.

## Constraints / edge cases

- **Vacant cards never appear in the hero index** (7o1) — only in the directory + explorer.
- **roleCode pill** (`organigramNode.roleCode`, ≤6 chars) renders top-right when present; auto-hides.
- Monogram = initials of `firstName`/`lastName`; if a holder has no usable name, fall back to the
  position monogram or the club flat-logo (existing fallback rule).
- The vacant CTA target is the club contact / Hulp entry (final destination confirmed in 7o7).

## What this defers

- **7o5:** the member-detail surface that the shared/single card opens (and how it lists multiple
  holders + their contacts).
- **7o7:** the vacant-CTA destination wording/route; whether the recruit CTA also surfaces in an empty
  department.

## Component note

The card is one component (`<OrgPersonCard>` or reuse/extend the 6.C `<TeamStaff>` card) parameterised by
occupancy state (`single | shared | vacant`) + scale (`directory | node`). **No hover behaviour** — the
dual-avatar is a static cue; the whole card is one click target that opens the 7o5 person detail.
