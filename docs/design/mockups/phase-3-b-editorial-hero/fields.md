# Phase 3 — Checkpoint B — EditorialHero · Field availability

> **Audit gate (per owner direction 2026-05-05):** every UI element in every variant mockup MUST map to a real Sanity field before drilling. Mockups that fabricate editorial data (author, reading time, dek, photo credit, etc.) are flagged below — drop or escalate via "Owner asks" section.

## Placement decision (2026-05-05)

EditorialHero is one component used in two placements. Drill-down focuses on the **detail-page placement** first; homepage placement layers on top once detail is locked.

|                                                  | Detail page (`/nieuws/[slug]`)                         | Homepage (lead-story slot)                         |
| ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------- |
| **Phase 3 B drill order**                        | **first** — canonical anchor                           | second — additive `placement="homepage"` extension |
| **Kicker / headline / lead / artefact / byline** | same                                                   | same                                               |
| **CTA row**                                      | **none** — body flows below the hero                   | `LEES …` + `ALLE …` (click-through)                |
| **Reasoning**                                    | reader is already committed; "READ" CTA is meaningless | reader needs an obvious entry point                |

The mockups in this dir from 2026-05-05 onwards are the **detail-page** variants. Homepage adaptations come once those are locked.

**Sources:**

- `packages/sanity-schemas/src/article.ts` — base article schema (all variants share)
- `packages/sanity-schemas/src/subject.ts` — interview-only `subjects[]`
- `packages/sanity-schemas/src/transferFact.ts` — body block for `articleType=transfer`
- `packages/sanity-schemas/src/eventFact.ts` — body block for `articleType=event`
- `packages/sanity-schemas/src/qaBlock.ts` — body block for interview Q&A
- `packages/sanity-schemas/src/event.ts` — separate `event` document (linked via `relatedContent`)
- BFF projection: `apps/web/src/lib/sanity/sanity.types.ts` (`ARTICLE_BY_SLUG_QUERY_RESULT`)

## Always available — base article fields

Every EditorialHero variant has access to these:

| Field             | Type               | Required?     | UI use                                                                |
| ----------------- | ------------------ | ------------- | --------------------------------------------------------------------- |
| `articleType`     | enum               | ✅            | discriminator → variant + kicker first label                          |
| `title`           | string (~60 chars) | ✅            | headline                                                              |
| `slug`            | slug               | ✅            | route                                                                 |
| `publishedAt`     | datetime           | optional      | byline date / kicker                                                  |
| `coverImage`      | image (hotspot)    | optional      | hero context strip / event variant artefact (16:9 — see policy below) |
| `tags`            | string[]           | optional      | secondary kicker labels (free text)                                   |
| `featured`        | boolean            | default false | feed-level treatment, not hero                                        |
| `body`            | Portable Text      | optional      | first paragraph candidate for dek (see "Owner ask 1")                 |
| `metaDescription` | string (160 max)   | optional      | SEO only, NOT on-page                                                 |
| `relatedContent`  | array of refs      | optional      | page body, not hero                                                   |
| `relatedArticles` | array of refs      | optional      | page body, not hero                                                   |

## NOT available on the article schema

These were rendered in the mockups but **DO NOT EXIST**:

| Mockup field                                                     | Reason it's fabricated                                                  | Fix                                                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Author / byline name**                                         | No `author` field on article                                            | Drop, or escalate (see Owner ask 2)                                         |
| **Photo credit** ("FOTO · M. CLAES")                             | No `coverImageCredit` / `imageCaption` field                            | Drop, or escalate (see Owner ask 4)                                         |
| **Reading time** ("12 MIN LEZEN")                                | No `readingTime` field                                                  | Auto-compute from `body` word count, or drop (see Owner ask 3)              |
| **Dek / lead / subtitle** ("Onze rechterflank wordt versterkt…") | No `lead`/`dek`/`excerpt` field                                         | Use first paragraph of `body`, or escalate (see Owner ask 1)                |
| **Section / category** ("NIEUWS · CLUB")                         | `tags[]` exists but is freeform string array, not a controlled category | Use `articleType` for the primary kicker label; tags as secondary if useful |
| **"5 MIN LEZEN" / "12 MIN" reading-time**                        | n/a                                                                     | drop or auto-compute                                                        |
| **Star-sandwich kicker copy** ("★ TRANSFER · 2026 · ★")          | template-derived, not editor-authored                                   | template constant from articleType + season; OK                             |

## Per-variant field map

### `interview`

**Article-level extra:** `subjects[]` (1–4 of `subject` objects).

| `subject.kind` | Available fields                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `player`       | `playerRef->` { firstName, lastName, jerseyNumber, position, transparentImageUrl, psdImageUrl, psdId } |
| `staff`        | `staffRef->` { firstName, lastName, functionTitle, photoUrl }                                          |
| `custom`       | `customName`, `customRole`, `customPhotoUrl`                                                           |

**Body PT extras:** `qaBlock` containing `qaPair` items (question + answer + tag in [standard|key|quote|rapid-fire] + respondentKey).

**Hero artefact column drives off:** `subjects[]` portraits.
**Hero meta column drives off:** `articleType=interview` → kicker; `subjects.length` → "DUO" / "TRIO" / "PANEL" label; `title` → headline; `body[0]` first paragraph → dek (pending Owner ask 1).

**❌ Fabricated in option-A mockup (drop):** "★ DOOR L. PEETERS" (no author), "12 MIN" (no readingTime), "★ AFSCHEID DUBBEL" (could be a `tags` value if editors apply it).

---

### `announcement` (default articleType)

**Article-level extra:** none.
**Body PT extras:** standard PT only — no announcement-specific fact block.

**Hero artefact column drives off:** none from data — `<StampBadge>` is **template-rendered with static "OFFICIEEL · BESTUUR" copy**. The badge's date is `publishedAt`.
**Hero meta column drives off:** `articleType=announcement` → kicker first label "MEDEDELING"; `title` → headline; `body[0]` first paragraph → dek.

**❌ Fabricated in option-A mockup (drop):** "★ BESTUUR KCVV / VOORZITTER · M. JANSSENS" byline (no author), "OFFICIEEL" duplicate stamp text.

---

### `transfer`

**Article-level extra:** none on article — but **body PT must include at least one `transferFact` block** for the hero to render meaningfully. The first transferFact powers the hero.

| `transferFact` field | Type                                    | UI use                                                     |
| -------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `direction`          | incoming \| outgoing \| extension (req) | shield-arrow direction                                     |
| `playerName`         | string (req)                            | hero subtitle / shield label                               |
| `position`           | enum                                    | meta row                                                   |
| `age`                | number (14–45)                          | meta row                                                   |
| `otherClubName`      | string (req when not extension)         | "from" or "to" club label                                  |
| `otherClubLogo`      | image (when not extension)              | shield image                                               |
| `otherClubContext`   | string                                  | sub-label under other-club ("Jupiler Pro League · U23")    |
| `kcvvContext`        | string                                  | sub-label under KCVV side ("Derde Amateur · A-ploeg · #8") |
| `until`              | string (extension only)                 | "verlengd tot 2028"                                        |
| `note`               | text (140 max)                          | optional pull-quote in hero                                |
| `noteAttribution`    | string                                  | pull-quote byline (defaults to `playerName`)               |

**Hero artefact column drives off:** transferFact's `direction` + `playerName` + `otherClubLogo` + `otherClubName` + (KCVV crest, template-supplied) → before/after shield row.
**Hero meta column drives off:** `articleType=transfer` → kicker; `title` → headline; `body[0]` (or first non-transferFact body paragraph) → dek; transferFact's `note` → pull-quote (optional).

**❌ Fabricated in option-A mockup (drop):** "★ DOOR REDACTIE / FOTO · KCVV" byline (no author / photo credit), "12 MIN LEZEN" (no readingTime).

---

### `event` — TWO Sanity surfaces, only one is in Phase 3 B scope

**`event` lives in TWO places in Sanity, with a real overlap:**

| Surface                 | Sanity source                                                                                                      | Route            | Currently renders                                                                            | Phase 3 B scope?             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| Standalone event detail | `event` _document_ (title, slug, dateStart [datetime], dateEnd, coverImage, externalLink, featuredOnHome, ogImage) | `/events/[slug]` | bespoke composition in `apps/web/src/app/(main)/events/[slug]/page.tsx` — NOT article-driven | **OUT — different hero**     |
| Articles ABOUT events   | `article` _document_ with `articleType=event` + first `eventFact` block in body                                    | `/nieuws/[slug]` | `EventTemplate` → `EventHero` + `EventStrip` (#1525 redesign target)                         | **IN — this is the variant** |

**Implications:**

- The standalone `event` document and the `articleType=event` article are **independent surfaces with no schema link** (apart from `article.relatedContent[]` optionally referencing an event doc).
- Editors can describe one real-world event in **one or both** places: an event document for `/events` + `/kalender`, an event article for `/nieuws`. They are not auto-synchronised.
- **Phase 3 B EditorialHero `event` variant only fires on `/nieuws/[slug]` when `articleType=event`.** It reads from the article's coverImage + first eventFact in body, NOT from the event document.
- The `/events/[slug]` page hero rebuild is **out of Phase 3 B scope** — likely Phase 6 (master design line 539) alongside player profile, match detail, team detail, kalender.

**Article-level extra:** none on article — but **body PT must include at least one `eventFact` block** for the hero. First eventFact powers the strip. _(See Owner ask 6 below — should this be enforced via schema validation?)_

| `eventFact` field       | Type                                 | UI use                          |
| ----------------------- | ------------------------------------ | ------------------------------- |
| `title`                 | string (req)                         | event title                     |
| `date`                  | date (req)                           | start day                       |
| `endDate`               | date                                 | multi-day events                |
| `startTime` / `endTime` | HH:mm string                         | simple single-day or continuous |
| `sessions[]`            | per-day { date, startTime, endTime } | recurring/multi-day             |
| `location`              | string                               | venue name                      |
| `address`               | string                               | street + town                   |
| `ageGroup`              | string                               | kicker driver                   |
| `competitionTag`        | string                               | kicker fallback                 |
| `ticketUrl`             | url                                  | CTA                             |
| `ticketLabel`           | string (default "Inschrijven")       | CTA label                       |
| `capacity`              | number                               | "Max 24 spelers" line           |
| `note`                  | Portable Text                        | short prose                     |

**Article CAN ALSO link to a separate `event` document via `relatedContent[]`** — that document carries `coverImage`, `dateStart` (datetime), `dateEnd`, `externalLink`, `featuredOnHome`. Per the eventFact comment, the eventFact in body is the canonical hero data source — the event document is for index pages.

**Hero artefact column drives off:** `coverImage` (16:9 poster crop) + eventFact's `date` (display date numeral) + eventFact's `ticketUrl` (CTA — optional).
**Hero meta column drives off:** `articleType=event` → kicker; eventFact's `ageGroup` OR `competitionTag` → kicker secondary; `title` → headline; eventFact's `note` first paragraph (or article `body[0]`) → dek; eventFact's `ticketUrl` → CTA.

**❌ Fabricated in option-A mockup (drop):** "★ KCVV CLUBHUIS / VR 14 NOV · 19:00 / GRATIS · INSCHRIJVING NODIG" byline (last item ≈ derive from ticketUrl absence + capacity, but byline format is fabricated).

---

### `matchPreview` / `matchRecap` _(deferred — #1470)_

**Schema additions (per #1470):**

- `articleType` enum gains `matchPreview` + `matchRecap`
- `linkedMatch` string (PSD match id, hidden unless articleType in [matchPreview, matchRecap])

**Match data comes from PSD via `linkedMatch` lookup**, NOT from Sanity. Available fields per memory `reference_psd_*`:

- opponent club id, opponent club name, opponent club logo
- kickoff datetime, venue
- competition (id, name)
- matchday number
- (recap only) final score (home / away — orient via teamId per memory `feedback_no_psd_prerendering`)

**Hero artefact column drives off:** opponent shield (PSD logo via Sanity-cached) + match meta (kickoff/venue/competition/matchday) + ticket CTA (preview) OR final score (recap).
**Hero meta column drives off:** `articleType` → kicker; opponent name → headline complement; `body[0]` → dek; standard CTA.

Design coordinated through #1470 once Phase 3 B four article variants are locked.

---

## Cover image policy (16:9 single source)

Per master design line 698 (owner correction 2026-04-28) + owner direction 2026-05-05:

- **Source:** `article.coverImage` at **16:9 landscape**, hotspot, optional.
- **One upload per article.** Used by every surface that needs an image.
- The current `coverImagePortraitUrl` (4:5 portrait crop in `ARTICLE_BY_SLUG_QUERY_RESULT`) is a redesign target — drops in Phase 3.B.2 implementation. No portrait crops anywhere.

## Owner asks — fields not in schema today

Each item below is a real gap the heroes need to render meaningfully. Please decide per item: **(a) add the field**, **(b) use the proposed alternative**, or **(c) drop the UI element**.

> **Decisions captured 2026-05-05** — see ✅ markers per ask below.

### Ask 1 — Dek / lead / intro paragraph

**Where it shows up:** every variant's hero has a 2–3-line intro between the headline and the CTA row. None of the mockups can render without this.

**Today:** no `lead`/`dek`/`excerpt` field on article.

**Options:**

- **(a) Add `lead` field** to article schema — `string`, ~280 char max, optional. Editor-authored. Most direct.
- **(b) Auto-extract from `body[0]`** — first Portable Text paragraph. Free, no schema change. Risk: editors write the body's first paragraph as a continuation of the headline, not as a stand-alone summary; the hero dek then reads weird.
- **(c) Hybrid** — `lead` field, fall back to `body[0]` first paragraph when `lead` is empty.

**My recommendation:** (c). Lets editors craft a hero-specific dek when they want, and not worry when they don't. Schema cost: 1 string field, optional.

✅ **Decided: (c) hybrid.** Add a `lead` (or `summary`) optional string field to article schema. Body-first-paragraph fallback when empty. **Adding this field is a BLOCKING requirement** — must land in the schema migration that ships alongside Phase 3 B EditorialHero. Capture in the GitHub issue split as a hard dependency on `3.B.2` (EditorialHero variants) and `packages/sanity-schemas`. Useful beyond just the hero — fills a gap in news cards / social sharing / OG too.

### Ask 2 — Author / byline

**Where it shows up:** byline row at the bottom of the hero ("★ DOOR L. PEETERS").

**Today:** no `author` field on article.

**Options:**

- **(a) Add `author` field** to article schema — `string`, optional. Or `reference` to a `staffMember` document for staff-authored articles.
- **(b) Drop the byline row** entirely from EditorialHero. Articles render anonymously.

**My recommendation:** (b) drop. KCVV is a club site — most articles are "by the editorial team" implicitly. A byline adds editorial weight that may not match KCVV's voice. If you do want bylines for specific articles, (a) `author: string` (optional) is cleanest — one editor-typed string per article. Reference-to-staffMember is over-engineered for the volume.

✅ **Decided: (a) keep byline; render stubbed default for now, plan for editor-supplied author later.**
**Phase 3 B mockup contract:** byline row renders with a default stub (`"Door redactie"` constant). Future: optional `author` field on article schema (probably `string`; reference-to-staffMember is over-engineered) — editor-supplied value overrides the stub. **Not blocking Phase 3 B mockup design** — the visual slot is reserved; the field addition is a follow-up that does NOT need to land before EditorialHero ships.

### Ask 3 — Reading time

**Where it shows up:** "12 MIN" / "5 MIN LEZEN" in the kicker row.

**Today:** ✅ **already implemented.** `apps/web/src/lib/utils/reading-time.ts` exports `computeReadingTime(body)` returning Dutch copy `"N min lezen"` (200 wpm, returns `undefined` for bodies under 20 words). Already wired into `apps/web/src/app/(main)/nieuws/[slug]/page.tsx:233` and consumed by today's hero components. My earlier flag of this as "fabricated" was wrong.

✅ **Decided: (a) keep auto-computed.** Use `computeReadingTime(article.body)` at render time. EditorialHero kicker secondary slot can render the result. Hide when undefined (short articles).

### Ask 4 — Photo credit / cover image caption

**Where it shows up:** "FOTO · M. CLAES" byline item.

**Today:** no `coverImageCredit` / `coverImageCaption` field.

**Options:**

- **(a) Add `coverImageCredit` field** to article schema — `string`, optional.
- **(b) Drop entirely.** Most KCVV cover images are taken by club photographers; credit isn't routinely tracked.

**My recommendation:** (b) drop. Add later if a high-volume photographer wants attribution; not worth schema bloat for occasional credit.

✅ **Decided: (b) drop.** No `coverImageCredit` field, no "FOTO · X" line in the byline.

### Ask 5 — Cover image alt text

**Where it shows up:** accessibility — every `<img>` needs an alt attribute.

**Today:** Sanity image fields support hotspot but no built-in alt text. Articles' `coverImage` is `type: "image", options: { hotspot: true }` — no alt.

**Options:**

- **(a) Add `coverImageAlt` field** — `string`, optional but recommended for a11y.
- **(b) Use `title` as fallback alt** — works for SEO + a11y baseline.

**My recommendation:** (b) for now (use `title` as fallback). Add `coverImageAlt` only if accessibility audit flags it (low effort to add later).

✅ **Decided: (b) use `title` as fallback alt.** No new field.

### Ask 6 — Enforce that `articleType=event` requires an eventFact in body

**Today:** schema doesn't enforce this. Editors can publish an `articleType=event` article with no `eventFact` in body — the hero then has no event data (no date, no location, no ticket CTA) and degrades to a plain announcement-style hero.

The same theoretical concern applies to `articleType=transfer` without a `transferFact` in body.

**Options:**

- **(a) Add a custom Sanity validator** that checks: when `articleType=event`, body must contain ≥1 `eventFact`. Same for transfer.
- **(b) Render-time graceful degradation** — render a minimal hero (kicker + title + dek + CTA) when the type-specific fact block is missing. No editor warning.
- **(c) Studio warning only** — soft hint via custom input, no validation block.

**My recommendation:** (a). Editors should not be able to publish an event article without an event fact — the article is then meaningless to the hero. Same logic for transfer. Adds 2 small validators, prevents render fallback bugs.

✅ **Decided: (a) enforce.** Sanity validators on `article.body`:

- When `articleType=event` → body must contain ≥1 `eventFact` block.
- When `articleType=transfer` → body must contain ≥1 `transferFact` block.

**BLOCKING requirement** for implementation: validators must land in the same schema migration as the `lead` field. Editors cannot publish an event/transfer article without the data the hero needs.

### Ask 8 — Cover image: required for ALL article types?

**Direction (2026-05-05):** owner direction is to require `coverImage` across all article types, replacing the StampBadge artefact in the announcement variant — the image becomes the hero's right-column artefact for every variant.

**Today:** `coverImage` is optional (no `r.required()` validator).

**Implications:**

- **Schema migration:** every existing article without a coverImage needs to receive one before the validator can land. Audit count + backfill plan needed.
- **Editor friction:** announcements often have no natural visual (board statements, schedule changes). Forcing an image either adds editor work each time or invites stock/placeholder uploads.

**Options:**

- **(a) Hard-required** — `r.required()` on coverImage. Editor must upload one for every article. Strongest enforcement.
- **(b) Required + Studio default-image picker** — schema requires it, but Studio offers a curated library of generic defaults (club crest, kantine, generic stadium, paper texture). Editor can pick a default when they don't have a specific photo. Reduces friction while keeping designs always image-led.
- **(c) Optional + render-time fallback** — `coverImage` stays optional in schema; the EditorialHero renderer falls back to a curated default when missing. Visually identical to "always required" without the migration / friction.

**My recommendation:** **(c) optional + render-time fallback.** Cleanest editor experience, no migration headache, no risk of editors uploading random images just to satisfy the validator. The renderer picks a default from a small in-codebase set keyed off articleType (e.g. `default-images/announcement.jpg`, `default-images/transfer.jpg`). The visual contract — "every hero has an image" — holds without the schema lock-in.

**(b)** is acceptable too if you prefer hard schema enforcement; just adds Studio plumbing for the default picker.

**(a)** is what the user direction literally asks for, but I want to flag (b/c) as alternatives before locking — the friction tradeoff is real.

✅ **Decided: (a) hard-required.** `coverImage` becomes required on `article` schema (`validation: (r) => r.required()`). Editor must upload an image for every article. **BLOCKING schema migration.**

**Migration plan:**

1. Audit existing dataset (staging + production) for articles where `coverImage` is empty. Output a count + slug list.
2. Editorial team backfills missing coverImages BEFORE the schema validator deploys. Anything left at deploy time will block re-publish until the editor adds a coverImage.
3. Add a one-shot migration script under `apps/studio/migrations/<name>/index.ts` that lists offenders for the editorial team. Per memory `feedback_sanity_migrations`: run staging first, audit, then production.
4. Description copy on the field (Dutch) clarifies the contract: _"Verplichte cover-afbeelding (16:9 landschap). Wordt overal gebruikt — homepage, news cards, hero, social shares. Eén upload per artikel."_

### Ask 9 — Title emphasis: how does an editor mark "the green word"?

**Where it shows up:** every redesign mockup has `EditorialHeading` with one word in italic + jersey-deep — e.g. _"De **kantine** blijft open"_, _"Werken aan de **hoofdtribune**"_. This is a strong visual signature.

**Today:** no mechanism. `article.title` is `type: "string"` — plain text only. Mockups have hard-coded `<em>` in HTML; in production, editors would have no way to mark the accented word.

Per memory `feedback_inline_emphasis_via_portable_text`: when a field needs optional inline emphasis, use a constrained Portable Text + custom decorator mark; never substring matching. Same pattern was locked for `<QASectionDivider>` in Checkpoint A.

**Options:**

- **(a) Convert `title` to constrained Portable Text + Accent decorator.** Single block, no styles, no annotations, ONE custom decorator named `accent`. Editor selects word, clicks Accent button, that span renders italic + jersey-deep. **Cost:** every existing article's string title needs migration to single-block PT. Every renderer (cards, hero, OG meta, search results, sitemap, JSON-LD, share previews) needs to switch from `article.title` (string) to PT-aware rendering or a `serializeTitle(title): string` helper for non-display contexts.
- **(b) Drop emphasis from the title.** Title renders plain (or always italicises the LAST word, predictable rule). Cheap to ship; redesign loses one of its visual signatures.
- **(c) Add a separate `titleAccent` string field** — editor types the substring to highlight. **VIOLATES memory rule** (`feedback_inline_emphasis_via_portable_text`) — not an option.

**My recommendation:** **(a).** Title emphasis IS the redesign's signature; dropping it weakens the visual identity. Pattern is identical to QASectionDivider's Accent decorator (already shipping in Phase 3 A). Migration is bounded and one-shot.

✅ **Decided: (a) Portable Text + Accent decorator.** **BLOCKING schema migration.**

**Schema definition (target shape):**

```typescript
defineField({
  name: "title",
  title: "Title",
  type: "array",
  of: [
    {
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [],
      marks: {
        decorators: [{ title: "Accent", value: "accent" }],
        annotations: [],
      },
    },
  ],
  validation: (r) =>
    r
      .required()
      .max(1)
      .custom((blocks) => {
        // Single block, must contain text
        const text = blocks?.[0]?.children?.map((c) => c.text).join("") ?? "";
        return text.trim().length > 0 ? true : "Titel mag niet leeg zijn.";
      }),
  description:
    "Houd de titel kort en krachtig (richtlijn: ~60 tekens). Selecteer één woord en klik op 'Accent' voor de groene cursief.",
});
```

**Migration plan:**

1. Migration script (idempotent) walks every `article` document and converts `title` (string) → single-block PT (no accent decorator applied — editors add it manually post-migration when they want emphasis).
2. Run staging first, audit (spot-check Studio that titles still render, run published-article smoke tests), then production.
3. **Code migration is the bulk of the work** — every consumer of `article.title` (string) must switch:
   - **Display contexts:** PT-aware renderer (cards, hero EditorialHeading, OG meta image rendering if visual). Use a small `<TitlePortableText>` component.
   - **Plain-string contexts:** add a `serializeTitle(title: PortableTextBlock[]): string` helper that flattens the PT to plain text. Used by JSON-LD, sitemap, search-result snippets, plain text alt fallback (Ask 5), RSS, OG meta description, share previews.
4. Audit existing call-sites: grep for `article.title` and update each.

**Editor workflow in Studio:**

- Editor types the title.
- Optionally selects one word and clicks an "Accent" toolbar button.
- The accent renders as italic + jersey-deep on the front-end via the EditorialHeading PT serializer.
- No accent applied → title renders plain (no emphasis).

### Ask 7 — Standalone `event` document and `articleType=event` article — link them?

**Today:** independent surfaces. `article.relatedContent[]` optionally references an event document, but no required link.

**Options:**

- **(a) Add an optional `linkedEvent` reference** to article schema (similar pattern to #1470's `linkedMatch`) — when present, the EditorialHero can show "see this event in the calendar" link, and the event detail page can show "read article" link.
- **(b) Keep independent.** Editors duplicate data when they want both.

**My recommendation:** (b) for Phase 3 B. The reverse-discovery pattern (event detail page lists articles tagged for this event) is a Phase 6 concern alongside the event detail page rebuild. For Phase 3 B, the EditorialHero `event` variant only needs the eventFact in body.

✅ **Decided: (b) keep independent.** No `linkedEvent` reference field. Phase 6 revisits.

---

## Decision gate

Before drilling any of the four article variants:

- [x] **Ask 1 (dek):** add `lead` (or `summary`) optional string field — **BLOCKING** schema migration alongside Phase 3 B EditorialHero. Body-first-paragraph fallback when empty. _(2026-05-05)_
- [x] **Ask 2 (author):** keep byline row visible; default stub `"Door redactie"` constant for now; add optional `author` string field as a **non-blocking follow-up**. _(2026-05-05)_
- [x] **Ask 3 (reading time):** auto-computed via existing `computeReadingTime()` (`apps/web/src/lib/utils/reading-time.ts`). Render in kicker secondary slot, hide when undefined. _(2026-05-05)_
- [x] **Ask 4 (photo credit):** drop. _(2026-05-05)_
- [x] **Ask 5 (image alt):** use `title` as fallback alt. _(2026-05-05)_
- [x] **Ask 6 (enforce facts in body):** **(a) enforce.** Sanity validators — `articleType=event` requires ≥1 `eventFact`; `articleType=transfer` requires ≥1 `transferFact`. **BLOCKING.** _(2026-05-05)_
- [x] **Ask 7 (link standalone event to article):** keep independent. _(2026-05-05)_
- [x] **Ask 8 (coverImage required for all articles):** **(a) hard-required.** `r.required()` validator on `article.coverImage`. Audit existing dataset + backfill before deploy. **BLOCKING.** _(2026-05-05)_
- [x] **Ask 9 (title emphasis schema):** **(a) Portable Text + Accent decorator.** Title becomes constrained PT (single block, no styles, one custom `accent` decorator). Migration converts all existing string titles to single-block PT. Every consumer (cards, hero, OG, JSON-LD, sitemap, search) updates. **BLOCKING.** _(2026-05-05)_

## Schema followups (capture in Phase 3 PRD + GitHub issue split)

**BLOCKING — must land in the same schema migration that ships alongside Phase 3 B EditorialHero:**

1. **`article.lead`** — optional `string` (~280 char). Description (Dutch): _"Korte samenvatting boven het artikel — toont op homepage, news cards, hero, social shares. Laat leeg om de eerste alinea van de body te gebruiken."_ Folds into `ARTICLE_BY_SLUG_QUERY_RESULT` projection. Useful well beyond the hero — fills a long-standing gap on news cards and OG meta.
2. **`article.body` validator: eventFact required when `articleType=event`** — custom validator on the `body` field that checks `body[]._type` for at least one `eventFact` when `articleType==='event'`. Error message (Dutch): _"Een event-artikel heeft minstens één Event-fact nodig in de inhoud — voeg er één toe via het + menu in de body editor."_
3. **`article.body` validator: transferFact required when `articleType=transfer`** — same pattern. Error message: _"Een transfer-artikel heeft minstens één Transfer-fact nodig in de inhoud — voeg er één toe via het + menu in de body editor."_
4. **`article.coverImage` becomes required** (Ask 8) — `validation: (r) => r.required()`. Description updated to reflect 16:9 contract. Pre-deploy audit + backfill of existing articles missing a coverImage.
5. **`article.title` converted to constrained Portable Text** (Ask 9) — single block, one `accent` decorator, no other marks/styles/annotations. Migration script + every consumer of `article.title` switches to PT-aware rendering or plain-text via `serializeTitle()` helper.

**Non-blocking — can ship in a later phase:**

- `article.author` — optional `string` (or eventually `reference -> staffMember`). Default rendered byline is `"Door redactie"` constant; when `author` is set, use that instead. No data migration required (defaults to undefined for existing articles).

## Sanity migration requirement

The 3 blocking schema changes ship as a single migration:

- **`packages/sanity-schemas/src/article.ts`** — add `lead` field, add 2 body-level validators
- **Migration script:** `apps/studio/migrations/<name>/index.ts` — idempotent. No data migration needed for `lead` (new optional field). The body validators are render-time enforced; existing articles in violation surface as Studio errors that editors fix at next edit. **For safety:** the migration can include a one-shot Studio query/audit script flagging any existing articles where `articleType in [event, transfer]` and body has no matching fact block — editors fix before deploy.
- **Run order:** staging dataset first, audit, then production. Per memory `feedback_sanity_migrations`.
