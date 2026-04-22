---
name: Article detail redesign — validated design
description: Content-type-aware article detail templates (interview, announcement, transfer, event) with structured Sanity blocks and an editorial-magazine visual direction
status: approved design, ready for PRD/implementation planning
---

# Article detail redesign — validated design

Authoritative design contract for the KCVV Elewijt article detail page rework. This document is the result of a brainstorm that surveyed three parallel visual directions and settled on the merge described below. It is the input for the next step, a detailed implementation plan produced via `superpowers:writing-plans`.

**Exploration artefacts kept for reference** (not the final design — these were the three raw directions):

- `docs/design/directions/01-editorial-magazine.md` — the chosen base
- `docs/design/directions/02-stadium-graphic.md` — eliminated
- `docs/design/directions/03-broadcast-dramatic.md` — source of the `quote` breakout + body fade-ups
- `docs/design/mockups/{01,02,03}.html` — in-browser previews

---

## 1. Decision in one paragraph

Article detail pages become **content-type aware**. One of four `articleType` values (`interview | announcement | transfer | event`) drives a tailored template. Interviews gain a structured `qaBlock` with four tag treatments (`standard | key | quote | rapid-fire`) so editors no longer hand-format Q&A with bold/italic em-dashes. Transfer articles gain a `transferFact` block that renders incoming, outgoing, and extension transitions with the KCVV side auto-rendered. Event articles gain an `eventFact` block with date, location, ticket CTA. All four templates share a calm, typography-led visual language — white surfaces, narrow reading measure, surgical green accents — with one dramatic moment per interview: the full-bleed `quote` pull-quote on a cream band with an oversized softened `"` glyph.

---

## 2. Visual direction

**Base:** Editorial Magazine (see `docs/design/directions/01-editorial-magazine.md`).

**Merged in from Broadcast Dramatic:**

- The `quote` qaBlock is a full-bleed cream band with an oversized decorative `"` glyph — a scaled-up version of the existing `.prose blockquote::before` motif — softened for readability. No dark surfaces. No Stenciletta. No radial glows.
- Body paragraphs fade up 24px on scroll-enter (500ms `cubic-bezier(0.22,1,0.36,1)`). Respects `prefers-reduced-motion`.

**Rejected outright:**

- Dark hero surfaces, 90vh cinematic heroes, radial green rim-lights, diagonal clip-path cuts, `prose-alert` red pills, Stenciletta stencil display face, countdown timers, scroll parallax on hero images.

### 2.1 Direction principles

1. **Narrow measure, generous margins.** Body copy never exceeds 65ch. Reading is the priority; chrome stays light.
2. **Weight and scale carry hierarchy; color only punctuates.** Quasimoda 700 display + Quasimoda 400 body do the work. `kcvv-green-bright` appears as accent bars, numerals, pull-quote rules, the decorative `"` glyph, and the drop-cap on announcements. Never as a fill behind text.
3. **Structure is visible.** Numbered Q&A pairs, thin rules between sections, small-caps kickers, an announcement drop-cap. The _template_ prints rhythm; editors stop hand-formatting it.

---

## 3. Content-type taxonomy

Four types, driven by a new `articleType` enum on the `article` document. Order reflects editorial priority.

| Type           | What it covers                                                   | Signature treatment                                                       |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `interview`    | Q&A profiles of players, staff, volunteers                       | `qaBlock` body, `subject` attribution, 4:5 portrait hero                  |
| `announcement` | General-purpose news, club updates, facility, sponsor, editorial | Drop-cap on first paragraph, calm 16:9 hero image, rule-framed blockquote |
| `transfer`     | Single or overview transfer news                                 | Typographic-only hero, `transferFact` feature + overview blocks           |
| `event`        | Tournaments, stages, club events, youth days                     | Serif-style date block hero, `eventFact` feature + overview blocks        |

**Routing:** one `/nieuws/[slug]` route, one React page component that dispatches to a type-specific template based on `article.articleType`. Do not split into separate routes.

**Fallback:** if `articleType` is missing on a legacy article, render as `announcement`.

---

## 4. Sanity schema changes

All schema changes live in `packages/sanity-schemas/src/` and apply to both studios automatically (dual-environment rule from root `CLAUDE.md`).

### 4.1 `article` additions

Add three fields to `packages/sanity-schemas/src/article.ts`:

```typescript
defineField({
  name: 'articleType',
  title: 'Article type',
  type: 'string',
  options: {
    list: [
      { title: 'Interview',    value: 'interview' },
      { title: 'Announcement', value: 'announcement' },
      { title: 'Transfer',     value: 'transfer' },
      { title: 'Event',        value: 'event' },
    ],
    layout: 'radio',
  },
  initialValue: 'announcement',
  validation: (r) => r.required(),
}),

// Only meaningful for articleType='interview'. Optional otherwise.
defineField({
  name: 'subject',
  title: 'Subject (interview only)',
  type: 'subject',  // defined below
  hidden: ({ parent }) => parent?.articleType !== 'interview',
}),
```

The `body` array gains three new block types: `qaBlock`, `transferFact`, `eventFact` (defined below). Existing `articleImage`, `fileAttachment`, `htmlTable`, standard `block` remain.

### 4.2 `subject` object type

New file: `packages/sanity-schemas/src/subject.ts`.

Discriminated union by `kind`. Sanity Studio conditionally shows the relevant branch.

```typescript
export const subject = defineType({
  name: "subject",
  title: "Subject",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      title: "Subject kind",
      type: "string",
      options: {
        list: [
          { title: "KCVV Player", value: "player" },
          { title: "Staff member", value: "staff" },
          { title: "Custom (not in squad)", value: "custom" },
        ],
        layout: "radio",
      },
      initialValue: "player",
      validation: (r) => r.required(),
    }),

    // kind='player'
    defineField({
      name: "playerRef",
      title: "Player",
      type: "reference",
      to: [{ type: "player" }],
      hidden: ({ parent }) => parent?.kind !== "player",
      validation: (r) =>
        r.custom((val, ctx) =>
          ctx.parent?.kind === "player" && !val ? "Required" : true,
        ),
    }),

    // kind='staff'
    defineField({
      name: "staffRef",
      title: "Staff member",
      type: "reference",
      to: [{ type: "staffMember" }],
      hidden: ({ parent }) => parent?.kind !== "staff",
      validation: (r) =>
        r.custom((val, ctx) =>
          ctx.parent?.kind === "staff" && !val ? "Required" : true,
        ),
    }),

    // kind='custom'
    defineField({
      name: "customName",
      title: "Name",
      type: "string",
      hidden: ({ parent }) => parent?.kind !== "custom",
    }),
    defineField({
      name: "customPhoto",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.kind !== "custom",
    }),
    defineField({
      name: "customRole",
      title: "Role",
      type: "string",
      description: 'E.g. "Trainer tegenstander", "Supporter", "Oud-speler"',
      hidden: ({ parent }) => parent?.kind !== "custom",
    }),
  ],
});
```

**Attribution rendering** (used by `key` and `quote` qaBlock treatments):

- `kind='player'` → `${firstName} ${lastName}, #${jerseyNumber ?? '—'}`. Photo = `transparentImage || psdImage`.
- `kind='staff'` → `${firstName} ${lastName}, ${role}`. Photo = staff `image`.
- `kind='custom'` → `${customName}, ${customRole}`. Photo = `customPhoto`.

### 4.3 `qaBlock` block type

New file: `packages/sanity-schemas/src/qaBlock.ts`.

```typescript
export const qaBlock = defineType({
  name: "qaBlock",
  title: "Q&A",
  type: "object",
  fields: [
    defineField({
      name: "pairs",
      title: "Pairs",
      type: "array",
      of: [{ type: "qaPair" }],
      validation: (r) => r.min(1).error("At least one Q&A pair required."),
    }),
  ],
});

export const qaPair = defineType({
  name: "qaPair",
  title: "Q&A pair",
  type: "object",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (r) => r.required().max(240),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "array",
      of: [{ type: "block", styles: [{ title: "Normal", value: "normal" }] }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      options: {
        list: [
          { title: "Standard", value: "standard" },
          { title: "Key quote", value: "key" },
          { title: "Standalone quote", value: "quote" },
          { title: "Rapid-fire", value: "rapid-fire" },
        ],
      },
      initialValue: "standard",
    }),
  ],
});
```

No `intro` or `outro` field. Editors place intro/outro prose as regular paragraphs _before_ and _after_ the `qaBlock` in the article body.

### 4.4 `transferFact` block type

New file: `packages/sanity-schemas/src/transferFact.ts`.

```typescript
export const transferFact = defineType({
  name: "transferFact",
  title: "Transfer fact",
  type: "object",
  fields: [
    defineField({
      name: "direction",
      type: "string",
      options: {
        list: [
          { title: "Incoming", value: "incoming" },
          { title: "Outgoing", value: "outgoing" },
          { title: "Extension", value: "extension" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "playerName",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "playerPhoto",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "position",
      type: "string",
      options: { list: ["Keeper", "Verdediger", "Middenvelder", "Aanvaller"] },
    }),
    defineField({
      name: "age",
      type: "number",
      validation: (r) => r.min(14).max(45),
    }),
    defineField({
      name: "otherClubName",
      type: "string",
      description: "Required for incoming/outgoing; leave empty for extension.",
      hidden: ({ parent }) => parent?.direction === "extension",
    }),
    defineField({
      name: "otherClubLogo",
      type: "image",
      hidden: ({ parent }) => parent?.direction === "extension",
    }),
    defineField({
      name: "until",
      type: "string",
      description:
        'Display string, e.g. "2028" or "tot einde seizoen 2027-28".',
      hidden: ({ parent }) => parent?.direction !== "extension",
    }),
    defineField({
      name: "note",
      type: "text",
      rows: 2,
      validation: (r) => r.max(140),
      description: "Optional colour line.",
    }),
  ],
});
```

The KCVV side is auto-rendered (logo + name) based on `direction`. Editors never fill in "KCVV" themselves.

### 4.5 `eventFact` block type

New file: `packages/sanity-schemas/src/eventFact.ts`.

```typescript
export const eventFact = defineType({
  name: "eventFact",
  title: "Event fact",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "date",
      type: "date",
      validation: (r) => r.required(),
    }),
    defineField({ name: "startTime", type: "string", description: "HH:mm" }),
    defineField({ name: "endTime", type: "string", description: "HH:mm" }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "address", type: "string" }),
    defineField({
      name: "ageGroup",
      type: "string",
      description:
        'E.g. "U13", "Senioren", "Alle jeugd". Free text — not an enum.',
    }),
    defineField({
      name: "competitionTag",
      type: "string",
      description: 'E.g. "Tornooi", "Clubfeest", "Training".',
    }),
    defineField({ name: "ticketUrl", type: "url" }),
    defineField({
      name: "ticketLabel",
      type: "string",
      description: 'CTA label, default "Inschrijven".',
      initialValue: "Inschrijven",
    }),
    defineField({
      name: "capacity",
      type: "number",
      description: "Optional.",
    }),
    defineField({
      name: "note",
      type: "array",
      of: [{ type: "block", styles: [{ title: "Normal", value: "normal" }] }],
      description: "Short prose, one paragraph.",
    }),
  ],
});
```

### 4.6 Body array update

`article.body` becomes:

```typescript
of: [
  {
    type: "block",
    marks: {
      /* existing link + internalLink */
    },
  },
  { type: "articleImage" },
  { type: "fileAttachment" },
  { type: "htmlTable" },
  { type: "qaBlock" },
  { type: "transferFact" },
  { type: "eventFact" },
];
```

### 4.7 Schema barrel update

Add `subject`, `qaBlock`, `qaPair`, `transferFact`, `eventFact` to `packages/sanity-schemas/src/index.ts`.

### 4.8 Sanity migration

Every existing article needs `articleType` backfilled to `'announcement'` on migration. Interviews currently flagged via tags (if any) can be auto-promoted — audit the tag taxonomy and write a one-off Sanity migration script. Per memory, run migrations proactively (staging → production) or add as an explicit PR manual step.

---

## 5. Per-type page templates

One route: `/nieuws/[slug]`. One top-level `ArticleDetailPage` Server Component that dispatches to a type-specific layout module.

Shared across all types:

- Metadata bar (breadcrumb, date, author, share) — single-row, thin 1px rules above and below in `kcvv-gray-light`, mono small caps. Lives below the hero image (announcement/interview/event) or below the typographic hero block (transfer).
- Related content slider — cream `--color-foundation-gray-light` section at page end. See §7.

### 5.1 `announcement` template (the baseline)

```text
< Terug naar nieuws

---- NIEUWS  |  19 APRIL 2026

Een nieuw hoofdstuk
voor het eerste elftal.

[ HERO IMAGE 16:9 — rounded-[4px], no overlay, no shadow ]

----- metadata bar (date · author · reading time · share) -----

[ Drop-cap paragraph ]

[ paragraphs ]

---- Section heading in Quasimoda 700 text-3xl with featured-border bar

[ paragraphs, blockquote, lists, images ]
```

- Hero image: `article.coverImage` at 16:9 via Sanity CDN hotspot crop. Max width `max-w-[60rem]`. No gradient overlay, no diagonal cut.
- Kicker: `.featured-border::before` 4rem × 2px `kcvv-green-bright` bar, then category label + date in `text-xs uppercase tracking-[var(--letter-spacing-label)]`.
- Headline: `font-[var(--font-family-title)] font-700 text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] text-[var(--color-kcvv-gray-blue)]`. Sentence case.
- **No byline row under the headline.** Author + reading time are shown once in the §7.6 metadata bar rendered immediately below the hero image — duplicating them as a hero byline reads as noise in practice. This rule applies to **every** article template (announcement, interview, transfer, event): the metadata bar is the single source of truth for `author`, `date`, `reading time` and share controls.
- Body: see §6. Drop-cap on first paragraph.

### 5.2 `interview` template

Same frame as announcement, with three differences:

- Kicker reads `INTERVIEW | #${jerseyNumber} · ${positionUppercase}` pulled from `subject` autofill.
- Headline drops to `clamp(2rem,4.5vw,3.5rem)` to make room for a **subtitle line** — subject's full name in Quasimoda 400, `text-2xl`, `kcvv-gray-dark`.
- Hero image: if `article.coverImage` is present, render at **4:5 portrait crop** (taller than announcement). If absent, skip the hero image; the headline block carries the hero alone.
- Transparent cutout is **not** used in the hero — it is saved for the `key` qaBlock spread (see §6.2).

### 5.3 `transfer` template

Typographic hero only — no image.

```text
< Terug naar nieuws

---- TRANSFER | INCOMING

Maxim Breugelmans
-------------------------------
27 jaar · Middenvelder

from    STANDARD LUIK
to      KCVV ELEWIJT

----- metadata bar -----

[ feature transferFact card — full-bleed, first body block, see §8.1 ]

[ body paragraphs / additional transferFact overview blocks ]
```

- Headline slot renders a programmatic from/to composition at display size (same type scale as announcement headline, but structured as a from/to block).
- The first `transferFact` block in the body renders as the **feature variant**; all subsequent blocks render as overview cards. See §8.

### 5.4 `event` template

```text
< Terug naar nieuws

---- EVENT | JEUGD

Lentetornooi U13 — zaterdag in Elewijt.

27         APRIL
----       2026
zaterdag · 10u00 · Sportpark Elewijt

----- metadata bar -----

[ feature eventFact card — full-bleed, first body block, see §8.2 ]

[ body paragraphs / additional eventFact overview blocks ]
```

- Kicker `EVENT | ${ageGroup || competitionTag}`.
- Below the headline: **serif-style date block** — day numeral at `text-[5rem]`, month uppercase `text-xl` with `tracking-[var(--letter-spacing-label)]`, year and metadata in mono small caps. Horizontal 1px rule in `kcvv-gray-light` between day and month labels.

---

## 6. qaBlock — tag treatments (the crown jewel)

All Q&A lives inside the 65ch reading column by default. `key` and `quote` break out full-bleed.

### 6.1 `standard`

Numbered pair in a 4rem left gutter.

- Numeral `01.` `02.`: `font-[var(--font-family-title)] font-700 text-5xl leading-[0.9] text-[var(--color-kcvv-green-bright)]`, top-aligned to the question's baseline.
- Question: Quasimoda 700, `text-xl`, `leading-[1.3]`, `kcvv-gray-blue`, `mb-3`.
- Answer: Montserrat 400, `text-lg`, `leading-[1.6]`, `kcvv-gray-dark`. Supports paragraphs, emphasis, links, line breaks (limited PT styles; no headings, no images).
- 1px `kcvv-gray-light` rule below each pair (except the last), `mt-10 mb-10`.
- Mobile (`< md`): numeral drops above the question on its own line, not in a gutter.

### 6.2 `key` — promoted spread

Full-bleed `.full-bleed` on `--color-foundation-gray-light` cream band. Subject cutout (from `subject` autofill) floats on one side at 35% viewport width (max 380px). Answer promoted as display copy.

- Answer: Quasimoda 400, `clamp(1.75rem,3.5vw,2.5rem)`, `leading-[1.25]`, `kcvv-gray-blue`, `max-w-[40rem]`, framed top and bottom by 1px `kcvv-gray-light` rules.
- Question: rendered as a small caption above the cutout column in uppercase tracking-label, not as a display heading. It is never hidden for `key`.
- Attribution: mono numeral + subject name in `tracking-[var(--letter-spacing-caps)]` uppercase, below the bottom rule.
- Section padding: `py-32` desktop, `py-16` mobile.
- **Cutout:** uses `subject` attribution photo (see §4.2). No rim-light, no drop shadow, no border.
- Mobile: cutout stacks above the quote, max-width 70vw, centered.

### 6.3 `quote` — standalone, full-bleed cream breakout

**The direction's one dramatic moment.** Breakout beyond the 65ch column, cream band, oversized softened `"` glyph behind the text.

Layout:

```text
+-------------------------------------------------------------------+
|                                                                   |
|                       "                                           |
|                 [ decorative Quasimoda 700 glyph,                 |
|                   ~24rem / 384px, kcvv-green-bright @ 12%,        |
|                   absolutely positioned centered, z-0 ]           |
|                                                                   |
|        Ik voetbal nog altijd met schrik in de buik.               |
|        Dat is het enige wat mij scherp houdt.                     |
|        [ quote text on top of the glyph, z-10 ]                   |
|                                                                   |
|            ——  JEROEN VAN DEN BERGHE, #9                          |
|                                                                   |
+-------------------------------------------------------------------+
```

Specs:

- **Surface:** `--color-foundation-gray-light`. Full-bleed via `.full-bleed` utility.
- **Vertical padding:** `py-40` desktop (10rem), `py-20` mobile.
- **Decorative glyph:** typographic `"` (U+201C, same character as existing `.prose blockquote::before`). Quasimoda 700, font-size `24rem` desktop, `12rem` mobile. `color: var(--color-kcvv-green-bright)`. `opacity: 0.12`. Absolutely positioned centered behind the quote text (`top: 50%; left: 50%; transform: translate(-50%, -50%)`).
- **Quote text:** Quasimoda 500, `clamp(2rem, 4vw, 3rem)`, `leading-[1.2]`, `kcvv-gray-blue`, centered, `max-w-[42ch]`. Positioned `relative z-10` on top of the glyph.
- **Attribution:** 2rem × 2px `kcvv-green-bright` horizontal rule + subject name in Montserrat 500, `text-sm`, uppercase, `tracking-[var(--letter-spacing-caps)]`, `kcvv-gray-dark`. Pulled from `subject` autofill.
- **Question is hidden** on render.
- **Motion:** the glyph fades opacity `0 → 0.12` and scales `0.85 → 1.0` over 700ms `cubic-bezier(0.22,1,0.36,1)` on scroll-enter (via IntersectionObserver). Runs once. `@media (prefers-reduced-motion: reduce)` snaps to final state.

### 6.4 `rapid-fire`

Consecutive `rapid-fire`-tagged pairs cluster into one block, auto-rendered with a section header.

- **Section header** (auto): `— — — Sneltrein` in Quasimoda 700, `text-xs`, uppercase, `tracking-[var(--letter-spacing-label)]`, `kcvv-green-dark`. The three short dashes are 2px × 0.5rem `kcvv-green-bright` bars, not character dashes.
- Grid desktop: `grid-cols-[1fr_1.3fr] gap-8`. Mobile: single column.
- Question: Quasimoda 500, `text-base`, `kcvv-gray-blue`.
- Answer: Montserrat 400, `text-base`, `kcvv-gray-dark`.
- 1px `kcvv-gray-light` rule between rows.
- **No Stenciletta.** The previous "stadium banner" treatment from direction 1 for this header is replaced with a Quasimoda-only rendering.

---

## 7. Typography, tokens, and shared rules

### 7.1 Tokens — pull from `apps/web/src/app/globals.css`

- Colors: `--color-kcvv-green-bright`, `--color-kcvv-green-dark`, `--color-kcvv-green-100`, `--color-kcvv-black`, `--color-kcvv-gray-blue`, `--color-kcvv-gray-dark`, `--color-kcvv-gray`, `--color-kcvv-gray-light`, `--color-kcvv-white`, `--color-foundation-gray-light`.
- Fonts: `--font-family-title` (Quasimoda), `--font-family-body` (Montserrat), `--font-family-mono` (IBM Plex Mono).
- **Stenciletta (`--font-family-alt`) is not used anywhere in this redesign.**
- Letter-spacing: `--letter-spacing-label` (0.14em) for kickers, `--letter-spacing-caps` (0.08em) for small-caps attribution.

### 7.2 Body prose baseline (announcement, transfer, event in-body paragraphs)

- Column: `max-w-[65ch]` centered in the 60rem inner width.
- Paragraph: Montserrat 400, `text-lg` (1.125rem), `leading-[1.6]`, `kcvv-gray-dark`.
- Paragraph spacing: `1.25em` vertical.
- Headings: `h2` Quasimoda 700 `text-3xl` with `.featured-border::before` bar above; `h3` Quasimoda 500 `text-xl`, no bar.
- Links inside body: `kcvv-gray-blue` with 2px `kcvv-green-bright` underline, `underline-offset-4`. Hover color `kcvv-green-dark`.
- Lists: `ul` bullets = 2px × 2px `kcvv-green-bright` squares. `ol` = mono `kcvv-green-dark` numerals + period.

### 7.3 Drop-cap (announcement + transfer body prose only)

Applied via `::first-letter` on the first `<p>` of the body prose:

```css
.article-body > p:first-of-type::first-letter {
  font-family: var(--font-family-title);
  font-weight: 700;
  font-size: 5.5rem;
  line-height: 0.85;
  float: left;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  color: var(--color-kcvv-green-bright);
}
```

No drop-cap on `interview` (the qaBlock is the body) or `event` (fact block dominates).

### 7.4 Blockquote inside announcement/transfer body

Reworked from the existing 15rem `"` glyph. Rule-framed, centered, magazine style.

- Quote text: Quasimoda 400, `text-2xl`, `leading-[1.4]`, `kcvv-gray-blue`, centered, `max-w-[50ch]`.
- Top + bottom 1px rules in `kcvv-gray-light` extending the full prose width.
- Attribution below in Montserrat 500, `text-sm`, uppercase, `tracking-[var(--letter-spacing-caps)]`, `kcvv-gray`, preceded by a 2rem × 2px `kcvv-green-bright` rule (not an em-dash).
- **No leading `"` glyph for the body blockquote.** The glyph moment is reserved for the qaBlock `quote` treatment (§6.3).
- **This replaces** the current `.prose blockquote::before` rule in `apps/web/src/app/globals.css` — scoped to `.article-body` so it doesn't affect Sanity Studio's `BlockStyle` previews.

### 7.5 Body fade-up on scroll

Applied to each `<p>` and `<h2>`/`<h3>` inside `.article-body`:

```text
initial: opacity 0, translateY(24px)
entered: opacity 1, translateY(0)
duration: 500ms
easing: cubic-bezier(0.22, 1, 0.36, 1)
trigger: IntersectionObserver, threshold 0.15, rootMargin '0px 0px -10% 0px'
```

`@media (prefers-reduced-motion: reduce)` — elements render at final state immediately; no observer instantiation. `key` and `quote` qaBlock breakouts have their own entry treatment (see §6.3) and do not cascade from this baseline.

### 7.6 Metadata bar

```text
+------------------------------------------------------------------+
|  19.04.2026   ·   Redactie KCVV   ·   4 min lezen   [share icons]|
+------------------------------------------------------------------+
```

- Single row, 1px `kcvv-gray-light` rule above and below.
- Left cluster: mono, `text-xs`, uppercase, `tracking-[var(--letter-spacing-caps)]`, `kcvv-gray`.
- Right: Lucide `Share2` (native Web Share API with a Facebook-URL fallback on desktop) and `Facebook` from the curated icon set (`apps/web/src/lib/icons.ts`), 16px, `kcvv-gray-blue`, hover `kcvv-green-dark`. No filled buttons, no circles. **No Twitter/X icon** — KCVV does not have a Twitter/X account (see `reference_club_identity`). Instagram is not a share target either (no URL-share deeplink), so the cluster is Share2 + Facebook only.

### 7.7 Related content slider

Cream band (`--color-foundation-gray-light`) full-bleed at the end of every article detail page.

- Header: `.featured-border::before` bar + `MEER UIT HET ARCHIEF` kicker in `text-xs uppercase tracking-[var(--letter-spacing-label)] font-500 kcvv-gray-blue`, followed by a Quasimoda 700 `text-4xl kcvv-gray-blue` section title.
- Cards: white surface on cream, `rounded-[4px]`, no shadow at rest, `--shadow-card-hover` on hover. 16:10 image top (no overlay), kicker row, `text-lg font-700 kcvv-gray-blue` title, date in mono small-caps.
- Separation: 2rem gap + a 1px vertical rule between cards (no card borders).
- Nav arrows: Lucide `ChevronLeft`/`ChevronRight` 20px in `kcvv-gray-blue`, no fill. Disabled state `kcvv-gray-light`.
- Hover: 2px `kcvv-green-bright` underline animates in under the card title.

---

## 8. `transferFact` and `eventFact` rendering

### 8.1 `transferFact`

**Feature variant** (first `transferFact` block in the body, and only when `articleType='transfer'`):

```text
+-------------------------------------------------------------------+
|   [ player cutout ]    ---- INCOMING                              |
|                                                                   |
|                        Maxim Breugelmans                          |
|                        -----------------------------              |
|                        27 jaar · Middenvelder                     |
|                                                                   |
|                        from                                       |
|                        [logo] STANDARD LUIK                       |
|                        ----- 1px rule -----                       |
|                        to                                         |
|                        |  [logo] KCVV ELEWIJT                     |
|                                                                   |
|                        "Blij om thuis te zijn."                   |
+-------------------------------------------------------------------+
```

- Full-bleed, content capped at `max-w-[70rem]`. `py-16` desktop, `py-8` mobile. 1px top + bottom `kcvv-gray-light` rules.
- Grid: `grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10`. Cutout column: `playerPhoto` at max 420px, `object-contain`, bottom-aligned. No frame, no shadow, no rim-light.
- Kicker: `.featured-border::before` + `INCOMING`/`OUTGOING`/`EXTENSION` in `text-xs uppercase tracking-[var(--letter-spacing-label)] font-500 kcvv-green-dark`.
- Player name: Quasimoda 700, `text-5xl`, `leading-[0.95]`, `kcvv-gray-blue`.
- Age + position: `text-sm uppercase tracking-[var(--letter-spacing-caps)] kcvv-gray`, middle-dot separator.
- From/to: mono label (`from`/`to`/`until`) above a club row with 32px logo + Quasimoda 500 `text-2xl kcvv-gray-blue` name. 1px `kcvv-gray-light` rule between from and to.
- **KCVV side** gets a 2px `kcvv-green-bright` left accent bar (4px inset).
- Direction rules:
  - `incoming`: from = `otherClubName`, to = KCVV. KCVV row has the accent.
  - `outgoing`: from = KCVV, to = `otherClubName`. KCVV row has the accent.
  - `extension`: single row `KCVV ELEWIJT` + mono `until ${until}` line beneath. Accent bar on the row.
- Note: Quasimoda 400, `text-xl`, `kcvv-gray-dark`, `mt-4`. No quote glyph, no rules.

**Overview variant** (subsequent `transferFact` blocks or those inside an `articleType='announcement'` article):

```text
+-----------------------------------------------------------+
|  INCOMING    Maxim Breugelmans            27 · MF         |
|              [logo] Standard Luik  ->  [logo] KCVV        |
+-----------------------------------------------------------+
```

- Body-column width (`max-w-[65ch]`), 1px top + bottom `kcvv-gray-light` borders, `py-4`, no side borders, no radius. Stacks flush (subsequent cards use `border-b` only).
- Left kicker column `w-[7rem]`: direction label `text-xs`. Incoming/extension in `kcvv-green-dark`; outgoing in `kcvv-gray` (reported, not celebrated — no red pill, per the rejection list).
- Right column, row 1: name Quasimoda 700 `text-xl kcvv-gray-blue` + right-aligned age/position meta in mono small-caps.
- Right column, row 2: 20px logo + club name `text-base`, Lucide `ArrowRight` 14px in `kcvv-gray`, 20px logo + club name. Extension collapses to `[logo] KCVV ELEWIJT` + `until ${until}` in mono.
- No player cutout in overview variant.

### 8.2 `eventFact`

**Feature variant** (first `eventFact` block in the body, and only when `articleType='event'`):

```text
+-------------------------------------------------------------------+
|   ---- EVENT | JEUGD                                              |
|                                                                   |
|   27                                       Lentetornooi U13       |
|   APRIL    ----------------------------                           |
|   2026     zaterdag · 10u00 - 17u00                               |
|            Sportpark Elewijt                                      |
|            Driesstraat 14, Elewijt                                |
|                                                                   |
|            Open voor spelers geboren in 2013 en 2014.             |
|                                                                   |
|            Inschrijven  >                                         |
+-------------------------------------------------------------------+
```

- Full-bleed, `max-w-[70rem]` inner, `py-16` desktop, `py-8` mobile, 1px top/bottom rules.
- Date block left: day Quasimoda 700 `text-[6rem] leading-[0.85] kcvv-gray-blue`, month uppercase `text-xl tracking-[var(--letter-spacing-label)]`, year mono `text-sm kcvv-gray`. Vertical 1px `kcvv-gray-light` rule on the right of the date block.
- Title Quasimoda 700 `text-4xl kcvv-gray-blue`.
- Metadata rows in `text-sm uppercase tracking-[var(--letter-spacing-caps)] kcvv-gray-dark`, middle-dot separators.
- Note: Montserrat 400, `text-lg leading-[1.6] kcvv-gray-dark`.
- CTA: text link (not a button). Quasimoda 700, `text-base`, uppercase, `tracking-[var(--letter-spacing-caps)] kcvv-green-dark`, 1px `kcvv-green-bright` underline, Lucide `ArrowRight` 14px trailing. Hover: underline thickens to 2px.

**Overview variant**:

```text
+-----------------------------------------------------------+
|  27 APR    Lentetornooi U13              Inschrijven >    |
|  zaterdag  Sportpark Elewijt · U13                        |
+-----------------------------------------------------------+
```

- Same 1px-rule stack as `transferFact` overview.
- Left column `w-[5rem]`: `27 APR` in Quasimoda 700 `text-xl kcvv-gray-blue` over weekday in mono `text-xs`.
- Middle: title Quasimoda 700 `text-lg` over metadata line in small-caps.
- Right: CTA link, same spec as feature at `text-sm`.

---

## 9. Mobile philosophy

The direction is single-column, narrow-measure by design. Mobile is the home viewport, not an afterthought.

- All full-bleed blocks (`key`, `quote`, transferFact feature, eventFact feature) collapse to vertical stacks and keep their full-bleed band. Rules re-flow inside the new column.
- Display type uses clamp() throughout — e.g. headline `clamp(2.5rem,5.5vw,4.5rem)` scales from 2.5rem on a 360px screen to 4.5rem on a 1440px monitor without a breakpoint override.
- `standard` qaBlock: numeral drops above the question on its own line (not in a gutter).
- `rapid-fire`: collapses to single column; each pair becomes question (Quasimoda 500, `text-sm kcvv-green-dark`) stacked over answer (`text-base`), 1px rule between pairs.
- `quote` decorative glyph shrinks to 12rem, stays centered behind the text.
- Touch targets ≥ 44px (CTA links, share icons, nav arrows). `apps/web/CLAUDE.md` safe-area utilities apply where relevant.
- Parallax, radial glows, rim-lights — none used; nothing to disable.

---

## 10. Components, stories, tests

Per `apps/web/CLAUDE.md`, every new component lands in `src/components/article/` with a `.stories.tsx` under `Features/Articles/` and a `.test.tsx`. Proposed component tree:

```text
apps/web/src/components/article/
  ArticleDetailPage/               # top-level dispatcher (renders one of the four templates)
  InterviewTemplate/
  AnnouncementTemplate/
  TransferTemplate/
  EventTemplate/
  ArticleHeader/                   # existing — refactor into four hero variants
  SanityArticleBody/               # existing — extended to render qaBlock, transferFact, eventFact
  blocks/
    QaBlock/                       # renders qaBlock + all 4 tag treatments
    QaPairStandard/
    QaPairKey/
    QaPairQuote/                   # includes the decorative glyph + motion
    QaGroupRapidFire/              # consecutive rapid-fire collation
    TransferFactFeature/
    TransferFactOverview/
    EventFactFeature/
    EventFactOverview/
  SubjectAttribution/              # shared attribution block used by key + quote
```

Each component gets at least a Playground story + variant stories per tag/direction. Storybook titles follow `Features/Articles/<Component>`.

---

## 11. Analytics

Per `apps/web/CLAUDE.md`'s Analytics Checklist, any user-facing change must include events. Proposed additions:

| Event                   | Trigger                      | Parameters                                                         |
| ----------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `article_view`          | Article detail page mount    | `article_type`, `article_id_hashed`, `has_subject`, `subject_kind` |
| `article_share`         | Share icon click             | `article_type`, `article_id_hashed`, `channel` (native/facebook)   |
| `related_article_click` | Related slider card click    | `article_type`, `related_article_id_hashed`, `position`            |
| `transfer_cta_click`    | Transfer CTA (if applicable) | `article_id_hashed`, `direction`                                   |
| `event_cta_click`       | Event ticket/signup link     | `article_id_hashed`, `event_date`, `has_ticket_url`                |

Hash article IDs via `hashMemberId` helper. Sanitize any editorial strings. Update GTM + GA4 custom dimensions as part of the implementation PR, not this design.

### Closure checklist — analytics sign-off before merging the implementation PR

Every implementation PR that adds or modifies events in this section must have all of the following ticked in the PR body before merge:

- [ ] **GTM registration:** triggers and tag templates added for each new event in the KCVV GTM workspace. Link the GTM version in the PR.
- [ ] **GA4 custom dimensions:** any new event parameter registered as a custom dimension in GA4 (User- or Event-scope as appropriate). Screenshot of the GA4 admin view in the PR.
- [ ] **Explorations updated:** rebuild or adjust the affected GA4 explorations / reports so the new events/dimensions flow into existing editorial dashboards. Link the exploration in the PR.
- [ ] **PII verification sign-off:** confirm in the PR body that no raw personally-identifiable information flows into any event parameter. Article IDs must be hashed via `hashMemberId`; editor-authored strings (titles, excerpts, quote text) must not be sent at all. Include a single-line attestation like `PII check: all article IDs hashed, no editorial strings in params — <handle>`.

No new event may land on main until all four boxes are checked — this matches the existing `apps/web/CLAUDE.md` Analytics Checklist and the `feedback_analytics_prd_requirement` memory.

---

## 12. SEO / structured data

JSON-LD via `schema-dts` builders in `apps/web/src/lib/seo/jsonld.ts`:

- All types → `NewsArticle` or `Article` baseline (headline, datePublished, dateModified, author, image).
- `articleType='interview'` → additionally emit `InterviewObject`-like data via custom typing (schema.org does not have a canonical `Interview` type at the time of writing — fall back to `NewsArticle` with `about` referencing the subject person).
- `articleType='event'` → add an `Event` JSON-LD block populated from the first `eventFact` in the body.
- `articleType='transfer'` → no extra structured type; baseline `NewsArticle`.

---

## 13. Not in this design

The following are deliberate non-goals; they will be addressed in separate issues/PRs:

- Revisions to the `/nieuws` listing page (card layouts, filter chips). Only the article detail page changes.
- Revisions to the homepage featured-article carousel. Cards continue to consume `article.coverImage` at 16:10 — no schema-side changes break the homepage.
- Revisions to the `RelatedContentSlider` non-article types (players, staff, teams). Only the article-card treatment is restyled to match this design; the player/staff/team cards inside the same slider retain their current styling.
- Migration logic for legacy articles with ambiguous type signals (some interviews are currently flagged only by tag convention). To be specified in the implementation plan.
- Dual-studio Studio UX improvements for the new `qaBlock` / `transferFact` / `eventFact` editors. Tracked separately per `project_sanity_studio_ux_rework` memory.

---

## 14. Open questions captured during brainstorm

None blocking. All direction-level questions resolved in the Q1–Q8 exchange that produced this document.

---

## 15. Source of decisions

- Scope (content-type-aware templates): user picked option C in Q1.
- Types (interview, announcement, transfer, event): user picked in Q2.
- Schema surgery (B — schema-light with `articleType` + structured blocks): user picked in Q3.
- `transferFact` fields: converged in Q4 iteration.
- `qaBlock` shape (no intro/outro; full PT answers; four tag treatments): converged in Q5.
- `subject` = Sanity ref (Drupal decommissioned): corrected in Q6.
- Direction merge: D1 base + D3 `quote` breakout (cream surface, no Stenciletta, softened glyph) + body fade-ups. Radial glows and rim-lights explicitly rejected.

---

_End of design._
