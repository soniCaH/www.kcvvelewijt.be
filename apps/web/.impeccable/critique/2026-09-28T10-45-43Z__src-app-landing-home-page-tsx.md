---
target: src/app/(landing)/(home)/page.tsx
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 1
timestamp: 2026-09-28T10-45-43Z
slug: src-app-landing-home-page-tsx
---

Method: dual-agent (A: isolated design review · B: isolated detector + browser evidence)

Live surface: `https://kcvv-nextjs.vercel.app/` (production, `main` at `45d4664e`), 390×844 and 1440×900, headless Chromium. The homepage moved since the 2026-08-06 run: it is now `src/app/(landing)/(home)/page.tsx`, so this snapshot has a new slug and the trend helper sees it as a first run. The previous run on the same page is `2026-08-06T08-46-20Z__src-app-landing-page-tsx.md` (19/32).

## Design Health Score

Surface mode: **Persuade**. Heuristics 7 and 10 scored `n/a` — total renormalized to /32.

| #         | Heuristic                       | Score     | Key Issue                                                                                                                                                                                                                                              |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1         | Visibility of System Status     | 3         | The match strip gives the last result and next fixture at once, and every band has a designed "unavailable vs empty" state (`page.tsx:241`, `:273-283`). No signal of editorial age: the hero is 82 days old.                                          |
| 2         | Match System / Real World       | 3         | Plain Dutch, football vocabulary. The agenda chips sort **U10, U11 … U21, U6 … U9** — `UpcomingMatchesClient.tsx:82` calls `localeCompare(b, "nl")` without `{ numeric: true }`. The club's own Onderbouw / Middenbouw / Bovenbouw grouping is unused. |
| 3         | User Control and Freedom        | 3         | Chip filter has an "Alles" reset; "Toon alle 17 wedstrijden" expands in place; navigation is persistent.                                                                                                                                               |
| 4         | Consistency and Standards       | 3         | "See all" links sit in three positions (beside the heading, beside and lower, under the heading). "Lees verder" is a sans button in the event band and a mono text link on cards.                                                                      |
| 5         | Error Prevention                | 3         | Little input surface. The lexical chip sort and an "A-PLOEG" chip in an agenda meant to exclude senior teams are the slips.                                                                                                                            |
| 6         | Recognition Rather Than Recall  | 3         | Mostly labelled. The mobile match strip carries thuis/uit by a house or bus glyph only, while the agenda rows say "Thuis/Uit" in text.                                                                                                                 |
| 7         | Flexibility and Efficiency      | n/a       | Landing page, anonymous product, no expert workflow.                                                                                                                                                                                                   |
| 8         | Aesthetic and Minimalist Design | 2         | Strong craft, but 12 bands and 10 601px on mobile (~12.6 screens). The same A-team result and fixture appear twice within two screens (strip, then "Dit weekend."). Nine full-width news cards of ~420px each, reaching back to March 2025.            |
| 9         | Error Recovery                  | 3         | Failed reads name their reason per band. The whole-page fallback (`page.tsx:298-308`) offers no route onward — no link to `/kalender` or `/nieuws`.                                                                                                    |
| 10        | Help and Documentation          | n/a       | Not a task surface; `/hulp` is in nav and footer.                                                                                                                                                                                                      |
| **Total** |                                 | **23/32** | **72% — Good**                                                                                                                                                                                                                                         |

## Design Specificity Verdict

**Authored.** Another club could not reuse this page unchanged.

**LLM assessment.** Cream paper, hard ink offset shadows, tape on card tops, striped seams taping the dark bands, Freight Display headings with one italic accent word and a terminal period, uppercase mono kickers. The match components are domain-native: thuis/uit glyphs, ticket-stub date cells, a highlighter swipe on the score, first teams grouped by their real division. Three bands read as category-interchangeable: banner slot A (third-party campaign creative in sans type and a gradient photo), the 3×2 `NewsGrid` with map screenshots and a stock desert photo as covers, and the generic clubshop CTA.

**Deterministic scan.** Scoped to the homepage's import graph (113 `.tsx` files; the design-system barrel pulls in every primitive): **53 findings**, exit 2.

- `broken-image` ×15 (warning) — **all false positives**: `vi.mock("next/image")` harnesses in `*.test.tsx`.
- `design-system-color` ×11 — 8 are `DownloadButton`'s file-type colour map, reached only through the barrel and never rendered on `/`; 3 are in tests/stories. **Zero shipped homepage colour violations.**
- `design-system-font-size` ×27 — 17 in shipped files. Seen live: 9px at `MatchStripView.tsx:410` ("Verlies" / "Volgende") and `TeamAgendaRow.tsx:571` ("· Competitie"), 13px `MonoLabel.tsx:58`, and the responsive header steps in `SiteHeader.tsx:58,70`. The rest are conditional (menu open, empty states, hero variants). These literals are the known debt of #2396's **freeze-and-drain** decision, suppressed by #2418 — not a regression.

**Visual overlays.** Injection ran in a headless browser (Chromium's private-network check had to be disabled to load `detect.js` from localhost into the https page): `[impeccable] 26 anti-patterns found` at 390, `24` at 1440. The browser has since closed, so **no user-visible overlay remains**. Deduplicated:

- **undersized-ui-text** — 9px "Volgende" / "Verlies" / "· Competitie"; 10px numbers in `span.border-l.pl-2.text-[10px]`; footer legal line 9.5px mobile / 10.5px desktop.
- **all-caps-body** — the 43-character MonoLabel event meta line; one 31-character link.
- **kicker-above-heading**, **cream-palette** — documented house patterns. Ignore both.

Measured by B: no horizontal overflow at either viewport; no clipped text (the 2026-08-06 opponent-name clipping is gone); clean console. Contrast on `jersey-deep` (`#007c46`): cream 4.69:1; **warm on jersey-deep 3.17:1**, which is fine at the 32/48px display accents but not for the 9px semibold "Volgende" in the match strip; **ink on jersey-deep 3.74:1** for the 13px "AANSTAAND EVENEMENT" kicker. The ten `opacity: 0` read-more labels use `reveal-on-hover`, which `globals.css:1310` shows at rest under `@media (hover: none)` — assessment A saw them on the touch viewport. The 2026-08-06 P1 is fixed.

## Overall Impression

The design world holds across all twelve bands and the match half is genuinely live. The editorial half is not: it has no concept of age, so the largest type on the page makes an in-season club look dormant. The single biggest opportunity is to give "featured" a shelf life.

## What's Working

**A real design world, applied without leaks.** Seams, tape, hard shadows, accent-word headings and mono kickers hold in every band. No SaaS or template tells, zero radius honoured, zero shipped colour violations.

**Match data reads at a glance.** Match strip → "Dit weekend." gives both first teams' last result and next fixture in the first 1.3 mobile screens. The agenda rows label Thuis/Uit and carry the full address for home games.

**Failure states are designed.** Bands hold their shape and name the reason on a failed read. Few club sites get this right.

## Priority Issues

### [P1] The editorial half has no concept of age, and "featured" never expires

**What.** `ARTICLES_QUERY` orders `featured desc, publishedAt desc` (`lib/repositories/article.repository.ts:33`). The hero is article 0, Uitgelicht 1–3, Laatste nieuws 4–9 (`page.tsx:285-288`). Live: an 82-day-old hero (8 July), Uitgelicht dated 27, 17, 25 April, and a "Laatste nieuws" grid running to March 2025. A featured article from any year outranks every newer one, forever.
**Why it matters.** "Show the club is serious" is a success criterion. The page's biggest type says the club is quiet while the match half says otherwise.
**Fix.** Featured counts only within N days, then newest wins. Give the news grid an age floor, or shrink it to 3 cards when recent articles are scarce.
**Suggested command:** `/impeccable harden`

### [P2] The youth-parent path: 15 chips, sorted wrong

**What.** "Komende wedstrijden" starts ~6 255px down on mobile. Its chip row holds 15 facets in lexical order, so a U8 parent's chip sits off-screen right behind 32×32 arrows.
**Why it matters.** Youth parents are a co-equal primary audience (principle 2). The band's depth is decided (#2408); the extra friction inside it is not.
**Fix.** `localeCompare(b, "nl", { numeric: true })` — one line. Consider grouping the chips as Senioren / Bovenbouw / Middenbouw / Onderbouw.
**Suggested command:** `/impeccable clarify`

### [P2] The agenda leaks an A-team chip, and the match strip repeats "Dit weekend."

**What.** The agenda claims to exclude senior teams (`page.tsx:289-295`) yet shows an "A-PLOEG" chip — matches with a null `kcvv_team_id` pass the dedupe. On mobile the strip's A-team rows are repeated ~900px later in "Dit weekend.". The heading obeys #2392's rule (soonest fixture, Sat/Sun, ≤7 days), but it then sits over a B-team row with a 9-day-old result and a fixture two weekends out.
**Why it matters.** It spends the phone's most valuable screens twice, and a half-true heading costs trust in the data.
**Fix.** Resolve null team ids by label in the dedupe. Decide whether the strip mounts on `/` at all (it is a shared `(landing)` layout primitive, `layout.tsx:16`).
**Suggested command:** `/impeccable distill`

### [P2] Mobile length and news-card density

**What.** 10 601px on mobile against 6 833px on desktop. Every news card is full-width, image-topped and ~420px tall; the agenda and youth band sit behind ~2 700px of mostly old news.
**Why it matters.** Phone-outdoors and page weight are named functional requirements (PRODUCT.md, Accessibility & Inclusion).
**Fix.** Below `sm`, render "Laatste nieuws" as compact list rows, or cap it at 3 cards.
**Suggested command:** `/impeccable adapt`

### [P2] Tap targets and small type on jersey-deep

**What.** "AL HET NIEUWS →" is 121×27, "ALLE SPONSORS & SYMPATHISANTEN →" 248×27, chip arrows 32×32. The strip's thuis/uit glyph has no text. The 9px warm "Volgende" measures 3.17:1 and the 13px ink kicker 3.74:1 on jersey-deep.
**Why it matters.** PRODUCT.md asks for generous tap targets and no unlabelled icons for less-digital visitors on the sideline. No WCAG target is adopted (#2395); this is a legibility call.
**Fix.** Pad text links to a 44px hit area without changing their look; add a "thuis"/"uit" mono micro-label beside the glyph.
**Suggested command:** `/impeccable polish`

## Persona Red Flags

**Jordan (first-timer).** The first screen is a July B-team staff announcement; nothing says who the club is or when the next home game is. "3E NATIONALE VV A" goes unexplained. "Word lid" is in the desktop header only; on mobile it is inside the menu.

**Riley (stress tester).** "Laatste nieuws" contains items 18 months old. An old featured article can hold the hero indefinitely. U10 sorts before U6. An A-PLOEG chip in a youth agenda. The whole-page fallback has no link onward. Sponsor tiles are lazy images with no placeholder — 30 blank tiles mid-scroll on a slow connection.

**Casey (distracted mobile).** 12.6 screens. Her team's chip is off-screen with 32px arrows; text links are 27px tall. The good part: the strip answers "score / when next" in the first 330px.

**Sofie (U8 parent, Saturday 08:45, phone at the gate).** Scrolls past the hero, both first teams, three Uitgelicht cards, the event, a campaign banner and six news cards (~6 255px), then swipes past U10–U21 to find U8. The youth band then addresses her as a prospect ("Word jeugdspeler") rather than as a current parent.

## Minor Observations

- ~90px of empty cream between the match strip and the hero kicker on mobile (`pt-10`).
- The youth band's primary button is jersey-deep on a jersey-deep field, separated only by border and shadow.
- The obituary "Overlijden Jean Lepage" carries a stock desert landscape as cover; a monogram artefact (`getCardSubjectArtefact`) would be more respectful.
- On desktop "Al het nieuws" drops below its heading's baseline; "Volledige kalender" aligns.
- The club name is never a heading on `/` when a hero exists — the `<h1>` is whichever article is featured.

## Questions to Consider

- If the club publishes one article a quarter, should the first screen be editorial at all — or can the hero hold whatever is freshest without breaking principle 6's refusal to rank?
- If only one of the match strip and "Dit weekend." could stay on `/`, which goes?
- Recruits convert into parents. Where on this page is the converted parent served, apart from chip #17?

## Against the 2026-08-06 baseline (#3106)

19/32 → **23/32**. Still failing, **by decision**: single focus (#2408; visual hierarchy, declined with it, now passes) and peak-end (#2422 — the audience-neutral tail). No other map item fails again: hover-only CTAs (#2393), opponent clipping (#2397), BFF-outage silence (#2399), the Kantine fallback and midweek heading (#2392), and the colour token drift are all fixed; the 9px/10px literals are #2396/#2418's frozen debt. The priority issues above are new findings, not regressions.
