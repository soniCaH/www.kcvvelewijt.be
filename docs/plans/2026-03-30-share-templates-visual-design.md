# Share Templates — Visual Design

**Date:** 2026-03-30
**Branch:** `feat/issue-920`
**Implementation issues:** #921 (wiring), #922 (image capture / share flow)

## Context

Nine Instagram Story templates (1080 × 1920 px) are pre-built as React components and
captured server-side as PNG via `html-to-image`. This document records the approved
visual design so that #921 and #922 can implement the wiring and capture without reopening
design questions.

## Approved Design — "TornLeft" (Round 5)

After five rounds of exploration the approved pattern is `Round5_TornLeft`. All 9
production templates apply this pattern with event-appropriate variants.

### Core anatomy

```text
┌──────────────────────────────────────────┐  ← 1080 px wide
│  [KCVV logo]             [@kcvvelewijt]  │  top:60 left/right:80
│                                          │
│  ← UPPER ZONE (varies by template) →    │  ~top 40% of canvas
│    photo / score hero / card shape       │
│                                          │
│──── torn paper edge ─────────────────── │  ~y 730–790 px (38–41%)
│  ████████████████████████████████████   │
│  ████ DARK GREEN ZONE (#008755) ███████  │  lower 60%
│  ████████████████████████████████████   │
│  [event info — label + name + minute]   │  ~top:940
│  [stats row — Nr. | divider | Stand]    │  ~top:1290
│  [match name section]                   │  ~top:1590
│  [KCVV logo]  kcvvelewijt.be            │  bottom:60
└──────────────────────────────────────────┘
```

### Torn boundary

The torn-paper effect is a CSS `clip-path: polygon(...)` with 3 % oscillation at 38–41 %
of canvas height. The same polygon is used by all 9 templates:

```text
polygon(
  0% 40%, 2% 38%, 5% 41%, 8% 38%, 11% 41%, 14% 38%,
  …(every 3% across the full width)…
  98% 38%, 100% 40%, 100% 100%, 0% 100%
)
```

Three bright-green (`#4acf52`) accent lines flank the tear at approximately y 698, 715, 792 px.

### Typography

| Token | Stack                                                    | Usage                     |
| ----- | -------------------------------------------------------- | ------------------------- |
| TITLE | `quasimoda, acumin-pro, Montserrat, Verdana, sans-serif` | headlines, shirt numbers  |
| BODY  | `montserrat, "Helvetica Neue", Arial, sans-serif`        | labels, metadata, UI text |

Both are typed as `React.CSSProperties["fontFamily"]`.

### Colour palette

| Token        | Value     | Usage                            |
| ------------ | --------- | -------------------------------- |
| Canvas bg    | `#121a14` | root background                  |
| Green zone   | `#008755` | torn lower zone (win / default)  |
| Bright green | `#4acf52` | accent lines, labels, score text |
| Red (card)   | `#dc2626` | red-card templates               |
| Amber (card) | `#f59e0b` | yellow-card templates            |
| Draw zone    | `#3a3a3a` | FullTimeTemplate mood=draw       |
| Loss zone    | `#5a1a1a` | FullTimeTemplate mood=loss       |

### Canvas constants

All root elements must read dimensions from `constants.ts`:

```typescript
import { CAPTURE_WIDTH, CAPTURE_HEIGHT } from "../constants";
// CAPTURE_WIDTH = 1080, CAPTURE_HEIGHT = 1920
```

## Templates

### 1. GoalKcvvTemplate

**Props:** `playerName`, `shirtNumber`, `score`, `matchName`, `minute`, `celebrationImageUrl?`

Upper zone: full-bleed photo (right-biased `objectPosition: "70% top"`) with left-side
darkening gradient so the left-aligned headline stays readable. No-photo fallback uses a
dark radial gradient + KCVV pattern + ghost shirt number.

Headline: `"GOAL!"` TITLE 900 260 px, `top: 635 px left: 80 px`, straddles the torn boundary.

Green zone info:

- "Doelpunt" label → `playerName` 74 px → `minute`' Minuten 40 px
- Stats row: Nr. + shirt number 160 px | divider | Stand + score 110 px `#4acf52`
- Match section at `top: 1590 px`

### 2. GoalOpponentTemplate

**Props:** `score`, `matchName`, `minute`

Muted variant — good for opponent goals that need acknowledging without celebration energy.
Canvas background `#0d1810`, green zone `#162418` (very dark). Accent lines at 10 %
opacity, no glow. Headline `"GOAL"` at `rgba(255,255,255,0.35)`.

### 3. KickoffTemplate

**Props:** `matchName`

Upper zone: KCVV logo (280 px) upper-right as hero graphic.
Two-line headline: `"KICK-"` at `top: 460 px` and `"OFF"` at `top: 648 px`, both 235 px.
Green zone: team names parsed from `matchName.split("—")`.

### 4. HalftimeTemplate

**Props:** `matchName`, `score`

Upper zone: score (340 px TITLE) as hero at `top: 220 px`.
Headline: `"RUST"` 300 px at `top: 596 px`, straddles torn boundary.
Green zone: team names.

### 5. FullTimeTemplate

**Props:** `matchName`, `score`, `mood: "win" | "draw" | "loss"`

Mood drives three values via the `MOOD` config object:

| mood   | zone      | accent    | headline     | headlineSize |
| ------ | --------- | --------- | ------------ | ------------ |
| `win`  | `#008755` | `#4acf52` | `GEWONNEN!`  | 148 px       |
| `draw` | `#3a3a3a` | `#909090` | `GELIJKSPEL` | 128 px       |
| `loss` | `#5a1a1a` | `#e05555` | `VERLOREN`   | 158 px       |

Upper zone: score (380 px) as hero.
Green zone: "Eindstand" label + home team + VS + away team.

### 6. RedCardKcvvTemplate

**Props:** `playerName`, `shirtNumber`, `matchName`, `minute`

Upper zone: tilted red card shape (`210 × 295 px`, `rotate(9deg)`, `#dc2626`) upper-right + red radial glow.
Headline: `"ROOD!"` 245 px. Accent color: `#dc2626`.
Green zone: "Rode kaart" label + playerName + minute + shirt number.

### 7. RedCardOpponentTemplate

**Props:** `matchName`, `minute`

Same red card shape. Accent color: `#4acf52` (green — good news for KCVV).
Green zone: "Tegenstander" label + "Rode kaart" text + minute.

### 8. YellowCardKcvvTemplate

**Props:** `playerName`, `shirtNumber`, `matchName`, `minute`

Amber card shape (`#f59e0b`), amber radial glow. Headline: `"GEEL!"` 245 px.

### 9. YellowCardOpponentTemplate

**Props:** `matchName`, `minute`

Amber card shape. Accent: `#4acf52` (green — contextually good).
Green zone: "Tegenstander" + "Gele kaart" + minute.

## Storybook

All exploration rounds live under `Features/Share/_DesignExploration` for reference.
Each production template has its own stories file under `Features/Share/<TemplateName>`.

## Implementation notes for #921 / #922

- `matchName` must use `"—"` (U+2014 em dash) as the team separator — the components
  split on this character to display home/away separately.
- `CAPTURE_WIDTH` and `CAPTURE_HEIGHT` from `constants.ts` are the authoritative canvas
  dimensions — the capture library must use these exact values.
- The `FullTimeMood` type is exported from `FullTimeTemplate.tsx` — import it rather than
  re-declaring the union.
- The `celebrationImageUrl` on `GoalKcvvTemplate` is optional; when absent the no-photo
  fallback renders without crashing.
