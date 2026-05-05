# `<EndMark>` — locked design (Phase 3, Checkpoint A)

**Status:** awaiting owner sign-off.
**Issue:** #1525 · sub-issue 3.A.3.
**Direction:** Option C — Matchday Programme (`option-c-matchday-programme.html` `#end-mark` section).

## Composition

```
[ 1px ink rule ]  ★  EINDE GESPREK  ★  [ 1px ink rule ]
```

A single horizontal closer composed of:
- left ink rule (1px solid `--color-ink`, flexible width)
- jersey-deep `★` glyph (typographic, no SVG / no Lucide)
- mono caps label (Sanity-/article-supplied — defaults `EINDE GESPREK`)
- jersey-deep `★` glyph
- right ink rule (1px solid `--color-ink`, flexible width)

Container is centred at `max-width: 560px`, sits in the article column flow with vertical `margin: 48px auto 32px`.

## Alignment contract (explicit)

Three things must share a single vertical centerline, accurate to within 1px at all viewports:

1. **Optical centre of the mono caps label** — defined by the cap-height midpoint of the text.
2. **Optical centre of the `★` glyphs** — Phosphor / system serif star glyph (`★`).
3. **Centerline of the 1px rules.**

### Implementation rules

- Use **flexbox**, not grid. `display: flex; align-items: center;` on the wrapper.
- `★` glyphs: rendered as `<span class="endmark__star" aria-hidden="true">★</span>` — NOT pseudo-elements on the label. Pseudo-elements share the label's line-box, which can offset the star from the rule by sub-pixel amounts depending on font metrics.
- Set `line-height: 1` on the wrapper so the flex centerline equals the optical centerline.
- `★` glyphs use `display: inline-flex; align-items: center;` and a font-size tuned so the optical centre sits at 50% of the star's bounding box (typical: `font-size: 14px` with `--color-jersey-deep`).
- The 1px rules render as flex children: `<span class="endmark__rule" aria-hidden="true"></span>` with `flex: 1; height: 1px; background: var(--color-ink); align-self: center;`.
- The label is mono caps: `font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; font-weight: 600; padding: 0 12px;`. **No background fill** — the label sits on cream paper, no need to "knock out" the rule.

### Visual verification (mandatory before merge)

When implementing, run a Storybook story that overlays a horizontal guide at the wrapper's optical centerline. The rule, both stars, and the cap-height midpoint of the label must all touch that line. Capture as VR baseline.

## Component API

```typescript
type EndMarkProps = {
  /** Closer text, defaults to "EINDE GESPREK". Editor-authored per article. */
  label?: string;
};
```

No tone, no flourish variants, no asymmetric mode. The component is structural.

Common labels (page-/article-supplied): `EINDE GESPREK`, `EINDE INTERVIEW`, `EINDE LOGBOEK`, `EINDE`.

## A11y

- The whole component is decorative and scoped to article close. Wrap in `<aside role="presentation">` or `<div aria-hidden="true">` if the surrounding article uses an explicit `<footer>` for credits.
- The `★` glyphs are decorative — `aria-hidden="true"`.
- The label is meaningful text — leave it readable to assistive tech.

## Reference render

- `screenshots/compare-end-mark.png` (column C)
- Source: `option-c-matchday-programme.html` lines 905–963 (markup) + 439–462 (CSS)

## Master design delta

§5.2 interview template currently spec's `<EndMark flourish="star">` — drop the `flourish` prop. There is no flourish variant; the star is a fixed part of the composition.

## Approval checklist

- [ ] Direction: Option C — rule + tag + stars (no asterisk cluster, no symmetric double-dash).
- [ ] Stars rendered as separate flex children (`<span class="endmark__star">★</span>`), not pseudo-elements.
- [ ] Three centerlines (rule, star optical centre, label cap-height midpoint) align to within 1px — verified with a VR baseline overlaid on a guide.
- [ ] Label is editor-supplied with default `EINDE GESPREK`; no other props.
- [ ] Stars are `aria-hidden`; component is `role="presentation"`.

Reply "approved" and the next figure goes under the same drill-down.
