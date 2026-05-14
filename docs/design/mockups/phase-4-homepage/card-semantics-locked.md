# Phase 4.5 · Per-card semantics — Locked (R3)

**Locked 2026-05-14.**
**Source compare page:** `round-r3-card-semantics-comparisons.html`.
**Companion:** `newsgrid-revisit-locked.md` (R2 · 3×2 geometry).
**Owner:** @climacon.

## Decision

**R3.B · Per-articleType backgrounds.** News-card background is
determined by `article.articleType`:

| articleType    | Background                 |
| -------------- | -------------------------- |
| `transfer`     | `jersey-deep` (cream text) |
| `interview`    | `cream` (ink text)         |
| `announcement` | `cream` (ink text)         |
| `event`        | `cream` (ink text)         |

Background is decoupled from slot position. The slot-rhythm cycle
(`cream` / `jersey-deep` / `cream-soft` / `ink` / `cream` / `cream-soft`)
that Phase 4 Round 5b shipped is **retired** for the news grid.

## Rationale

The owner explicitly accepted the brief's proposal over the safer
hybrid (R3.C) and the predictable rhythm (R3.A). The trade-off
acknowledged: visual flatness when the grid is dominated by one type
(all-cream calm periods) and visual heaviness during transfer windows
(4+ jersey-deep tiles).

The semantic signal — "green = transfer" — is the value paid for. Over
time, repeat visitors learn the pattern and can scan the grid by colour
for transfer activity. Editorial intent (brief §6: "variant treatment
per Sanity type is intentional") wins over visual ergonomics here.

## Implementation impact

### `apps/web/src/components/home/NewsGrid/NewsGrid.tsx`

The `SLOT_BGS` constant (lines 33–40) goes away — it's no longer slot-
indexed:

```typescript
// DELETE:
const SLOT_BGS: NewsCardBg[] = [
  "cream",
  "jersey-deep",
  "cream-soft",
  "ink",
  "cream",
];

// REPLACE with a type-indexed lookup at the call site:
const BG_BY_TYPE: Record<ArticleType, NewsCardBg> = {
  transfer: "jersey-deep",
  interview: "cream",
  announcement: "cream",
  event: "cream",
};
```

`renderCard` (lines 42–60) reads `article.articleType` and picks `bg`
from the lookup, defaulting to `cream` when articleType is missing
(legacy articles, drafts, etc.).

### Tape, rotation, and figure-tape stay slot-indexed

These visual decorations remain deterministic per slot for paper-stamp
variety across the 6 cards:

- `SLOT_ROTATIONS` (`a`/`b`/`c`/`d`/`a`/`b`) → unchanged.
- `<TapedFigure>` tape colour per slot (warm vs jersey alternation)
  → unchanged.
- `<TapedCard>` external tape strip colour per slot → unchanged.

So even when 6 cream cards stack in a calm period, the cards are NOT
visually identical: each has its own slot-driven rotation + tape
colour + cover image.

### Data projection

Already in the R1 / R1.5 prerequisite list (`hero-locked.md`,
`hero-flourishes-locked.md`): the `ARTICLES_QUERY` projection needs to
include `articleType` for the hero discriminated union. The news grid
consumes the same field.

```text
articleType                          // required for both
                                     // hero variant + card bg
```

No new query work for R3 specifically.

## Subcategory accents (brief §6 horizontal-stripe meta-panel)

Brief §6 says announcement cards with "jeugd-victory, column"
subcategories get a horizontal-stripe accent on the meta panel below
the photo. **No such field exists on the Sanity article schema today**
(only `articleType` + `featured` boolean). R3 does NOT lock this
accent — it remains open as R7. Decision tree at R7:

- Add a `subcategory` enum to the article schema (migration cost), OR
- Drop the accent entirely, OR
- Redefine the trigger (e.g. all `announcement` types get the accent,
  no subcategory needed).

Until R7 locks, news-card meta panels render without the horizontal-
stripe pattern.

## Card meta row & footer

Unchanged from Phase 4 Round 5b's `<NewsCard>` spec:

- MonoLabel row above the heading: `${variant} · ${date}` (e.g.
  `Transfer · Vr 9 mei`).
- Footer below the cover (when present): date `<time>` + countdown
  (events) + `Lees verder →`.
- Press-down hover: `hover:shadow-none hover:translate-x-1 hover:translate-y-1`.

Per `feedback_canonical_press_down_hover` — no per-card hover variants.

## Risk register (accepted)

Owner accepted these failure modes when choosing R3.B over R3.C:

1. **Calm-period flatness.** When 5–6 of the 6 most-recent non-featured
   articles are interview/announcement/event, the grid renders mostly
   cream tiles. Mitigation: cover images, tape rotation/colour, and
   headline emphasis carry the visual interest. No tonal variety from
   background.
2. **Transfer-window heaviness.** When 3–4 of the 6 cards are
   transfers (winter / summer transfer windows), the grid renders
   heavily jersey-deep. The visual heaviness is the cost of the
   semantic clarity. No mitigation — content drives the layout.
3. **New articleType additions.** If `matchPreview` / `matchRecap`
   land per `#1470`, the `BG_BY_TYPE` lookup must be extended. Default
   to `cream` for any unknown variant; a future round picks the right
   colour at the time `matchPreview` / `matchRecap` ship.

## Storybook & VR

When R3 ships, the NewsGrid Storybook gains two new "scenario" stories:

- `Features/Home/NewsGrid/MonoType` — 6 cards all interview (mostly
  cream stress test).
- `Features/Home/NewsGrid/TransferHeavy` — 4 transfers + 2 others
  (jersey-heavy stress test).

VR baselines for each.

## Tracking

This decision rolls into the implementation issue alongside R2.B
(NewsGrid 3×2 geometry). No standalone implementation issue needed.
