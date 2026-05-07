# Phase 4 · NewsGrid + NewsCard — Locked

**Locked 2026-05-07 across rounds 5, 5b, 5c, 5d, 5e, 5f.**

## Composition

```text
<NewsGrid title="Laatste nieuws" articles={Article[]}>  // takes 1–5 articles
  <SectionHeader> + "Alle berichten →" link
  <div class="grid grid-cols-1 md:grid-cols-2"> // geometry D 50/50
    <NewsCard variant="lead">                     // slot 0, 16:9, rotation a
    <div>                                          // 2x2 right cluster
      <div>                                        // top row
        <NewsCard>                                 // slot 1, 16:9, rotation b
        <NewsCard>                                 // slot 2, 16:9, rotation c
      <div>                                        // bottom row
        <NewsCard>                                 // slot 3, 16:9, rotation d
        <NewsCard>                                 // slot 4, 16:9, rotation a
```

## Locked decisions

| Round | Decision | Rationale |
| --- | --- | --- |
| 5 | **N.2 Broadsheet** with 5 cards (1 lead + 4 supporting) | One dominant lead, no orphan card |
| 5b | **D · 50/50 split** — lead 1fr × 2 rows + 2×2 supporting 1fr | Mobile collapses to 1+2+2 (symmetric) |
| 5c | **C.1 · All 16:9 on /** | text-only retired from homepage scope (coverImage required); aspect prop stays on NewsCard for other surfaces |
| 5d | **T.1 · Slot index rotation cycle** (a/b/c/d/a) | Matches Phase 1 `<TapedCardGrid>` `ROTATION_POOL` |
| 5e | **H.1 · Press-down hover** | Canonical per `feedback_canonical_press_down_hover` |
| 5f | **E.1 · Graceful collapse** | Lead always; supporting fills in order; null at N=0 |

## Data flow

| Variable | Value | Source |
| --- | --- | --- |
| Articles count input | 1–5 | `articles.slice(3, 8)` from `ARTICLES_QUERY` |
| Slice change vs today | `[3..8]` (5) instead of `[3..9]` (6) | one fewer article into the grid |
| Aspect ratio per slot | `landscape-16-9` for all 5 | hard-coded in NewsGrid (NewsCard prop available) |
| Rotation per slot | `[a, b, c, d, a]` cycle by index | hard-coded in NewsGrid |
| Hover behaviour | `hover:translate-x-1 hover:translate-y-1 hover:shadow-none` | NewsCard primitive |
| Click target | Whole card → Link to `/nieuws/{slug}` | NewsCard primitive |
| Empty event slot | Removed | Phase 4 IA E.2 lock — featured event has its own band |
| Featured event prop | Removed | Phase 4 IA E.2 lock |

## Sparse-data behaviour (N = articles count)

```text
N = 0  →  return null (entire section hidden)
N = 1  →  lead-only, full width
N = 2  →  lead 50% + 1 supporting 50% (single row top)
N = 3  →  lead 50% × 2 rows + 2 supporting (top row only)
N = 4  →  lead 50% × 2 rows + 3 supporting (full top row + 1 bottom)
N = 5+ →  lead 50% × 2 rows + 4 supporting (full 2×2)
```

The grid uses CSS Grid auto-flow; supporting slots are conditionally rendered. Implementation
must collapse the 2x2 sub-grid to whichever rows are needed (no empty `<div>` placeholders).

## NewsCard primitive contract

```typescript
interface NewsCardProps {
  /** Article slug → link target /nieuws/{slug} */
  slug: string;
  /** Article title (PortableText with optional accent decorator OR plain string) */
  title: string | PortableTextBlock[];
  /** Lead/excerpt (optional — only the lead card uses this on /) */
  lead?: string;
  /** Article type → renders as <MonoLabel> pill (kicker) */
  articleType: "interview" | "announcement" | "transfer" | "event";
  /** Author display name */
  author?: string;
  /** ISO publish date */
  publishedAt: string;
  /** Cover image (required by article schema) */
  coverImage: { url: string; alt: string };
  /** Visual variant — controls headline size, lead presence, byline detail */
  variant?: "lead" | "standard";  // default "standard"
  /** Aspect ratio of the inner image — defaults to "landscape-16-9" on / */
  aspectRatio?: "landscape-16-9" | "square" | "portrait-3-4";
  /** Rotation slot — pulled from pool, set by parent NewsGrid */
  rotation?: "a" | "b" | "c" | "d" | "none";
}
```

`text-only` aspect variant deliberately not on the API. Master design §9.12 lists 4 aspect
variants — Phase 4 ships 3. Reconsider in a later phase if a use case appears.

## Reuse mandate

NewsCard composes:
- `<TapedCard rotation={rotation}>` — paper card primitive (Phase 1)
- `<TapeStrip>` — tape decoration (Phase 0)
- `<TapedFigure>` — inner image with aspect (Phase 1)
- `<MonoLabel>` — articleType pill (Phase 0)
- `<EditorialHeading level={3}>` — title with optional accent decorator (Phase 1)
- `<EditorialLead>` — lead/excerpt for variant="lead" only (Phase 1)
- `<EditorialByline>` — author + date (Phase 1)

No new primitives introduced for NewsCard. Geometry-level CSS is the only Phase 4 addition.

## VR baseline contract

Per `docs/prd/visual-regression-testing.md` §12, NewsCard is in the Phase 3 Include list. Phase 4
adds:
- New stories per variant: `Article/NewsCard/Default`, `Article/NewsCard/Lead`,
  `Article/NewsCard/SquareAspect`, `Article/NewsCard/PortraitAspect`.
- New stories for NewsGrid sparse states: `Home/NewsGrid/Default5`, `Home/NewsGrid/Sparse4`,
  `Home/NewsGrid/Sparse3`, `Home/NewsGrid/Sparse2`, `Home/NewsGrid/Sparse1`,
  `Home/NewsGrid/Empty` (returns null — captured as a deliberately empty viewport).
- Each new story carries `tags: ["autodocs", "vr"]` and ships baselines in the Phase 4 PR.

## Open questions deferred to implementation

- **Tape strip rotation per slot** — matches TapedCardGrid pool (-1° to -6°, 4–12% inset)? Yes.
- **Section header treatment** — uses Phase 2 `<SectionHeader>` (now wraps `<EditorialHeading>` +
  `<MonoLabelRow>`). No customization needed.
- **Loading skeleton** — covered by `docs/prd/loading-skeleton-consistency.md`; not a Phase 4
  decision.
