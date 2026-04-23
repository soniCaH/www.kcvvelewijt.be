# Restructuring legacy interviews

**Audience:** Sanity editors with write access to the article collection.
**Prerequisite:** An existing article you recognise as an interview — currently stored as plain prose with bold questions and italic answers.

## Why this exists

The article editor now supports four types: `announcement`, `interview`, `transfer`, `event`. Legacy articles predate this field and were all backfilled to `announcement`. Articles that are actually interviews should be manually promoted so the site renders the interview hero + attribution, and search engines see the correct `NewsArticle` + `about: Person` structured data.

The `Interview`-style tagged articles surfaced by `audit-interview-candidates` are the candidates. Run the audit from `apps/web/`:

```bash
SANITY_DATASET=staging node scripts/audit-interview-candidates.mjs
```

The report prints each candidate's slug, title, and matched tags. Open them in Studio one at a time and follow the steps below.

---

## Before / after

### Before — legacy interview

The body is a Portable Text array of plain blocks, with questions emphasised via **bold** and answers in regular prose (sometimes also _italic_):

```text
Body:

  [Paragraph, bold]  Hoe kijk je terug op het seizoen?

  [Paragraph]        Met een dubbel gevoel. We zijn vijfde geëindigd
                     terwijl we naar promotie speelden.

  [Paragraph, bold]  En de match tegen Wezemaal?

  [Paragraph]        Die mag ik voor geen geld ooit nog eens spelen.
                     Zeven spelers ziek de week ervoor.

  …
```

### After — interview with `qaBlock`

```text
Article type:  interview
Subject:       ►  Kind: player
                  Player: Max Breugelmans (#9, Middenvelder)

Body:

  [Q&A]   Hoe kijk je terug op het seizoen?
          Tag: standard
          ► Met een dubbel gevoel. We zijn vijfde geëindigd terwijl we
            naar promotie speelden.

  [Q&A]   En de match tegen Wezemaal?
          Tag: quote             ← isolates a pull quote in the body
          ► Die mag ik voor geen geld ooit nog eens spelen. Zeven
            spelers ziek de week ervoor.

  …
```

The interview hero now shows the article-type kicker (`INTERVIEW | #9 · MIDDENVELDER` for players with a jersey + position; just `INTERVIEW` for staff / custom subjects or players without those fields), the subject name as subtitle, and the cover image as a 4:5 portrait. Each `quote`/`key`-tagged Q&A pair renders with a decorative glyph + attribution from `article.subject`.

---

## Step-by-step in Studio

1. **Open the article** in Studio (staging first; repeat on production once happy).
2. **Set Article type** to `Interview`.
3. **Fill Subject**:
   - **Kind** → `player`, `staff`, or `custom`.
   - For `player`: link to the player document by name/number.
   - For `staff`: link to the staff member document.
   - For `custom` (external guest): type the name + role; upload a photo.
     The subject drives the hero kicker (jersey + position), subtitle, and the pull-quote attribution on `key`/`quote` Q&A pairs.
4. **Rebuild the body with Q&A pairs**. For each legacy paragraph pair (bold question → plain answer):
   - Delete the two legacy paragraphs.
   - Insert a **Q&A pair** block.
   - Paste the question (short, ends with a question mark).
   - Paste the answer into the answer field. Keep it flat prose — no headings, no lists (the schema enforces that). Bold, italic, underline, and inline links are all kept.
   - Set the **Tag** intentionally:
     - `standard` — default. Regular Q&A flow.
     - `key` — highlighted Q&A pair (boxed, attributed).
     - `quote` — standalone pull quote with decorative glyph; use sparingly, once per article.
     - `rapid-fire` — short back-and-forth; consecutive rapid-fire pairs are visually grouped in the renderer.
5. **Keep** any paragraphs that are editorial framing (intro, outro, scene-setting) as plain Portable Text blocks above/below/between the Q&A pairs. Not everything has to become a `qaBlock`.
6. **Save as draft, preview, then publish**.

## Don'ts

- **Don't auto-parse**. Bold-first / italic-second is a convention, not structure — bolded callouts mid-answer would be mis-detected as questions. Manual re-entry is the only safe option.
- **Don't leave `articleType` as `announcement`** on the theory that "it still renders". The announcement template doesn't show the subject or qaBlock treatments, and the JSON-LD `about: Person` branch only fires for interviews.
- **Don't skip the subject field**. Without it, the hero collapses to `INTERVIEW` + title only, and all `key`/`quote` pairs render without attribution.

## Questions

Post in `#website-editors` on Slack or tag Kevin on the article document in Studio.
