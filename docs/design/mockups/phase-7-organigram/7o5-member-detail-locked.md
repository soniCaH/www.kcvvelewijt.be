# Phase 7 · `/club/organigram` — Round 5 (MEMBER DETAIL) — LOCKED

**Date:** 2026-06-08
**Mockups:** `7o5-member-detail-v2-compare.html` (person-first content + container options).
The first pass `7o5-member-detail-compare.html` (position-summary model) is **superseded** — kept only as
history.
**Owner:** @climacon
**Tracker:** #1529 · **Milestone:** `redesign-retro-terrace-fanzine`

## Decision

**Person-first contact detail, in a right side-panel (B).**

Clicking a node opens a **person's contact** — not a function summary (owner correction, 2026-06-08:
*"I expected click to open the contact person immediately"*). It slides in from the right so the
directory/explorer stays visible and the panel just **updates as you click around** (ideal over the
verkenner and for browsing person→person). On mobile it becomes a **full-width bottom sheet**.

- **Single holder (common):** click → that person's panel directly.
- **Shared (2+):** click → lands on the **first holder**, with a **name-tab switcher** at the top listing
  all holders → flip to #2/#3/#4. Always lands on a real, contactable person.

## Content spec (data-bound — see `7o5-member-detail-v2-compare.html`)

```text
header     afdeling · functie (kicker) · person photo/monogram · name (italic display) · roleCode pill (if present)
actions    ✉ Mail · ☎ Bel   — render only when email/phone exist on that staffMember
helpt met  responsibility chips → deep-link into the Hulp section/finder (the responsibilities whose
           primaryContact resolves to THIS position); auto-hides when none
profiel    "Volledig profiel →" → /staf/{psdId}   — only when psdId exists
shared     holder-switcher (avatar + first-name tabs) above the header; lands on holder #1
single     no switcher
```

Nothing richer than this — `staffMember.bio`/`birthDate`/`joinDate` stay on the `/staf/{psdId}` profile,
not in the panel.

## Behaviour / a11y

- Opens from a **directory card** OR an **explorer leaf**; same panel, same content.
- Right side-panel on desktop; **full-width bottom sheet** under the mobile breakpoint.
- Close via ✕ / backdrop / **Esc**; focus trap while open; returns focus to the trigger.
- Labelled dialog: `aria-label="Contactgegevens — {name}"` (distinct from the verkenner dialog).
- Deep-link preserved: `?memberId=` opens the panel on load (existing behaviour).
- **Analytics:** `organigram_member_clicked { member_id (hashed via hashMemberId), view }` — unchanged
  event; fires on open. Switching holders in a shared panel re-fires with the new (hashed) id.

## Consolidation

`<MemberDetailPanel>` (new) **replaces both `<MemberDetailsModal>` and `<ContactOverlay>`** — one
person-first surface for every entry point (directory + explorer). The old center-modal is retired.

## Defers

- **7o6:** the Hulp finder that the "Helpt met" chips link into; exact `primaryContact`→position
  matching for "Helpt met".
- **7o7:** the mobile breakpoint value; whether the panel also exposes the vacant-recruit CTA.

## Rejected

- **A center modal** — covers the directory/explorer; person→person browsing is open/close/open.
- **C dedicated responsive bottom-sheet** — best mobile, but two presentations to build; B already
  degrades to a full-width sheet on mobile for far less cost.
- **Position-summary detail** (first pass) — owner wants person-first; the summary-then-list step was
  wrong for the common single-holder case.
