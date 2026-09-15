# /scheurkalender — poster layout (LOCKED)

Supersedes the Treatment A table locked in `sk1-poster-table-compare.html`. That
treatment shipped in #2137 and was correct as a fixture table, but read as a
spreadsheet and did not fit the poster block at a legible type size.

Locked with the owner on 2026-08-04 against the live 26/27 season.

## The poster block

**340 × 567 mm** (ratio 1 : 1.67) — the space between the sponsor blocks in the
InDesign poster. The owner screenshots the sheet and places it there; the
background texture, sponsor logos, and title stay in InDesign.

## Decision — two columns, split on the calendar year

| Option                      | Fits 340 × 567 mm?                              | Printed club-name height |
| --------------------------- | ----------------------------------------------- | ------------------------ |
| One column                  | **No** — 600 mm at 1400 px render (33 mm over)  | 3.4 mm                   |
| One column, compact         | Only from ~1150 px render                       | 4.0 mm                   |
| **Two columns, year split** | **Yes** — 538 mm at 860 px render (29 mm spare) | **5.5 mm**               |
| Two columns, compact        | Yes, with room to spare                         | 4.7 mm                   |

Measured in headless Chromium against the real season (56 fixtures). One column
was eliminated on arithmetic: it cannot fill the block without dropping the club
names to a size that does not survive being read off a poster.

**Screenshot at ~860 px browser width.** Narrower gives bigger type but a taller
block (820 px → 5.8 mm, 564 mm — fills the block almost exactly); wider gives the
reverse.

## Locked details

- **Column split is on the calendar year**, not a balanced CSS flow — the break
  always lands on New Year, so the left column is the autumn half and the right
  the spring half every season, regardless of how the fixture list shifts. A
  season spanning one year only renders a single full-width column.
- **Month heading** mirrors `/ploegen/[slug]/wedstrijden`: `font-display-big`
  (freight-big-pro) at **900**, month in ink, year as an italic jersey-deep
  `<em>` with a trailing period, and **no rule beneath**. Set at 30 px here, not
  the live `--text-display-xl` (44–72 px), which would swamp a poster column.
  The year stays at a real **700 italic** — the Typekit kit ships
  freight-big-pro italic at 400/700 only, so a 900 italic would be a
  browser-faked oblique.
- **Date tab** is three fixed stops — weekday (mono 9 px) · day-of-month
  (Freight Display 19 px, right-aligned) · kickoff (mono 11 px behind a hairline
  rule). The kickoff sits in the tab rather than in a right-hand column, so every
  club name starts on one left edge and the dead band between date and match is
  gone. The day-of-month carries no month or year — the heading owns those.
- **Weekend seams** are a dotted hairline between weekends within a month; the
  first weekend of a month has none.
- **A weekend that crosses a month is split**, one heading each — amended
  2026-09-15, against the printed 26/27 sheet. Weekends were anchored on their
  Saturday so a Sat/Sun pair stayed together, which put `ZO 1` (1 November) under
  `Oktober ’26.` — a day-of-month that October's Sunday column cannot have, while
  November opened on the 8th with its first fixture nowhere on the poster. The
  date tab carries no month by design, so the heading is the only thing saying
  which month a row is in; adjacency is worth less than that. Same rule covers a
  lone Sunday on the 1st, whose weekend Saturday sits in the month before.
- **KCVV side is bolded**, squad letter (`A`/`B`) inline and in jersey-deep;
  opponent in `text-ink-soft`.
- **Club names arrive already re-cased** — PSD returns `Ksc Blankenberge` /
  `Erpe-mere`, which read as typos at poster size. The BFF's
  `normaliseClubName` (`apps/api/src/psd/transforms.ts`, #2336) uppercases known
  federation prefixes and capitalises after a hyphen, so this page renders the
  name verbatim. It briefly owned a local copy of that rule; the BFF owns it now.
- **Free weekends are omitted.** They were prototyped as an explicit hatched row
  and rejected by the owner. Consequence, accepted: a gap in the season is
  indistinguishable from a fixture that has not been published yet.
- **Still absent:** logos, squad pills, scores, competition labels.
