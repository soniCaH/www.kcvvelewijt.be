# `<PlayerFigure>` — locked design (Phase 3, Checkpoint A)

**Status:** awaiting owner sign-off.
**Issue:** #1525 · sub-issue 3.A.1.
**Master design:** `docs/plans/2026-04-27-redesign-master-design.md` §4.4 / §5.3 (to be revised — see "Master design deltas" below).

## States

PlayerFigure renders one of two **mutually-exclusive** compositions, never combined:

| State            | When                            | Composition                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Photo**        | `psdImage` is set on the player | Polaroid TapedCard wrapping the rectangular `psdImage`, surrounded by editorial chrome.                                                                                                                                                                          |
| **Illustration** | `psdImage` is missing           | A single canonical drawn figure (jersey-deep block silhouette + ink overprint outline + V-collar + vertical stripes) on a desaturated grey panel inside a polaroid TapedCard. **Identical across all options** — there is no per-direction illustration variant. |

The illustration state never embeds a photo well; the photo state never wraps a drawn jersey/arm illustration. Hybrid combinations are explicitly rejected ("Mickey Mouse" — `feedback_playerfigure_no_hybrid`).

## Photo-state composition

Direction: **Option A — Photobooth Strip** (`option-a-photobooth-strip.html`, photo-state section).

```text
TapedCard (polaroid)
  ├─ <img src={psdImage} />               ← rectangular, no surrounding illustration
  └─ caption strip: "★ KCVV ELEWIJT · SEIZOEN 25–26"   ← static club chrome

Side meta column:
  ├─ <MonoLabel> {position}              ← uppercase via CSS
  ├─ name: {firstName} <em>{lastName}</em>
  ├─ #{jerseyNumber}                     ← optional, drop if not set
  ├─ short bio paragraph (italic)        ← optional, first paragraph of player.bio; drop if empty
  ├─ {tag?}                              ← page-supplied prop (e.g. "SPELER VAN DE WEEK", "NIEUW")
  └─ {teamLabel?}                         ← page-supplied prop (e.g. "A-PLOEG")
```

**Not in PlayerFigure:**

- ❌ TicketStub ("STAMNR. 55") — moved out; lives separately on hero compositions if needed (see master design delta below).
- ❌ Pull-quote — quotes belong to `<PullQuote>` (Phase 1 primitive) as a sibling. Never inside PlayerFigure.

Reference renders:

- `screenshots/compare-playerfigure-revised-photo.png` (column A)
- `screenshots/compare-playerfigure-revised-photo-tight.png` (column A)

## Illustration-state composition (canonical, shared across A/B/C)

The illustration replaces the **photo well only**. The surrounding meta column (position, name, jerseyNumber, bio, tag, teamLabel) renders identically to the photo state — players without a `psdImage` are not second-class.

```text
TapedCard (polaroid, slight rotation, jersey-deep tape strip at top edge — cream tape on cream-soft has no contrast in the design-system token set; jersey is the canonical Phase 3 visible tape colour, decided during #1633 visual review)
  ├─ Inner panel — desaturated grey rectangle (option-b's .figure__photo gradient, no real photo)
  ├─ jersey-deep block silhouette (head ellipse + curved torso + shoulder stripe blocks)
  ├─ ink overprint outline shifted 2-3px (head ellipse + torso + V-collar + 4 vertical stripes)
  └─ caption strip: <b>#{jerseyNumber}</b> {firstName} {lastName} · {teamLabel?}

Side meta column (SAME as photo state):
  ├─ <MonoLabel> {position}
  ├─ name: {firstName} <em>{lastName}</em>
  ├─ #{jerseyNumber}
  ├─ short bio paragraph (italic), drop if empty
  ├─ {tag?}
  └─ {teamLabel?}
```

**Head:** the body's own ellipse-head reads through. **No** face-circle accent (grey-gradient, dark-green, or any other overlay) — owner-confirmed 2026-05-04.

Reference render:

- `screenshots/compare-playerfigure-revised-illustration.png` (any column — all three are identical).

Source SVG/CSS lives in `option-b-stamped-block-print.html` `#player-figure` (lines 720-756, photo + face-circle layers omitted in the canonical illustration). When `<PlayerFigure>` is implemented, the illustration is shipped as a fixed SVG asset / component — not parameterised.

## Component API (TypeScript shape)

```typescript
type PlayerFigureProps = {
  player: Pick<
    Player,
    | "firstName"
    | "lastName"
    | "position"
    | "positionPsd"
    | "jerseyNumber"
    | "psdImage"
    | "bio"
  >;
  /** Optional context tag (e.g. "SPELER VAN DE WEEK", "NIEUW"). Renders as a MonoLabel. */
  tag?: string | { text: string; tone: "default" | "jersey" | "ink" };
  /** Optional team label (e.g. "A-PLOEG"). Calling page derives it from team references. */
  teamLabel?: string;
  /** Photo crop variant. */
  crop?: "default" | "tight";
};
```

The component picks photo vs illustration internally based on `player.psdImage`. Bio rendering takes the first paragraph only (truncate at ~120 chars or 2 lines).

## Field source mapping (verified against `packages/sanity-schemas/src/player.ts`)

| UI element                               | Source                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `psdImage`                               | PSD-synced image field                                                                  |
| firstName, lastName                      | PSD-synced                                                                              |
| position                                 | editorial `position` field (sentence-case, uppercased via CSS) — fallback `positionPsd` |
| jerseyNumber                             | editorial number field                                                                  |
| short bio line                           | first paragraph of `bio` (block content); empty → drop                                  |
| caption "★ KCVV ELEWIJT · SEIZOEN 25–26" | static club chrome                                                                      |
| `tag`                                    | page prop                                                                               |
| `teamLabel`                              | page prop (derived by caller from team references)                                      |

## Master design deltas (to fold into the phase 3 PRD)

1. §4.4 PlayerFigure spec — replace "illustrated jersey + arms with photo-fillable circular face" with "two mutually-exclusive states: photo (polaroid) or canonical illustration (no hybrid)."
2. §5.3 player profile — `<PlayerFigure>` no longer contains `<TicketStub>`. The hero composition can place `<TicketStub>` as a sibling next to `<PlayerFigure>` if the page wants it.

## Approval checklist

- [ ] Two states, never hybrid (photo OR illustration, picked at runtime).
- [ ] Photo-state direction: Option A polaroid.
- [ ] Photo-state composition: polaroid + image + caption + position + name + jerseyNumber + bio + (optional) tag + (optional) teamLabel. **No TicketStub. No quote.**
- [ ] Illustration-state: canonical block-print figure + ellipse head (no face-circle accent), shared across all options. Side meta column matches photo state.
- [ ] Position rendered uppercase via CSS, source field stays sentence-case.
- [ ] Bio is first paragraph of `player.bio`, dropped if empty.
- [ ] `teamLabel` and `tag` are page-supplied props, not derived inside the component.
- [ ] Master design §4.4 / §5.3 deltas captured for the phase 3 PRD.

When you sign off, reply in chat (or tick the boxes here) and the next figure (JerseyShirt) goes under the same drill-down.
