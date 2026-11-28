# The /jeugd grid: what makes the twelfth tile

_2026-11-28, for #3911. Dated and frozen: cite it, do not revise it. Line numbers are on branch
`feat/issue-3911` at `45cb867ec`. "Live" means `https://www.kcvvelewijt.be`, fetched 2026-11-28._

## 1. How the 11 is made today

**11 = 8 pinned nav tiles + 3 Jeugd articles.**

- The page fetches articles with `limit: 3, category: "Jeugd"` —
  `apps/web/src/app/(landing)/jeugd/(index)/page.tsx:91-95`.
- The query keeps published articles whose `tags` contain `"Jeugd"`, newest first —
  `apps/web/src/lib/repositories/article.repository.ts:82-83`. The match is case-sensitive (#2965).
  Nobody picks the articles by hand: the three newest win.
- The grid has 8 hard-coded tiles in `NAV_CARDS` —
  `apps/web/src/components/jeugd/JeugdEditorialGrid/JeugdEditorialGrid.tsx:50-144`.
- `buildItemsFromHardcoded` puts the articles in slots 1, 3 and 5 and the nav tiles around them —
  `JeugdEditorialGrid.tsx:234-255`.
- A Sanity override (`jeugdLandingPage.editorialCards`) would replace all of this —
  `JeugdEditorialGrid.tsx:278-281`. No such document exists in production (#3427, checked 2026-10-07).
  The live grid matches the hard-coded order exactly (below), so the override is not in use.

**Live order, 2026-11-28** (links inside `#ontdek`):

|   # | Tile                                         | Kind    |
| --: | -------------------------------------------- | ------- |
|   1 | Opleiding initiator UEFA C 2027 (2026-11-26) | article |
|   2 | Word lid van KCVV                            | nav     |
|   3 | Nicotinezakjes niet toegelaten (2026-10-30)  | article |
|   4 | Onze opleidingsvisie                         | nav     |
|   5 | Herfststage 2026 (2026-10-01)                | article |
|   6 | Trainingen & ProSoccerData                   | nav     |
|   7 | Organigram                                   | nav     |
|   8 | Wie contacteer ik?                           | nav     |
|   9 | Blessure of medisch attest?                  | nav     |
|  10 | Intern reglement jeugd                       | nav     |
|  11 | Mutualiteit: terugbetaling lidgeld           | nav     |

**The count can change with content.** It is `8 + min(3, Jeugd articles)`: 0 articles gives 8
(`JeugdEditorialGrid.tsx:237-238`), 1 gives 9, 2 gives 10, 3 or more gives 11. In practice it is
always 11: the live `/nieuws?categorie=Jeugd` listing returns a full first page of 24 Jeugd articles
with `hasMore: true`.

**How it became 11.** The grid was 9 tiles, "a clean 3×3" (#2965). #3427 added two tiles
("Intern reglement jeugd", "Mutualiteit") to the 6 nav tiles, which made 8 + 3 = 11. Nobody chose 11.

## 2. Layout per breakpoint

The grid is `<TapedCardGrid columns={3} gap="sm">` (`JeugdEditorialGrid.tsx:287`).
`columns={3}` means `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
(`apps/web/src/components/design-system/TapedCardGrid/TapedCardGrid.tsx:30-35`).
`sm` is 640 px and `lg` is 1024 px (`apps/web/src/app/globals.css:388,391`).

There are no spans and no featured tiles. Every card is the same 16:9 tile
(`apps/web/src/components/editorial/EditorialHubCard/EditorialHubCard.tsx:134`;
grid doc comment `JeugdEditorialGrid.tsx:262-267`).

| Width                                       | Columns | 11 tiles                       | 12 tiles    |
| ------------------------------------------- | ------: | ------------------------------ | ----------- |
| < 640 px (phone)                            |       1 | 11 rows, nothing uneven        | 12 rows     |
| 640–1023 px (large phone landscape, tablet) |       2 | 5 full rows + 1 tile alone     | 6 full rows |
| ≥ 1024 px (desktop)                         |       3 | 3 full rows + 2 tiles, one gap | 4 full rows |

So the "uneven" claim holds on desktop and at the 2-column width. On a phone in portrait (one
column) 11 is not visibly uneven. 12 is the smallest count above 11 that fills both 2 and 3
columns.

## 3. Candidate tiles

|   # | Title (Dutch, as on the tile)                                                                 | Target                              | Why a parent needs it                                                                                                                                                                                                                                                                                                               | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Target exists?            |                             Count |
| --: | --------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------: |
|   A | **Pesten of grensoverschrijdend gedrag?** (tag `Integriteit`)                                 | `/hulp?categorie=gedrag#hulp`       | A worried parent needs the confidential contact (API) fast. Six live hulpvragen sit in that category: pestgedrag melden, ongepast gedrag rapporteren, discriminatie melden, gedragscode raadplegen, conflict met een andere ouder, opmerking over een trainer. Their answers name the API (`api@` appears 8 times on live `/hulp`). | The club's _Integriteit en grensoverschrijdend gedrag_ (2026-10-06), "Communicatie": "Webpagina: specifieke rubriek veiligheid en grensoverschrijdend gedrag" and "Contactgegevens API: beschikbaar op de website". #3911 lists these promises and makes "the integriteit page or rubriek exists" an AC. The `gedrag` category is real (`apps/web/src/components/hulp/HulpFinder/categoryMeta.ts:43-47`). Same deep-link pattern as the medisch tile (`JeugdEditorialGrid.tsx:104-126`). | **Yes**, live today       |                                12 |
|   B | Raise the article cap to 4                                                                    | `/nieuws/<slug>`                    | More youth news.                                                                                                                                                                                                                                                                                                                    | Cap is `limit: 3` (`page.tsx:93`); the template hard-codes three slots (`JeugdEditorialGrid.tsx:235-250`). The 4th newest Jeugd article today is _Meetrainen met de plezantste compagnie_ (2026-03-04). That is the "kom meetrainen" invitation the club asked to drop (#3427, "No kom meetrainen"). Only 4 Jeugd articles were published in the last 12 months (2025-12-30 to 2026-11-26, live listing).                                                                                | Yes                       |        12 only while ≥ 4 articles |
|   C | Merge "Onze opleidingsvisie" + "Intern reglement jeugd" into one "Reglementen en beleid" tile | the new `/club/<slug>` Page         | One door for all 8 policy documents.                                                                                                                                                                                                                                                                                                | Both tiles will point at the same Page (decided for #3911). But the visie PDF is the club's most-searched document, 17 clicks / 695 impressions a year (`JeugdEditorialGrid.tsx:61-65`, #2960). Merging hides it one click deeper and drops its photo tile.                                                                                                                                                                                                                              | Not yet (#3911 builds it) | 10, so it needs **two** new tiles |
|   D | Trots op 55 (split it out of the reglement tile)                                              | the new Page, or the PDF            | The club asked for it by name: "Toevoegen van trots op 55" (#3437).                                                                                                                                                                                                                                                                 | #3911 table; the PDF is a one-page code of conduct.                                                                                                                                                                                                                                                                                                                                                                                                                                      | Not yet                   |                                12 |
|   E | Stages en kampen                                                                              | `/hulp#voetbalstage-inschrijven`    | Parents sign up for holiday camps.                                                                                                                                                                                                                                                                                                  | Live hulpvraag `voetbalstage-inschrijven`; _Herfststage 2026_ is on the grid today as an article.                                                                                                                                                                                                                                                                                                                                                                                        | Yes                       |                                12 |
|   F | Afmelden voor training of wedstrijd                                                           | `/hulp#afmelden-training-wedstrijd` | Every parent needs it every week.                                                                                                                                                                                                                                                                                                   | Live hulpvraag `afmelden-training-wedstrijd` now exists; #2960 had found none ("no hulpvraag covers it", `JeugdEditorialGrid.tsx:111-117`).                                                                                                                                                                                                                                                                                                                                              | Yes                       |                                12 |
|   G | Blessure: meld het binnen de week                                                             | `/ongeval` → `/hulp#sportongeval`   | The 21-day e-Kickoff deadline.                                                                                                                                                                                                                                                                                                      | _Blessures en revalidatie Jeugd_ (2026-10-06); redirect in `apps/web/next.config.ts:330-334`.                                                                                                                                                                                                                                                                                                                                                                                            | Yes                       |                                 — |

Why G is not a new tile: it repeats the medisch tile ("Blessure of medisch attest?",
`JeugdEditorialGrid.tsx:118-124`), which already reaches `sportongeval` through the medisch category.
If it helps, retitle that tile; do not add a second one.

Not a candidate: a monthly health-theme tile from the _Lifestyle- en gezondheidsbeleid_ poster plan
(§ 7). It needs someone to change it every month, and nobody owns that (Writer Rule,
`apps/web/CLAUDE.md`; same reason the training planning was dropped in #3437).

## 4. Recommendation

**Add candidate A as the ninth pinned tile: "Pesten of grensoverschrijdend gedrag?" →
`/hulp?categorie=gedrag#hulp`. Keep visie and reglement as two tiles.**

Why:

- It is the one need the club put in writing that the grid does not cover: the integriteit document
  promises a website rubriek and the API contact, and #3911 makes that an AC.
- The target is live today, needs no writer, and copies the medisch tile pattern exactly.
- 9 pinned tiles form a clean 3×3 on their own, so the grid stays even if the article feed ever runs
  dry (it is `9 + min(3, n)`). With three articles it is 12: 4×3 on desktop, 6×2 at the 2-column width.
- Raising the cap (B) brings back the "kom meetrainen" article the club removed, and youth news runs at
  about 4 articles a year. Merging (C) buries the club's most-searched document and then needs two new
  tiles instead of one.

Open for the owner: if the new Page gets an integriteit section, the tile can point there instead.
`/hulp` holds the API contact and the six questions today, so it is the target that works now.
