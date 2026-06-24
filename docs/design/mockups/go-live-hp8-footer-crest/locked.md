# HP-8 — Footer crest — LOCKED

**Issue:** #2236 (HP-8) · go-live-ux-polish
**Locked:** 2026-06-24 by @climacon

## Decision

Use the owner-provided **retro crest** (faithful KCVV crest + subtle paper-grain),
as a **two-variant raster set**, picked by background:

| Asset                                                     | Use on                                               |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `apps/web/public/images/logos/kcvv-crest-retro.png`       | **cream / light** grounds (interior transparent)     |
| `apps/web/public/images/logos/kcvv-crest-retro-cream.png` | **non-cream / dark** grounds (interior cream-filled) |

The SiteFooter band is **ink**, so the footer uses **`kcvv-crest-retro-cream.png`**.
(Verified: the cream-filled variant reads cleanly on `#0a0a0a`; the transparent-interior
variant goes dark-on-dark on ink, hence the split.)

## Notes

- **Raster** (2048²). Text ("55", "KCVV ELEWIJT") is baked into the image → **no Gotham
  font dependency and no outlining step** (unlike the abandoned SVG route). 2048² is ample
  for a footer mark (displayed ~80–160px); scale **down** only, don't blow it up large.
- Source vector still in repo at `apps/web/public/images/logos/kcvv-crest.svg` if a
  crisp/large/recolourable version is ever needed.

## Supersedes (exploration — not used)

- The screenprint treatments (halftone/grain/misregister) — owner found them lower quality.
- The bold-vector A1/A2 recolors (`kcvv-crest-bold-faithful.svg` / `kcvv-crest-bold-retro.svg`)
  and the earlier AI raster (`kcvv-crest-ai*.{jpeg,png}`).

## Implementation (#2236)

Wire `kcvv-crest-retro-cream.png` into `apps/web/src/components/layout/SiteFooter/SiteFooter.tsx`
as a flourish near the "KCVV Elewijt" wordmark + "Er is maar één plezante compagnie" motto.
