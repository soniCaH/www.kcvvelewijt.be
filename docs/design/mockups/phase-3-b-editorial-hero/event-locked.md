# `<EditorialHero variant="event">` — locked design (Phase 3, Checkpoint B)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.B.2 (variants).
**Mockup:** `option-a-event-detail.html` + screenshots `screenshots/detail-event-{single-day,recurring,no-ticket,mobile,full}.png`.
**Iterative comparison file** (historical): `option-a-event-comparisons.html`.
**Field availability sheet:** `fields.md`.

> **★ Reuse audit correction (2026-05-05):** mentions of `<HeroCoverImage>` below (composition diagram + reuse map) are **superseded** — `<TapedFigure>` already accepts `aspect="landscape-16-9"`, so the cover-image artefact composes inline as `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">`. No wrapper primitive, no new Storybook story. **Canonical source of truth: Phase 3 PRD §8b.** Same correction applies to `announcement-locked.md`, `transfer-locked.md`, `interview-locked.md`.

## Scope

Detail-page hero for `/nieuws/[slug]` when `articleType === "event"`. Reuses the locked Asymmetric Broadsheet shell + the same five slots locked on announcement and transfer. Variant-specific narrative (date / location / sessions / tickets) lives in a sibling `<EventFactStrip>` BELOW the hero — same architectural pattern as `<TransferFactStrip>`, but with event-specific content shape.

**Out of scope:** standalone `event` document hero on `/events/[slug]` — that's a separate route + composition that'll be revisited in Phase 6.

## Locked decisions (Q1 / Q2 / Q3 / Q4)

Drilled down per question, owner-approved each:

|                                | Choice                        | What it means                                                                                                                                                                                    |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Q4 · Cover image treatment** | A1 — plain                    | `article.coverImage` in TapedCard rotation A, no overlay. Same shape as announcement / transfer.                                                                                                 |
| **Q1 · Strip layout**          | C — ticket-stub banner        | Strip itself reads as one giant perforated ticket: jersey-deep filled date block (left), dashed seam, cream body cell (location + aftrap or sessions), RESERVEER CTA (right edge).               |
| **Q2 · Sessions[] placement**  | A — inline in strip body      | When `eventFact.sessions[]` is populated, the per-day schedule renders inside the strip's body cell. Date block becomes the date range.                                                          |
| **Q3 · Agenda link**           | B2 — small line in strip body | When `article.relatedContent[]` references an event document, a compressed mono-caps "★ Ook in agenda →" link sits as the last line of the strip's body cell. Hides when no event doc is linked. |

## Composition

```text
┌──────────────────────────────────────────────┬───────────────────────────┐
│  EditorialKicker (★ EVENT · category · …)     │                           │
│  EditorialHeading (PT-aware, accent)          │   <TapedCard rotation A>  │
│  EditorialLead                                │     + <TapedFigure        │
│  EditorialByline                              │       aspect="landscape-  │
│                                               │       16-9"> (plain)      │
└──────────────────────────────────────────────┴───────────────────────────┘
                                            ↓
┌─────────────┬───────────────────────────────────────────┬────────────────┐
│   14        │  Locatie · Aftrap                          │                │
│   Nov '26   │  Clubhuis KCVV · 19:00                     │   RESERVEER →  │
│             │  Driesstraat 14 · max 80 · € 22 pp         │  (canonical    │
│ jersey-deep │  ★ Ook in agenda →   (when relatedContent  │   press-down   │
│   filled    │       has an event doc)                    │   hover)       │
└─────────────┴───────────────────────────────────────────┴────────────────┘
              ↑ dashed perforation seam (no decorative circle)
                                            ↓
                                   article body in --container-prose
```

## EventFactStrip — full state matrix

The strip's body cell adapts based on the eventFact data:

| State                        | When                                                  | Body cell content                                                                                            |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Single-day, no sessions**  | `eventFact.sessions[]` empty                          | "Locatie · Aftrap" + venue + "DD venue · HH:MM" + address line + capacity/price                              |
| **Recurring, with sessions** | `eventFact.sessions[]` non-empty                      | "Locatie · Uurschema per dag" + venue + per-day list (each session: "Vrijdag DD/MM" + "HH:MM — HH:MM")       |
| **With agenda link**         | `article.relatedContent[]` includes an event document | All of the above + extra last line: `★ Ook in agenda →` linking to `/events/[slug]` of the related event doc |
| **Without ticketUrl**        | `eventFact.ticketUrl` empty                           | RESERVEER CTA (right edge) hides entirely; body cell stretches to fill the freed space                       |

The body cell is the only mutable area — date block on the left and CTA cell on the right are stable per their fixed inputs.

## Mobile (`max-width: 720px`)

- Hero collapses to single-column (artefact-on-top, per shell rule).
- EventFactStrip flips to vertical: date block (full-width) → seam (now horizontal dashed border) → body cell → CTA at the bottom.
- When ticketUrl empty, the bottom CTA cell is absent — strip ends at the body cell.
- Date block keeps its jersey-deep filled bg.
- Strip's slight rotation preserved at smaller magnitude.

## Component composition — reuse + new

**Existing primitives reused** (continued from announcement-locked / transfer-locked):

| Primitive                        | Use                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `<TapedCard>`                    | Wraps the cover image at rotation A                                                                                                      |
| `<TapedFigure>`                  | Inline cover-image: `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">` (supersedes `<HeroCoverImage>` per Phase 3 PRD §8b) |
| `<MonoLabel>` / `<MonoLabelRow>` | Kicker, role labels                                                                                                                      |
| `<EditorialHeading>`             | Hero headline (PT-aware post-Ask-9)                                                                                                      |
| `<DropCapParagraph>`             | First body paragraph (article body, not hero)                                                                                            |

**Shared sub-components** (locked with announcement, reused here):

`<EditorialHero>` · `<EditorialHeroShell>` · `<EditorialKicker>` · `<EditorialLead>` · `<EditorialByline>` — no fork. (Cover image composes inline as `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">` per Phase 3 PRD §8b; `<HeroCoverImage>` is superseded.)

**New variant-specific component:**

| Component          | Path                                                     | Purpose                                                                                                                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<EventFactStrip>` | `apps/web/src/components/article/blocks/EventFactStrip/` | Renders the ticket-stub banner beneath the hero. Takes an `EventFact` prop + an optional `linkedEventSlug` prop. Internally branches on `sessions[]` presence and `ticketUrl`. Storybook stories: `single-day`, `recurring`, `no-ticket-url`, `with-agenda-link`, `mobile` — VR-tagged. |

The strip is an article body block (parallel to `<TransferFactStrip>`), not a design-system primitive — variant-specific by definition.

## Field-source map

| UI element            | Source                                                                                                                     | Notes                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Kicker · "EVENT"      | static label keyed off `articleType==='event'`                                                                             | EditorialKicker constant                                                                                                        |
| Kicker · category     | `eventFact.competitionTag` OR `eventFact.ageGroup`                                                                         | falls back to ageGroup when competitionTag absent                                                                               |
| Kicker · reading time | `computeReadingTime(article.body)`                                                                                         | Hides when undefined                                                                                                            |
| Kicker · publish date | `formatDate(article.publishedAt)`                                                                                          | (Optional — owner did not request it explicitly for this variant; can drop to keep kicker compact when reading-time is showing) |
| Headline              | `article.title` (PT, post-Ask-9)                                                                                           | Renders accent decorator as italic + jersey-deep                                                                                |
| Lead                  | `article.lead` (post-Ask-1) → fallback `body[0]` first paragraph (truncate ~280 chars)                                     | Italic display                                                                                                                  |
| Byline                | `article.author ?? "Door redactie"`                                                                                        | Default stub                                                                                                                    |
| Hero cover image      | `article.coverImage` @ 16:9 (post-Ask-8 required)                                                                          | Editor-curated; any contextually relevant photo                                                                                 |
| Strip · day block     | `eventFact.date` (single) OR `eventFact.date` + `eventFact.endDate` (range)                                                | "DD" or "DD–DD" + month/year                                                                                                    |
| Strip · role label    | static "Locatie · Aftrap" (single) OR "Locatie · Uurschema per dag" (recurring)                                            | Mono jersey-deep                                                                                                                |
| Strip · head line     | `eventFact.location` + `eventFact.startTime` (single, joined by `·`) OR `eventFact.location` (recurring)                   | Display italic 900                                                                                                              |
| Strip · sub line      | `eventFact.address` + `capacity` + price                                                                                   | Mono caps muted; price source TBD per editorial; capacity drops when undefined                                                  |
| Strip · sessions list | `eventFact.sessions[]` · session day from `session.date` localised · time range from `session.startTime`/`session.endTime` | Mono caps; renders only when sessions[] non-empty                                                                               |
| Strip · agenda link   | Conditional · renders when `article.relatedContent[]` contains an `event` document; href = `/events/${linkedEvent.slug}`   | Mono jersey-deep · gap-grow on hover                                                                                            |
| Strip · RESERVEER CTA | `eventFact.ticketUrl` + `eventFact.ticketLabel ?? "Inschrijven"`                                                           | Jersey-deep filled · canonical press-down hover · hides entirely when `ticketUrl` empty                                         |
| Image alt             | `serializeTitle(article.title)` (post-Ask-9 plain text)                                                                    | —                                                                                                                               |

## API (target shape post-Ask-8 + Ask-9 migrations)

```typescript
type EditorialHeroEventProps = {
  variant: "event";
  placement?: "detail" | "homepage"; // default "detail"
  article: {
    title: PortableTextBlock[];
    lead?: string;
    body: PortableTextBlock[];
    publishedAt: string;
    coverImage: { url: string; hotspot?: { x: number; y: number } };
    author?: string;
  };
  // First eventFact in body, hoisted by the page-level Server Component before
  // passing into EditorialHero. Source: `article.body[].find(b => b._type === 'eventFact')`.
  eventFact: EventFact;
  // Optional — derived from article.relatedContent[] when an event document is linked.
  linkedEvent?: { slug: string };
};
```

## Schema dependencies (BLOCKING)

Inherits all 5 from announcement-locked + the eventFact body validator (Ask 6) — already enumerated in `fields.md`:

1. `article.lead` field added (Ask 1).
2. **`articleType=event` body validator (Ask 6)** — `articleType=event` requires ≥1 `eventFact` block in body. Hero has nothing to render without it.
3. `articleType=transfer` body validator (Ask 6).
4. `article.coverImage` becomes required (Ask 8).
5. `article.title` → constrained Portable Text + `accent` decorator (Ask 9).

No additional schema changes for this variant — uses existing `eventFact` shape verbatim.

## Implementation contract

- **Press-down hover** on the RESERVEER CTA — canonical `hover:shadow-none + translate(4px, 4px) + transition-all duration-300`. Per memory `feedback_canonical_press_down_hover`.
- **CTA absence** — when `eventFact.ticketUrl` is empty, the entire CTA cell of the strip drops; body cell stretches to fill. Tested as a separate Storybook story.
- **Sessions empty vs single-day** — when `sessions[]` is empty/undefined, render single-day shape (head line shows venue + startTime). When populated, render sessions list + drop the inline time from the head line.
- **Date format** — single-day: "DD" + "MMM 'YY". Range: "DD–DD" + "MMM 'YY". Same month assumed; cross-month ranges TBD (probably "DD MMM – DD MMM 'YY").
- **Agenda link discovery** — page-level Server Component finds the first `event` document in `article.relatedContent[]` and passes its slug to `<EditorialHero>`. Renders the link when present; hides when absent.

## Approval checklist

- [x] Asymmetric Broadsheet shell (locked direction A).
- [x] Detail placement — no click-through CTAs (only the RESERVEER ticket CTA which is contextual, not navigational).
- [x] coverImage in right column · plain (Q4 A1).
- [x] EventFactStrip Layout C — ticket-stub banner with jersey-deep date block.
- [x] No perforation circle (owner-removed).
- [x] Sessions[] inline in strip body (Q2 A).
- [x] Agenda link as small line in strip body (Q3 B2).
- [x] ticketUrl-empty → CTA hides; body cell stretches.
- [x] Press-down hover on RESERVEER CTA.
- [x] Mobile — strip flips vertical, same composition vocabulary.
- [x] Component path: `apps/web/src/components/article/blocks/EventFactStrip/`.
- [x] All 5 schema migrations + eventFact body validator captured for the issue split.

## Homepage placement (`placement="homepage"`)

Locked 2026-05-05 — see `option-a-homepage-placement-comparisons.html` (P3 picked from P1/P2/P3 drill).

When the EditorialHero renders as a featured-article teaser at the top of the homepage's news section, the shell + slots above stay **identical to the detail-page composition**. One extension: **whole-card click**.

- The entire hero is wrapped as a link to `/nieuws/{article.slug}`.
- **At rest**: identical to the detail-page hero — kicker, heading, lead, byline, right-column artefact unchanged. No CTA text, no extra band, no inline read-more affordance.
- **On hover**: card press-ups (`transform: translate(-2px, -2px)` + box-shadow grown by ~4px) — the natural inverse of the canonical press-down hover used on paper-stamped primitives. A small `★ Lees verder →` hint fades in at the bottom-right.
- **Body content does not render in homepage placement.** The EventFactStrip is article-detail-only.
- **Touch-device note**: no hover means the press-up + hint never trigger. The whole card is clickable; native touch tap navigates. Acceptable starting point; revisit with a persistent foot-line hint if analytics show click-through underperforms.
- **`<EditorialHero>` discriminated union**: `placement?: "detail" | "homepage"` (default `"detail"`). `"homepage"` triggers the `<a>` wrap + press-up styling + body content suppression in the Server Component.
