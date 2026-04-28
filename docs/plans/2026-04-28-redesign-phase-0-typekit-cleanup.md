# Phase 0 — Adobe Typekit Cleanup

**Date performed:** _to be filled when the owner edits the Typekit kit_
**Performed by:** _owner (Adobe portal)_

## Removed

- Stenciletta — all weights

## Confirmed remaining

- Quasimoda — all current weights
- Freight Display Pro — 400 italic, 600, 700, 700 italic, 900
- Freight Big Pro — 700, 900

## Verification

- Storybook `Foundation/Typography` story renders Freight Display, not Georgia fallback.
- Production Storybook deployment loads kit without 404 for any font URL.

## Code-side state in this PR

- No `globals.css` changes required for the Typekit kit retirement; the Adobe portal owns the kit content.
- Legacy `--font-family-alt` token in `apps/web/src/app/globals.css` (line ~141, the `stenciletta` font stack) is left in place per the dual-coexistence policy. Components that consume Stenciletta will fall back to the system serif when the kit no longer serves it; those components are scheduled for redesign in their own phase. If any visually-critical component (nav header, hero) breaks visibly, file a follow-up to reinstate Stenciletta or move that component's redesign forward.

## References

- `docs/plans/2026-04-27-redesign-master-design.md` §3.3 (Typography roles)
- `docs/prd/redesign-phase-0.md` §4 (Adobe Typekit changes)
