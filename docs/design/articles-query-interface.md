# ARTICLES_QUERY projection interface — locked

**Locked:** 2026-05-14
**Phase:** 4.5 (homepage refinement)
**Consumed by:** `apps/web/src/lib/repositories/article.repository.ts` (`findAll`)
**Source:** `/design-an-interface` round triggered from the Phase 4.5 PRD draft.
**Owner:** @climacon

---

## 1. Requirements

### Who calls this

`ArticleRepository.findAll()` is called from four surfaces today:

| Caller                                            | Surface       | What it needs                                                                                   |
| ------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web/src/app/(landing)/page.tsx:100-101`     | Homepage      | All articles, ordered featured-first; sliced into hero (0), Uitgelicht (1..4), NewsGrid (4..10) |
| `apps/web/src/app/(landing)/jeugd/page.tsx:62`    | Youth landing | All articles, filtered client-side by youth tag                                                 |
| `apps/web/src/app/(landing)/sponsors/page.tsx:43` | Sponsors page | (Indirect — investigate at implementation time; possibly only `tags`)                           |
| `apps/web/src/app/(landing)/events/page.tsx:52`   | Events page   | (Indirect — likely filters by event articles)                                                   |

`findAll` shape change therefore affects four pages, not just the homepage. Any new fields must degrade gracefully on the three non-homepage consumers (they should not pay a perf cost; they should not break TypeScript).

### Three critical operations

1. **Find all published articles, featured-first ordering** — homepage feed (with new per-variant data).
2. **Find paginated articles** — `/nieuws` archive + jeugd-news filtering (unchanged shape).
3. **Find article by slug** — full detail page (already projects per-variant data including `articleType`, `subjects[]`, body Q&A blocks, mentionedPlayers, etc. — see `ARTICLE_BY_SLUG_QUERY` for the existing fat-shape precedent).

### What must be hidden

- Sanity client wiring, GROQ syntax.
- The fact that `transferFact` and `eventFact` live inside the body Portable Text array (not top-level Sanity fields). GROQ extraction with `body[_type == "transferFact"][0]` is a query-layer concern.
- The fact that `subjects[]` items dispatch over `kind` and resolve through `playerRef` / `staffRef` / custom — already abstracted by the existing `resolveSubject` helper.

### Constraints

- **Effect, not Promise.** `Effect.Effect<Result, Error, Requirements>` returned by all repository methods.
- **No new Sanity schemas / migrations.** Phase 4.5 promised 0 migrations across all locked rounds. The projection extension uses existing schema fields only.
- **GROQ typegen patterns.** Repository file follows the `Pick + Omit` `ArticleVM = Omit<Pick<ARTICLES_QUERY_RESULT[number], …>, …> & { … overrides … }` pattern. New shape must work with `npx sanity@latest typegen generate`.
- **One `ArticleVM` type.** The same type is exported once and consumed by all four call sites — there's no per-surface ArticleVM today and we don't want to introduce one.
- **`findBySlug` already does fat-shape projection** with optional fields (subjects, mentionedPlayers, relatedContent). Whatever pattern findAll adopts should be coherent with that precedent.

### What will change

- **More articleTypes** — `#1470` adds `matchPreview` + `matchRecap` to the enum (open issue, not yet merged).
- **Future body block types** — analytics-rich blocks, embed types, photo-gallery blocks may grow over future phases.
- **More projection fields** — Phase 5+ rounds may add e.g. `relatedMatches`, `byline`, `readTime` to the projection.

The shape MUST be additive-friendly. Whatever wins should make "add a new optional field" a one-line change.

---

## 2. Three candidate shapes

### Option A — Fat single shape (everything in one type, nullable per variant)

```typescript
// apps/web/src/lib/repositories/article.repository.ts

export const ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && publishedAt <= now() && (!defined(unpublishAt) || unpublishAt > now())]
    | order(featured desc, publishedAt desc) {
    "id": _id,
    "title": coalesce(pt::text(title), title, ""),
    "slug": coalesce(slug.current, ""),
    publishedAt,
    "featured": coalesce(featured, false),
    "tags": coalesce(tags, []),
    "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max",

    // NEW for Phase 4.5
    articleType,
    subjects[]{
      _key, kind,
      playerRef->{
        _id, firstName, lastName, jerseyNumber, position,
        "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
        "psdImageUrl":         psdImage.asset->url         + "?w=600&q=80&fm=webp&fit=max",
        psdId
      },
      staffRef->{
        _id, firstName, lastName, functionTitle,
        "photoUrl": photo.asset->url + "?w=600&q=80&fm=webp&fit=max"
      },
      customName, customRole,
      "customPhotoUrl": customPhoto.asset->url + "?w=600&q=80&fm=webp&fit=max"
    },
    "firstTransferFact": body[_type == "transferFact"][0]{
      direction, playerName, position, age,
      otherClubName, until, note, noteAttribution, kcvvContext
    },
    "firstEventFact": body[_type == "eventFact"][0]{
      title, date, endDate, startTime, endTime,
      location, address, ageGroup, competitionTag,
      ticketUrl, ticketLabel
    },

    // body stays projected as before for downstream block rendering
    body[]{ … }
  }
`);

export type ArticleVM = Omit<
  Pick<
    ARTICLES_QUERY_RESULT[number],
    | "id"
    | "title"
    | "slug"
    | "publishedAt"
    | "featured"
    | "tags"
    | "coverImageUrl"
    | "articleType"
    | "subjects"
    | "firstTransferFact"
    | "firstEventFact"
  >,
  "title" | "slug" | "featured" | "tags"
> & {
  title: string;
  slug: string;
  featured: boolean;
  tags: string[];
};
```

```typescript
// apps/web/src/app/(landing)/page.tsx — call site

const articles = yield* repo.findAll();
const [hero, ...rest] = articles;

// Hero picks per-variant data based on articleType (narrowed in component)
<EditorialHero
  variant={hero.articleType ?? "announcement"}
  slug={hero.slug}
  title={hero.title}
  coverImage={hero.coverImageUrl ? { url: hero.coverImageUrl, alt: hero.title } : undefined}
  subjects={hero.subjects}                  // null for non-interview
  transferFact={hero.firstTransferFact}     // null for non-transfer
  eventFact={hero.firstEventFact}           // null for non-event
/>;
```

### Option B — Discriminated union (variant in the type)

```typescript
type BaseArticleVM = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  featured: boolean;
  tags: string[];
  coverImageUrl: string | null;
};

type InterviewArticleVM = BaseArticleVM & {
  articleType: "interview";
  subjects: SubjectVM[];
};
type TransferArticleVM = BaseArticleVM & {
  articleType: "transfer";
  transferFact: TransferFactVM;
};
type EventArticleVM = BaseArticleVM & {
  articleType: "event";
  eventFact: EventFactVM;
};
type AnnouncementArticleVM = BaseArticleVM & { articleType: "announcement" };
type LegacyArticleVM = BaseArticleVM & { articleType: null };

export type ArticleVM =
  | InterviewArticleVM
  | TransferArticleVM
  | EventArticleVM
  | AnnouncementArticleVM
  | LegacyArticleVM;
```

```typescript
// apps/web/src/app/(landing)/page.tsx — call site

const articles = yield* repo.findAll();
const hero = articles[0];

// TypeScript narrows on the discriminator
switch (hero.articleType) {
  case "interview": return <EditorialHero variant="interview" subjects={hero.subjects} … />;
  case "transfer":  return <EditorialHero variant="transfer" transferFact={hero.transferFact} … />;
  case "event":     return <EditorialHero variant="event" eventFact={hero.eventFact} … />;
  default:          return <EditorialHero variant="announcement" … />;
}
```

To produce this from GROQ typegen output, a runtime narrowing function (`narrowArticleVM(raw): ArticleVM`) is required. Sanity typegen emits a flat object per row; the discriminated union is a TypeScript-layer reshape, not what GROQ returns.

### Option C — Generic + resolver service

```typescript
// ArticleVM stays generic — just adds articleType + body
export type ArticleVM = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  featured: boolean;
  tags: string[];
  coverImageUrl: string | null;
  articleType: ArticleType | null;
  body: ArticleBody[];               // raw body — resolvers parse this
};

// Resolver functions live alongside the variant rendering components
export function resolveHeroData(article: ArticleVM): HeroData | null { … }
export function resolveTransferCard(article: ArticleVM): TransferCardData | null { … }
export function resolveEventCard(article: ArticleVM): EventCardData | null { … }
```

```typescript
// apps/web/src/app/(landing)/page.tsx — call site

const articles = yield* repo.findAll();
const heroData = resolveHeroData(articles[0]);
return <EditorialHero {...heroData} />;
```

Resolvers can be pure functions (in `apps/web/src/components/article/blocks/`) or Effect services. They access `body[]` client-side to extract the first transferFact / eventFact, mirroring how the detail-page heroes already work (`resolveTransfer(value)`, `resolveSubject(subject)`).

---

## 3. Evaluation against criteria

| Criterion                                           | A (Fat)                           | B (Union)                       | C (Resolvers)                              |
| --------------------------------------------------- | --------------------------------- | ------------------------------- | ------------------------------------------ |
| **Simplicity** — how much must a caller know?       | ✅ One type, one method           | ❌ N-branch union to learn      | ⚠️ Type + resolver per surface             |
| **Depth** — small interface, big complexity hidden? | ⚠️ Optional fields exposed        | ✅ Per-variant narrowing        | ⚠️ Resolvers spread the surface            |
| **Generality** — handles future variants?           | ✅ Add an optional field          | ❌ New branch per variant       | ✅ Add a new resolver                      |
| **Effect fit** — composes in pipelines?             | ✅ Just data                      | ✅ Just data (post-narrow)      | ⚠️ Resolvers could leak into effect chains |
| **Testability** — mockable cleanly?                 | ✅ Mock returns ArticleVM         | ⚠️ Mock per branch              | ✅ Mock data + test resolvers separately   |
| **KCVV conventions** — fits existing patterns?      | ✅ Matches `findBySlug` fat shape | ❌ Diverges from typegen output | ⚠️ Splits state across files               |
| **Implementation cost** — lines of code             | Minimal — GROQ projection only    | Medium — typegen + narrowing fn | Medium — repository + N resolvers          |
| **Payload size** — for non-homepage callers         | ⚠️ Extra fields included          | ⚠️ Same                         | ✅ body[] only if caller needs it          |

---

## 4. Recommendation

**Winner: Option A (Fat single shape).**

### Why A wins

1. **Matches the existing `findBySlug` precedent.** `ARTICLE_BY_SLUG_QUERY` already projects optional `subjects`, `mentionedPlayers`, `mentionedTeams`, `mentionedStaffMembers`, `relatedContent` — all nullable, all consumed selectively by the detail page. Option A extends `findAll` to the same pattern, keeping the two queries coherent.

2. **GROQ typegen does the work.** Sanity's typegen reads the GROQ query and emits TypeScript types directly. Option A is what typegen naturally produces. Options B and C require additional machinery on top (a narrowing function or a resolver layer) that adds code without obviously buying more safety than A + per-component narrowing inside consumers.

3. **Only 4 new optional fields.** `articleType`, `subjects`, `firstTransferFact`, `firstEventFact` (plus the existing `body[]`). The "fat shape is hard to reason about" concern doesn't apply at this scale.

4. **Future-proof for matchPreview/matchRecap (#1470).** When those land, the projection grows by one or two more optional fields (`firstMatchPreviewFact`, `firstMatchRecapFact`, or a shared `firstMatchFact`). No union-branch surgery, no resolver-per-new-variant work.

5. **Zero impact on non-homepage callers.** `/nieuws`, `/jeugd`, `/sponsors`, `/events` pages keep working unchanged — they receive `ArticleVM[]` with extra optional fields they can ignore. TypeScript doesn't break, runtime doesn't break.

### What the losing options do better — worth borrowing

**From Option B — narrow at the consumer.** Even though `ArticleVM` doesn't ship as a discriminated union AT THE REPOSITORY LAYER, the homepage hero consumer should narrow on `article.articleType` and discriminate which per-variant data it reaches for. Borrowed pattern:

```typescript
// Inside EditorialHero — typed input + runtime narrowing
function renderVariant(article: ArticleVM) {
  switch (article.articleType) {
    case "interview":
      return renderInterview(article.subjects ?? []);
    case "transfer":
      return renderTransfer(article.firstTransferFact);
    case "event":
      return renderEvent(article.firstEventFact);
    case "announcement":
    case null:
      return renderAnnouncement(article);
  }
}
```

This keeps Option B's exhaustive-switch ergonomics without forcing the repository's return type to be a union.

**From Option C — reuse existing resolvers as the parsing layer.** The existing `resolveSubject(subject)` and `resolveTransfer(value)` helpers in `apps/web/src/components/article/blocks/` ALREADY do the variant-specific normalisation (joined Dutch names, direction → kickerLabel, etc.). Option A's fat-shape data feeds straight into them — no new resolver layer needed at the repository, the resolver layer lives next to the components that consume it.

```typescript
// EditorialHero homepage placement — reuses the existing resolver
import { resolveSubject } from "@/components/article/SubjectAttribution";
import { resolveTransfer } from "@/components/article/blocks/TransferFact";

const heroSubjects =
  article.subjects?.map(resolveSubject).filter(Boolean) ?? [];
const heroTransfer = article.firstTransferFact
  ? resolveTransfer(article.firstTransferFact)
  : null;
```

This is the existing pattern from the detail-page heroes — Phase 4.5's homepage hero adopts it without inventing a new abstraction.

---

## 5. Locked interface

### Type signature

```typescript
export type ArticleVM = Omit<
  Pick<
    ARTICLES_QUERY_RESULT[number],
    | "id"
    | "title"
    | "slug"
    | "publishedAt"
    | "featured"
    | "tags"
    | "coverImageUrl"
    // NEW for Phase 4.5
    | "articleType"
    | "subjects"
    | "firstTransferFact"
    | "firstEventFact"
  >,
  "title" | "slug" | "featured" | "tags"
> & {
  title: string;
  slug: string;
  featured: boolean;
  tags: string[];
};
```

### GROQ projection extension

In `ARTICLES_QUERY`, add (after the existing `coverImageUrl` projection, before `body[]{ ... }`):

```text
articleType,
subjects[]{
  _key, kind,
  playerRef->{
    _id, firstName, lastName, jerseyNumber, position,
    "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
    "psdImageUrl":         psdImage.asset->url         + "?w=600&q=80&fm=webp&fit=max",
    psdId
  },
  staffRef->{
    _id, firstName, lastName, functionTitle,
    "photoUrl": photo.asset->url + "?w=600&q=80&fm=webp&fit=max"
  },
  customName, customRole,
  "customPhotoUrl": customPhoto.asset->url + "?w=600&q=80&fm=webp&fit=max"
},
"firstTransferFact": body[_type == "transferFact"][0]{
  direction, playerName, position, age,
  otherClubName, until, note, noteAttribution, kcvvContext
},
"firstEventFact": body[_type == "eventFact"][0]{
  title, date, endDate, startTime, endTime,
  location, address, ageGroup, competitionTag,
  ticketUrl, ticketLabel
},
```

The `subjects[]` projection is copy-pasted verbatim from `ARTICLE_BY_SLUG_QUERY` to ensure parity between detail-page subject resolution and homepage subject resolution. Image URLs are sized for the homepage hero's smaller thumbnail use (~600px) rather than detail-page's full portrait.

### Repository interface — unchanged

```typescript
export interface ArticleRepositoryInterface {
  readonly findAll: () => Effect.Effect<ArticleVM[]>;
  readonly findBySlug: (slug: string) => Effect.Effect<ArticleDetailVM | null>;
  readonly findPaginated: (params: {
    offset: number;
    limit: number;
    category?: string;
  }) => Effect.Effect<ArticleVM[]>;
  readonly findTags: () => Effect.Effect<ARTICLE_TAGS_QUERY_RESULT>;
  readonly findRelated: (documentId: string) => Effect.Effect<ArticleVM[]>;
}
```

No method signature changes. `findAll` returns the same `ArticleVM[]` type — just with four new optional fields. `findPaginated` and `findRelated` could optionally adopt the same projection extension in a follow-up if their consumers need it; for Phase 4.5 they stay narrow.

### Validation expectations

- A `transfer` article SHOULD have a non-null `firstTransferFact` (Sanity validation enforces ≥1 transferFact body block; the GROQ projection then takes the first).
- An `event` article SHOULD have a non-null `firstEventFact` (same).
- An `interview` article SHOULD have `subjects.length ≥ 1`.
- A nullable runtime branch is still required for: legacy untyped articles (`articleType: null`), draft / preview content where validation is bypassed, and missing-body edge cases.
- Per `feedback_design_data_audit`: components consuming these fields must handle the null case gracefully — never render a hero variant that depends on data that turns out to be missing.

---

## 6. Implementation notes (not part of the lock, just guidance)

- **Migration cost: 0 Sanity migrations.** All projected fields use existing schema fields (`articleType` enum, `subjects[]` array, body blocks with `_type == "transferFact" / "eventFact"`).
- **Typegen step:** after editing `ARTICLES_QUERY`, the implementer must regenerate Sanity types with `npx sanity@latest typegen generate` (or whatever the project's typegen script is). The `ARTICLES_QUERY_RESULT` import wires through automatically.
- **Cache invalidation:** `findAll` uses `fetchGroq`, which inherits the project's standard Sanity caching strategy. New fields don't change the cache key.
- **`/nieuws`, `/jeugd`, `/sponsors`, `/events` consumers** keep working unchanged — they pay a small projection-size cost (extra fields in the response) but no breakage.
- **`toHomepageArticles` mapper** (`article.repository.ts:230-234`) keeps its current behaviour — it strips the new fields when producing `HomepageArticle[]` for the legacy `<NewsCard>` consumer. The new homepage hero / Uitgelicht / News surfaces will need a different mapper (or consume `ArticleVM` directly) — that's an implementation decision for the spinout issue.

---

## 7. Open questions deferred to implementation

- [ ] **Image sizing on subject portraits.** The detail-page query uses `?w=600` for `transparentImageUrl` / `psdImageUrl`. The R1.5 IV.3 design needs only ~16px thumbnails for the credit chips. Worth a smaller `?w=64` projection on the homepage version to reduce payload, OR keep `?w=600` for parity with detail use? Implementer picks.
- [ ] **Should `findPaginated` and `findRelated` adopt the same extension?** `/nieuws` archive and `/jeugd` news section could benefit from articleType-driven card backgrounds (R3.B) too. Defer until R3.B implementation reveals whether the archive / jeugd pages need it.
- [ ] **`toHomepageArticles` future.** With the new `ArticleVM` carrying variant data, the mapper either drops it or is replaced by per-surface mappers (`toHeroArticle`, `toUitgelichtCard`, `toNewsCard`). Implementer to decide based on the consumer signatures.

---

## 8. Tracking

Implementation lands in the Phase 4.5 PRD's tracer-bullet issue: "extend `ARTICLES_QUERY` projection" (or the rename equivalent). The PRD references this doc as the locked interface contract. PR review should confirm:

- ✅ ARTICLES_QUERY shape matches §5 above.
- ✅ `ArticleVM` Pick/Omit list includes the four new fields.
- ✅ `npx sanity@latest typegen generate` ran and the generated types match.
- ✅ Type check passes across all four call sites (`page.tsx`, `nieuws`, `jeugd`, `sponsors`, `events`).
- ✅ No new Sanity schema files in the diff.
