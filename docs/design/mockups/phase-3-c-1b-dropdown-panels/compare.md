# Phase 3 · 3.C.1b · Dropdown panels — drill record

**Issue:** #1659 · `<SiteHeader>` desktop dropdown panels (3.C.1b)
**Parent tracking:** #1525
**Companion to:** `phase-3-c-header-and-matchstrip/header-locked.md` (locked Direction A — Classic Newsstand)

This drill follows the Phase 3 drill-down pattern: lock voice → IA → details, one question at a time, with at least 3 visual options per question. Each lock builds on the previous.

## Drill order

| Step | Question                                | Type      | Options        | Status                              |
| ---- | --------------------------------------- | --------- | -------------- | ----------------------------------- |
| 1    | **Surface** of the dropdown panel       | Voice     | 4 (B/B′/C/C′)  | locked → C (Ink-fill cool)          |
| 2    | **Width & position** (anchored / mega)  | IA        | 4 (A/B/C/D)    | locked → D (Content-width hybrid)   |
| 3    | **Grouping & labels (De club wide panel)** | IA     | 3 (α/β/γ)      | locked → γ (Two-group fold)         |
| 4    | **Animation** (instant / fade / slide)  | Detail    | 3 (A/B/C)      | locked → C (Fade + paper-slide)     |
| 5    | **Active state inside panel**           | Detail    | 3 (A/B/C)      | locked → C (Em-dash → ▶ chevron)    |
| 6    | **Close paths** (mouse-leave grace, …)  | Behaviour | matrix + 3 presets | locked → B (Forgiving)          |
| —    | **Trigger**                             | Locked    | hover-open     | locked                              |

## Q1 — Surface

The visual register of the dropdown panel itself: what does it look like as an *object* before we decide how items are arranged inside it.

### Iteration history

- Initial set proposed A (cream continuation), B (cream-soft pinned), C (ink-fill cool), D (cream + tape seal).
- A and D rejected by owner — too quiet / mannered.
- B and C kept; refined into B′ (letterhead variant) and C′ (warm-ink variant) to address each side's main weakness.
- Active comparison: **B vs B′ vs C vs C′**.

### Options

| Opt | File                                      | Direction                                                                                  |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| B   | `option-b-cream-pinned.html`              | `--color-cream-soft` panel, 2px ink full-frame, hard offset shadow. Most "fanzine".       |
| B′  | `option-b-prime-letterhead.html`          | `--color-cream-soft` panel, 4px ink top-edge band only, soft shadow. Paper + letterhead.  |
| C   | `option-c-ink-fill.html`                  | `--color-ink-soft` panel inverted, cream caps, jersey-bright hover. Stadium-board chrome. |
| C′  | `option-c-prime-warm-ink.html`            | Warm coffee/sepia panel (`#1d1812`), cream caps. Inverted newsprint, warmer than C.       |

Side-by-side: `comparisons.html`.

### Trade-off summary

| Criterion                                  | B — Pinned            | B′ — Letterhead             | C — Ink-fill                       | C′ — Warm-ink                  |
| ------------------------------------------ | --------------------- | --------------------------- | ---------------------------------- | ------------------------------ |
| Coherence with locked Direction A          | High                  | Highest                     | Lowest (clashes)                   | Medium                         |
| Distinct from "more nav row"               | Highest               | High (band signals)         | Highest                            | Highest                        |
| Fanzine character                          | Highest               | High                        | Low (different register)           | Medium (printed inverse)       |
| Sticky-scroll behaviour                    | Medium (heavy shadow) | Strong                      | Strong (always distinct)           | Strong                         |
| Readability vs page content                | High                  | Medium                      | Highest                            | High                           |
| Implementation complexity                  | Lowest                | Lowest (border swap)        | Medium (jersey on dark)            | Highest (3 new tokens)         |
| Jersey-deep accent contrast                | Passes AA             | Passes AA                   | Fails (~3:1, jersey-bright req.)   | Fails (~3:1, jersey-bright req.) |
| Holds up across 11-item De club            | Heavy slab            | Yes                         | Yes                                | Yes                            |
| Composes with future panels (search/notif) | Heavy                 | Yes                         | Yes (different register)           | Yes (warm chrome family)       |
| New palette tokens needed                  | 0                     | 0                           | 0 (jersey-bright carve-out)        | 3 (warm-ink family)            |

### Visual decision map

| Decision        | B                                | B′                                          | C                                | C′                                          |
| --------------- | -------------------------------- | ------------------------------------------- | -------------------------------- | ------------------------------------------- |
| Panel surface   | `--color-cream-soft`             | `--color-cream-soft`                        | `--color-ink-soft`               | `--color-ink-warm` (new, `#1d1812`)         |
| Panel border    | 2px `--color-ink` (full)         | 4px `--color-ink` top + 1px paper-edge sides | 1px `--color-ink`                | 1px `--color-ink-warm-rule` (new)            |
| Panel shadow    | `--shadow-paper-sm` (hard 4px)   | `--shadow-soft` (blurred)                   | `--shadow-paper-sm-soft`         | `--shadow-paper-sm-soft`                    |
| Item text       | `--color-ink`                    | `--color-ink`                               | `--color-cream-soft`             | `--color-cream-soft`                        |
| Em-dash bullet  | `--color-ink-muted`              | `--color-ink-muted`                         | `--color-ink-muted`              | `--color-ink-warm-bullet` (new)             |
| Hover signal    | `--color-jersey-deep`            | `--color-jersey-deep`                       | `--color-jersey-bright` + bright text | `--color-jersey-bright` + bright text   |
| Decoration      | none                             | the 4px ink band IS the anchor              | none                             | none                                         |
| Reads as        | flyer pinned beneath             | printed flyer w/ section letterhead         | stadium board, inverted          | inverted newsprint, warm                     |

### The deciding question

> **Does a dropdown belong to the masthead, or is it a separate piece of UI furniture?**

- **B / B′** answer "masthead" — the panel is paper, printed, in the same register. B says it loud (full ink frame + hard shadow). B′ says it quietly (cream-soft body + ink letterhead anchor + blurred shadow).
- **C / C′** answer "UI furniture" — the panel is a clear inverse object. C does it cool/clinical (neutral ink-soft). C′ does it warm/printed (sepia-tinted dark — like inverted newsprint).

### Open considerations to surface during Q1 review

1. **Master design §3.6 advisory:** "blurred shadows for chrome (modals, dropdowns, popovers)". B′, C, C′ follow this; B departs (hard offset shadow on a chrome surface). Departure may be defensible — owner call.
2. **Master design §2.3 open question:** "paper everywhere vs paper only at editorial weight (chrome stays unrotated, uses `--shadow-soft`)". This Q1 lock implicitly answers that question for dropdowns.
3. **No bright jersey green** memory: C and C′ both force `--color-jersey-bright` for hover bullets on dark — needs an explicit carve-out for inverted-chrome surfaces if either wins. The carve-out also unblocks future modal / command-palette designs that may live on dark.
4. **Multi-panel render:** all 11 De club items are shown in the mockups so the worst-case panel height is visible. Teams (4 items) and Jeugd (8–12 items) will appear shorter under the same surface.
5. **Locked above:** trigger = hover-open; click on the trigger label still navigates to the parent's own page. Keyboard always uses click semantics (Enter / Space / ArrowDown).
6. **C′ adds 3 new tokens** (`--color-ink-warm`, `--color-ink-warm-rule`, `--color-ink-warm-bullet`) — small palette addition, but a one-way door once they ship.

### Decision

> **Option C — Ink-fill (cool)** locked 2026-05-07. B, B′, C′ kept as historical record only.

- [ ] ~~B — Cream-soft pinned~~ _(historical record)_
- [ ] ~~B′ — Cream-soft + ink letterhead~~ _(historical record)_
- [x] **C — Ink-fill (cool)** _(locked 2026-05-07)_
- [ ] ~~C′ — Warm-ink (coffee)~~ _(historical record)_

**Rationale:** the dropdown is **UI furniture**, not part of the masthead. C's neutral ink-soft surface gives the cleanest "here's a list of choices" reading — highest contrast, no colour-temperature negotiation with the cream paper world, no new palette tokens. The contrast jolt against the cream page is a *feature*: it tells the user "the panel is a separate object, click one and move on" rather than "more nav row, scan everything". B / B′ kept the panel inside the paper register but at the cost of "is this just more nav?" ambiguity. C′ added warmth but came with 3 new tokens for marginal gain.

**Carve-outs created by this lock:**

- `--color-jersey-bright` is the canonical hover-bullet accent for the ink-fill panel (jersey-deep fails AA on `--color-ink-soft`, ~3:1). Document this as the dark-surface accent rule when implementing — it unblocks future modal / command-palette designs that may also live on dark.
- The dropdown is the first inverted-chrome surface in the redesign. Establishes the pattern (cream-soft caps text, ink-muted em-dash bullet, jersey-bright hover accent) for future dark UI surfaces.

### Next step

**Q2 — Width & position.** Apply the locked C surface to 4 layout options. See section below.

---

## Q2 — Width & position

How wide is the panel, where is it positioned, and does the layout differ per submenu? All four options use the locked Q1 C ink-fill surface verbatim — this drill is about *layout*, not surface.

### Options

| Opt | File                                  | Direction                                                                                      |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A   | `q2-option-a-anchored-narrow.html`    | Uniform 244px narrow column anchored to trigger. Single layout for all 3 submenus.             |
| B   | `q2-option-b-anchored-grouped.html`   | Uniform 520px wide anchored to trigger. Layout varies inside (1 / 2 / 3 columns + headings).   |
| C   | `q2-option-c-full-bleed-mega.html`    | Full-viewport ink band under masthead. Tab-row / pill-row / 3-col + accent strip per panel.    |
| D   | `q2-option-d-content-width.html`      | Per-panel width: 280px (Teams + Jeugd) / 560px (De club). Width matches data shape.            |

Side-by-side: `q2-comparisons.html` (focuses on De club — the most-discriminating panel).

### Trade-off summary

| Criterion                           | A — Narrow      | B — Medium grouped     | C — Full-bleed         | D — Content-width        |
| ----------------------------------- | --------------- | ---------------------- | ---------------------- | ------------------------ |
| Implementation cost                 | Lowest          | Medium                 | Highest                | Medium                   |
| Visual heaviness on hover           | Lightest        | Medium                 | Heaviest               | Light (most panels)      |
| De club readability (11 items)      | Tall column     | Grouped index          | Editorial spread       | Grouped index            |
| Teams fit (4 short labels)          | Snug            | Oversized              | Tab-row reads as feature | Snug                   |
| Jeugd fit (10 short ages)           | 10-row tall     | 2-col grid             | Pill row works         | 10-row tall              |
| Visual rhythm across panels         | Most consistent | Consistent outer width | All-in or nothing      | Inconsistent             |
| Editorial register fit              | Mechanism only  | Indexed                | Stadium concourse      | Editorial honest         |
| Internal layouts to maintain        | 1               | 3                      | 3 + accent component   | 2                        |
| Width change tolerance (data grows) | High            | High                   | Medium                 | Low (heuristic boundary) |
| Q3 has ground to drill?             | No              | Yes (per panel inside) | Yes (3 layouts)        | Yes (narrow vs wide)     |

### Visual decision map

| Decision              | A                      | B                          | C                                      | D                                  |
| --------------------- | ---------------------- | -------------------------- | -------------------------------------- | ---------------------------------- |
| Outer width           | 244px (uniform)        | 520px (uniform)            | 100vw (uniform full-bleed)             | 280px / 280px / 560px (per panel)  |
| Panel position        | absolute, anchored     | absolute, anchored         | absolute, top:100%, left:0/right:0     | absolute, anchored                 |
| Internal layout Teams | single column          | single column              | horizontal tab-row                     | single column                      |
| Internal layout Jeugd | single column          | 2-col grid                 | horizontal pill row                    | single column                      |
| Internal layout Club  | single column          | 3-col grouped              | 3-col grouped + accent strip           | 3-col grouped                      |
| Section headings      | none                   | mono caps + dashed rule    | mono caps cream-soft on dark           | mono caps + dashed rule            |
| Accent micro-element  | none                   | none                       | jersey-bright "Kom langs" strip        | none                               |

### Open considerations to surface during Q2 review

1. **Hover-open + full-bleed** (Q2-C) needs careful grace timing. Cursor sweeping across triggers will rapidly stack/unstack three different ink-band layouts. May feel chaotic compared to the narrow-anchored options.
2. **Q2-D's heuristic** ("data shape determines width") needs an explicit rule: at what item count does narrow become wide? Today: ≤10 → narrow, 11+ → wide. Future Jeugd growth past ~12 ages would force a re-evaluation.
3. **Q2-B's 520px from rightmost trigger** can overflow at exactly 1024px viewport. Implementation needs `max-width: calc(100vw - 32px)` guard. Q2-D has the same risk with 560px.
4. **Q2-C's accent strip** ("Maar één plezante compagnie") opens the door to mini editorial moments inside dropdowns. Could repeat for Jeugd ("Trainingstijden") or Teams ("Volgende match"). If Q2-C wins, this is a separate spec to lock per-panel.
5. **Q3 Composition implications:** if Q2-A wins, Q3 has nothing meaningful to drill (one layout). If B/C/D wins, Q3 picks the per-panel layouts. Locking Q2 also implicitly decides whether Q3 happens.

### Decision

> **Option D — Content-width hybrid** locked 2026-05-07. A, B, C kept as historical record only.

- [ ] ~~A — Anchored narrow uniform~~ _(historical record)_
- [ ] ~~B — Anchored medium with grouping~~ _(historical record)_
- [ ] ~~C — Full-bleed ink band mega-menu~~ _(historical record)_
- [x] **D — Content-width hybrid** _(locked 2026-05-07)_

**Rationale:** width carries meaning. Teams' 4 short labels and Jeugd's 10 short ages don't earn a 520px panel — they get a quiet 280px narrow column. De club's 11 heterogeneous items genuinely do — they get 560px with 3-column grouping. The user learns "wide panel = more to show, narrow panel = quick switch", and the visual weight of every dropdown opening is content-determined, not a fixed cost. Q2-A was too undifferentiated; B oversized the small panels; C was a too-loud register departure for a hover-open mechanism.

**Carve-outs created by this lock:**

- Two width tokens: `--dropdown-narrow: 280px` and `--dropdown-wide: 560px`.
- The 11+ → wide threshold is a heuristic. Today: De club only. If Jeugd grows past 12 ages (unlikely soon), revisit. Document in implementation PRD.
- 560px from rightmost trigger overflows at exactly 1024px viewport — implementation MUST add `max-width: calc(100vw - 32px)`.
- Q3 (Composition inside) DOES have ground to drill — the wide De club panel needs grouping labels + column assignments. Narrow panels stay simple. See Q3 below.

### Next step

**Q3 — Grouping & labels for the wide De club panel.** See section below.

---

## Q3 — Grouping & labels (De club wide panel)

With Q2-D locked, only the wide De club panel needs grouping. Teams + Jeugd stay flat narrow. This drill picks **the group labels** (3 of them, in Dutch) and **how the 11 children are bucketed**. The grouping data lives in `apps/web/src/components/layout/menuItems.ts` (extended schema; not Sanity, until the Studio UX rework lands).

### Schema extension

```typescript
interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];          // existing — Teams, Jeugd
  childGroups?: MenuItemGroup[];  // new — De club only
}

interface MenuItemGroup {
  label: string;       // mono caps heading
  items: MenuItem[];   // children of this group, in display order
}
```

The renderer reads `childGroups` if present, otherwise falls back to `children`.

### Options

| Opt | File                              | Direction                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- |
| α   | `q3-option-alpha-topic.html`      | Topic-led — Over ons / Helpen / Praktisch (6/2/3). Brochure index voice.               |
| β   | `q3-option-beta-role.html`        | Role-led — Wie we zijn / Doe mee / Contact (6/3/2). Verb-led, mirrors WORD LID.        |
| γ   | `q3-option-gamma-two-group.html`  | Two-group fold — Wie we zijn / Praktisch & contact (6/5 in 2 cols). Balanced spread.   |

Side-by-side: `q3-comparisons.html`.

### Trade-off summary

| Criterion                                | α — Topic              | β — Role               | γ — Two-group              |
| ---------------------------------------- | ---------------------- | ---------------------- | -------------------------- |
| Distribution balance                     | 6/2/3 — lopsided       | 6/3/2 — tapered        | 6/5 — balanced             |
| Hulp top-level conflict                  | YES (Helpen ≈ Hulp)    | No                     | No                         |
| Editorial voice consistency              | 3 nouns                | noun / verb / noun     | noun / compound            |
| Action emphasis                          | Buried in "Praktisch"  | Highlighted as "Doe mee" | Folded into bucket       |
| Membership signup placement              | Under "Praktisch" (mislabel) | Under "Doe mee" (correct) | Under "Praktisch & contact" |
| Visual rhythm                            | Tall · short · medium  | Tall · medium · short  | Balanced 2-page spread     |
| Heading wrapping risk at 11px mono       | No                     | No                     | YES — 18 chars             |
| Editorial nuance                         | Brochure index         | Verb-led club voice    | Utilitarian split          |
| Composes with future Hulp fold-in        | Helpen collides        | Hulp can become 4th    | Folds into bucket easily   |

### Visual decision map

| Decision               | α                            | β                                    | γ                                      |
| ---------------------- | ---------------------------- | ------------------------------------ | -------------------------------------- |
| Group 1 (identity)     | Over ons (6)                 | Wie we zijn (6)                      | Wie we zijn (6)                        |
| Group 2 (engagement)   | Helpen (2)                   | Doe mee (3)                          | _(merged)_                             |
| Group 3 (touchpoints)  | Praktisch (3)                | Contact (2)                          | Praktisch & contact (5)                |
| Word vrijwilliger lives in | Helpen                  | Doe mee                              | Praktisch & contact                    |
| Praktische Info lives in | Praktisch                  | Doe mee                              | Praktisch & contact                    |
| Cashless clubkaart lives in | Praktisch              | Doe mee                              | Praktisch & contact                    |
| Contact lives in       | Helpen                       | Contact                              | Praktisch & contact                    |
| Downloads lives in     | Praktisch                    | Contact                              | Praktisch & contact                    |
| Heading accent         | none                         | jersey-bright on "Doe mee"           | none                                   |
| Column count           | 3                            | 3                                    | 2                                      |
| Reads as               | brochure index               | verb-led club voice                  | 2-page spread                          |

### Open considerations to surface during Q3 review

1. **"Hulp" top-level rename** — flagged separately by owner. Currently `Hulp` is a top-level nav item pointing to `/hulp`. Renaming/folding it into De Club is a *navigation IA* decision adjacent to but distinct from this Q3 grouping drill. Recorded as a Phase 3 follow-up below.
2. **Voice mode mixing** — β's three headings span identity / verb / noun. Possibly intentional (action-led middle group earns the verb) but worth conscious confirmation.
3. **Heading wrapping** — γ's "Praktisch & contact" is 18 chars. At 11px mono caps in a ~240px column it should fit on one line, but verify on real fonts. Could shorten to "Praktisch" and demote Contact to an inline trailing item if it wraps.
4. **Jersey-bright accent on action heading (β)** — small but new chrome moment. If β wins, decide whether to formalise this as "verb-led groups get the bright accent" pattern across the redesign or keep it scoped to this single panel.
5. **Future Sanity menu schema** — when Studio UX rework lands, `childGroups` migrates from `menuItems.ts` to a Sanity menu document. Editor controls labels + assignments at runtime. Not in scope for #1659 — flagged in `project_sanity_studio_ux_rework`.

### Decision

> **Option γ — Two-group fold** locked 2026-05-07. α and β kept as historical record only.

- [ ] ~~α — Topic-led~~ _(historical record)_
- [ ] ~~β — Role-led~~ _(historical record)_
- [x] **γ — Two-group fold** _(locked 2026-05-07)_

**Rationale:** the 6/5 distribution is the only option that doesn't leave a short orphan column inside a 560px panel. "Wie we zijn" cleanly owns the identity content; the second column gathers everything functional (signup, vrijwilliger, cashless, contact, downloads) under one larger bucket so the panel reads as a balanced 2-page spread. β's "Doe mee" verb energy was tempting but the action group is small (3 items) and would have re-created α's lopsided rhythm. γ also gives Hulp the cleanest fold-in path if the top-level rename happens (one bucket to add to, not three to renegotiate).

**Carve-outs created by this lock:**

- Right-column heading is **"Praktisch & contact"** as drafted. Open implementation tweak: shorten to **"Praktisch"** alone (Contact appears as an item below, no need to repeat in heading) — see "Heading tweak" below.
- 2-column grid: `grid-template-columns: 1fr 1fr; gap: 32px`. Each column ~240px wide.
- Heading wraps need to be guarded — at 11px mono caps with `letter-spacing: 0.12em`, "Praktisch & contact" is 18 chars. Should fit on one line at 240px column width but verify on real fonts in implementation.
- Schema: `MenuItemGroup[]` with 2 entries on the `De club` MenuItem in `menuItems.ts`.

### Heading tweak

> **γ-short** locked 2026-05-07. Right-column heading is **"Praktisch"** (alone). Contact + Downloads are listed as items below the heading; "& contact" was redundant.

- [ ] ~~γ as-built (`Praktisch & contact`)~~
- [x] **γ-short (`Praktisch`)** _(locked 2026-05-07)_
- [ ] ~~γ-action (`Doe mee`)~~

### Next step

**Q4 — Animation.** Open/close transition style, durations, and easing. Hover-grace timings (delay before open / delay before close) are deferred to Q6 (Close paths). See section below.

---

## Q4 — Animation

How does the panel arrive on screen and leave it? Three options, all on the locked Q1+Q2+Q3 panel. Mockups auto-cycle so you can compare rhythms in real time.

### Options

| Opt | File                          | Open                              | Close                            | Spatial            |
| --- | ----------------------------- | --------------------------------- | -------------------------------- | ------------------ |
| A   | `q4-option-a-instant.html`    | 0ms                               | 0ms                              | none               |
| B   | `q4-option-b-fade.html`       | 200ms opacity ease-out            | 120ms opacity ease-in            | none               |
| C   | `q4-option-c-paper-slide.html`| 150ms opacity + 4px translateY    | 100ms opacity + 2px translateY   | from masthead seam |

Side-by-side (all three cycling in sync): `q4-comparisons.html`.

### Trade-off summary

| Criterion                                | A — Instant     | B — Fade        | C — Paper-slide        |
| ---------------------------------------- | --------------- | --------------- | ---------------------- |
| Perceived responsiveness                 | Highest (0ms)   | Medium (200ms)  | High (150ms)           |
| Spatial cue                              | No              | No              | Yes — from seam        |
| Editorial register fit                   | Pure chrome     | Soft UI         | Printed sheet          |
| Stutter resistance under load            | Highest         | High            | Medium (transform paint) |
| Rapid cursor sweep tolerance             | High            | High            | Lower (slide stack)    |
| Reduced-motion compliance                | Already complies | Falls back to A | Falls back to A        |
| Composes with existing redesign motion   | No motion       | Generic fade    | Same as NavTakeover    |
| Implementation cost                      | Zero            | Low             | Medium (GPU layer)     |

### Visual decision map

| Decision        | A · Instant       | B · Fade                  | C · Paper-slide                     |
| --------------- | ----------------- | ------------------------- | ----------------------------------- |
| Open duration   | 0ms               | 200ms                     | 150ms                               |
| Close duration  | 0ms               | 120ms                     | 100ms                               |
| Open easing     | none              | ease-out                  | ease-out                            |
| Close easing    | none              | ease-in                   | ease-in                             |
| Open opacity    | hidden → visible  | 0 → 1                     | 0 → 1                               |
| Open transform  | none              | none                      | translateY(−4px) → translateY(0)    |
| Close transform | none              | none                      | translateY(0) → translateY(−2px)    |
| Reads as        | system menu       | gentle UI                 | printed sheet dropping              |

### Open considerations to surface during Q4 review

1. **Hover-grace timings are NOT in this drill** — they're behavioural and deferred to Q6 (Close paths). E.g. "delay 100ms before opening on hover, 200ms before closing on mouse-leave" are Q6 concerns.
2. **All three respect `prefers-reduced-motion`** — B and C fall back to A's instant snap when the user has reduced motion preference. No drill needed there.
3. **C is the redesign default** — `NavTakeover.tsx` already uses Tailwind `animate-in fade-in slide-in-from-top-1`. Locking C unifies dropdown + drawer motion vocabulary.
4. **Rapid cursor sweep** is the strongest argument against C — if a user hovers across Teams → Jeugd → De club triggers in <300ms, three slide-in animations would stack and stutter. Q6's hover-grace timing fixes this (debounce open by 80–120ms, cancel pending opens on hover-leave) but you should verify the C slide doesn't feel chaotic in practice.

### Decision

> **Option C — Fade + paper-slide** locked 2026-05-07. A and B kept as historical record only.

- [ ] ~~A — Instant snap~~ _(historical record)_
- [ ] ~~B — Fade only~~ _(historical record)_
- [x] **C — Fade + paper-slide** _(locked 2026-05-07)_

**Rationale:** unifies dropdown motion with the existing `<NavTakeover>` drawer animation (`animate-in fade-in slide-in-from-top-1`). 150ms is fast enough to feel responsive, the 4px downward translate signals "panel comes from the masthead seam", and the asymmetric ease (out on open, in on close) gives natural physicality. The "rapid cursor sweep stutter" risk is real but solvable in Q6 with hover-grace debouncing — not a reason to lose C's spatial cue.

**Implementation contract:**

- Open: 150ms, opacity `0 → 1` + `transform: translateY(-4px) → translateY(0)`, `ease-out`
- Close: 100ms, opacity `1 → 0` + `transform: translateY(0) → translateY(-2px)`, `ease-in`
- Reduced motion: collapse to instant (option A)
- Reuse Tailwind utilities: `animate-in fade-in slide-in-from-top-1 duration-150` for open

### Next step

**Q5 — Active state inside panel.** How the current-route item reads among the others. See section below.

---

## Q5 — Active state inside panel

When the user is on a child route (e.g. `/club/geschiedenis`) and opens De club, how does the corresponding item read among the other 10? All three options shift text colour to `--color-jersey-bright`; they differ in what (if anything) replaces the em-dash bullet.

### Options

| Opt | File                          | Active treatment                                  |
| --- | ----------------------------- | ------------------------------------------------- |
| A   | `q5-option-a-color.html`      | Colour shift only — text + em-dash both jersey-bright |
| B   | `q5-option-b-rail.html`       | Em-dash → 2px jersey-bright vertical rail + colour shift |
| C   | `q5-option-c-chevron.html`    | Em-dash → ▶ filled chevron + colour shift |

Side-by-side: `q5-comparisons.html`.

### Trade-off summary

| Criterion                              | A — Colour      | B — Rail               | C — Chevron               |
| -------------------------------------- | --------------- | ---------------------- | ------------------------- |
| Visual prominence                      | Lowest          | Medium                 | Highest                   |
| Redundant signals (colour-blind safe)  | Colour only     | Colour + structure     | Colour + glyph            |
| "No decorative ornament" rule          | Passes          | Passes (functional)    | Borderline (glyph swap)   |
| Vocabulary consistency w/ NavTakeover  | Same as nav     | Same as drawer rule    | Echoes hover →            |
| Implementation cost                    | Lowest          | Medium                 | Low                       |
| Bullet vocabulary uniformity           | All em-dash     | Em-dash + rail         | Em-dash + chevron         |
| Hover collision risk                   | Both colour-shift | Rail distinguishes   | Chevron distinguishes     |

### Open considerations to surface during Q5 review

1. **Hover and active overlap.** With C ink-fill panel, hover already shifts the bullet to jersey-bright. Option A makes hover and active visually identical — the only difference is that active persists. B and C distinguish them via structural change. Consider whether this matters in practice (typically only one item is hovered at a time, and hover is transient).
2. **`feedback_no_decorative_nav_ornaments`** — option C's chevron is technically functional ("currently pointing at"), but it is a glyph swap. Borderline. A and B are safer.
3. **`aria-current="page"`** is the load-bearing semantic regardless of visual choice. Screen readers announce "current page" — visual is supportive.
4. **Multiple active edge case** — could happen if two children share the same path prefix. None of today's De club children do, but worth flagging.
5. **WCAG 1.4.1** (Use of Color): A relies on colour alone. B and C have structural redundancy. A is borderline; aria-current carries the semantic load but visual best practice is redundancy.

### Decision

> **Option C — Em-dash → ▶ filled chevron** locked 2026-05-07. A and B kept as historical record only.

- [ ] ~~A — Colour only~~ _(historical record)_
- [ ] ~~B — Em-dash → 2px rail~~ _(historical record)_
- [x] **C — Em-dash → ▶ filled chevron** _(locked 2026-05-07)_

**Rationale:** the loudest indicator wins because the active item is genuinely "you are here" — pretending it's just another link with a colour shift undersells it. The chevron echoes the `→` hover-reveal in `NavTakeoverItem`'s child rows (so the visual lineage is internal, not borrowed from generic UI), and it's a glyph swap rather than a bullet styling change so hover-vs-active is visually distinct (hover keeps em-dash, active shows chevron). The `feedback_no_decorative_nav_ornaments` rule is satisfied because the chevron is functional — it points at the active row — not ornamental.

**Implementation contract:**

- Inactive item: em-dash bullet (`—`) in `--color-ink-muted`, text in `--color-cream-soft`
- Hover item: em-dash bullet → `--color-jersey-bright`, text → `--color-cream`
- Active item (`aria-current="page"`): glyph swap em-dash → `▶` filled chevron in `--color-jersey-bright`, text → `--color-jersey-bright`
- Width and height of bullet area unchanged across states (no padding shift)
- Verify chevron readability at 200% zoom — bump font-size if required

### Next step

**Q6 — Close paths.** All the ways the panel can close, plus hover-grace timings. See section below.

---

## Q6 — Close paths & hover-grace

This drill has two halves:

1. **Always-on close paths** — required behaviours, no choice (a matrix listing them).
2. **Hover-grace timing preset** — choose one of three (A/B/C). See `q6-comparisons.html` to feel each one.

### Always-on close paths (required, no choice)

| Trigger                          | Behaviour                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Escape key                       | Closes immediately. Returns focus to the parent trigger button.                                    |
| Click outside the panel          | Closes immediately on `pointerdown` outside both trigger and panel. (Uses `pointerdown` not `click` so the panel doesn't catch a click meant for content.) |
| Click on a panel item            | Item navigates → panel closes via the route-change handler below.                                  |
| Route change (`pathname` change) | `useEffect(() => close(), [pathname])`. Same pattern `MobileMenu.tsx` already uses.                |
| Tab out of last item             | Tabbing past the last focusable item in the panel: focus advances to the next nav item AND closes the panel. (Desktop dropdowns do NOT trap focus — that's mobile-drawer behaviour.) |
| Trigger blur (focus leaves)      | If the trigger had keyboard focus and the user Tab/Shift+Tabs out before opening, no-op.            |

### Hover-grace timing preset

Choose one. All three respect Q4's open/close transition (150ms / 100ms paper-slide). The grace times are *delays around* those transitions.

| Preset       | File                       | Open grace | Close grace | Total open (incl. transition) | Total close (incl. transition) |
| ------------ | -------------------------- | ---------- | ----------- | ----------------------------- | ------------------------------ |
| A · Snappy   | `q6-comparisons.html` (frame A) | 0ms     | 100ms       | 150ms                         | 200ms                          |
| B · Forgiving| `q6-comparisons.html` (frame B) | 80ms    | 200ms       | 230ms                         | 300ms                          |
| C · Sticky   | `q6-comparisons.html` (frame C) | 150ms   | 300ms       | 300ms                         | 400ms                          |

Side-by-side (with hover testing): `q6-comparisons.html`.

### Trade-off summary

| Criterion                                | A — Snappy           | B — Forgiving        | C — Sticky           |
| ---------------------------------------- | -------------------- | -------------------- | -------------------- |
| Perceived responsiveness                 | Highest              | High                 | Medium               |
| Resistance to accidental hover           | Low (0ms)            | High (80ms)          | Highest (150ms)      |
| Tolerance of cursor sweep across triggers| Lowest               | High                 | Highest              |
| Tolerance of diagonal trigger→panel paths| Medium               | High                 | Highest              |
| Risk of skitter / flicker                | Highest              | Low                  | Lowest               |
| Risk of "clingy" feel                    | None                 | Low                  | Real                 |

### Visual decision map

| Decision                  | A · Snappy | B · Forgiving | C · Sticky |
| ------------------------- | ---------- | ------------- | ---------- |
| Open debounce             | 0ms        | 80ms          | 150ms      |
| Close-mouse-leave grace   | 100ms      | 200ms         | 300ms      |
| Open transition (Q4-locked) | 150ms    | 150ms         | 150ms      |
| Close transition (Q4-locked)| 100ms    | 100ms         | 100ms      |
| Reads as                  | reactive   | tolerant      | deliberate |

### Open considerations to surface during Q6 review

1. **Click-open compatibility** — even though Q2 locked `hover-open`, keyboard navigation should still work via Enter/Space on the trigger. The grace timings only apply to hover; keyboard activation is instant. This is a parallel input mode, not a competing one.
2. **Panel re-hover after close** — if a user hovers De club, leaves, then immediately re-hovers within close-grace, the panel should NOT close-then-reopen. The implementation should cancel the pending close and treat the re-hover as continuous. Easy to forget — flag in implementation PRD.
3. **Multiple panels** — opening B's panel while A's is still in close-grace should immediately close A (skip its close-grace) and start B's open-grace. The open-grace on B is for fresh hovers, not for hand-offs from another open panel.
4. **Mobile / touch** — none of these apply to mobile (drawer handles that). On touch devices, hover doesn't fire reliably; click-open is required as a fallback (Q2's hover-open trigger should also accept tap on mobile).
5. **Reduced motion** — animation duration is already 0 under `prefers-reduced-motion: reduce` (Q4 lock). Grace timings stay the same — they're not motion, they're behavioural buffers.
6. **Implementation pattern** — likely a small `useHoverIntent` hook around `setTimeout`/`clearTimeout` keyed off the trigger element. Or `transition-delay` for CSS-only (works for hover-out grace, but hover-in debounce really wants JS to cancel cleanly).

### Decision

> **Preset B — Forgiving** locked 2026-05-07. A and C kept as historical record only.

- [ ] ~~A — Snappy (0 / 100ms)~~ _(historical record)_
- [x] **B — Forgiving (80 / 200ms)** _(locked 2026-05-07)_
- [ ] ~~C — Sticky (150 / 300ms)~~ _(historical record)_

**Rationale:** 80ms open-grace filters out accidental hovers without feeling sluggish; 200ms close-grace covers diagonal trigger→panel cursor paths without making the panel feel clingy. Total perceived "to fully visible" is 230ms which sits comfortably in the responsive band. Sticky's 400ms close was tested and read as overstaying its welcome; Snappy's 0ms open invited skitter on rapid trigger sweeps.

**Implementation contract:**

- Open grace: 80ms debounce (`setTimeout` on `mouseenter`, cleared on `mouseleave` before timer fires)
- Close grace: 200ms (`setTimeout` on `mouseleave`, cleared if `mouseenter` re-fires before timer)
- Re-hover within close grace: cancel pending close, treat as continuous (no close-then-reopen flicker)
- Cross-panel hand-off: opening another panel skips the previous panel's close grace (immediate close), but starts the new panel's open-grace clean
- Keyboard activation (Enter/Space) bypasses both grace timers — instant
- Touch tap bypasses open-grace, applies close-grace as normal
- Both grace timings are constants in the implementation, not props — consistent across all dropdowns

### Drill complete

All six questions are locked. The canonical spec lives in `dropdown-locked.md`.

This compare.md is the historical drill record — useful for understanding *why* each decision was made, but the implementation contract is in `dropdown-locked.md`.

**Next step:** review `dropdown-locked.md`, then run `/spec` to make this Ralph-ready (or `/write-a-prd` if more implementation depth is needed first — the locked doc has the contract, but a PRD would expand testing strategy, VR baselines, schema migration steps, etc).

---

## Phase 3 follow-ups (out of scope for #1659)

These surfaced during the drill but belong to other issues / work:

- **"Hulp" top-level rename / fold-in.** Owner flagged 2026-05-07 that the top-level `Hulp` nav item could maybe be renamed or folded into the De club tree. This is a top-level navigation IA decision that affects `menuItems.ts` and the page route at `/hulp`. NOT decided in this drill; surface as a separate spec issue under #1525.
- **Sanity menu schema.** Long-term home for `childGroups` data. Tracked under `project_sanity_studio_ux_rework`. Not blocking #1659.
