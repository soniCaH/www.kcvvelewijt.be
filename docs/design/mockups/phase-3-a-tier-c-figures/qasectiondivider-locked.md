# `<QASectionDivider>` — locked design (Phase 3, Checkpoint A)

**Status:** awaiting owner sign-off.
**Issue:** #1525 · sub-issue 3.A.4.
**Direction:** Option C — Matchday Programme (single thin rule + glyph + italic display title + mono kicker beneath).

## Composition

```
[ 1px ink rule ]  ✦  De jaren tussen de lijnen.  ✦  [ 1px ink rule ]
                          AKTE 02 · DE OVERSTAP
```

Stacked over one another:

- **Top row** — single horizontal closer line: 1px ink rule, jersey-deep `✦`, italic Freight Display title (mixed-case Dutch), jersey-deep `✦`, 1px ink rule.
- **Bottom row** — small mono caps kicker (e.g. `AKTE 02 · DE OVERSTAP`), centered, sits ~8px under the rule. Optional — when omitted, the divider is just the top row.

Container: `max-width: 580px`, centered in the article column, `margin: 40px auto`.

## Differentiation from `<EndMark>`

Both primitives intentionally share vocabulary (1px rule + jersey-deep glyph + label). The split that prevents reader confusion:

|                | `<EndMark>`                   | `<QASectionDivider>`                       |
| -------------- | ----------------------------- | ------------------------------------------ |
| Glyph          | **★** (five-pointed)          | **✦** (four-pointed) — distinct silhouette |
| Title font     | mono caps, 10px               | italic Freight Display, 22px, mixed-case   |
| Kicker beneath | none                          | optional mono caps act label               |
| Role           | article closer (appears once) | section break (appears 1–N times)          |

`★` is reserved for "this is the end"; `✦` is reserved for "the next section starts." Designers must not mix them.

## Alignment contract (same rules as `<EndMark>`)

The top row's three centerlines must share one vertical line, accurate to 1px:

1. 1px rules.
2. Optical centre of the `✦` glyphs.
3. Cap-height midpoint of the italic Freight Display title.

### Implementation rules

- **Flexbox** wrapper, `display: flex; align-items: center; line-height: 1;`.
- `✦` rendered as separate flex children (`<span class="divider__glyph" aria-hidden="true">✦</span>`), NOT pseudo-elements on the title — same architectural reasoning as `<EndMark>`.
- 1px rules are flex children with `flex: 1; height: 1px; background: var(--color-ink); align-self: center;`.
- Italic display title: `font-family: var(--font-display); font-style: italic; font-weight: 600; font-size: 22px; line-height: 1; padding: 0 6px;` — the in-title `<em>` accent renders in `--color-jersey-deep` and `font-weight: 900`.
- Kicker (when present): `font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-ink-muted); margin-top: 8px;`.

### Visual verification (mandatory before merge)

A Storybook story renders the divider with a debug centerline overlay (same proof pattern used for `<EndMark>`). VR baseline captures the result. Drift between rules / glyphs / title centerline = layout bug.

## Component API

```typescript
type QASectionDividerProps = {
  /** Title rendered as Portable Text. Each text span carries optional `accent` mark. */
  title: PortableTextBlock[];
  /** Mono caps act label rendered under the rule. Omit to drop the second row entirely. */
  kicker?: string;
};
```

No tone, no flourish variants, no rotation modifier. The component reads `title` as Portable Text — text without marks renders ink italic, text with the `accent` decorator renders in jersey-deep italic (`font-weight: 900`).

## Sanity schema — Portable Text with a custom `accent` decorator

The accent is **inline-selected by the editor** inside the title field, exactly like bold/italic in any rich-text field. No substring typing, no string matching.

```typescript
// packages/sanity-schemas/src/blocks/qaSectionDivider.ts
defineType({
  name: "qaSectionDivider",
  title: "Q&A section divider",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }], // no headings
          lists: [], // no lists
          marks: {
            decorators: [
              { title: "Accent", value: "accent" }, // ← inline toolbar button
            ],
            annotations: [], // no links / refs
          },
        }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "kicker",
      type: "string",
      description:
        'Optioneel — kleine mono caps regel onder de divider, bv. "AKTE 02 · DE OVERSTAP".',
    }),
  ],
});
```

Add to the article body's block schema as a new block-of object so editors insert it from the body editor's "+" menu.

**Editor flow** (familiar Sanity rich-text pattern):

1. Insert "Q&A section divider" from the body editor's `+` menu.
2. Type the title in the inline editor. (e.g. _De jaren tussen de lijnen._)
3. Optional — select a word, click the **Accent** button in the toolbar. That word renders jersey-deep italic.
4. Optional — fill in the kicker.

If no accent is applied, the title renders plain ink italic — same end result as the "no inline accent" path, with zero extra effort.

## Renderer rule

Walk the `title` Portable Text block's children. For each child span:

- No marks → render in `<span>` with default ink italic styling.
- `accent` in `marks` → render in `<em class="qa-divider__accent">` with jersey-deep italic + `font-weight: 900` styling.

No string matching, no substring search — Sanity stores the marked range structurally.

## A11y

- Wrap in `<aside role="separator" aria-label={portableTextToPlainText(title)}>` so assistive tech reads the divider as a section break with its title as context. **`aria-label` requires a `string`, not the raw `PortableTextBlock[]`** — the component must serialize the title via the existing `portableTextToPlainText()` helper (or an equivalent — the same helper used to derive the cover-image `alt` attribute on `<EditorialHero>`). Strips spans + accent decorator marks; preserves the readable text only.
- `✦` glyphs are decorative — `aria-hidden="true"`.
- Kicker is meaningful but secondary — leave readable.

## Reference renders

- In-context flow: `screenshots/qa-divider-flow.png` (option C panel — third / bottom).
- Specimen view: `screenshots/compare-qa-divider.png` (column C — note: rendered before the glyph swap from `★` to `✦`).

## Master design delta

§5.2 interview template currently spec's `<QASectionDivider>` with `flourish: "em-dash" | "star"` — drop the `flourish` prop entirely. The glyph is a fixed `✦`. The component just takes a `title` and an optional `kicker`.

## Approval checklist

- [ ] Direction: Option C — single 1px rule + ✦ glyphs + italic display title + optional mono kicker.
- [ ] Glyph is `✦` (four-pointed), reserved exclusively for QASectionDivider. EndMark's `★` is separate and reserved.
- [ ] Glyphs are flex children, not pseudo-elements on the title.
- [ ] Three centerlines (rule, ✦ optical centre, italic title cap-height midpoint) align to within 1px — verified with VR baseline overlaid on a guide.
- [ ] Kicker is optional; when present, mono caps under the rule.
- [ ] Accent is inline-applied in the Sanity Portable Text editor via an "Accent" decorator (like bold/italic). No substring typing.
- [ ] Sanity schema (`packages/sanity-schemas/src/blocks/qaSectionDivider.ts`) ships with `title` (Portable Text, single block, `accent` decorator only — no styles/lists/links) + optional `kicker`. Article body schema gains it as a block-of object.
- [ ] `aria-label={portableTextToPlainText(title)}` on the wrapper (serialised plain string, NOT the raw `PortableTextBlock[]`); glyphs `aria-hidden`.

Reply "approved" and the next figure goes (JerseyShirt — last one in Checkpoint A).
