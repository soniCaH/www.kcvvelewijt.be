# 8s1 — /zoeken page architecture · LOCKED

**Decision:** S3 — **dark search masthead**, softened (see refinements).

The search field is the hero, on a `jersey-deep-dark` full-bleed band with subtle
diagonal stripe texture; results render on cream below the band.

Rejected:

- **S1 (lean utility)** — calmest and results-first, but reads almost generic;
  too little of the fanzine personality the rest of the site now carries.
- **S2 (editorial hero band)** — on-brand, but a tall two-column hero pushes the
  result list below the fold.

## Owner refinements — "softened S3" (carried into all later search rounds)

1. **No mono kicker.** Drop the `Zoeken op de site` eyebrow entirely (removes the
   eyebrow↔heading "zoeken" duplication).
2. **Serif heading, not loud uppercase.** Replace S3's big uppercase Archivo with
   a Freight Display (Fraunces in mockups) **italic** title — "less aggressive".
3. **Accent-colour part.** One word carries an accent colour, as on our other
   hero titles. On the dark ground the accent flips light (jersey-deep is
   invisible on jersey-deep-dark) → **warm gold** or **bright jersey**, decided in
   8s1.1.
4. **Heading copy = B "Wat zoek je?"** — accent on "zoek".
5. **No duplicate "zoeken".** Search-field button is a **magnifier icon** (Phosphor
   `MagnifyingGlass` Fill via `@/lib/icons.redesign`), not the word "ZOEK".
6. **Hard-shadow search field** — cream input, ink border, offset shadow; the
   button cell carries the chosen accent.

**Accent colour = warm gold** (LOCKED 8s1.1). Reads as the established dark-hero
accent (ultras + clubshop); stays clear of the green result-type labels below.
So: "zoek" in `--warm`, the magnifier-icon button cell in `--warm` with an ink
border. Bright jersey rejected — competes with the green type labels.

Result-card vocabulary / filter row / empty-state rounds → 8s2 / 8s3 / 8s4,
all rendering on the cream area below the dark masthead.
