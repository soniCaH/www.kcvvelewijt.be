# Interview — Multi-Subject (Duo + Panel) Design Review

**Issue:** [#1358](https://github.com/soniCaH/www.kcvvelewijt.be/issues/1358) — `feat(news): multi-subject interview support (duo + panel)`
**Milestone:** `article-detail-redesign` (extension beyond Phases 1–8)
**Status of review:** spec predates the merged Phases 1–7 shipping state; this review reconciles it.
**Reviewed on:** 2026-04-23

---

## Purpose

Phases 1–7 of `docs/prd/article-detail-redesign.md` have shipped to `main`. Issue #1358 extends Phase 3 (single-subject interview, #1329) to duo and panel interviews. The spec is labelled `ready` but was authored before the downstream phases finalised their patterns. This document reviews the spec against the merged architecture and records the decisions that need to be folded back into the issue before implementation.

## Verdict

The three-option exploration in the issue's rationale trail is sound. **Option A (`subjects[]` array + optional per-pair `respondent`) with Option C's side-by-side portrait layout for N=2 remains the right path.** The merged code supports this direction — `InterviewHero`, `SubjectPhoto`, `SubjectAttribution`, and `QaPair*` components are all already structured around a single resolved subject passed down as a prop, so swapping that prop source from `article.subject` to a resolved `respondent` (from `article.subjects[]`) is mechanically straightforward.

The spec is ~85% ready. Seven revisions are needed before implementation. Five were decided during this review; two are safe recommendations that need no further input.

---

## Revisions to fold into #1358

### R1 — Hero kicker: always bare for N≥2 (decided)

**Current spec:** N=1 shows `INTERVIEW | #9 · MIDDENVELDER`; N=2 shows bare `INTERVIEW`; N=3+ shows `INTERVIEW | PANEL`.

**Decision:** drop the `| PANEL` suffix entirely. N=1 keeps the meta slot (`| #9 · POSITION`). N≥2 is always bare `INTERVIEW`. The subtitle row (Dutch-Oxford-joined subject names) carries the panel character on its own.

```text
N=1:  ────  INTERVIEW  |  #9 · MIDDENVELDER
N=2:  ────  INTERVIEW
N=3:  ────  INTERVIEW
N=4:  ────  INTERVIEW
```

**Rationale:** the half-and-half rule in the original spec (N=2 bare, N=3+ labelled) was the least defensible of the three options. A consistent rule matches the kicker-bar style used across `AnnouncementHero` and makes the `buildKickerParts` helper simpler.

**AC changes:**

- `InterviewHero` kicker composition becomes: `INTERVIEW | #N · POSITION` **only when** `subjects.length === 1 && subjects[0].kind === 'player'` (fall-through rules for missing meta unchanged from Phase 3). All other cases render bare `INTERVIEW`.
- Remove the `| PANEL` requirement from the hero spec section.
- Storybook/tests drop the panel-label assertion.

### R2 — respondent is required (blocks publish) for key/quote on N≥2 (decided)

**Current spec:** Studio surfaces a yellow warning; publish is allowed; runtime falls back to `subjects[0]`.

**Decision:** respondent is **required** when `articleType === 'interview'` **and** `subjects.length >= 2` **and** `tag in {'key','quote'}`. Publish is blocked until set. No runtime fallback needed — the schema guarantees a resolved respondent for every attributed pair once published.

**Rationale:**

- Simpler runtime: `QaPairKey` and `QaPairQuote` render from a resolved respondent directly (typed as non-null on multi-subject articles).
- Stronger editorial contract: the attribution lie scenario ("every pulled quote credited to subjects[0]") becomes structurally impossible.
- Trade-off: editors get a publish-blocking error instead of a warning. Acceptable given the low volume of interview articles and the copy ("Kies wie dit gezegd heeft") telling them exactly what to do.

**AC changes:**

- Schema validator on `qaPair.respondentKey` (see R2a below for the storage shape) uses `validation: Rule => Rule.custom((val, ctx) => ...)` walking up to the parent `article` document via `ctx.document`. Rules: (a) `subjects.length >= 2 && tag in {'key','quote'} && !val` → error with copy "Kies wie dit gezegd heeft". (b) `val && !subjects.some(s => s._key === val)` → error "Selected respondent is no longer one of the article subjects" (guards against subject deletion after the pair was authored).
- Unit test: schema-level validator test exercising pass/fail for each combination of N, tag, and key presence/mismatch.

### R2a — respondent storage: local `_key` pointer + custom Studio picker (decided, supersedes "reference" in original spec)

**Constraint discovered during implementation:** the original spec and first revision of this review both said `qaPair.respondent` is a Sanity `reference` to a subject. That's not achievable — `subject` is an object type embedded in `article.subjects[]`, not a document, and Sanity references can only target documents. References to inline array items within the same document don't exist.

**Two options considered:**

1. **Duplicate the subject object** on qaPair (`type: 'subject'` field). Works mechanically but requires the editor to re-select kind + playerRef from the full global player list on every `key`/`quote` pair — for a realistic duo interview (3 key + 2 quote pairs) that's 5 re-selections through a ~300-player list. Also loses the invariant that the respondent matches one of the article's subjects.
2. **Local `_key` pointer + custom Studio picker** (chosen).

**Chosen shape:**

```typescript
qaPair.respondentKey?: string  // _key of a subjects[] item
// components: { input: RespondentPicker }  // reads doc.subjects[] via useFormValue
// validator: required when doc.subjects.length >= 2 && tag in {key,quote}
//            AND val must match some subjects[]._key
// hidden: tag in {standard,rapid-fire}
```

**Runtime resolution:**

- GROQ returns `respondentKey` as a scalar string. No server-side deref.
- `SanityArticleBody` (or a helper at the repository boundary) performs the lookup: `article.subjects.find(s => s._key === pair.respondentKey)`.
- The resolved subject is passed as a prop to `QaPairKey` / `QaPairQuote`.

**Why this wins:**

- Editor picks once from a 2–4 item dropdown scoped to the article's subjects, not from the global player pool.
- Validator enforces "respondentKey exists in subjects[]" — structurally impossible to attribute a quote to a non-subject.
- No data staleness for `kind=custom` subjects (no duplication; the editor-maintained subject data lives at article.subjects[] only).
- Aligns with the planned Studio UX rework (`project_sanity_studio_ux_rework`).

**Cost:** ~60–100 LOC custom Studio input component at `packages/sanity-schemas/src/components/RespondentPicker.tsx` (or equivalent workspace package if Studio UI is separated). Per `project_sanity_studio_ux_rework`, this is the direction the codebase is moving anyway.

**Note on the package boundary:** `packages/sanity-schemas` is intentionally React-free (per project memory). The `RespondentPicker` React component must live in a workspace package that Studio imports — either `packages/sanity-studio` (planned Studio UI package) or the Studio app itself. Decide at implementation: if `packages/sanity-studio` already exists, put it there; otherwise, put it in `apps/studio-staging/components/` first, co-locate in `apps/studio/components/` when the schema lands, and plan the package extraction in a follow-up.

### R3 — Hide `respondent` field when tag is not key/quote (recommendation, no input needed)

The issue currently adds `respondent` to every `qaPair` and notes "`respondent` can still be stored on these pairs for future use (e.g. a mini-chip showing `— Max` above the answer in a future polish pass)."

**Recommendation:** add `hidden: ({ parent }) => !['key','quote'].includes(parent?.tag)` to the `respondent` field. Until the mini-chip ships, editors see the field only where it renders. Zero runtime cost; removes a trap.

If and when the mini-chip ships, the `hidden` predicate gets extended to include `standard` (and/or `rapid-fire`).

### R4 — GROQ: SUBJECT_PROJECTION on subjects[] + respondentKey scalar on qaPair (decided, revised from earlier "eager deref")

**Constraint:** the earlier version of this review specified `respondent->` eager dereference inside `body[]`. That is not viable given the corrected storage shape in R2a — `respondentKey` is a plain string, not a Sanity reference. There is nothing for GROQ to deref.

**Decision:**

1. Extract a shared `SUBJECT_PROJECTION` GROQ fragment at `apps/web/src/lib/repositories/article.repository.ts` matching the existing `article.subject` projection (kind + playerRef/staffRef/custom branches with transparent/psdImageUrl, photoUrl, customPhotoUrl). Apply it to **`article.subjects[]`** only.
2. For `body[_type == 'qaPair']` entries, project `respondentKey` as a scalar — no deref.
3. Resolution happens at the repository boundary (or in `SanityArticleBody` when passing props to `QaPairKey`/`QaPairQuote`): `article.subjects.find(s => s._key === pair.respondentKey)`.

```groq
// Shared fragment
const SUBJECT_PROJECTION = `{
  _key,
  kind,
  playerRef->{
    _id, firstName, lastName, jerseyNumber, position,
    "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
    "psdImageUrl":         psdImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
    psdId
  },
  staffRef->{
    _id, firstName, lastName, role,
    "photoUrl": photo.asset->url + "?w=600&q=80&fm=webp&fit=max"
  },
  customName, customRole,
  "customPhotoUrl": customPhoto.asset->url + "?w=600&q=80&fm=webp&fit=max"
}`

// Applied on subjects[]; respondentKey returned as scalar on qaPair
body[]{
  ...,
  _type == 'qaPair' => { ..., respondentKey }
},
subjects[] ${SUBJECT_PROJECTION}
```

**AC changes:**

- Acceptance criterion under "Runtime (apps/web)" becomes: the GROQ projection extracts `SUBJECT_PROJECTION`; `subjects[]` uses the fragment; `body[_type == 'qaPair']` projects `respondentKey` (scalar).
- Helper: `resolveRespondent(pair, article)` returns `article.subjects.find(s => s._key === pair.respondentKey) ?? null`. Non-null guaranteed when the pair is `key`/`quote` on an N≥2 article (schema validator guards this); null otherwise.

### R5 — Storybook: both atomic and composition layers (decided)

The merged tree uses two distinct title namespaces:

- `Features/Articles/<Component>` — atomic component stories (`InterviewHero` has 6 today at `apps/web/src/components/article/InterviewHero/InterviewHero.stories.tsx:52`).
- `Pages/Article/<Template>` — full-page composition stories (`InterviewTemplate` at `apps/web/src/components/article/InterviewTemplate/InterviewTemplate.stories.tsx:30`).

**Decision:** add variants at **both** layers.

- `Features/Articles/InterviewHero/Single`, `/Duo`, `/Trio`, `/Panel` — hero-only rendering for each N.
- `Pages/Article/Interview/Single`, `/Duo`, `/Trio`, `/Panel` — whole-article composition with the full `qaBlock` suite threaded through the PT body.

**AC changes:** AC in "Seeds & Stories" section becomes 8 stories, not 4. The existing single-subject `InterviewHero` stories can be renamed/normalised under the new `Features/Articles/InterviewHero/Single` grouping or left as-is (editor discretion).

### R6 — Analytics: minimum `subject_count` dimension (decided)

**Current spec:** no analytics section.

**Decision:** extend the existing `article_view` event payload with a single `subject_count: 1 | 2 | 3 | 4` dimension. No subtype string, no per-respondent event. Smallest GTM/GA4 diff that still lets editorial slice engagement by interview format.

**AC additions:**

- Extend the existing `article_view` data-layer push (see `apps/web/src/lib/analytics/` after Phase 7 merged under #1333) with `subject_count`. Non-interview articles push `subject_count: null` (or omit; follow whatever pattern the merged Phase 7 uses for optional dimensions).
- GTM tag configuration: add the new custom dimension to the existing `article_view` GA4 event tag.
- GA4 report: add `subject_count` as a custom dimension in the property configuration.
- Test: `article_view` integration test asserts `subject_count` is set to `subjects.length` on interview articles.

### R7 — Runtime type for `body[]` narrows `qaPair` with `respondentKey` scalar (recommendation, revised)

The current `body[]` type is `PortableTextBlock[]`. After adding `respondentKey` to `qaPair` that generic type is too loose — `SanityArticleBody`'s PortableText components will be casting on every access.

**Recommendation:** introduce a `QaPairBlock` type extending the generic PT block:

```typescript
interface QaPairBlock {
  _type: "qaPair";
  _key: string;
  question: string;
  answer: PortableTextBlock[];
  tag: "standard" | "key" | "quote" | "rapid-fire";
  respondentKey?: string; // present only when tag in {key,quote}; required when subjects.length>=2
}
```

Narrow `body[]` as `Array<PortableTextBlock | QaPairBlock>` at the repository boundary. `SanityArticleBody` resolves `respondentKey` → `SubjectValue` via `article.subjects.find(...)` and passes the resolved value as a `respondent` prop to `QaPairKey`/`QaPairQuote`.

---

## Minor items (no input needed)

- **Defensive N=0 fallback.** Schema guarantees `subjects.length >= 1`, but runtime `InterviewHero` should still render gracefully (title + subtitle only, no portrait grid) if an interview document somehow arrives with `subjects: []`. One branch, no portrait frames.
- **Migration unit test.** The idempotent shape-detection branch of `apps/web/scripts/migrations/<timestamp>-interview-subject-to-subjects.ts` needs a unit test exercising: old shape → new; new shape → skipped; malformed shape → logged and skipped. Spec has acceptance criteria for the run; it doesn't require the test.
- **Seeds: re-verify fixture availability.** The N=2/3/4 seed plan depends on finding four PSD-clean players. Confirm availability before implementation starts; if three usable players aren't queued for retirement/farewell pieces, use player+staff combos for N=3/4 rather than block on data.
- **Ubiquitous language.** Add entries for `Subject` (retaining existing meaning: the person an interview is about) and `Respondent` (the subject who answered a specific pair). Lives at `docs/ubiquitous-language.md` — the glossary currently has no entry for either. Keeps the `subjects` / `respondent` distinction clear for future reviewers.

---

## Summary of AC changes to fold into #1358

Paste-ready deltas for the issue body:

**Under "Hero mocks" → "Typography":**

- Replace `The `| POSITION`segment only appears for N=1.`| PANEL` replaces it for N≥3. N=2 has no suffix.` with `The `| #N · POSITION`meta only appears when N=1 and the sole subject is a player. All other cases — N=1 non-player, N=2, N=3, N=4 — render bare`INTERVIEW`.`
- Strike every reference to `| PANEL` in the hero mocks.

**Under "`key` pair attribution" → "Multi-subject, `respondent` unset":** delete this subsection entirely. The required-publish validator makes this state unreachable.

**Under "Schema changes":**

- `qaPair.respondent?: reference to a subject` → keep the question-mark (optional in the schema) but add: `Required (validator) when the parent article has `subjects.length >= 2`and the pair's`tag`is`'key'`or`'quote'`. Hidden when `tag`is`'standard'`or`'rapid-fire'`.`

**Under "Acceptance criteria" → "Schema":**

- Replace the warning-based `respondent` AC with the required-based version (blocks publish).

**Under "Acceptance criteria" → "Runtime (apps/web)":**

- Remove: `New helper `resolvePairRespondent(pair, article)`returns`resolveSubject(pair.respondent) ?? resolveSubject(article.subjects[0])`.`
- Add: `GROQ `body[]`projection expands`\_type == 'qaPair'`entries with a full`respondent->{...}`subtree matching the existing`subject`projection shape. Share the GROQ fragment between`subjects[]`and`body[].respondent->`.`
- Add: `Runtime `body[]`type narrows`qaPair`blocks to a`QaPairBlock`type with a dereferenced`respondent`(or`null`when tag is`standard`/`rapid-fire` or N=1).`
- Add: `InterviewHero renders gracefully (title + subtitle only) when `subjects.length === 0`, even though the schema forbids it.`

**Under "Acceptance criteria" → "Seeds & Stories":**

- Storybook AC becomes 8 stories total: `Features/Articles/InterviewHero/{Single,Duo,Trio,Panel}` AND `Pages/Article/Interview/{Single,Duo,Trio,Panel}`.

**New section "Analytics":**

```markdown
## Analytics

- `article_view` event payload extended with `subject_count: 1 | 2 | 3 | 4` (null/omitted for non-interview articles, per the pattern established in #1333).
- GTM: custom dimension added to the existing `article_view` GA4 event tag.
- GA4 property: `subject_count` registered as a custom dimension.
- Test: `article_view` integration test asserts `subject_count === subjects.length` on interview articles.
```

**New section "Migration — testing":**

```markdown
- Unit test for the migration script exercising: old `{ subject }` → new `{ subjects: [subject] }`; already-migrated `{ subjects }` → skipped; malformed shape → logged and skipped.
```

**New section under "References":**

```markdown
- Design review: `docs/design/interview-multi-subject-review.md`
```

---

## Out of scope for #1358

- Mid-answer speaker switches (Option B / conversation blocks). Revisit only if editorial patterns emerge that genuinely require it.
- `standard` / `rapid-fire` attribution (the mini-chip idea). Can be picked up as a dedicated polish issue when the multi-subject format has shipped and editors have authored a handful.
- Per-respondent analytics events (the `interview_respondent_view` variant). Minimum dimension ships first; extend only if `subject_count` segmentation surfaces useful signal that demands finer granularity.
- Lifting the `subjects.length <= 4` cap. Dedicated design pass if editorial ever requests 5+.

---

## Next step

Update the #1358 issue body with the AC deltas above, then the issue is ready for implementation.
