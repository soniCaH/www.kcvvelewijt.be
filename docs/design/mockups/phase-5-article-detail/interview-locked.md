# Interview body touches — locked (drill 5.d-int)

**Drill:** 5.d-int · Two rounds · #1787
**Locked:** 2026-05-18 by @climacon
**Mockups:** `5d-int/round-1-qa-number-style-comparisons.html`, `5d-int/round-2-credits-layout-comparisons.html`

---

> ⚠️ **Supersedes** the legacy `interview-locked.md` in `phase-3-b-editorial-hero/` for the `<QASection>` row composition + closing credits block. Phase 3-b's hero + `<SubjectsStrip>` locks still stand unchanged.

## Round 1 — Q&A row number style

### Decision

**D — no number.** Each Q&A row drops the left-column ordinal marker. The row reads as monogram avatar + mono speaker tag + italic display-sm 600 question + body-md answer. Sequence information lives in natural reading order only.

### Rationale

- The 5.d2 monogram avatar (locked at row scale) already carries strong left-edge weight.
- Display numerals (A) felt like chapter headings — too loud for a 6-question Q&A.
- Mono index `01 ·` (B) doubled with the mono speaker tag below — visual stutter.
- Blockquote glyph (C) repeated against the inline answer `"…"` — also stuttery, and loses ordinal sequence anyway.
- D's grid collapses cleanly (avatar + body, 2 columns) and reads as a transcript.

### Locked component shape

```text
<QARow>
  ┌─────────┐
  │  [L]    │  monogram avatar (5.d2 D lock) · 32px
  │         │
  │  LARS · AANVALLER          ← mono speaker tag
  │  Wat was het moment …      ← italic display-sm 600 question
  │  "Halfweg de eerste …"     ← body-md answer
  └─────────┘
   ↑ dotted ink-muted divider between rows (Phase 3-b)
```

API impact on `<QARow>`:

- `number` prop is dropped (or defaults to `undefined` and never rendered).
- Grid collapses from 3-col to 2-col (avatar + body).
- No new component, no new asset.

---

## Round 2 — `<ArticleCredits>` block layout (renamed from `<InterviewCredits>`)

### Decision

**B — centered block with 1px ink rules top + bottom.** Plus: schema-extension path to back the credit fields with real data.

### Rationale

- Centered framed block reads as a deliberate "end-credit panel" — a clear typographic finale to long-form content, distinct from the article body's flow.
- Option A (left-aligned key/value list) felt like document metadata, not a credit roll.
- Option C (sidebar) introduced a structural delta — the article body would have to step outside `--container-prose` at the end. Heavy machinery for a 4-line block.
- Option D (inline with EndMark) read cinematic but lost the key/value contrast and wrapped messily for long credit lists.

### Component rename

The component is **`<ArticleCredits>`**, not `<InterviewCredits>`. The user observed that this credit-roll vocabulary should be reusable for a future **photo-gallery variant** (and potentially other long-form variants). The shape is variant-agnostic — interview is just its first consumer.

- Rendered conditionally by ANY variant when at least one of `author`, `photographer`, or `subjects[]` is populated.
- Interview variant always renders (subjects[] is required by `validateSubjectsCount`).
- Other variants render only when the editor has populated credit fields.

### Schema additions (the data-audit fix)

**Two new optional `article` fields** — both string, no validation (any non-empty text):

- `article.author` — _"Auteur (Door)"_ — shown both in `<EditorialByline>` (hero) and `<ArticleCredits>` (footer). Defaults to "Door redactie" in the byline when blank; omitted from credits when blank.
- `article.photographer` — _"Fotograaf (Beeld)"_ — shown in `<ArticleCredits>` only. Omitted from credits when blank.

`subjects[]` (already on schema) supplies the **Met** line. `publishedAt` (already on schema) supplies the **Gepubliceerd** line.

**No `location` field added** — location info can be folded into the article body if relevant. Keeps the schema lean.

This is a **deliberate exception** to the PRD's "0 schema migrations" guarantee. Documented in PRD §5 schema migrations.

### Locked layout (B with conversational Dutch labels)

```text
                  ─────────────────────────────────
                  Door            Tom De Smet
                  Met             Lars Janssens, Wim Peeters
                  Beeld           An Verheyden
                  Gepubliceerd    17 mei 2026
                  ─────────────────────────────────
```

- **Container:** prose width (`--container-prose: 680px`), centered.
- **Frame:** 1px ink rules top + bottom (no side rules, no background fill — sits on cream).
- **Padding:** 24px top/bottom inside the rules; 28px side padding to match prose body.
- **Typography:**
  - Key: mono caps `--font-mono`, 10px, `letter-spacing: 0.16em`, `color: --color-ink-muted`.
  - Name: italic Freight Display 700, 17px, `color: --color-ink`.
  - Date: same vocabulary as Key (mono caps, ink-muted).
- **Inline layout:** each row is `<KEY>` + `<NAME>` on one centered line (single column, no two-column alignment grid).
- **Empty-row behaviour:** drop the row entirely when its source field is blank. A credits block with only `Met` + `Gepubliceerd` still renders (interview minimum); a credits block with all four lines fills the frame.
- **Field render order:** Door · Met · Beeld · Gepubliceerd (regardless of which fields are populated).

### Labels (locked Dutch vocabulary)

| Source field   | Label            | Notes                                                                                                                             |
| -------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `author`       | **Door**         | "Door redactie" remains the fallback in `<EditorialByline>` only; `<ArticleCredits>` omits the row when blank.                    |
| `subjects[]`   | **Met**          | Names joined with `, `. For N=2 we considered italic display "&" but kept the comma to match the multi-line credit-list register. |
| `photographer` | **Beeld**        | "Beeld" reads more inclusive than "Foto's" — works for static photos AND any future moving-image credit.                          |
| `publishedAt`  | **Gepubliceerd** | Date formatted as `d MMMM yyyy` per the rest of the site (`17 mei 2026`).                                                         |

### Placement in the article shell

```text
<PortableText body />
<PullQuote interspersed />
<EndMark flourish="star" />
<ArticleCredits />          ← interview variant + future photo-gallery variant
<VerderLezenRow />
```

The credits sit **between** EndMark and VerderLezenRow. Other variants (announcement / transfer / event / match) render `<ArticleCredits>` only when credit fields are populated — otherwise they skip to VerderLezenRow as today.

---

## Future photo-gallery variant reuse

When a `photoGallery` (or similar) `articleType` lands, it consumes `<ArticleCredits>` verbatim. Expected fill:

- **Door** = editorial author of the gallery copy (if any).
- **Beeld** = `photographer` — the main credit driver for galleries.
- **Met** = `subjects[]` (people in the gallery).
- **Gepubliceerd** = `publishedAt`.

No new fields, no new component — the rename + schema-extension here pays the cost once and supports gallery later.

---

## What this drill resolves

- ✅ Q&A row number style — D (no number).
- ✅ Credits block layout — B (centered framed block).
- ✅ Credits component naming — `<ArticleCredits>` (variant-agnostic).
- ✅ Credits data source — schema extension with two optional fields (`author`, `photographer`) on `article`.
- ✅ Credits label wording — `Door · Met · Beeld · Gepubliceerd` (conversational Dutch).
- ✅ Editor workflow — all fields optional; rows drop when blank.

## What this drill does NOT decide

- **`<QARow>` avatar slot** — already locked by 5.d2 (monogram at row scale).
- **`<QASectionDivider>` major-break treatment** — already locked by 5.d3 (Phase 3-b thin-rule subtitle stands).
- **Photo-gallery articleType** — does not exist yet; the credits component is forward-compatible but the variant itself is out of scope for Phase 5.
- **Location field** — explicitly rejected. Location info goes in the article body if needed.

## Net new primitives / schema

- **Schema:** two new optional `string` fields on `article` (`author`, `photographer`). **Deliberate exception to PRD §1 "0 migrations expected".**
- **Component:** `<ArticleCredits>` (variant-agnostic; renamed from the original `<InterviewCredits>`).
- **No new design-system primitive** — composes from existing typography + 1px ink rules.

## Downstream impact

- **#1795 (5.B.int)** — title still says "InterviewCredits"; body needs editing to reference `<ArticleCredits>` and the new schema fields. Field labels Door/Met/Beeld/Gepubliceerd land in the implementation.
- **PRD §1, §4, §5, §8, §9, §10, §11** — all need updates (schema exception, component rename, credits scope expansion to all variants conditionally).
- **`<EditorialByline>`** — should consume `article.author` once the field lands (currently hardcoded fallback per Phase 3-b interview-locked.md).

## Source-of-truth

- Mockup HTML: `5d-int/round-1-qa-number-style-comparisons.html`, `5d-int/round-2-credits-layout-comparisons.html`
- Schema diff: `packages/sanity-schemas/src/article.ts` (`author` + `photographer` defineFields).
- Memories consumed: `feedback_design_data_audit`, `feedback_reuse_approved_primitives`, `feedback_no_magazine_chrome`, `feedback_monolabel_cream_full_opacity`.
- Phase 3-b lock: `docs/design/mockups/phase-3-b-editorial-hero/interview-locked.md` (hero + SubjectsStrip stand unchanged).
