# `<EditorialHero variant="transfer">` — locked design (Phase 3, Checkpoint B)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.B.2 (variants).
**Mockup:** `option-a-transfer-detail.html` + screenshots `screenshots/detail-transfer-{full,option-a,option-b,matrix,mobile}.png`.
**Field availability sheet:** `fields.md`.

## Scope

Detail-page hero for `/nieuws/[slug]` when `articleType === "transfer"`. Reuses the locked Asymmetric Broadsheet shell + the same five slots locked on announcement (kicker / heading / lead / byline / cover image). Variant-specific narrative — the transferFact's van → naar story — sits as a separate `<TransferFactStrip>` BELOW the hero. The optional pull-quote uses the existing `<PullQuote tone="jersey">` primitive between strip and body.

## Composition

```text
┌──────────────────────────────────────────────┬───────────────────────────┐
│  EditorialKicker                              │                           │
│  EditorialHeading (PT-aware, accent)          │   HeroCoverImage          │
│  EditorialLead                                │   (TapedCard rotation A   │
│  EditorialByline                              │    + 16:9 image)          │
└──────────────────────────────────────────────┴───────────────────────────┘
                                            ↓
                             <TransferFactStrip transferFact={firstTransferFact} />
                                  3 paper cards + arrows · per-direction shape
                                            ↓
                             <PullQuote tone="jersey"> (when transferFact.note set)
                                            ↓
                             article body (--container-prose)
                             — additional transferFacts render as compact overview
                                rows here, NOT in the hero
```

**Shell + slot list = identical to announcement.** No fork. The transfer-specific design lives in:

- The TransferFactStrip below the hero
- The optional PullQuote between strip and body

## TransferFactStrip — direction matrix

The strip morphs by `transferFact.direction`:

### Incoming (`direction: "incoming"`)

3 paper cards in a row, jersey-deep arrows between:

```text
[FROM-CLUB card · rot-a]   →   [PLAYER card · rot-b · cream-soft]   →   [KCVV card · rot-c]
   shield (other club logo)        ★ Speler ★                              shield (KCVV crest)
   VAN                              Player Name                             NAAR
   Other Club Name                  Position · Age                          KCVV Elewijt
   otherClubContext                 (dashed perforation bottom)             kcvvContext
```

- Each card composes `<TapedCard>` at a different rotation from the pool (`-1.2°` / `+0.6°` / `+1.2°`).
- Each card has its own tape strip — green at corners on side cards, ochre centered on the player card.
- Arrows: italic Playfair Display `→`, jersey-deep, 64px, between the cards.
- Player card distinguished by:
  - `background: var(--color-cream-soft)` (subtle tint difference)
  - Star sandwich kicker `★ Speler ★`
  - Dashed perforation along the bottom (ticket-stub feel)
  - Slightly wider `max-width: 360px`

### Outgoing (`direction: "outgoing"`)

Identical 3-card structure as incoming, with KCVV on the from-side and the destination club on the to-side. **Arrows swap to `var(--color-alert)` (`#b84a3a`)** — the editorial cue: green = good news (player joins), alert-red = bittersweet (player leaves). Same italic `→` glyph, same size, same position; only the colour shifts.

```css
.transfer-strip--outgoing .transfer-strip__arrow {
  color: var(--color-alert);
}
```

### Extension (`direction: "extension"`)

**Single centered card**, no arrows, no journey. The semantic is "player STAYS at KCVV; only the contract gets longer" — there's no movement to narrate.

```text
              [PLAYER card · rot-b · cream-soft · max-width 440px]
                  shield (KCVV crest)
                  ★ Verlengd ★
                  Player Name (display italic 900)
                  Position · Age · KCVV team / number
                  ┌────────────────────┐
                  │  tot               │   ← jersey-deep outline stamp
                  │  2027 — 28         │      slight rotation, cream-soft bg
                  └────────────────────┘
```

The `tot 2027 — 28` extension stamp uses `transferFact.until` directly. No arrows, no ink-shield, no other-club meta — extension never has any of those.

## Mobile (`max-width: 720px`)

- Strip flips to vertical layout: `flex-direction: column`.
- Cards stack top-to-bottom, max-width 320px, slight rotations preserved (smaller magnitudes).
- **Arrow span swaps glyph by viewport** — desktop renders inline italic `→`; mobile renders an inline SVG down-arrow (vertical stroke + arrowhead, jersey-deep stroke / alert-red on outgoing). No rotation hack — the down-arrow is its own SVG path, not a rotated `→`.
- Extension stays a single centered card on mobile (no arrows to swap).

```html
<span class="transfer-strip__arrow">
  <span class="transfer-strip__arrow--horizontal">→</span>
  <span class="transfer-strip__arrow--vertical">
    <svg viewBox="0 0 28 38">
      <path d="M14 4 L14 32 M5 23 L14 33 L23 23" />
    </svg>
  </span>
</span>
```

CSS toggles which child renders by viewport. SVG inherits `currentColor` so it picks up jersey-deep or alert-red automatically.

## Pull-quote (Option B — chosen)

When `transferFact.note` is set, render the existing `<PullQuote tone="jersey">` design-system primitive between the TransferFactStrip and the body's first paragraph:

```html
<PullQuote
  tone="jersey"
  attribution={{
    name: transferFact.noteAttribution ?? transferFact.playerName,
  }}
>
  {transferFact.note}
</PullQuote>
```

**Why B (not in-hero):** Option B reuses an existing primitive verbatim, keeps the hero shape identical to announcement (no per-variant divergence), and gives the quote its own paper-card moment with proper typographic weight. Option A (in-hero quote) was rejected as it forks the hero composition.

When `transferFact.note` is empty, no PullQuote renders — body flows directly from strip to first paragraph.

## Component composition — reuse + new

**Existing primitives reused verbatim** (continued from announcement-locked):

| Primitive                        | Use                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `<TapedCard>`                    | Each of the 3 cards in TransferFactStrip composes TapedCard with a different rotation prop |
| `<TapedFigure>`                  | Wraps the cover image in HeroCoverImage at `aspect="landscape-16-9"`                       |
| `<MonoLabel>` / `<MonoLabelRow>` | Kicker, role labels, sub-meta in cards                                                     |
| `<EditorialHeading>`             | Hero headline (PT-aware post-Ask-9)                                                        |
| `<DropCapParagraph>`             | First body paragraph (article body, not hero-side)                                         |
| `<PullQuote tone="jersey">`      | The transferFact.note treatment between strip and body                                     |

**New shared sub-components** (continued — same set as announcement):

- `<EditorialHero>` (top-level) · `<EditorialHeroShell>` · `<EditorialKicker>` · `<EditorialLead>` · `<EditorialByline>` · `<HeroCoverImage>` — all locked with announcement.

**New variant-specific component:**

| Component             | Path                                                        | Purpose                                                                                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<TransferFactStrip>` | `apps/web/src/components/article/blocks/TransferFactStrip/` | Renders the 3-card direction-aware strip beneath the hero. Takes a `TransferFact` prop, internally branches on `direction`. Storybook stories: `incoming` / `outgoing` / `extension` / `mobile` (each viewport) — VR-tagged. |

The strip is an **article body block**, not a design-system primitive — same dir pattern as the existing `EventFact`, `TransferFact` blocks. It's variant-specific by definition; not reused outside transfer.

When matchPreview / matchRecap land via #1470, they'll need a sibling `<MatchFactStrip>` at the same path — design will draw on TransferFactStrip's vocabulary (3-card row · arrows · mobile vertical stack) but with match-specific cells (opponent shield · kickoff/score · KCVV).

## Field-source map

| UI element                     | Source                                                              | Notes                                                              |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Kicker · "TRANSFER"            | static label keyed off `articleType==='transfer'`                   | EditorialKicker constant                                           |
| Kicker · reading time          | `computeReadingTime(article.body)`                                  | Hides when undefined                                               |
| Kicker · date                  | `formatDate(article.publishedAt)`                                   | Format "DD MMM YYYY"                                               |
| Headline                       | `article.title` (PT, post-Ask-9)                                    | Renders accent decorator as italic + jersey-deep                   |
| Lead                           | `article.lead` (post-Ask-1) → fallback to `body[0]` first paragraph | Italic display                                                     |
| Byline                         | `article.author ?? "Door redactie"`                                 | Default stub                                                       |
| Hero cover image               | `article.coverImage` @ 16:9 (post-Ask-8 required)                   | Editor-curated; usually a player face shot or a clubhouse photo    |
| Strip · player kicker          | `★ Speler ★` static                                                 | Same across all directions                                         |
| Strip · player name            | `transferFact.playerName` (string)                                  | Display italic 900                                                 |
| Strip · player meta            | `transferFact.position` + `transferFact.age`                        | "Middenvelder · 23 j."                                             |
| Strip · KCVV side · role       | static "Van" / "Naar" / "Verlengd" by direction                     | Mono jersey-deep                                                   |
| Strip · KCVV side · club name  | static "KCVV Elewijt"                                               | Display italic                                                     |
| Strip · KCVV side · sub        | `transferFact.kcvvContext`                                          | Mono caps muted                                                    |
| Strip · other side · role      | static "Van" / "Naar" by direction                                  | Mono jersey-deep                                                   |
| Strip · other side · club name | `transferFact.otherClubName`                                        | Display italic                                                     |
| Strip · other side · sub       | `transferFact.otherClubContext`                                     | Mono caps muted                                                    |
| Strip · shield (other club)    | `transferFact.otherClubLogo` (image) → fallback to text initial     | Shield clip-path; ink fill when text fallback                      |
| Strip · shield (KCVV)          | static KCVV crest mark "K"                                          | Shield clip-path; jersey-deep fill                                 |
| Strip · arrows                 | static "→" glyph; colour by `direction`                             | jersey-deep (incoming) / alert-red (outgoing) / hidden (extension) |
| Strip · extension stamp        | "tot " + `transferFact.until`                                       | Jersey-deep outline pill, mono caps                                |
| Pull-quote body                | `transferFact.note` (≤ 140 char)                                    | `<PullQuote tone="jersey">`                                        |
| Pull-quote attribution         | `transferFact.noteAttribution ?? transferFact.playerName`           | PullQuote attribution prop                                         |

## API (target shape post-Ask-8 + Ask-9 migrations)

```typescript
type EditorialHeroTransferProps = {
  variant: "transfer";
  placement?: "detail" | "homepage"; // default "detail"
  article: {
    title: PortableTextBlock[];
    lead?: string;
    body: PortableTextBlock[];
    publishedAt: string;
    coverImage: { url: string; hotspot?: { x: number; y: number } };
    author?: string;
  };
  // First transferFact in body, hoisted by the page-level Server Component
  // before passing into EditorialHero. Source: `article.body[].find(b => b._type === 'transferFact')`.
  transferFact: TransferFact;
};
```

## Schema dependencies (BLOCKING)

Inherits all 5 from announcement-locked, plus the transferFact body validator (Ask 6) — already enumerated in `fields.md`:

1. `article.lead` field added (Ask 1).
2. `articleType=event` body validator (Ask 6).
3. **`articleType=transfer` body validator (Ask 6)** — `articleType=transfer` requires ≥1 `transferFact` block in body. Hero has nothing to render without it.
4. `article.coverImage` becomes required (Ask 8).
5. `article.title` → constrained Portable Text + `accent` decorator (Ask 9).

## Approval checklist

- [x] Asymmetric Broadsheet shell (locked direction A).
- [x] Detail placement — no click-through CTAs.
- [x] coverImage in right column (same as announcement).
- [x] EditorialKicker · EditorialHeading · EditorialLead · EditorialByline · HeroCoverImage all reused from announcement-locked.
- [x] TransferFactStrip — 3 paper cards + jersey-deep arrows for incoming.
- [x] Outgoing — alert-red arrows.
- [x] Extension — single centered card with extension stamp; no arrows.
- [x] Mobile — vertical stack + SVG down-arrow (no rotation hack).
- [x] PullQuote tone="jersey" between strip and body for `transferFact.note` (Option B chosen).
- [x] Multiple transferFacts: first powers hero+strip; rest render as compact overview rows in body (designed in 3.B.2 implementation, not hero-side).
- [x] Component path: `apps/web/src/components/article/blocks/TransferFactStrip/`.
- [x] All 5 schema migrations + transferFact body validator captured for the issue split.

## Homepage placement (`placement="homepage"`)

Locked 2026-05-05 — see `option-a-homepage-placement-comparisons.html` (P3 picked from P1/P2/P3 drill).

When the EditorialHero renders as a featured-article teaser at the top of the homepage's news section, the shell + slots above stay **identical to the detail-page composition**. One extension: **whole-card click**.

- The entire hero is wrapped as a link to `/nieuws/{article.slug}`.
- **At rest**: identical to the detail-page hero — kicker, heading, lead, byline, right-column artefact unchanged. No CTA text, no extra band, no inline read-more affordance.
- **On hover**: card press-ups (`transform: translate(-2px, -2px)` + box-shadow grown by ~4px) — the natural inverse of the canonical press-down hover used on paper-stamped primitives. A small `★ Lees verder →` hint fades in at the bottom-right.
- **Body content does not render in homepage placement.** The TransferFactStrip is article-detail-only.
- **Touch-device note**: no hover means the press-up + hint never trigger. The whole card is clickable; native touch tap navigates. Acceptable starting point; revisit with a persistent foot-line hint if analytics show click-through underperforms.
- **`<EditorialHero>` discriminated union**: `placement?: "detail" | "homepage"` (default `"detail"`). `"homepage"` triggers the `<a>` wrap + press-up styling + body content suppression in the Server Component.
