# Phase 4.5 · R10 · NewsCard structure — Locked

**Locked 2026-05-14.**
**Source comparison pages:**

- `round-r10-card-structure-fix.html` (nested vs flush demo)
- `round-r10-options-visual.html` (three options visualised)
- `round-r10b-display-variants-polished.html` (polished display compositions — REJECTED)

**Owner:** @climacon.

## Decision

**Option 1 · Flush-edge structure fix only.** Drop the nested
`<TapedFigure>` inside `<NewsCard>`. The outer `<TapedCard>` becomes
the only frame; the image fills the top region edge-to-edge; an ink
rule divides image from meta panel. Every card always uses its
article's `coverImage`.

**Option 2 (display variants for image-less cards) rejected.** Owner's
verdict on the polished R10b compositions: _"they don't shine at all,
I expected interaction with illustrations or images or whatever"_.
Pure typographic compositions (display date, jersey-number disc,
pull-quote) don't carry the visual weight a photo carries. Display
variants will return in a future phase when paired with imagery /
illustration — not Phase 4.5.

## Structural changes

### Before (current implementation)

```text
<TapedCard padding="md">                  ← outer frame · 16px padding
  <TapedFigure aspect="landscape-16-9">   ← inner frame · own border + shadow
    <Image fill ... />                    ← image inside inner frame
  </TapedFigure>
  <MonoLabel>...                          ← meta panel directly under inner figure
  ...
</TapedCard>
```

### After (R10 lock)

```text
<TapedCard padding="none-top-and-sides">  ← outer frame · padding only inside meta
  <TapeStrip position="tl|tr" />          ← tape on outer card corners
  <Image fill aspect="16/9" />            ← image fills top region directly
  <div class="meta panel">                ← divided from image by top border
    <MonoLabel>...
    ...
  </div>
</TapedCard>
```

### Per-property delta

| Property               | Before (nested)                                      | After (flush)                                             |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Outer card padding     | 16px all around                                      | 0 on top + sides, padding only inside meta panel          |
| Inner figure           | `<TapedFigure>` with border + paper-shadow + padding | Removed — image fills outer card's top region directly    |
| Tape strips            | On the inner `<TapedFigure>`                         | On the outer `<TapedCard>` corners (top-left + top-right) |
| Image / meta divider   | Inner figure's bottom border + 16px cream gap        | Single 1px ink rule (`border-top` on meta panel)          |
| Number of paper levels | Two (outer card + inner figure)                      | One (outer card)                                          |

## Where R10 applies

| Surface                                 | Update                                              |
| --------------------------------------- | --------------------------------------------------- |
| **NewsGrid (R2.B)**                     | All 6 cards switch to flush-edge structure          |
| **Uitgelicht (R1.6.A)**                 | All 3 featured cards switch to flush-edge structure |
| **Any future consumer of `<NewsCard>`** | Inherits the flush-edge default                     |

## Where R10 does NOT apply

| Surface                       | Reason                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero photo (R1.B)**         | Hero's right-column photo IS a single taped polaroid, intentionally framed as a photo-object. Different role — not a card. Keep `<TapedFigure>` for the hero photo. |
| **FeaturedEventBand image**   | Separate band composition (image left + text right), not a card. Keep its existing `<TapedFigure>` per `featuredeventband-locked.md`.                               |
| **Clubshop JerseyShirt (R6)** | Section decoration, not a card. Unaffected.                                                                                                                         |

## R9 reconciliation

R9 (photo-treatment-system-locked.md) already locked tape strips
"anchored to card frame (move with card), NOT to photo" — that
model assumed flush-edge structure. R10 makes that assumption
explicit. No conflict; R9's hover Variant A (card press-down +
photo lift-on-top) continues to work because the "photo" is now
the top region of the outer card rather than an inner figure.

R9's `<TapeStrip>` torn-edge variant, paper-grain overlay, warm-tint
filter, and asymmetric photo shadow all still apply — the photo
just lives directly under the outer card border now instead of
inside a nested figure.

## Implementation pieces

For the implementation issue:

- **`<NewsCard>` refactor:**
  - Remove `<TapedFigure>` wrapper.
  - Outer `<TapedCard>` set to `padding="none"` (new prop value) or
    equivalent; child `<Image>` fills the top region.
  - Move tape strip placement from inner figure to outer card top-left
    - top-right corners (consume `slot` index for the deterministic
      colour cycle).
  - Add `border-top` on the meta panel section (1px ink).
- **`<TapedCard>` may need a `padding="none"` value** if it doesn't
  already support zero-padding for this consumer.
- **Storybook update:** every NewsCard story re-renders with the new
  structure. VR baselines refresh.
- **NewsGrid + Uitgelicht consumers:** no code change (they consume
  `<NewsCard>` via props that don't reference the inner figure).
- **`<EditorialHero>` / `<TapedFigure>` standalone usage:** unchanged.

## Future revisit (NOT Phase 4.5)

If display variants for image-less cards come back in a future phase:

- They must incorporate imagery / illustration, not pure typography
  (owner's explicit rejection of R10b).
- Candidate imagery sources: jersey illustrations, ticket-stub
  illustrations, illustrated team crests, photo collages with a
  display headline overlay, etc.
- Pure typographic display compositions (large date, big number,
  pull quote) are **rejected at the card scale** — they don't carry
  the visual weight a card needs.

Save the rejection rationale to memory so a future round doesn't
re-propose the same compositions.

## Plan doc audit alignment

- Audit §"Other concerns" gets a new entry: card structure mismatch
  (nested vs flush) — resolved here.
- Brief's "scrapbook polaroid" intent: realised primarily through R9
  tape + R10 flush-edge + Variant A hover. The card is the "scrapbook
  page"; the image is the photo printed onto that page; the tape
  strips are the masking tape; the meta panel is the editor's
  caption beneath.

## Tracking

R10 implementation rolls into the broader Phase 4.5 implementation
PR (alongside R2.B's 3×2 geometry and R3.B's per-articleType
backgrounds — all touch `<NewsCard>` / `<NewsGrid>`).
