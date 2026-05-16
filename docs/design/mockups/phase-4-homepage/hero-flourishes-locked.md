# Phase 4.5 · Hero per-articleType flourishes — Locked (R1.5)

**Locked 2026-05-13. Implemented #1749 (2026-05-16).**
**Supersedes:** open follow-up listed in `hero-locked.md` §R1.5.

## Implementation notes (#1749)

- `<EditorialHero>` discriminated union extended per variant with the
  structured data needed for kicker + below-H1 + cover-overlay +
  below-hero rendering:
  - `announcement` → `{ category?, date? }`
  - `interview` → `{ subjects?, date? }`
  - `event` → `{ feature?, date? }`
  - `transfer` → `{ feature?, date? }`
- Five new co-located sub-components in
  `apps/web/src/components/article/EditorialHero/_variant-parts.tsx`:
  `HeroCreditChip`, `HeroDayBlockOverlay`,
  `HeroCompressedEventStrip`, `HeroTransferDirChip`,
  `HeroTransferMetaLine`. Each is tightly coupled to the hero and
  doesn't merit a top-level design-system surface.
- `<TapedFigure>` gained an additive `aspect="landscape-3-2"` value
  for the Interview + Transfer covers (3:2 was already in the lock;
  the primitive just didn't expose it yet).
- The legacy `kicker?: EditorialKickerProps["items"]` prop on
  `<EditorialHero>` is retired — kicker is derived per variant from
  `category` / `subjects` / `feature` + `date`. `HomepageHeroArticle`
  (the carousel input shape) migrated to a discriminated union per
  variant with the same fields. `page.tsx::toHeroCarouselArticle`
  populates each branch.
- The Transfer kicker carries a JSX dirChip (`↓ Inkomend` / `↑ Uitgaand`
  / `↻ Verlengd`) that doesn't fit `<EditorialKicker>`'s plain-label
  items API, so the Transfer variant renders its kicker row manually
  (`renderTransferEditorial`). The chip wraps `resolveTransfer()` so
  the direction enum drives the glyph + Dutch label deterministically.
  **Source compare pages:**

- `round-r1-5-hero-flourishes-comparisons.html` (initial overlay-first proposal — rejected as a set)
- `round-r1-5b-hero-flourishes-hybrid-comparisons.html` (hybrid baseline — Announcement approved)
- `round-r1-5c-hero-iterations-comparisons.html` (Interview / Event / Transfer iterations)

**Owner:** @climacon.

## Shared base (locked)

Every variant on the homepage hero renders inside the same shell:

- 50/50 column split (copy left, photo right). Centered vertically.
- Kicker row: `MonoLabel` pill (variant name) + meta dots in italic-mono.
- H1: `EditorialHeading level={1}` italic serif with optional jersey-deep
  `accent` decorator on emphasis spans. Size `display-xl` at hero scale.
- Optional `EditorialLead` paragraph.
- `Lees verder →` mono-uppercase link in jersey-deep.
- `EditorialByline` row (mono-uppercase, opacity 0.6). The detail page omits
  byline because the metadata bar carries author/date; the homepage hero has
  no metadata bar, so byline stays.
- Right column: single landscape `<TapedFigure>` (3:2 or 16:9 per variant)
  with warm + jersey tape strips. Caption line below the photo (italic, opacity 0.65).

**Image constraint:** all hero photos are LANDSCAPE — `article.coverImage`
is uploaded in landscape orientation only (owner constraint 2026-05-13).
Per-variant aspect ratios:

| Variant      | Aspect | Notes                                                 |
| ------------ | ------ | ----------------------------------------------------- |
| Interview    | 3:2    | Article cover (can be a group shot for multi-subject) |
| Announcement | 16:9   | Clean cover, no overlays                              |
| Event        | 16:9   | Cover + day-block overlay (signature)                 |
| Transfer     | 3:2    | Article cover (player action shot, not portrait crop) |

Person photos (`player.psdImage` / `transparentImage`) are separate from the
hero image and only appear as ~16px inline credit thumbnails on the
Interview variant. Never as the hero focal point.

## Variant locks

### Announcement (R1.5b approved)

- Kicker: `Aankondiging · ${category} · ${date}` (`category` from `article.tags[0]` when present).
- Clean 16:9 cover, no overlays (matches detail-hero §5.1 "no overlay,
  no shadow" philosophy).
- Date stays in kicker — no date stamp on photo.
- Byline retained for homepage placement.

### Interview (R1.5c · IV.3)

- Kicker: `Interview` pill + optional `#${jerseyNumber} · ${POSITION}` for
  N=1 player subjects (port from `InterviewHero` `buildKickerParts`) + date.
- H1: article title (italic serif with optional accent).
- **Credit chips row** below H1: one `person-credit` chip per interviewee,
  each carrying a 16px square `player.psdImage` thumbnail (or coloured
  initial block fallback) left of the name. Uses subject resolution via
  `resolveSubject()` ported from detail.
- Single landscape `<TapedFigure>` (3:2) on the right.
- Multi-subject (N≥2) uses the same composition; each subject becomes a
  chip. Hero photo is the article's group cover image. No 4-up portrait
  grid on the homepage (detail-page concern only).

### Event (R1.5c · EV.3)

- Kicker: `Event | ${ageGroup || competitionTag}` (ported from `EventHero`).
- H1: article title.
- Hero stays minimal — no venue strip inside the H1+lead column.
- Day-block overlay on photo lower-left (signature visual hook, kept from R1.5b).
- **Compressed `<EventStrip>` rendered BELOW the hero photo, inside the
  click target.** Pattern: `▸ ${venue} · ${Dutch date} · ${time}–${endTime}`.
  Single horizontal row, mono-uppercase, top + bottom 1px ink rule.
- Uses the article's first `eventFact` (`feature` per `EventHero` pattern).

### Transfer (R1.5c · TR.1')

- Kicker: `Transfer | ${dirChip} · ${date}` where `dirChip` is the jersey-
  filled directional chip with arrow glyph: `[↓ Inkomend]` / `[↑ Uitgaand]` /
  `[↻ Verlengd]`. Chip stays in the kicker (functional indicator).
- H1: `transferFact.playerName` (italic serif).
- **Meta line** below H1, graceful-omit per missing optional field:
  - Incoming: `${age} jaar · ${position} · van ${otherClubName}`
  - Outgoing: `${age} jaar · ${position} · naar ${otherClubName}`
  - Extension: `${age} jaar · ${position} · verlengd tot ${until}`
  - Each `· ${field}` segment elided when the field is absent.
- No pull-quote on the homepage hero — `note` + `noteAttribution` stay on
  the detail-page `TransferHero` only.
- **No jersey number on the homepage hero** (no structured field on
  transferFact; reintroducing would require a schema migration or a
  subject-ref extension — both out of scope for Phase 4.5).
- Landscape 3:2 article cover (NOT the 4:5 portrait the detail hero uses).

## Data projection prerequisites

Before R1 + R1.5 implementations land, the homepage `ARTICLES_QUERY`
(`apps/web/src/lib/repositories/article.repository.ts:19-24`) needs to
project the per-variant fields. Today it projects only id/title/slug/
publishedAt/featured/tags/coverImageUrl + body[]. Extensions needed:

```text
articleType                          // currently missing — hard-coded
                                     // "announcement" in page.tsx:64-76

// For Interview variant:
subjects[]{                          // article-level subject refs
  _key,
  subject->{
    _type, name,
    "photoUrl": coalesce(transparentImage.asset->url, psdImage.asset->url),
    jerseyNumber, position
  }
}

// For Transfer variant (body extraction):
"firstTransferFact": body[_type == "transferFact"][0]{
  direction, playerName, position, age,
  otherClubName, until
}

// For Event variant (body extraction):
"firstEventFact": body[_type == "eventFact"][0]{
  ageGroup, competitionTag, venue, date, startTime, endTime
}
```

Implementation note: GROQ supports array filtering with `[predicate][0]`.
The repository's `toHomepageArticles` mapper extracts the right slice for
the hero call site.

## What is NOT in scope for Phase 4.5

- **Schema migrations.** No new fields added to `transferFact`, `eventFact`,
  `article`, or `subject` schemas. Jersey number on transfer hero is
  dropped per owner choice; future PRD could add a `kcvvJerseyNumber: number`
  field if the hero composition needs it.
- **Detail-page hero rework.** `InterviewHero`, `AnnouncementHero`,
  `EventHero`, `TransferHero` all use pre-redesign tokens
  (`text-kcvv-gray-blue`, `font-title`, `rounded-[4px]`). The retro-fanzine
  port of these heroes is Phase 5+ scope (article-detail redesign series).
  Composition logic is shared; visual chrome diverges across phases.

## Retirement plan for the EditorialHero shell-only state

`EditorialHero.tsx:8` still reads: "Today every variant renders the same
shell content." After R1.5 implementation:

1. Per-variant artefacts above land as new sub-components or as
   conditional renders inside `EditorialHero`, scoped by `props.variant`
   discriminated-union narrowing.
2. The shell comment updates to reflect the new state.
3. Detail page consumers stay on legacy `<VariantHero>` components for
   now — `EditorialHero` is the homepage-placement consumer only until
   Phase 5+ unifies them.

## Implementation issues to spin out

After R1.6 (Uitgelicht card sizing) and R2 (NewsGrid geometry) also lock,
the Phase 4.5 implementation can break into ~5–7 GitHub issues:

1. Extend `ARTICLES_QUERY` projection (articleType, subjects, firstTransferFact, firstEventFact).
2. `<EditorialHero>` per-variant rendering (4 variants).
3. New `<FeaturedUitgelichtRow>` component (depends on R1.6 sizing).
4. `<HomepageHeroCarousel>` retirement + `<EditorialHero>` static placement.
5. Compressed `<EventStrip>` for homepage placement (EV.3 below-hero).
6. NewsGrid geometry update (depends on R2).
7. Plan doc + locked.md cleanup; CLAUDE.md update for homepage IA.
