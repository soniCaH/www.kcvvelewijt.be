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

## Recommendation

**E (Angled Badge) is the right primary direction**, with **A (Paper Notice) as the long-form fallback** — a two-form Alert API rather than five-direction-one-shape.

Reasoning:

1. **E carries the strongest retro-fanzine signal** of any option. It's the most distinctive thing the design system would own. Owner reached for E unprompted from a sketch — that's the strongest possible product-design signal that we're on a real lead.
2. **E genuinely doesn't fit multi-line errors.** Don't try to force it. Form-validation messages are short ("Geen geldig telefoonnummer.", "Verplicht veld.", "Bericht verzonden.") — that's E's home. Long-form server errors and dashboard banners need a different shape.
3. **A is the lowest-risk long-form fallback** because it composes with Track B chrome. Keeping the API surface as `<Alert variant="error" mode="badge|notice">` (or two separate components — `<AlertBadge>` and `<AlertNotice>`) lets callers pick the right shape per use case.
4. **B / C / D don't pull weight as a third direction.** B's perforation idiom should be reserved for `<TicketStub>` so it stays special. C is loud enough that it's only correct once a quarter, and a quarter isn't enough volume to justify the surface area. D is fine but doesn't add anything A doesn't.

If we have to pick ONE direction with no fallback, **A** is the right safe answer: it's the spec-compliant interpretation that respects the locked Direction D vocabulary. But A on its own feels like one more chrome atom — it doesn't add personality the way E does.

## Open questions for the owner

1. **Two-form API or single-form?** Is the team OK with `<AlertBadge>` (E) for short messages and `<Alert>` (A) for long ones, or does the simplicity of one component matter more?
2. **Warning variant in E** — owner sketch covered error. Should the warning badge use `--color-warning` bg (mustard ochre on cream) or `--color-ink` bg (matches the strongest read but loses the warning chroma)? The mockup tries warning bg.
3. **Dismiss in E** — accept that E is non-dismissible by design (the user reads, types correctly, the alert disappears on revalidation), or wedge in an `×` glyph somewhere?
4. **Multi-instance stacking** — in a form with three failed fields, three E badges read as a strong list of three pull-quotes. Acceptable, or do we collapse to one A-style summary banner?
5. **PRD §6.4 revision** — once a direction is locked, that section needs a rewrite. Pre-implementation update or post-VR-baseline?

## What to do next

1. **Review** the five HTML mockups in a browser. Each is `~600 lines` and scrollable as a single page with all variants + tradeoffs inline.
2. **Decide direction(s).** Recommended: E primary + A long-form fallback.
3. **Settle the open questions above** (especially Q1 — single-form vs two-form API determines the PR shape).
4. **PRD §6.4 revision** authored alongside the implementation PR.
5. **VR baselines re-captured** with the chosen direction.

Once a direction is locked, this document moves from `⏳ Awaiting owner direction` to `✅ LOCKED — Direction <X>` and the implementation PR proceeds.
