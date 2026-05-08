# Phase 4 · `<FeaturedEventBand>` — Locked

**Locked 2026-05-07 across rounds 10, F.1.**
**New component this phase.** Surfaced by Round 3 IA (E.2 — standalone band between hero and NewsGrid).

## Composition

```text
<FeaturedEventBand>                       // server component
  if (event === null) return null;        // drop-if-empty
  <section className="jersey-deep-band">
    <div className="grid 1fr 1.4fr">
      <TapedFigure
        aspect="landscape-16-9"
        rotation="a"
        tape={[{ color: "warm" }]}        // ← new "warm" tape variant per F.1 lock
      >
        <Image src={event.coverImage.url} alt={event.coverImage.alt} fill />
      </TapedFigure>
      <div className="text-block">
        <span className="meta">AANSTAAND EVENEMENT</span>
        <h2><EditorialHeading><span className="accent">{event.title.firstWord}</span> {event.title.rest}</EditorialHeading></h2>
        <span className="when">{formatDateTime(event.dateStart, event.dateEnd)} · {event.location || "Kantine"}</span>
        <a href={event.externalLink?.url ?? `/evenementen/${event.slug}`}>
          {event.externalLink?.label ?? "Meer info →"}
        </a>
      </div>
    </div>
  </section>
```

## Spec

| Aspect | Value |
| --- | --- |
| Section background | `var(--jersey-deep)` |
| Layout | Image left 1fr + text right 1.4fr (desktop); stacks on mobile |
| Image treatment | `<TapedFigure>` polaroid with `tape="warm"` variant (new — see Phase 0 task) |
| Image aspect | `landscape-16-9` |
| Polaroid rotation | `rotation="a"` (-0.5°) |
| Text colour | `var(--cream)` |
| Accent colour | `#f0c264` (warm yellow) on first noun in title |
| Meta line | `AANSTAAND EVENEMENT` (uppercase mono, opacity 0.85) |
| Headline | Event `title` rendered via `<EditorialHeading>` italic with optional accent decorator |
| When line | `formatDateTime(dateStart, dateEnd)` + optional `location` (defaults to "Kantine") |
| CTA copy | `event.externalLink.label` if present, else `"Meer info →"` |
| CTA target | `event.externalLink.url` if present, else `/evenementen/${event.slug}` |
| CTA hover | Canonical press-down |
| Empty state | If 0 future events flagged `featuredOnHome === true`, return null |

## Locked decisions

| Round | Decision | Rationale |
| --- | --- | --- |
| 3 (IA) | **E.2 · Standalone band between hero and NewsGrid** | Surfaces the band; positions it after hero |
| 10 | **L.1 · Image left (TapedFigure) + text right** | Reuses TapedFigure (consistent with NewsCard / EditorialHero cover) |
| F.1 | **Warm/yellow tape variant on jersey-deep sections** | Default jersey-tape green disappears against jersey-deep section bg |

## New `tape="warm"` variant

The default `<TapeStrip>` colour is jersey-tape green (`rgba(31, 95, 63, 0.78)` per Phase 0).
On jersey-deep sections (FeaturedEventBand here, potential others later), the green tape blends
in. Phase 4 introduces a `warm` variant:

- Token: `--tape-warm: rgba(240, 194, 100, 0.85)` (warm yellow at 85% opacity)
- Usage rule: ANY TapedFigure or TapedCard placed on a jersey-deep section background uses
  `tape="warm"`. On cream/cream-soft sections, default `tape="jersey"` stays.
- This is a Phase 0/1 follow-up: extend `<TapeStrip>` and `<TapedFigure>`'s `tape` prop union
  to accept `"warm"`. Add Storybook coverage. Capture VR baselines.

## Data flow

| Field | Source | Notes |
| --- | --- | --- |
| `event` | `EventRepository.findNextFeatured()` (existing) | Returns next future event with `featuredOnHome === true` |
| `title` | Sanity `event.title` (PortableText with optional accent decorator) | Rendered via `<EditorialHeading>` |
| `dateStart` | Sanity `event.dateStart` (datetime) | Required |
| `dateEnd` | Sanity `event.dateEnd` (datetime) | Optional; if present, format as range |
| `coverImage` | Sanity `event.coverImage` | Required for FeaturedEventBand to show — if missing, treat as empty and return null |
| `externalLink` | Sanity `event.externalLink {url, label}` | Optional; falls back to internal `/evenementen/{slug}` |
| `location` | _NOT in schema today_ | Phase 4 hardcodes "Kantine" as default. Future schema field if location varies (Phase 6 events redesign). |

## Reuse mandate

FeaturedEventBand composes:
- `<TapedFigure>` with new `tape="warm"` variant (extends Phase 1)
- `<EditorialHeading>` with accent decorator (Phase 1)
- `<MonoLabel>` (Phase 0) for the meta line
- `<Button variant="primary">` (Phase 2) for the CTA

One new primitive variant introduced (`tape="warm"`); no new primitive components.

## Mobile

- Grid collapses to single column at <880px
- Image moves above text
- TapedFigure rotation preserved

## VR baseline contract

- Story: `Home/FeaturedEventBand/Default` — typical event with all fields
- Story: `Home/FeaturedEventBand/NoExternalLink` — internal `/evenementen/{slug}` fallback CTA
- Story: `Home/FeaturedEventBand/MultiDay` — dateStart + dateEnd both set
- Story: `Home/FeaturedEventBand/Empty` — returns null (deliberately empty viewport)

## Out of scope

- Spotlight section for `featured: true` events (events page, Phase 6)
- Calendar integration (Phase 6 kalender redesign)
- Event location field on schema (Phase 6 — events get richer schema)
