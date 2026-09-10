---
name: KCVV Elewijt
description: A retro-terrace fanzine for a Belgian amateur football club — cream paper, hard ink, tape and stamps.
colors:
  cream: "#f5f1e6"
  cream-soft: "#ede8da"
  cream-deep: "#e1d7bf"
  paper-edge: "#d9d2bd"
  ink: "#0a0a0a"
  ink-soft: "#1f1f1f"
  ink-muted: "#6b6b6b"
  jersey: "#4acf52"
  jersey-deep: "#007c46"
  jersey-bright: "#22c55e"
  jersey-deep-dark: "#133d28"
  warm: "#f0c264"
  tape-cream: "rgb(232 224 200 / 0.85)"
  alert: "#b84a3a"
  alert-soft: "#e8d5cf"
  warning: "#c68b2c"
  warning-soft: "#ecddb8"
  success-soft: "#d8e7d0"
  card-red: "#c93f1c"
typography:
  display:
    fontFamily: "freight-big-pro, Freight Display Fallback, georgia, Times New Roman, serif"
    fontSize: "clamp(3.5rem, 1.5rem + 8vw, 6rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "freight-display-pro, Freight Display Fallback, georgia, Times New Roman, serif"
    fontSize: "clamp(2.75rem, 1.5rem + 5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "freight-display-pro, Freight Display Fallback, georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 1.25rem + 3vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  subtitle:
    fontFamily: "freight-display-pro, Freight Display Fallback, georgia, Times New Roman, serif"
    fontSize: "clamp(1.5rem, 1rem + 1.5vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  subtitle-sm:
    fontFamily: "freight-display-pro, Freight Display Fallback, georgia, Times New Roman, serif"
    fontSize: "clamp(1.25rem, 1rem + 1vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "freight-sans-pro, Freight Sans Fallback, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-lg:
    fontFamily: "freight-sans-pro, Freight Sans Fallback, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "freight-sans-pro, Freight Sans Fallback, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "IBM Plex Mono, Consolas, Liberation Mono, Courier, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  mono-sm:
    fontFamily: "IBM Plex Mono, Consolas, Liberation Mono, Courier, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "IBM Plex Mono, Consolas, Liberation Mono, Courier, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
  label-sm:
    fontFamily: "IBM Plex Mono, Consolas, Liberation Mono, Courier, monospace"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  none: "0"
  full: "9999px"
spacing:
  card-sm: "0.75rem"
  card-md: "1.25rem"
  card-lg: "2rem"
  prose: "680px"
  wide: "1040px"
  index: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.jersey-deep}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "0.75rem 2rem"
  button-primary-hover:
    backgroundColor: "{colors.jersey-deep}"
    textColor: "{colors.cream}"
  button-inverted:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.75rem 2rem"
  button-secondary:
    backgroundColor: "{colors.cream-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.75rem 2rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.75rem 2rem"
  card-paper:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.card-md}"
  card-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "{spacing.card-md}"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 1rem"
    height: "2.5rem"
  input-focus:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
  pill-jersey-deep:
    backgroundColor: "{colors.jersey-deep}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.25rem 0.5rem"
  stamp-badge:
    backgroundColor: "{colors.jersey-deep}"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "0.375rem 0.875rem"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
---

# Design System: KCVV Elewijt

## Overview

**Creative North Star: "The Retro-Terrace Fanzine"**

This is a self-published supporter zine that happens to be a website. Everything is printed on cream paper stock, everything is drawn in hard black ink, and everything that matters is stuck down with tape or hit with a rubber stamp. Nothing glows, nothing blurs, nothing floats. The page has a physical thickness: cards cast a hard offset shadow with no blur, as if a rectangle of paper were laid on the page and lit from a single fixed point. Press one and it slides into its own shadow.

The register is confident and slightly rough. Headlines are enormous serif display type set tight, with a single italic word pulled out in green or a hand-drawn highlighter stroke swiped across it. Structural labels — kickers, statuses, timestamps, scores — are set in uppercase monospace at 11px, tracked wide, the typeface of a photocopied team sheet. Photographs are warm-tinted like aged newsprint and laid on the page under a barely-visible paper grain. The page ground itself is mottled stock, not flat screen. Tape strips sit at sub-degree angles, enough to break the perfect grid without looking seasick.

What this deliberately is not: the Sportlink/Twizzit amateur-club house style (stock hero, rounded cards, generic sans, logo on a blue gradient); modern SaaS product UI (soft blurred shadows, gradient fills, glassmorphism, Inter); and big-club broadcast slick (dark glossy panels, neon data viz, motion-heavy hero video). Those three are the anti-references. When a decision could go either way, go toward print and away from all three.

**Key Characteristics:**

- Cream paper surface with near-black ink — never white-on-grey product chrome
- Zero border radius on every rectangle; circles are the only curve
- Hard offset shadows (`4px 4px 0 0` ink), never blur
- Press-down interaction: surfaces slide into their shadow instead of lifting
- Serif display type at extreme scale against 10–11px uppercase mono labels — no middle register
- Tape, stamps, perforations and hand-drawn strokes as the ornament vocabulary
- Green is rare and load-bearing, never a wash

## Colors

A print palette: one paper, one ink, one green, one warm accent, and a small set of aged status tones. There is no grey UI layer — depth comes from stepping the cream down or flipping the whole surface to ink.

### Primary

- **Jersey Deep** (`#007c46`): the club green, and on cream the only green allowed to carry meaning. Primary buttons, large display headings, italic accent words in headlines, inline prose links, active states, and dark section fills. It reads 4.69:1 on cream — text-safe at any size, and still ≥3:1 against surrounding ink so a link stays distinguishable by colour alone. Darkened one shade from `#008755` by #2395, which also absorbed the former `jersey-link` (it held this exact value) so cream carries one text-bearing green instead of two. On ink that job belongs to `jersey-bright`, below.
- **Jersey** (`#4acf52`): the bright terrace green. Decorative only — stripe patterns, tape strips, spinner bars. **Never text, never on cream.**
- **Jersey Bright** (`#22c55e`): green text on ink surfaces only, where the deep green disappears.
- **Jersey Deep Dark** (`#133d28`): desaturated retro forest. The far stop of the photo-overlay gradient and the darkest green field.

### Secondary

- **Warm** (`#f0c264`): aged-poster yellow. Warm tape strips, accent words on dark green surfaces, button stripe details. It is the only accent that survives on a jersey-deep field, where green tape has no contrast.

### Neutral

- **Cream** (`#f5f1e6`): the page. Every surface starts here.
- **Cream Soft** (`#ede8da`): a card sitting on the page — the first step down.
- **Cream Deep** (`#e1d7bf`): the deepest paper tone; section bands that need to recede.
- **Manila** (`#f0e4c4`): a non-semantic warm paper stock — warmer and more saturated than Cream Deep, with no Alert variant to collide with. It chapters a long **index** page, once per page, marking where one part ends and the next begins. It is not a step-down — `cream-soft` keeps that job — and it is never the three soft status tints below, which are reserved to the Alert variants (see the Named Rules). Never on a detail page, never more than once. First used on `/inhoud`'s `nieuws` group (#2614).
- **Paper Edge** (`#d9d2bd`): card outlines and dividers on cream, where a full ink border would be too loud.
- **Ink** (`#0a0a0a`): primary text, every border, every hard shadow, and the fill for dark interlude panels.
- **Ink Soft** (`#1f1f1f`): a dark surface layered on a dark surface.
- **Ink Muted** (`#6b6b6b`): bylines, timestamps, metadata, and the soft shadow offset used where pure ink would vanish.
- **Tape Cream** (`rgb(232 224 200 / 0.85)`): the tape colour that nearly disappears into the paper — read by edge and shadow only.

### Tertiary

Status tones, tuned for print rather than for a dashboard. Each pairs a saturated stroke colour with a desaturated body tint.

- **Alert / Alert Soft** (`#b84a3a` / `#e8d5cf`): dusty brick red. Error field chrome, error alerts, alert-tone stamps.
- **Warning / Warning Soft** (`#c68b2c` / `#ecddb8`): aged mustard ochre.
- **Success Soft** (`#d8e7d0`): desaturated sage. Body tint only — success has no stroke colour of its own; it borrows jersey-deep.
- **Card Red** (`#c93f1c`): reserved severity tone for a cancelled/dead match state. Pairs with cream foreground text.

### Named Rules

**The Rare Green Rule.** Green is an event, not a surface treatment. On any given screen it appears on the primary CTA, the accent word in one heading, and active state — and effectively nowhere else. If a screen reads as green, it is wrong.

**The Two-Greens Rule.** There are exactly two greens on cream, split by one question — does it carry text? `jersey` decorates and never touches text; `jersey-deep` carries everything that does, inline prose links included. Until #2395 the rule named three greens and was not literally true; `jersey-link` has since been absorbed into `jersey-deep`. Picking the wrong green is the single most common colour error in this system.

**The Whole-Cream Rule.** Cream on a jersey-deep surface is cream, never a fraction of it. `text-cream/90` costs more contrast than a whole shade step of green does (4.05 → 3.56, where the #2395 shade step bought 4.05 → 4.69), so the fraction is always the worse trade. Scoped to jersey-deep: on `jersey-deep-dark` (~10.9:1) and ink (17.5:1) cream has contrast to spare and a fraction is harmless. One known exception is still shipping — `<NumberDisplay tone="cream">` hardcodes `text-cream/70` on its label, which lands on jersey-deep wherever the component sits in a jersey-deep `<TapedCard>`. Fixing it means touching a shared primitive whose other callers are all on dark surfaces, so it is tracked separately rather than swept here.

**The No-Grey-UI Rule.** There is no neutral grey in this system — not as a token, not as an option. A surface is cream, a step of cream, or ink. `gray-100` (`#f3f4f6`) was the last holdout, sitting under four homepage sections; #2342 deleted the token outright and reduced `SectionBg` to `jersey-deep | transparent`, so those sections now let the page cream through. If a section ever needs to step down from the page without going dark, add `cream-soft` to `SectionBg` — never reintroduce a grey. **This rule governs surfaces — panels, chrome, listing grounds — not the page-ground multiply texture below**, which is ink at low opacity and, read in isolation, is a desaturated darkening. It is not exempted from the rule so much as outside its scope: a texture drawn in `multiply` is not a surface. Three cream-tone alternatives to it were prototyped and lost on the render (see `d3a-mottle.html`, referenced below) before this reconciliation was written down (#2613).

**The Manila Rule (#2614).** `cream-soft` is the step-down; `manila` is a chapter, and the two are not interchangeable. A section that only needs to sit back from the page still gets `cream-soft`. `manila` exists for the one long **index** page that needs a visible break between its parts, and it carries two conditions: **index pages only, and once per page** — the chaptering argument is strong on a long index and weak on a detail page, and a second tinted band on the same page stops reading as a chapter and starts reading as a colour scheme. It is applied the same way a section already takes `cream-soft`: a literal `bg-manila` class string at the one call site, never a new prop or component. Never reach for `alert-soft` / `warning-soft` / `success-soft` for this — they are semantic (see Tertiary, above) and a decorative section in one of them reads as an Alert.

## Typography

**Display Font:** Freight Big Pro (`freight-big-pro`, with metric-matched Georgia fallback) — the heaviest headline register only
**Secondary Display:** Freight Display Pro (`freight-display-pro`, same fallback) — every other heading, and all italic accents
**Body Font:** Freight Sans Pro (`freight-sans-pro`, with metric-matched Arial fallback)
**Label/Mono Font:** IBM Plex Mono (self-hosted)

**Character:** A newspaper masthead bolted to a photocopied team sheet. The serif display faces carry all the drama — set at up to 96px with line-height 1 and negative tracking, they stack into dense blocks rather than sitting on a line. Freight Sans below them is quiet and highly legible at 1.6 line-height. The mono is the system's connective tissue: it labels, times, numbers and categorises everything, always uppercase, always tracked open.

### Hierarchy

There are **twelve** steps. Each names its utility class, because the frontmatter above is keyed on the role word (`subtitle`) while the CSS is keyed on the token (`--text-display-md`) — four role words sit on the one `display-*` family, so the two cannot be joined by name alone. This list is the join.

- **Display** — `text-display-2xl` (900, `clamp(3.5rem, 1.5rem + 8vw, 6rem)`, lh 1): Freight Big Pro. Page-defining hero headings, one per page at most.
- **Headline** — `text-display-xl` (700, `clamp(2.75rem, 1.5rem + 5vw, 4.5rem)`, lh 1.05): Freight Display Pro. Section-opening editorial headings.
- **Title** — `text-display-lg` (700, `clamp(2rem, 1.25rem + 3vw, 3rem)`, lh 1.1): the default editorial heading size.
- **Subtitle** — `text-display-md` (700, `clamp(1.5rem, 1rem + 1.5vw, 2rem)`, lh 1.2): card headings and sub-sections.
- **Subtitle Small** — `text-display-sm` (600, `clamp(1.25rem, 1rem + 1vw, 1.5rem)`, lh 1.3): the step below Subtitle. In practice this is the **italic standfirst** voice — a hero's or section's one-line lede, set `font-display` italic under the heading it follows.
- **Body** — `text-body-md` (400, 1rem, lh 1.6): all prose. Reading column capped at 680px.
- **Body Large / Small** — `text-body-lg` / `text-body-sm` (400, 1.125rem lh 1.55 / 0.875rem lh 1.55): leads and captions.
- **Mono** — `text-mono-md` (500, 0.875rem, lh 1.4): scores, dates, stat values, inline data.
- **Mono Small** — `text-mono-sm` (500, 0.75rem / 12px, lh 1.4): a 12px mono step. Note it is used almost entirely as a **third label size above `text-label`** — uppercase and tracked — yet unlike Label and Label Small it ships **no `letter-spacing`**, so all of its call sites set tracking by hand and have landed on five different values. Treat that as a known gap, not a licence to add a sixth.
- **Label** — `text-label` (500, 0.6875rem / 11px, lh 1, tracking 0.08em, uppercase): kickers, badges, pills, statuses, nav. The most-used non-body style in the system.
- **Label Small** — `text-label-sm` (500, 0.625rem / 10px, lh 1, tracking 0.08em, uppercase): a label attached directly above body text, where the 11px step would compete with it rather than introduce it.

Reach for the class. **Never `text-[length:var(--text-display-lg)]`**: the arbitrary-value form sets font-size and silently drops the step's line-height and tracking, which is what produced the hand-applied `leading-*` sprawl the ramp was built to prevent (#2417).

Navigation sits just outside the label token, and so does **the header's** wordmark — both are sized by a fit constraint rather than by this ramp. **The Chrome Fits The Bar Rule** below is the single home for their **sizes**; § Navigation keeps the nav's weight and tracking. `<SiteFooter>`'s wordmark is a different, undocumented ramp and is not covered by either (#2848).

### Named Rules

**The Missing Italic Rule.** Freight Big Pro ships italic at 400 and 700 only — there is no 900 italic. So a Display-size heading with an accent word switches the `<em>` down to Freight Display Pro italic rather than faking a heavy italic. Never pin an accent `<em>` to `font-black`.

**The One Emphasis Rule.** An editorial heading gets exactly one emphasis moment: an accent-coloured italic word _or_ a highlighter stroke, never both, and never two accented words. Emphasis is authored as a Portable Text `accent` decorator, never as a separate "accent word" string field.

**The Terminal Period Rule.** Editorial headings are auto-terminated with a period unless they already end in `.`, `?` or `!`. The period is part of the voice — declarative, printed, finished.

**The No Middle Register Rule.** There is display serif and there is small uppercase mono. Resist inventing a 16px semibold sans "section label" — that is product-UI language and it flattens the contrast the system runs on.

**The 11px Floor Rule.** Nothing sentence-case sets below 11px. Uppercase tracked mono is allowed exactly one step under it, at 10px (`text-label-sm`), and nothing goes lower. The exemption is not a loophole — it is a measurement. Caps fill the full cap-height where lowercase fills only the x-height, so 11px uppercase reads as _equal_ in weight to 16px lowercase body rather than subordinate to it; a label sitting directly above a paragraph needs the 10px step to actually recede. Point size alone is the wrong metric for legibility here. Element sizing inside a diagram (`VolledigOrganigram`) is not type and is not governed by this rule.

**The Chrome Fits The Bar Rule.** `<SiteHeader>`'s desktop row is the only type on the site sized by a **fit constraint** instead of by the ramp, and its literal, breakpoint-stepped values are legal there for that reason: the wordmark at `20px → 24px → 28px`, and `11px → 13px → 14px` on both the nav link and the `Word lid` CTA beside it, stepping at `xl` and `2xl`. The binding limit is § Navigation's — the desktop row must never wrap at `lg` — and **the room that grows is horizontal**: the row's `gap-4 xl:gap-8 2xl:gap-10` and `px-4 xl:px-8`. It is never vertical. `--sticky-header-h` is a single `65px` constant with no breakpoint variant, so the bar's height is a **ceiling** on this ramp rather than a source of new room — apply that test before proposing a fourth step. **Neither ramp can be written wholly in tokens, which is why neither is; but the two cases are not equally strong, and the weaker one is stated here so nobody has to rediscover it.** The nav ramp is the strong case: it walks across three roles and two of its steps have no token at all (11px is `text-label`'s size but neither its tracking nor its weight, 13px has nothing, 14px is `text-mono-md`'s). The wordmark is the weak one — `text-xl` **is** 20px and `text-2xl` **is** 24px, so its first two steps could be named utilities today, and only `28px` has nothing (`text-3xl` is 30px). It keeps three literals anyway, because splitting one ramp across two notations reads as two systems inside a single class attribute and hides that the three values are one ramp — and #2418 suppresses the wordmark's attribute either way, so the split buys nothing. **No `--text-*` step is minted for either:** a step only the header may use makes the ramp less trustworthy to read, not more — see #2396 decision 4, _"add no steps beyond `label-sm`"_. **The exception does not travel.** It is exactly **two** sites in `SiteHeader.tsx`, each carrying a comment pointing back here: `<Wordmark>`'s own class attribute, and the `CHROME_NAV_TYPE` constant that the nav links and the `Word lid` CTA both consume — they sit in the same row under the same limit, so the recipe is named once rather than copied. The nav link and the CTA sit inside the `lg:grid` desktop row; `<Wordmark>` is one shared component rendered **three** times — the mobile row, the desktop row, and the drawer's header slot — and its `xl:` / `2xl:` steps resolve only from 1280px, above the `lg:hidden` that retires the mobile row, so in practice mobile renders its base `20px`. **That is convention, not enforcement:** `<NavTakeover>` carries no `lg:hidden` and `drawerOpen` is never reset on a viewport change, so a drawer opened below `lg` and then widened past `xl` does render the ramp — a pre-existing defect in the drawer's lifecycle, not a licence ([#2850](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2850)). A literal `text-[…]` anywhere else is still drift, including `<NavTakeover>`'s own item (`text-[22px]`) and **`<SiteFooter>`'s wordmark** (`text-[32px] md:text-[44px]`), a second literal ramp this rule does **not** cover and which DESIGN.md documents nowhere — both tracked at [#2848](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2848). **Only sizes are exempted.** The nav's `tracking-[0.04em]` is 2 of **18** uses across 12 files and belongs to the tracking decision ([#2663](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2663)), not here; § Navigation stays the home for the nav's weight and tracking. One known imprecision this rule does **not** repair: the frontmatter's `nav-link.typography` resolves to `{typography.label}`, the nearest step rather than the nav's real values, because no token describes the ramp — do not "fix" it by minting one. Decided on [#2664](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2664), built by [#2847](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2847).

## Layout

The body is a single centred column at one of exactly three widths, chosen by the page's role: **680px** for reading (articles, forms, legal), **1040px** for detail pages (the default), and **1280px** for card-grid indexes and landing pages. Every page routes through one container primitive; hand-rolled `mx-auto max-w-*` wrappers are drift.

Three things sit outside those widths and only three: global chrome (header and footer span 1440px, the only value above 1280); element sizing (a photo, a quote measure, a scaled diagram keeps its own max-width); and full-bleed bands (striped seams, hero backgrounds, coloured CTA bands) which span the viewport and are never wrapped in a container.

Horizontal gutters are 1rem on mobile, 2rem from `md` up. Vertical rhythm belongs to the consuming section, not the container. Card padding steps 0.75rem / 1.25rem / 2rem.

Breakpoints: 640 (`sm`), 768 (`md`), 960 (`desk`), 1024 (`lg`), 1280 (`xl`), 1536 (`2xl`). The 960 step is inherited and used sparingly.

The real usage scene is a phone held outdoors on the sideline. Layouts collapse to a single column early, tap targets stay generous, and nothing important hides behind hover.

### Named Rules

**The Three Widths Rule.** A content container may use 680, 1040 or 1280 and no other value. If a layout seems to need 900px, it needs one of the three.

**The Reading-Measure Exemption Rule.** `ch` is banned as a reading measure (#2436): it resolves against the current font's zero-glyph advance, so the same value renders at a different pixel width in serif italic than in sans, and again at a different type size — drift invisible in review. Anything a visitor reads as a paragraph takes `var(--container-prose)` instead, never a `ch` value.

A clamp that turns out never to bind is removed outright rather than converted — a clamp only the token's own arithmetic keeps alive is not a measure, it's dead weight. `ErrorState`'s body lost its `ch` clamp this way (#2645): the whole composition (shirt, heading, body, actions) already sits inside its own `max-w-[40rem]` (640px) wrapper, narrower than the 680px prose token, so a 680 clamp on the body alone would never render — the same redundant-clamp shape #2436 flagged and resolved by removal on `/privacy` and `/club/word-lid`. `ErrorState`'s real measure is that 640px composition wrapper, not the prose token. A clamp that binds only in some variants is kept and converted, with a comment stating where it actually takes over — `EditorialLead` (inert on every article page under `EditorialHeroShell`'s default `width="wide"`; binds only in the homepage's `width="index"` variant) and `OrganigramHero`'s lead (inert at `lg`+, where the grid column itself is narrower than 680; binds only below `lg`) are both this shape.

Two shapes are not reading columns at all and may keep a bare `ch` max-width, each carrying an inline comment naming the exemption and pointing back here:

- **Helper copy that shares a row with controls.** `VolledigOrganigram`'s toolbar caption sits in a `justify-between` row next to the "Blader door het organigram" / "Download als PDF" buttons. Converting it to 680 was tried and reverted (#2560 / PR #2644): the caption claims the whole row, the button group wraps to a second line, and the chart shifts down. The slot is narrow on purpose — the unit was never the defect here.
- **Single-line labels that truncate.** `SiteHeader`'s nav-label cap (`max-w-[14ch] truncate`) bounds a single line against a Sanity team name, scaled to the mono type step it renders at — a truncation cap, not a measure of a paragraph. Truncation is always legal; this is not a case the next audit needs to re-open.

Enforced statically: `cross-page-consistency.test.ts` fails on any bare `ch` max-width in `apps/web/src` that isn't one of these two.

**The Full-Bleed Never Wraps Rule.** Striped seams and coloured bands are viewport-wide by definition. Wrapping one in a max-width container is always a bug.

**The Derived Anchor Offset Rule.** An in-page anchor's landing offset is `scroll-padding-top` on `<html>`, published at runtime by whichever sticky bar sits above the target — never a hand-written `scroll-mt-*` typed on the target itself. `useSectionNav` measures its own bar's rendered height and adds it to `--sticky-header-h` (the header's own token), so the offset tracks the bar's real, current height — including a trailing slot wrapping to its own line — instead of a typed guess that drifts the moment the bar's content changes. Three different hand-written values (`scroll-mt-24`, `scroll-mt-32`, `scroll-mt-[6.5rem]`) existed before this rule and were all wrong in different directions, which is the evidence a typed-per-section number does not stay correct. A route with no section nav (`/jeugd#visie`) falls back to a header-only base rule in `globals.css`. Decided on [#2478](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2478), built by [#2584](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2584).

## Elevation & Depth

The system is **flat-graphic, not lifted**. Depth is drawn, not simulated: a hard offset rectangle of pure ink with zero blur radius, exactly as a print designer would fake a drop shadow with a second black box. There is no ambient light, no spread, no colour bleed.

Only three weights exist, plus a muted sibling for surfaces where black-on-black would vanish and an alert-tinted sibling for error fields.

### Shadow Vocabulary

- **Paper Small** (`box-shadow: 4px 4px 0 0 #0a0a0a`): the default. Buttons, badges, stamps, chrome.
- **Paper Medium** (`box-shadow: 6px 6px 0 0 #0a0a0a`): cards at rest — the most common card weight.
- **Paper Lift** (`box-shadow: 8px 8px 0 0 #0a0a0a`): the hover target of a tilt-mode card, and emphasis cards.
- **Paper Small Soft** (`box-shadow: 4px 4px 0 0 #6b6b6b`): the same offset in ink-muted, for anything sitting on an ink or dark-green surface where pure ink loses its silhouette. Also the resting shadow of every form field.
- **Paper Small Soft Hover** (`box-shadow: 3px 3px 0 0 #6b6b6b`): the 1px compression a form field makes on hover.
- **Paper Small Alert** / **Alert Hover** (`4px 4px 0 0 #e8d5cf` / `3px 3px 0 0 #e8d5cf`): error-state fields only, so the offset reads as part of the alert moment.

### Named Rules

**The No Blur Rule.** Every shadow in this system has a blur radius of `0`. A blurred shadow is from a different design language and does not belong here — no exceptions, including "just a subtle one".

**The Press-Down Rule.** Interactive paper does not rise on hover; it presses. The surface translates `+1px, +1px` (buttons and cards) or `+1px/+2px` (fields) and its shadow collapses to `none`, so it appears pushed flat against the page. The translate is gated behind `motion-safe:`; the shadow collapse is not, so reduced-motion users keep the affordance. **One named exception:** the in-page section-nav chip (`<SectionNavChip>`, § Navigation) never presses — no translate, no shadow collapse, at rest or active — because it is chrome rather than the content-you-operate register the press-down exists for. It is deliberately quieter than `<FilterTabs>`'s chip, which keeps the full press-down. [#2478](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2478).

**The Complete Vocabulary Rule.** The seven tokens above are the entire shadow system — there is nothing else to reach for. The pre-redesign blurred family (`--shadow-sm`, `--shadow-DEFAULT`, `--shadow-md`, `--shadow-lg`, `--shadow-card-hover`, `--shadow-input`, `--shadow-input-focus`, `--shadow-soft`) and the orphaned asymmetric pair (`--shadow-photo-tape`, `--shadow-photo-tape-lift`) were removed from `globals.css`; all ten had zero consumers. Adding a blurred token back is a change to the design language, not a convenience.

## Motion

Motion here is **functional, not decorative**. Every duration answers exactly one of three jobs, every curve that starts on demand is the same curve, and a loop exists to say exactly one thing: the system is busy. Nothing spins, sweeps or breathes without meaning it — and nothing waits without picking the one device built for the kind of wait it is.

### Motion Vocabulary

- **Chrome** (`150ms`, `var(--ease-out)`): colour and border changes — nav links, chips, text links, filter bars.
- **The Press** (`300ms`, `var(--ease-out)`): the press-down on cards and buttons.
- **Arrival** (`500ms`, `var(--ease-out)`): anything entering the screen — scroll reveals.
- **The Curve** (`cubic-bezier(0, 0, 0.58, 1)`): the plain CSS `ease-out`.
- **The Scarf**: the barber-pole spinner (`<Spinner variant="primary">`). Search only.
- **The Dots**: the compact three-dot pulse (`<Spinner variant="compact">`). Any in-flight request that isn't search.
- **The Skeleton Pulse**: `motion-safe:animate-pulse` bars. A page arriving.

### Named Rules

**The Three Speeds Rule.** Exactly three durations exist for an on-demand transition, one per job: `150ms` for chrome, `300ms` for the press, `500ms` for arrival. There is no fourth. `240ms` is not a speed — it folds into `300ms`. A loop is not on demand, so it does not draw from this scale; loop periods are answered under the Loop Rule below.

**The One Curve Rule.** Every motion that starts on demand uses `cubic-bezier(0, 0, 0.58, 1)` — the plain CSS `ease-out`. There is no second curve for interaction. This is **not** Tailwind's `ease-out`: Tailwind v4 ships `cubic-bezier(0, 0, 0.2, 1)`, a different, harder deceleration, so the `--ease-*` namespace is reset in `globals.css` and only this curve re-declared — otherwise the class name would lie about which curve it applies. `cubic-bezier(0.22, 1, 0.36, 1)` (easeOutQuint) is removed everywhere it appeared: it front-loads roughly 90% of its travel into the first quarter of the duration, which is what made every duration on a short press feel identical before this rule existed. The curve, not the duration, was the finding that produced this rule (#2508).

**The Loop Rule.** Only three things loop, and all three mean the same thing: the system is busy. The scarf, the dots and the skeleton pulse. Decoration does not loop — a new decorative loop is not banned outright, but it requires its own decision and is never a default. A loop that travels uses `linear`; a loop that breathes uses `ease-in-out`. These are raw CSS values written directly in the keyframes and animation rules, never Tailwind utilities — the project ships exactly one ease utility, `ease-out`; `--ease-in-out` is not re-declared, so `ease-in-out` as a class compiles to nothing. Two of the three loops breathe, and both stay on the compositor: the dots animate `opacity` and `transform`, the skeleton pulse `opacity` alone. A breathing loop animates nothing else — both properties are composited, so a hidden tab costs nothing and no separate "stop when hidden" rule is needed. The scarf is the exception, not a fourth member of that allow-list: it travels by animating `background-position`, a paint property, on the main thread, every frame. That is affordable only because the scarf has exactly one mount and runs only for the duration of a search request in flight — bounded, not free. Each loop's period is its own choice, not the Three Speeds scale: the scarf runs `1.5s`, the dots `1.2s` (staggered `0.15s` / `0.3s` per dot), the pulse `2s`. A fourth loop picks its own period the same way; nothing here fixes one.

**The Waiting-Device Rule.** Three devices wait, and they are not interchangeable — each has exactly one home. A **page arriving** waits as a **skeleton**: its real opening, unshimmered, with `motion-safe:animate-pulse` bars where its data will be. A **request the visitor made** waits as **`<Spinner>`**: the compact dots inline — the scarf only in search. Nothing else waits: a page that simply arrives made no request, so it has nothing to spin about.

**The Reduced-Motion Rule.** Under `prefers-reduced-motion: reduce`, every loop stops and everything that travels arrives instantly. **Colour and border transitions survive.** A colour fade is not motion and causes no vestibular problem; suppressing the 43 `transition-colors` uses on this site would make it read as broken for exactly the users this rule protects. It is the same split the Press-Down Rule already makes on one primitive — the translate gated behind `motion-safe:`, the shadow collapse not — stated here once for the whole system instead of once per primitive.

**The Squeegee Wipe Rule.** A section scrolled into view arrives like ink pulled across paper — `<SectionWipeReveal>` sweeps a `clip-path: inset()` open, left to right, timed by **Arrival** (`500ms`, `var(--ease-out)`). It must degrade to "already visible": the resting, unclassed state carries no clip at all, so the class it adds only ever _triggers_ the sweep and is never what hides the content. That means no JS, an unsupported `IntersectionObserver`, and an observer that is armed but never calls back all leave the section fully visible by construction — there is no failure mode that leaves a section permanently clipped. A section already inside the viewport at mount is measured before the observer is created; if it is already visible, no observer is attached, so it can never animate in after the fact. Reduced motion follows the Reduced-Motion Rule above (the gesture is absent, not shortened — a `clip-path` sweep travels, so it does not get the colour/border carve-out). Built for `<SponsorTiers>` on `/sponsors` (#2623); not yet adopted site-wide — see the PR for the named, bounded set of call sites this shipped with.

**The List Row Fill Rule.** The canonical hover for interactive paper is the Press-Down Rule's translate-into-shadow, and that stays canonical everywhere except **list rows** — a full-width row in a vertical list of peers that carries no border-2/shadow frame of its own (the shared hairline between rows belongs to the list, not the row). Translating one such row reads as the list breaking apart, so a list row **fills instead of moving**: hover deepens its background toward an existing surface token (e.g. `cream-soft`, or the row's own tint one step darker), never a new one minted for this rule, and nothing about the row's box changes size or position — the resting state already reserves whatever the fill adds, so there is no shift to gate. This is a background-colour change, which the Motion Vocabulary already classes as **Chrome** (`150ms`, `var(--ease-out)`), not a fourth speed. **`focus-visible` gets the same fill as hover, plus an inset outline** (`outline-offset-[-2px]`, so the ring draws inside the row and can never clip a neighbour in this gap-free list) — the fill alone is easy to miss against a busy row, and a keyboard user is entitled to the identical cue a mouse user gets, not merely an equivalent one. Because it is colour, not translate, none of this is gated behind `motion-safe:` — the Reduced-Motion Rule above already keeps colour and border transitions everywhere, including here. A card — anything that carries its own `border-2` + shadow, however it is arranged or named in code — is never a candidate for this rule and keeps the press-down; this is a single scoped exception, not a second hover vocabulary. Built for `<CalendarAgenda>`'s `AgendaMatchRow`/`AgendaEventRow` (#2624) — the "labelled wall" agenda list, deliberately unbordered so a dense day reads as a list rather than a stack of cards. `<MatchStripView>`'s own flush row list ships this rule's outline half (`focus-visible:outline-2 focus-visible:outline-offset-[-2px]`) but not the fill half; its rows predate this rule.

**The Namespace Rule.** A Tailwind v4 motion namespace this project does not reset is Tailwind's design, not this project's. `@theme` resets `--ease-*` and `--animate-*` to `initial`, then re-declares only what the rules above sanction: one curve, and `animate-pulse` alone among the loop utilities (`animate-bounce` and `animate-ping` generate nothing — both had zero consumers). `--default-transition-duration` and `--default-transition-timing-function` are not namespaces to reset — they are two singular keys, pinned rather than reset, to `150ms` and `var(--ease-out)`, so an author who forgets an explicit duration class still lands on a sanctioned value instead of Tailwind's own default. Scoped to motion: a token not declared under `--ease-*` or `--animate-*` in `globals.css` may not be used for interaction or loop timing. This is not yet a whole-system rule — `--shadow-*`, `--radius-*`, `--color-*` and `--blur-*` remain fully unreset and unowned (Tailwind's blurred `shadow-sm`–`shadow-2xl` and rounded `rounded-sm`–`rounded-3xl` compile today, in tension with the No Blur and Sharp Corner Rules; `bg-gray-100` / `text-slate-500` compile in tension with the No-Grey-UI Rule), and `--text-*` / `--leading-*` (#2490) and `--font-mono` (#2520) are named, owned and tracked elsewhere. Closing the rest of the namespace list is not this section's job.

## Shapes

**Everything rectangular is sharp.** Border radius is `0` on cards, buttons, inputs, selects, textareas, pills, badges, modals, images and bands. The only curve in the system is a true circle (`rounded-full`) for avatars, timeline bullets, spinner dots and score circles. There is no small-radius softening step, and there is no "just 2px" exception.

Borders vary by weight, and the pattern is a tendency rather than a strict switch. A `2px` ink border is this system's most common weight by far: it is what a shadow-casting **object** uses — a card, a button, a filter chip, and (at reduced opacity, `ink/30` → `ink/40` → `ink/60` → `ink`) the form-field state progression — unless the object is a stamp, badge or small pill, which take `1.5px` instead. `2px` is also, more often than not, a plain divider or a loading-skeleton frame that carries no shadow at all. A quieter `1px` hairline — `border-paper-edge`, the alpha-ink steps `ink/10`–`ink/15`, or full-opacity `border-ink` left at its default weight — appears where a divider sits inside a surface that is already framed, and a second full-weight border would double the frame. Two further weights exist by design, not by drift: `1.5px` on stamps, badges and small pills, and a single `4px` accent rule on a left-hand highlight bar.

The ornament vocabulary is physical: **tape strips** (small solid rectangles anchored half-over a card edge at −0.5° to +0.5°, or −5°/+4° for polaroid compositions), **stamps** (rotated ~2°, mono uppercase, bordered and shadowed), **perforations** (a masked half-disc column with a dashed tear guide, on ticket-stub alerts), **striped seams** (45° two-tone SVG bands used as full-bleed section rules), and **highlighter strokes** (a hand-drawn SVG marker that sweeps left-to-right on hover behind inline links and heading accents).

Photographs get a newsprint treatment: a warm-tint filter (`sepia(0.06) saturate(0.94) hue-rotate(-4deg) contrast(1.02) brightness(1.01)`) plus a 4%-opacity SVG turbulence grain in multiply. They stay in colour.

**The page ground has texture too (D3a, #2613).** Two procedural layers sit behind every page, both inline SVG turbulence drawn in ink at `mix-blend-mode: multiply`: the same fine grain recipe used on photographs, reused here at 5% opacity, plus a new broad low-frequency mottle (`baseFrequency: 0.014`, 4 octaves) at 9% opacity. No image asset, no network request, no fallback path — a scanned-paper tile was considered and rejected because the axis actually missing was low frequency, which this SVG recipe supplies for free. See `d3a-mottle.html` in `docs/design/mockups/research-d-series/` for the comparison that settled the execution, and The No-Grey-UI Rule above for why an ink-drawn texture doesn't reopen that rule.

**The Person-Photo Rule.** A photo _of a person_ additionally multiplies onto the cream it sits on — squad and staff cards, the player and staff detail heroes, the organigram card and its detail panel, and a pull-quote's subject avatar. Multiply erases **white**, so a studio cutout's matte disappears into the paper and the subject sits on the page rather than in a white box. It applies club-wide and without exception (#2901): `<PlayerCard>`'s `blendPhoto` prop survives as an escape hatch but has no production call site.

The cost is stated rather than hidden: multiply darkens a photo that fills its frame instead of erasing anything — measured at roughly **10%** mean luminance on a full-bleed fixture. That is accepted because club portraits are cutouts in practice, and one consistent rule beats a per-surface exception. Note that `imageUrl` resolves `photoUrl ?? psdImageUrl` — the _editorial_ upload wins — so this is a decision about the common case, not a guarantee about every image. Whichever surface renders the blend paints its own cream ground; it never reaches through a parent for one.

### Named Rules

**The Sharp Corner Rule.** If it is a rectangle, its radius is `0`. Circles are circles. There is nothing in between.

**The Sub-Degree Rule.** Grid card and tape rotations live in a −0.5° to +0.5° pool. Individual tilt should be barely perceptible; the effect is only that the grid stops being perfect. Steeper angles are reserved for explicitly named polaroid compositions.

**The Shadow Needs Ink Rule.** Measured order-independently in `apps/web/src` product code (Storybook and tests excluded, since a demo wrapper is not a shipped surface, and counted per class attribute so Tailwind's arbitrary ordering — or a `cva()` variant split across a base class and a state class — can't hide a match): a `2px` ink border appears **163** times against a combined **96** for the three ways a `1px` hairline is drawn (`border-paper-edge` 32, alpha-ink `ink/10`–`ink/15` 10, full-opacity `border-ink` 54). `2px` ink is the more common weight, not the rarer one — the reverse of what an earlier draft of this rule stated, which counted only the literal adjacent string `border-2 border-ink` and so missed most real uses. The one direction that does hold, with one named exception: a shadow-casting surface takes `2px` ink, or `1.5px` on a stamp, badge or chip. **The exception is the in-page section-nav chip** (`<SectionNavChip>`, § Navigation) — `border` (1px) with a 1px offset shadow, on purpose: it is deliberately quieter than every other shadow-casting object on the site, chrome rather than content, so it takes the chip's own lighter weight instead of the `1.5px` a badge-scale object would otherwise use. [#2478](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2478). The converse does not hold either way: a `2px` ink border does not imply a shadow. Of the 163, only 71 also carry a shadow token; the other 92 are shadowless dividers, mostly loading-skeleton frames and `border-t-2`/`border-b-2` section rules. So the test a reviewer can actually run is one-directional — **giving a surface a shadow means giving it `2px` ink (or `1.5px` on a small badge, or `1px` on the section-nav chip) underneath; the absence of a shadow says nothing about the border weight.**

`border-jersey-deep` (12 uses in product code, plus 2 opacity variants) still stays on the object side, never the hairline side — it marks an active filter chip, a hovered link, a focused tab, never a passive divider by convention. The visually darker `border-jersey-deep-dark` is a distinct token and appears only in Storybook, not in product code. An accent-hairline variant was rendered and rejected on the convention (C2): at the density a divider actually renders — a stacked list, a run of section rules — a line of green hairlines stops reading as individual separators and starts reading as a green section, which is exactly what the Rare Green Rule exists to prevent. What C2 rejected is the _rhythm_, not the colour: green fails when it repeats down a list, because repetition is what turns a line into a field. A single green rule under a heading that labels a group does not repeat and does not read as a wash. That is why `SiteFooter`'s three column headings and `HulpFinder`'s category header (`1.5px` / `2px` under a static label) sit inside the convention rather than against it — three headings labelling three different groups is not a run of rows. Decided on [#2689](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2689).

## Components

### Buttons

- **Shape:** sharp (`0` radius), solid `2px` ink border, hard offset shadow at all times.
- **Primary:** jersey-deep fill, cream text, `4px 4px 0 0` ink shadow. Padding 0.75rem / 2rem at the default size (0.5/1.5 small, 1/2.5 large).
- **Inverted:** cream fill, ink text, muted-ink shadow — for placement on dark surfaces.
- **Secondary:** cream-soft fill, ink text. **Ghost:** transparent, ink text, `ink/5` hover wash.
- **Hover:** the canonical press-down — `translate(1px, 1px)` with the shadow collapsing to none over 300ms, and for primary that is the whole hover. Primary is the only variant with no hover fill: it used to brighten 110%, but a filter-based relight necessarily lands off-token (it pushed jersey-deep to `#00884d`), so #2395 removed it rather than mint a hover green.
- **Focus:** a 2px jersey-deep ring at 2px offset.
- **Disabled:** 50% opacity, `not-allowed` cursor, and every hover effect neutralised back to the resting surface so the button visibly does not react.
- An optional trailing `→` glyph translates 4px right on group hover.

### Cards / Containers

- **Corner Style:** sharp (`0`).
- **Background:** cream, cream-soft, ink, jersey or jersey-deep — the text colour flips with the surface.
- **Border:** solid `2px` ink on every variant. On an ink card the border merges into the fill and the shadow alone defines the silhouette — which is why ink cards must use the muted shadow.
- **Shadow Strategy:** Paper Medium at rest by default; see Elevation.
- **Internal Padding:** 0.75rem / 1.25rem / 2rem, or none for flush-edge media cards.
- **Rotation:** optional, from the sub-degree pool, applied as a CSS-variable transform so it composes with the press or tilt hover rather than fighting it.
- **Tape:** zero or more tape strips as children, so they translate with the card frame on press.

### Inputs / Fields

An eight-state machine shared identically by text input, select and textarea — the border weight encodes progress through the state, and the shadow encodes pressure.

- **Style:** white surface (the one white in the system — a field is a form you write on, not paper you print), sharp corners, `2px` border at `ink/30`, resting muted-ink offset shadow.
- **Hover:** border to `ink/40`, shadow compresses to `3px 3px`, surface nudges 1px.
- **Filled** (text present, not focused): border anchors at `ink/60`, resting shadow returns.
- **Focus:** border goes full ink, shadow snaps to none, surface presses 2px — the deepest press in the system.
- **Error:** border and shadow both switch to the alert pair; an `AlertBadge` renders below. Error survives focus.
- **Disabled:** `ink/15` border, cream-soft fill, 50% opacity, all motion frozen — deliberately still inside the paper vocabulary rather than shadowless.
- **Sizes:** 2rem / 2.5rem / 3rem tall with 0.75 / 1 / 1.25rem inline padding. Hints render in italic `ink/60` beneath.

### Chips / Labels

- **Mono Label:** the workhorse. Uppercase mono, 11px, tracking 0.08em, weight 500. Plain (inline, ink or cream) or as a solid pill in jersey, jersey-deep, ink or cream-soft.
- Pills are sharp-cornered with 0.5rem / 0.25rem padding. The jersey-deep pill uses pure white text, not cream. It was adopted when cream on the old `#008755` was the weaker pairing; on today's darker green full cream clears comfortably, so the white is inherited rather than required — reconciling it (and the handful of other white-on-jersey-deep surfaces) back to cream is an open consistency question, not a rule. Fractional cream, however, is never the answer here: see The Whole-Cream Rule.

### Navigation

The global top-level bar (`<SiteHeader>`) and the sticky in-page section nav are two different registers, not one description stretched over both — see below for why they differ before assuming either applies to the other.

**Global top-level bar:**

- Uppercase mono, weight 600, tracking 0.04em, no underline. The **size** ramp is a fit constraint rather than a ramp step, and § Typography's **The Chrome Fits The Bar Rule** is its single home; the weight and tracking above stay here.
- Default ink; hover and active shift to jersey-deep, colour only, 150ms.
- The utility action carries a 1px ink border that recolours to jersey-deep on hover.
- **The nav is flat — no dropdowns.** Every top-level entry is a plain link. Mobile uses a full takeover drawer of the same flat list, not a squeezed menu.

#### In-page section navigation is the light chip, not the top-level bar's bare link

A sticky in-page section nav (`<TeamSectionNav>` on `/ploegen/[slug]`, `<OrganigramSectionNav>` on `/hulp`) is **chrome, not content** — quieter than both the top-level bar above and `<FilterTabs>`'s heavy chip, which a visitor actively operates. Its item, `<SectionNavChip>`, is one recipe consumed by both navs and both loading skeletons:

- `border` (1px), `bg-cream`, a 1px offset shadow at rest — never `<FilterTabs>`'s `border-2` + Paper Small shadow.
- Active fills `bg-jersey-deep text-cream`, `aria-current="location"`, **and drops the shadow entirely** — no press-down, at rest or active (the chip's one named exception to the Press-Down Rule and the Shadow Needs Ink Rule; see § Elevation & Depth and § Shapes).
- Filled by scroll-spy on every route: the fill means "the section being read right now", never "the one last clicked".
- The bar itself pins at `--sticky-header-h`, `bg-cream-deep`, `border-b-2`; a trailing slot (`<HubSearch variant="nav">` on `/hulp`) takes the chip's exact paper weight so the bar reads as one row of one kind of object.

Decided on [#2478](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2478), built by [#2584](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2584). This is a distinct, lighter weight beside `<FilterTabs>` — see § Chips / Labels — not a variant of it.

#### The top-level bar is exempt from the ≤4 working-memory limit

A persistent nav is **scanned, not memorised**. The reader is not holding nine options in working memory and choosing between them; they are sweeping a fixed bar for the one word they already came for, and it sits in the same place on every page. The ≤4 ceiling governs a decision point — a set of options presented once, weighed against each other, then gone. The top-level bar is not one, so a count alone is not a finding against it.

Two constraints do bite, and they are the ones to measure against:

1. **One-line fit at `lg` (1024px)** with the longest realistic labels. This is a hard limit — the row must never wrap. Senior nav labels come from Sanity team names, so the desktop row bounds each entry itself (`max-w-[14ch] truncate`, exact because every nav label is mono) rather than trusting whatever an editor types. The bound lives at the desktop render site on purpose: the mobile drawer has no width constraint, and truncating the label string instead would chop the drawer too and put the ellipsis into the link's accessible name.
2. **Glance-scannability for any transient panel.** This is what the ≤4 rubric was reaching for, and it is the constraint to apply if a panel is ever proposed again — it governs panels, not the persistent bar.

Decided on [#2409](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2409), built by [#2415](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2415). The four dropdowns were **deleted rather than regrouped**, because each destination page already indexes its own children better than a transient panel can — `<ClubEditorialHub>` on `/club`, `<YouthDirectory>` on `/jeugd`, in-page section anchors on `/ploegen/[slug]`. `nav-reachability.test.ts` is the standing guard on that claim.

The footer is a second, intent-based organisation of the same site and is **not** required to mirror the nav. The rule binding them: **every top-level nav destination appears somewhere in the footer as that same href**; the footer may hold more. One alias is supported, and only one — a `/ploegen/<slug>` team entry is covered by the footer's `/ploegen` index, because a per-team footer link would grow with the roster. Anything else must match exactly: a general "same branch of the route tree" rule reads well but cannot fail where it matters, since `/club` would then count as covered by an unrelated `/club/*` CTA in another column. Enforced by `footerLinks.test.ts`.

### Tables

**The One Table Skin Rule (#2476/#2582).** There is one register for a table, the quiet one, on cream: `font-mono text-xs` throughout, `border-b-2 border-ink` under the header row, `border-b border-paper-edge` between body rows, uppercase tracked headers at `font-normal` weight (never the UA-default bold a bare `<th>` inherits when nothing else says otherwise), no frame, no zebra, no dotted dividers. A `<caption>` takes the kicker register — `font-mono`, `text-label`, `font-medium`, `leading-none`, uppercase, `text-ink-muted`, left-aligned, `pb-2` below it — identically wherever it appears.

Exactly two call sites, and the recipe is a literal class string at each rather than a shared component or prop, per the Manila Rule's precedent: one styles arbitrary injected HTML through `<HtmlTableBlock>`'s arbitrary-variant selectors, the other styles known JSX columns directly in `<StandingsTable>` — there is no shared class string to extract, only a shared set of property _values_ to keep in sync by hand.

What varies between them is not the skin but the **anchoring**: `<StandingsTable>` is typed, so it knows which columns are the identifying ones and pins them (#2476 rule 3); `<HtmlTableBlock>` renders an editor's arbitrary columns and anchors none. A typed table may also align its known first/last columns against the table's own edges with extra padding on those two cells — an authored table, not knowing which column is which, does not attempt it and keeps uniform `px-2 py-2` cell padding throughout instead. Both are deliberate, named exceptions to a shared base, not drift.

### Stamp Badge

A rotated, content-bearing paper stamp that pins over the edge of a card — 14px above the parent, 36px in from its anchoring side, rotated ~2°. Uppercase mono 11px bold at 0.1em tracking, `1.5px` ink border, Paper Small shadow, in jersey-deep, ink or alert tone. Distinct from a tape strip: the stamp carries text, the tape is purely graphic.

### Striped Seam

A full-bleed 45° two-tone stripe band (12 / 18 / 24 / 28px tall) rendered as an SVG pattern, used as a section rule. Four pairs: ink-cream (default, high contrast), jersey-cream, jersey-tonal-dark, and cream-jersey-deep. The angle can flip so a top and bottom seam lean toward each other and "tape" a section shut.

## The Imageless Card

**A card without a photo shows its own subject's artefact, not a generic texture.** A person (player or staff) takes the jersey-illustration figure; a team takes the shirt; a club (an opponent) takes its crest, contained on `bg-cream-soft`. Only one subject kind has nothing to depict — a document (an article, a page, a gallery, an event) — and for that one the 135° jersey-deep hatch keeps its job. One helper, `getCardSubjectArtefact` (`apps/web/src/lib/utils/card-subject-artefact.tsx`), maps subject kind to artefact — nothing enforces that a call site uses it instead of hand-rolling its own no-photo treatment, so treat it as the offered path, not a guarantee. A card learns "render this instead of the hatch" via its `artefact` slot.

Decided on [#2462](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2462) (crest card), [#2472](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2472) (placeholder crest), amended by [#2485](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2485) (the non-playing figure), built by [#2574](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2574).

### Named Rules

**The Subject, Not The Route Rule.** The artefact follows the document the card was built from, never the page it happens to render on — `getCardSubjectArtefact` takes a subject, not a route or a page, as its only input, so the same player document resolves to the same jersey figure wherever a card is built from it. #2574 ships the primitive and the helper; it does not wire any production call site to pass a subject through yet — the divergence this makes it possible to close (the same player reading as a photo card in the squad grid and a meaningless hatch in a related-content row) is a documented open item, not a closed one. Read the shipping PR before assuming a card anywhere renders an artefact today.

**The Player Draws One Figure Rule.** A player's `<JerseyIllustration>` seed is built through `playerFigureSeed`, never a free-form string — the same identity resolver `<SquadGrid>`'s `<PlayerCard>` and `<PlayerHero>` already use, so a given player draws the same figure wherever the illustration renders them, today and if the seed derivation ever changes.

**The Document Has Nothing To Show Rule.** A document is the one subject kind with no artefact, and that is not a gap — there is no illustration for "a piece of writing". The hatch is correct for exactly this one case, which is why it stays `<NewsCard>`'s own default rather than becoming a fifth artefact.

**The Person Resolves One Level Finer Rule (#2485).** "Person → jersey illustration" is one level too coarse: a player document takes the jersey, a staff document takes a coat off the same figure — same head, torso and shoulder bumps; only the garment-front lines (collar + shirt pattern vs. lapels/placket/notch ticks) and the two-pass palette (inverted: ink underprint, jersey-deep overprint) change. The key is always the document type, never the route and never role text — a role string is missing or generic (`"Staf"`) for most of the site's imageless staff cards, so it cannot carry this decision.

**The Contained, Never Covered Rule.** A crest is `object-contain` at every size, including this artefact's ~121px card scale (measured on a 288px card, #2462) — never `object-cover`, which would crop a square transparent logo the way #2462's own worked example predicted. The team shirt is likewise sized to sit inside its slot rather than fill it edge to edge. The person figure is the exception to "contained": `<JerseyIllustration variant="card">` fills its slot edge to edge on purpose, matching how it already renders in `<SquadGrid>`'s `<PlayerCard>` and in `<PlayerHero>` — this rule governs the crest and the shirt, not every artefact uniformly.

**The Slot Keeps Its Ratio Rule.** The artefact fills the card's existing image region; it never switches that region to a different aspect ratio per subject kind. This is what keeps a slider's cards sharing a top edge — the one thing the rejected "go typographic" candidate at #2462 gave away.

**The Placeholder Crest Is Accepted, Unqualified Rule (#2472).** A club's logo — a real crest, PSD's generic grey-shield placeholder for an unknown club id, or (rarer) a real per-club URL that happens to decode to a fully transparent image — renders through the exact same path, at every scale, with **no detection of any kind**: no byte-hashing, no redirect-target check, no `?v=` sniffing, no deny-list. Judged on render, not on rate: neither failure mode reads as a defect at any measured size, so there is no threshold to defend and nothing to substitute it with. A missing or wrong crest is upstream data work in PSD, not a render-time concern — see `getCardSubjectArtefact`'s docblock for the six ways a detector was tried and found insufficient.

## What an Image Says

**An image says only what the page does not already say.** If the subject is named in the same section — a card's own title, a figure's own caption, an opening's own `<h1>` — the image is decorative and says nothing. Where nothing else names it, the image carries the whole burden.

This is not only a screen-reader rule. The usage scene is a phone held in daylight on the sideline, possibly on a weak connection; on a weak connection the alt text **is** the page.

Decided on [#2548](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2548), built by [#2559](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2559).

### Named Rules

**The Section Radius Rule.** An image describes at a radius of one section — not the control, and not the page. A card's title silences its own image; an `<h1>` silences its opening's photograph; a caption silences its own figure. A page-level heading does **not** silence a run of distinct photographs, which is the whole difference between one article hero and fifty-five gallery photos.

**The Slot, Not The Tag Rule.** The unit is the image slot, so whatever fills it answers to the same rule: `alt` on a photo, `aria-label` on an artefact fallback, and anything carrying `role="img"`. A slot's two branches do not get two different verdicts.

**The Silent Artefact Rule.** An artefact is not a likeness, so it never speaks — it is `aria-hidden` even where the rule would otherwise let it talk. The jersey illustration is the same drawing for all 294 players and a monogram is two letters; neither identifies anybody. `<JerseyShirt>`, `<SubjectAvatar>` and `<SubjectAvatarCluster>` are all silent, and none of them takes an accessible-name prop.

**The Either-Or Rule.** A figure with a caption needs no alt; a figure without one carries everything the caption would have said. Look for the same shape elsewhere: a sponsor tile renders a logo _with_ an alt **or** a visible wordmark, never both — which is why `formatSponsorAlt` survives, since when the logo paints, the alt is the only naming on the tile.

**The Alone Image Rule.** An image with nothing else on the page to name it says its position and extent — `Foto 12 van 55` — never the collection, which the `<h1>` already named in the same section.

**Authored alt is an override, never a prerequisite.** The derived rule has to be correct on the day it ships with zero authored alts anywhere. No cover image _gains_ an alt field: a cover is structurally incapable of being alone (hero under its own `<h1>`, card under its own title, related row under its own link text), and an optional field that is correct when empty invites a half-filled state. If a cover ever needs to speak, the in-body image slot already exists for it. The one pre-existing exception — the event cover's `alt` — no longer reaches the page; it survives only as the social-share card's description, and its Studio help text says so.

## Failure & Emptiness

**The Silence Is An Answer Rule (#2470/#2580).** A client-initiated failure — a search, a submit, a copy-to-clipboard — gets a visible notice only when nothing else already recovers the visitor's intent. The test: does anything else on screen still let the visitor finish what they were doing? If yes, render nothing; the silence **is** the answer, not a gap to fill. Three sites are ratified under this test, by name, and stay silent on purpose: `/hulp`'s `HubSearch` (falls back to keyword search — the PRD floor, #2057 decision 7o8), `/zoeken`'s semantic augment (`useSemanticAugment` — the lexical results below still serve), and `/nieuws/[slug]`'s `navigator.share` rejection (`ArticleMetadata` — a dismissed share sheet is not a failure, and the sibling Facebook link is the explicit alternative). A fourth site follows the same test, not the shape of these three.

Where a notice is warranted, two more splits apply. **The tier follows the scope of the loss** — the whole surface gone (`<EmptyState tier="surface">`, e.g. `/zoeken`'s failed search) or one slot gone with the page around it intact (`<EmptyState tier="slot" reason="unavailable">`, e.g. a submit or a clipboard copy) — the same split `<EmptyState>`'s two tiers already draw for emptiness, so the visitor learns the register once. **An action appears only where the control it replaced is hidden** — a retry is a substitution, never an addition; a control that still works beside the notice (a submit button, a copy button, a populated search field) means no second control is added.

## Do's and Don'ts

### Do:

- **Do** set every rectangle's border radius to `0` and reserve curves for true circles.
- **Do** give a shadow-casting surface a `2px` ink border, or `1.5px` on a stamp, badge or chip — never a `1px` hairline underneath a shadow, except the in-page section-nav chip, which is deliberately `1px`/`1px` (chrome, not content). A shadowless divider may still be `2px` ink; the implication runs one way only.
- **Do** use hard offset shadows with `0` blur, in exactly the seven documented tokens.
- **Do** press interactive surfaces into their shadow on hover (`translate(1px, 1px)` + `shadow-none`), gating only the translate behind `motion-safe:` — except the in-page section-nav chip, which never presses at all.
- **Do** pick the right green: `jersey` decorative only, `jersey-deep` for anything carrying text (headings, CTAs, inline prose links), `jersey-bright` for green text on ink.
- **Do** reach for an existing primitive — taped card, ticket stub, mono label, editorial heading, tape strip, stamp badge, striped seam — before writing new markup.
- **Do** route every page through the three container widths (680 / 1040 / 1280).
- **Do** keep photographs in colour with the newsprint warm-tint; greyscale-to-colour-on-hover belongs to sponsor logos alone — except on `/sponsors` itself, see the Don't below.
- **Do** author heading emphasis as a Portable Text `accent` decorator, one emphasis per heading.
- **Do** use Phosphor Fill icons from the single icon source.
- **Do** give an image `alt=""` when its own section already names it, and describe the moment when nothing else does.
- **Do** reach for `getCardSubjectArtefact` before hand-rolling a no-photo treatment for a new card — a fifth artefact or a second mapping is exactly the drift #2462 closed.

### Don't:

- **Don't** introduce a blurred shadow, a gradient fill, or a glassmorphic surface — those are the SaaS anti-reference.
- **Don't** reintroduce a blurred shadow token. The pre-redesign family and the orphaned `--shadow-photo-tape*` pair were deleted from `globals.css`; re-adding one changes the design language.
- **Don't** put a radius on a loading skeleton. A skeleton must match the sharp shape of what it stands in for — 44 stray `rounded` / `rounded-sm` classes were removed from eight skeleton files for exactly this reason.
- **Don't** set `jersey` (`#4acf52`) as a text colour, and don't put it on cream.
- **Don't** draw a green divider **between repeating rows** — a list, a table, a run of section rules. Rendered and rejected (C2): at that density a line of green hairlines reads as a green section, which the Rare Green Rule forbids. A green hairline **under a heading that labels a group** is allowed and already ships (`SiteFooter`, `HulpFinder`): it marks one boundary, not a rhythm. The test is repetition — if a reader would see two of them stacked, it is green on a run and it is wrong.
- **Don't** wrap a striped seam or a coloured band in a max-width container.
- **Don't** invent a container width outside 680 / 1040 / 1280 (chrome's 1440 is header and footer only).
- **Don't** pin a Display-size heading's italic accent to a heavy weight — Freight Big Pro has no 900 italic.
- **Don't** add a new typeface. Freight Sans Pro, Freight Display Pro, Freight Big Pro and IBM Plex Mono are the whole set.
- **Don't** build a 16px semibold sans "section label" register between display serif and 11px mono.
- **Don't** reintroduce a neutral grey. `gray-100`, `foundation-gray-light` and the four `table-*` tokens have all been deleted; a section that needs to step down from the page gets `cream-soft`, not a grey.
- **Don't** rely on hover to reveal anything necessary — the primary usage scene is a phone, outdoors. Sponsor logos are the one exception: a logo is fully legible in greyscale, so the colour reveal is brand flavour rather than information. On `/sponsors`, where the logos are the content, they render in colour at rest.
- **Don't** use emoji as icons.
- **Don't** feed a heading, a card title or a caption back into the image beside it — a duplicated sentence spends the reader's attention twice for nothing.
- **Don't** give an artefact an accessible name. The jersey illustration and the monogram disc identify nobody, so they take `aria-hidden`, not a label.
- **Don't** add an alt field to a cover image. A cover is never alone, and an optional field that is correct when empty only invites a half-filled one.
- **Don't** try to tell a real crest apart from PSD's placeholder shield. No byte-hashing, no redirect-target check, no `?v=` sniffing, no deny-list — #2472 tried six variants of this and rejected all of them; a missing crest is upstream data work, not a render-time concern.
