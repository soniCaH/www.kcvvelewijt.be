# Phase 2.A.5 — Alert Design Checkpoint

> **Status:** ✅ **LOCKED — Two-form Alert API: `<AlertBadge>` (E) primary + `<Alert>` (B) long-form.**
> **Date locked:** 2026-04-30.
> **Worktree:** `feat/issue-1572` (`docs/design/mockups/phase-2-a-5-alert/`).
> **PRD:** `docs/prd/redesign-phase-2.md` §6.4 — rewritten as part of this checkpoint.
> **Tracking issue:** [#1572](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1572).

## Locked decisions

- **`<AlertBadge>` (E — Angled Badge)** is the primary alert. Owner-sketched, strongest retro signal in the system. Used for inline form-validation + short single-headline confirmations + form summaries (single badge, multi-line message).
- **`<Alert>` (B — Ticket Stub)** is the long-form companion. Used for page-level / dashboard-level alerts with title + body + dismissible.
- **Variant set (both forms):** `success` / `warning` / `error`. The legacy `info` variant stays retired.
- **E warning bg:** `--color-warning` (mustard ochre on cream) — locked over ink-bg alternative per owner.
- **E dismiss:** non-dismissible by design. The badge resolves on revalidation; no `×` slot.
- **E multi-line:** supported. Wrapped lines align to the same x-edge as line 1; badge stays anchored to line 1 via `flex-start` + small top-margin nudge. One badge can hold a multi-line summary under a form.
- **B right-edge claim strip:** removed. The icon block + tinted body already carry the variant cue; the card already has a border + paper shadow; the strip duplicated the signal without adding readability.
- **Error glyph (both forms):** `!` (Phosphor `WarningCircle` in production). Distinct from warning's `▲` (Phosphor `Warning`).
- **B title legibility on dusk panels:** explicitly overridden via `.panel--dusk .stub__title { color: var(--color-ink) }` so the mustard/dusty-brick body keeps its ink-dark text regardless of the surrounding theme.
- **Discarded directions:** A (Paper Notice), C (Banner Strip), D (Mono Stamp). Mockups preserved in this directory for historical reference; will not ship.

## Why this exists

PRD §6.4 originally specified Alert as a Track A "pure token swap" — drop `info`, swap to retro `--color-alert` / `--color-warning` palette, swap icons to Phosphor Fill. The implementation matched the spec exactly and produced this:

- left-accent border + tinted soft bg + Phosphor icon + sans-serif title + ink body
- visually indistinguishable from Material UI / shadcn / any modern component library

Owner reviewed and rejected: _"these don't look ANY like our retrozine style at all"_. The PRD's token-only spec was insufficient — it specified pigments without specifying **vocabulary**. Promoting Alert from "Track A token swap" to a proper design checkpoint here.

## Five directions

Each direction is a self-contained HTML mockup at `docs/design/mockups/phase-2-a-5-alert/option-*.html`. Open in a browser to compare visually — they all share the same Track B Direction D fonts and tokens but interpret "retro-fanzine alert" differently.

| File                                                       | Direction        | One-line read                                                                              |
| ---------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| [`option-a-paper-notice.html`](option-a-paper-notice.html) | **Paper Notice** | Direction D paper-card body applied to alerts — sibling of BrandedTabs / FilterTabs        |
| [`option-b-ticket-stub.html`](option-b-ticket-stub.html)   | **Ticket Stub**  | Perforated-edge "torn from a programme" feel + mono kicker label                           |
| [`option-c-banner-strip.html`](option-c-banner-strip.html) | **Banner Strip** | Bold ink/jersey/alert/warning header band with inverse mono title, soft body below         |
| [`option-d-mono-stamp.html`](option-d-mono-stamp.html)     | **Mono Stamp**   | Lightweight tint-only body anchored by a strong ink-bordered mono-caps stamp on the left   |
| [`option-e-angled-badge.html`](option-e-angled-badge.html) | **Angled Badge** | Solid colored angled badge + italic Freight Display message — owner-sketched, no card body |

## Trade-off matrix

|                                         | Paper Notice (A) | Ticket Stub (B) | Banner Strip (C) | Mono Stamp (D) | Angled Badge (E) |
| --------------------------------------- | ---------------- | --------------- | ---------------- | -------------- | ---------------- |
| Retro-fanzine signal                    | medium-low ¹     | high            | medium-high      | medium         | **highest**      |
| Personality / distinctiveness           | low              | medium          | high             | medium         | **highest**      |
| Information capacity                    | high             | high            | high             | high           | **low** ²        |
| Visual weight on page                   | high             | medium-high     | **highest**      | low            | **lowest**       |
| Cohesion with Track B chrome            | **highest**      | medium          | medium-high      | medium-low     | low ³            |
| Multi-line readability                  | high             | high            | high             | high           | medium-low       |
| Dismissible affordance                  | natural          | natural         | natural          | natural        | **awkward** ⁴    |
| Implementation cost                     | low              | medium ⁵        | low              | low            | low              |
| Risk of "looking like every other site" | medium           | low             | low              | low            | **lowest**       |

¹ Paper Notice reads as "Direction D applied to alerts" — fits the family but doesn't add personality. Risks "all atoms wear the same uniform".
² Angled Badge headline-style messaging caps at ~1–2 lines comfortably. Multi-paragraph errors (server-side validation summaries) don't fit.
³ Angled Badge breaks from paper-card vocabulary deliberately. That's its strength (distinctiveness) and weakness (less family resemblance).
⁴ The angled-badge inline form has no obvious slot for an `×` close button. Could append a low-key ink-muted glyph after the message but it disrupts the reading rhythm.
⁵ Ticket Stub's perforation effect needs `radial-gradient` mask + dashed pseudo-element — slightly trickier to get pixel-perfect on light + dark surfaces.

## Where each direction shines

- **Paper Notice (A)** — administrative confirmations, system-level notifications, anywhere "this is a piece of UI like the others" is the right read. Lowest cognitive load.
- **Ticket Stub (B)** — content-adjacent notices ("nieuwe wedstrijd toegevoegd aan kalender") that benefit from feeling more handcrafted. Risk of overuse if too many primitives use perforated edges.
- **Banner Strip (C)** — high-stakes communications: payment failures, registration errors, ban-the-account moments. Loud but earns its loudness.
- **Mono Stamp (D)** — calm informational notices, log-line confirmations, anywhere typography should carry the retro signal without chrome weight.
- **Angled Badge (E)** — inline form-validation messaging, single-headline confirmations ("Bericht verzonden."), error explanations under a specific input. Strongest personality, smallest footprint.

## Locked outcome — two-form Alert API

Two distinct components ship; one shape per message-length tier:

- **`<AlertBadge>` (Direction E — Angled Badge)** — primary inline form. Solid-coloured angled badge on the left + italic Freight Display message to the right. No card body, no soft tinted bg — the page colour shows through. Non-dismissible by design. Used for inline form-field validation (`Geen geldig telefoonnummer.`), short single-headline confirmations (`Bericht verzonden.`), and form summaries (one badge under the form with a multi-line message).
- **`<Alert>` (Direction B — Ticket Stub)** — long-form companion. Paper-card outer with perforated left notch, mono caps kicker → italic Freight Display title → ink Inter body, optional Phosphor `X` dismiss. Used for page-level / dashboard-level alerts that need a title + multi-paragraph body and/or a dismiss button.

Both share the same variant set (`success` / `warning` / `error` — `info` retired) and the same icon mapping (`CheckCircle` / `Warning` / `WarningCircle`).

### Why two components, not one with a `mode` prop

A single `<Alert>` with a `mode="badge" | "notice"` prop would collapse the API surface, but the two visual contracts have **zero shared markup** — no shared border, no shared body, no shared layout grid. A `mode` prop would force every prop (title, dismissible, multi-paragraph body) to gain a "valid in this mode only" footnote. Two components communicate the constraint at the type level: `<AlertBadge>` simply doesn't accept `title` or `dismissible`; `<Alert>` accepts both naturally.

### Why E primary

1. **E carries the strongest retro-fanzine signal** of any option. It's the most distinctive thing the design system owns. Owner reached for E unprompted from a sketch — that's the strongest possible product-design signal we landed on a real lead.
2. **E genuinely doesn't fit multi-paragraph errors.** Form-validation messages are short (`Geen geldig telefoonnummer.`, `Verplicht veld.`, `Bericht verzonden.`) — that's E's home. Long-form server errors and dashboard banners need the long-form shape.
3. **The form atoms (#1571) consume `<AlertBadge variant="error">`** for the helper-row error slot — the originally-proposed `<FieldError>` primitive is superseded. Two teams converging on the same retro-pill-plus-italic-message vocabulary (Phase 2.A.5 Alert checkpoint and Phase 2.A.4 form atoms checkpoint) is a strong design signal there's no behavioural daylight between the two.

### Why B over A / C / D as the long-form companion

- **B (Ticket Stub) wins on vocabulary cohesion with E.** Both lean _editorial_ — italic Freight Display titles in B, italic Freight Display messages in E. The "italic editorial" thread runs through both. C and D have a different language entirely.
- **B's visual weight pairs cleanly with E.** When both end up on screen at once, B doesn't compete with E.
- **A (Paper Notice)** would have been the "lowest-risk" pick — sibling of Track B chrome — but on its own felt like one more chrome atom rather than adding personality.
- **C (Banner Strip)** is too loud for routine long-form alerts.
- **D (Mono Stamp)** doesn't add anything A doesn't.

A / C / D mockups stay in this directory for historical reference; they will not ship.

Once a direction is locked, this document moves from `⏳ Awaiting owner direction` to `✅ LOCKED — Direction <X>` and the implementation PR proceeds.
