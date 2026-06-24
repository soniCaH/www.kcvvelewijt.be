# HP-8 — Footer crest illustration

**Issue:** #2236 (HP-8) · go-live-ux-polish
**Mockup:** `compare.html` · verification PNGs in `_verify/`
**Production assets:** `kcvv-crest-bold-faithful.svg` (A1), `kcvv-crest-bold-retro.svg` (A2)
**Target:** `apps/web/src/components/layout/SiteFooter/SiteFooter.tsx` — add a **bold**
retro **stamnummer-55 crest** flourish near the wordmark + "Er is maar één plezante
compagnie".

These are **CLEAN, SHARP, FAITHFUL** recolors of the **real** KCVV crest
(`apps/web/public/images/logos/kcvv-crest.svg`) with the **one** effect the owner wanted:
a **subtle 2-colour print OFFSET**. A prior pass added halftone + paper-grain +
misregister + distress and the owner found it **lower quality than the clean logo** — so
this pass has **NO halftone, NO grain, NO distress, NO distortion filters**. The only
treatment is a single flat-colour back copy translated a few viewBox units down-right
behind the main crest — a clean misregister with sharp edges. Quality + fidelity is the
whole point, and the crest is rendered **BOLD** (large/prominent), not a tiny mark.

Geometry is parsed **verbatim** from the source SVG at build time (`_build_crest.py`
reads the source paths/rects directly), so every part is a byte-exact copy of the real
artwork — crown, shield outline, all 5 stripes, the "55", the "KCVV ELEWIJT" band, and
the football + pentagons.

**Palette (locked, retro):** jersey-deep `#008755` · jersey-deep-dark `#133d28` · cream
`#f5f1e6` · ink `#0a0a0a`. Never the source bright green `#3aaa35`.

## The offset

The full crest is duplicated as a **single flat-colour back copy**, translated
`(+6, +6)` viewBox units (down-right, ~1% of the 566.93 viewBox) and rendered **behind**
the main crest — a clean 2-colour misregister. The back copy is one solid colour (it is
NOT a recolored crest): A1's ghost is flat ink, A2's ghost is flat cream. Subtle,
tasteful, sharp.

## Options

| #      | Option                        | Treatment                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1** | **Faithful colours + offset** | Closest to the AI look the owner liked. Shield body + 5 stripes in jersey-deep `#008755` (on-palette but still "the green logo"), the "55" panel + KCVV ELEWIJT band + football base in **cream**, linework + crown + pentagons in **ink**. "55" prints jersey-deep on its cream panel; "KCVV ELEWIJT" prints cream on the jersey band. Offset = flat **ink** ghost. Because the dark linework needs a light ground, it is presented on an inset **cream panel** within the ink footer. |
| **A2** | **Retro 2-tone + offset**     | The same faithful recolor, but the offset back-copy is flat **cream** so the misregister reads as the light plate peeking out on the dark band — the crest sits **directly on the ink footer band** (cream offset + cream panels read on dark). Jersey-deep shield + stripes, cream panels + football base + KCVV ELEWIJT, ink linework + crown + pentagons.                                                                                                                            |

Each option is shown **BOLD** in a realistic `SiteFooter` (ink band + cream "KCVV Elewijt"
wordmark in Fraunces + "Er is maar één plezante compagnie" motto + mono colofon) and on a
cream/ink swatch. Each section carries an ink `harness-head` + a warm `direction-bar`.

## Production-ready transparent assets

- `kcvv-crest-bold-faithful.svg` (A1) — faithful jersey-deep + cream + ink crest with the
  flat **ink** offset baked in as a back layer (transparent ground; designed for a light
  panel).
- `kcvv-crest-bold-retro.svg` (A2) — faithful jersey-deep + cream + ink crest with the
  flat **cream** offset baked in as a back layer (transparent ground; designed for the
  dark band).

> ⚠️ **Production text requirement.** The crest's `"55"` and `"KCVV ELEWIJT"` are LIVE
> `<text>` in `Gotham-Medium` (not a web font). The mockup re-typesets them in **Archivo
> 800** at the original position/size (Archivo is wider than Gotham, so the wordmark is
> sized to fit the band keyline), explicitly filled and verified visible. **For the shipped
> asset these two strings MUST be OUTLINED to `<path>`s from the original `.ai`** — do not
> ship live `<text>` depending on Gotham/Archivo. The offset back-layer also contains live
> ghost copies of both strings; outline those too when exporting. Both asset files carry an
> XML comment recording this.

## Regenerating

```bash
# from this directory — writes compare.html + the two asset SVGs
python3 _gen.py
# from the repo root (Playwright is installed) — writes _verify PNGs
node docs/design/mockups/go-live-hp8-footer-crest/_shoot.mjs
```
