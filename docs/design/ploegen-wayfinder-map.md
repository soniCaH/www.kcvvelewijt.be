# Team pages — findings map (`apps/web` `/ploegen`, `/ploegen/[slug]`, `/ploegen/[slug]/wedstrijden`, 2026-08-12)

> Filed as [#2536](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2536), tickets [#2537–#2544](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2536). **The issue is canonical — update it there, not here.** Source: `/impeccable critique` on `src/app/(main)/ploegen`, dual-agent run, scored **15/36 ("Poor", 42%)** with heuristic 10 `n/a`. Snapshot at `apps/web/.impeccable/critique/2026-08-12T12-56-34Z__src-app-main-ploegen.md`.

Working notes: `docs/design/ploegen-wayfinder-map.md` (committed). Critique snapshot: `apps/web/.impeccable/critique/2026-08-12T12-56-34Z__src-app-main-ploegen.md` — **generated and not committed**, so it may not exist in a fresh checkout. This issue is canonical.

Baseline measured 2026-08-12 against `main` at `e19f8235`. Source: `/impeccable critique` on `src/app/(main)/ploegen`, dual-agent run, scored **15/36 ("Poor", 42%)** with heuristic 10 `n/a`. Live evidence from `kcvv-nextjs.vercel.app` across all 18 team routes plus the two `/wedstrijden` sub-routes, spanning the shape range: the flagship senior side (368KB, standings + matches + squad + staff), the reserves, and the sparsest youth pages (U6, U9, U10P with an empty squad).

## Destination

A visitor who opens any of the sixteen team pages is told **which team this is**, sees **what the club actually has** for that team, and — where the club has nothing — is told so in the page's own voice rather than shown a gap. The test of done is not the first team. It is a U8 parent on a Thursday evening finding the fixtures, the training times and a named coach, or reading why they aren't there yet.

The map **decides, it does not build.** Every ticket on the frontier resolves to a rule; the defects those rules unblock are held in _Not yet specified_ and graduate as the decisions land. Per #2425 this map is **not a go-live blocker** — it runs alongside #2490, #2496, #2506 and #2519.

## Notes

### The score is 15/36 and the split is the whole finding

The composition would score well above this. Six independent places break the **content contract** — a component demands a field the pipeline does not supply, and the page silently erases itself rather than saying so.

Authored, and genuinely uncopyable: the mirrored A/B flagship pair flips grid track order rather than DOM order (`TeamFlagship.tsx:146`) with the B-ploeg content right-aligned so the mirror completes; the youth directory is taped polaroids on a sub-degree tilt pool (`YouthDirectory.tsx:16`); `TeamHero` pairs a taped landscape figure with a dashed "Seizoen" ticket stub; `TeamAgendaRow` locks the score dead-centre and truncates names rather than borrowing width (the #2397 decision).

What that chrome frames: the squad grid is the page's largest surface and holds 29 players with **3 photos**. `StandingsTable` renders on **0 of 16** team pages. `TeamEditorial` — 175 lines, three authored blocks — renders on **0 of 16**.

### Three of sixteen routes publish an `<h1>` that names a different team

Measured across all 18 team pages:

| Route                         | `<h1>`         | `<title>`          |
| ----------------------------- | -------------- | ------------------ |
| `/ploegen/eerste-elftallen-a` | `A-ploeg.`     | Eerste Elftallen A |
| `/ploegen/reserven`           | **`A-ploeg.`** | Reserven           |
| `/ploegen/kcvve-u17`          | `U17.`         | KCVVE U17          |
| `/ploegen/kcvve-u16`          | **`U17.`**     | KCVVE U16          |
| `/ploegen/kcvve-u10`          | `U10.`         | KCVVE U10          |
| `/ploegen/kcvve-u10p`         | **`U10.`**     | KCVVE U10P         |

**Two different causes, and they need different answers.** Reserven is **code**: its Sanity `name` is plainly `"Reserven"` (confirmed against the JSON-LD `SportsTeam.name` and the `<title>`), so `nameSuffix` returns `"RESERVEN"`, the A/B suffix test fails, and the fallback at `TeamHero.tsx:56` catches `age === "A"` and returns `"A-ploeg"`. U16→U17 and U10P→U10 are **data**: for youth, `computeCategory` returns the Sanity `age` verbatim (`TeamHero.tsx:43-46`), and `kcvve-u16` carries `age = "U17"`.

Whether that last one is even wrong is an open question — a Belgian side named U16 may legitimately play a U17 competition. Nobody has checked, which is why [what competitive data does PSD actually hold per team](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2537) exists before [Decide what a team page calls its team](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2539) decides anything.

A supporter clicking _Reserven_ from `/ploegen` lands on a page headed `A-ploeg.` and reasonably concludes the click failed. PRODUCT.md stakes the club's uncopyable asset on data "rendered as first-class pages (`/ploegen/[slug]`)", and its third success criterion is "show the club is serious".

### Every gated section erases itself, seam and all

`page.tsx:160-175` derives five section flags once and feeds **both** the render gates and the sticky nav list — genuinely good discipline, and it is why every anchor on every page resolves to a real DOM id. But the gate is total. `StandingsTable.tsx:15` returns `null` on an empty array, `page.tsx:215` then drops the section _and its `StripedSeam`_, and `page.tsx:170` drops the nav entry. Nothing is left behind: not a heading, not a line of copy.

Measured section presence:

| URL                    | `#klassement` | `#wedstrijden` | `#spelers` | `#staf` | `#info` |
| ---------------------- | ------------- | -------------- | ---------- | ------- | ------- |
| `…/eerste-elftallen-a` | ✗             | ✓              | ✓          | ✓       | ✗       |
| `…/reserven`           | ✗             | ✓              | ✓          | ✓       | ✗       |
| `…/kcvve-u9`           | ✗             | ✗              | ✓          | ✓       | ✗       |
| `…/kcvve-u6`           | ✗             | ✗              | ✓          | ✓       | ✗       |

`#klassement` and `#info` exist on **zero** pages. A youth parent gets two sections; a first-team supporter gets three. Nothing distinguishes "the season hasn't started" from "the sync is broken", which is the trap PRODUCT principle #3 was written against.

**This also puts a documented claim under stress.** DESIGN.md → Navigation justifies deleting all four nav dropdowns on the grounds that "in-page section anchors on `/ploegen/[slug]`" index the page better than a transient panel could. That index measures **3 anchors on a senior page and 2 on a youth page**, with no active state, and the global nav has no `/ploegen` entry at all.

### Wendy is the persona this map exists for

A mother of a U8, checking training times on a Thursday evening. Every step measured on `/ploegen/kcvve-u8`:

- No training schedule — `TeamEditorial` renders on 0 of 16 teams.
- No contact block. Same cause.
- No fixtures section; following "Volledige kalender →" gives `"Geen wedstrijden gepland."` in 14px muted mono, ~250px of blank cream, then the footer — **and no link back to the team page**, because every `<a href>` in that route's body starts `/wedstrijd/`.
- Staff is three cards, **two of which read `STAF`** — the last-resort label at `TeamStaff.tsx:63`. She cannot tell which one is the trainer, and there is no phone or email on the page.
- The largest, most prominent band on her child's page is **"Word lid — Sluit je aan bij de jeugd van Elewijt"** at display-lg on jersey-deep. Her child joined last season.

She leaves with nothing, having been sold a membership she already has. PRODUCT.md names youth parents as a **co-equal primary audience** whose first listed need is _schedule_.

### The detector agrees with the design world, which is itself the useful signal

`detect.mjs` over `src/app/(main)/ploegen` + `src/components/team`: **exit 2, 7 findings, all `design-system-font-size`, all in shipped components, none in tests or stories.** No ignore file, no suppression comments.

All 65 rules loaded and every rule that would punish this project's deliberate deviations stayed silent — `design-system-radius`, `gpt-thin-border-wide-shadow`, `hover-color-rules`, `cream-palette`, `ai-color-palette`, `kicker-above-heading`, `oversized-h1`, `italic-serif-display`. The detector and the committed world are not in tension on this surface, so all 7 survivors are real drift rather than brief-vs-detector noise.

The scan **structurally under-reports**: URL mode needs puppeteer (`detect-url.mjs:344` exits 1 without it), so `tiny-text`, `undersized-ui-text`, `low-contrast`, `skipped-heading`, `text-overflow` and `clipped-overflow-container` never ran. The browser pass found all six conditions present.

### The team page has no `<h2>`

`grep "level={2}\|<h2"` across `StandingsTable`, `TeamMatchesSection`, `SquadGrid` and `TeamStaff` returns **nothing**. Measured heading order on `/ploegen/eerste-elftallen-a`: `H1 "A-ploeg." → H3 "Doelmannen" → H3 "Spelers" → H2 "Met dank aan onze sponsors."`

The first `<h2>` a screen-reader user reaches is the **sponsor block**. `#staf` has no heading at any level. Every team-detail page skips h1→h3. On a youth page the only content `<h2>` is `TeamEnrolmentCta` — the recruitment ad. So the sticky nav advertises three sections that do not exist in the heading outline, and the two navigation systems disagree with each other.

## How to re-derive every number here

Per the #2425 lesson — charted measurements go stale, so re-run rather than trust. From `apps/web`:

```bash
# The three <h1> collisions. Expect A-ploeg. twice, U17. twice, U10. twice.
for s in eerste-elftallen-a eerste-elftallen-b reserven kcvve-u21 kcvve-u19 kcvve-u17 \
         kcvve-u16 kcvve-u15 kcvve-u14 kcvve-u13 kcvve-u12 kcvve-u11 kcvve-u10 \
         kcvve-u10p kcvve-u9 kcvve-u8 kcvve-u7 kcvve-u6; do
  h1=$(curl -s "https://kcvv-nextjs.vercel.app/ploegen/$s" \
       | grep -oE '<h1[^>]*>.*?</h1>' | sed -E 's/<[^>]+>//g' | head -1)
  printf "%-22s %s\n" "$s" "$h1"
done

# Reserven's Sanity name really is "Reserven" — so it is the age fallback, not the suffix test
curl -s https://kcvv-nextjs.vercel.app/ploegen/reserven | grep -oE '"name":"[^"]*"' | sort -u

# No <h2> anywhere in the four gated sections — expect zero hits
grep -rn "level={2}\|<h2" src/components/team/StandingsTable src/components/team/TeamMatchesSection \
  src/components/team/SquadGrid src/components/team/TeamStaff

# No active state and no focus style on the sticky nav — expect zero hits
grep -n "aria-current\|focus" "src/app/(main)/ploegen/[slug]/(detail)/TeamSectionNav.tsx"

# Detector over this surface (expect exit 2, 7 × design-system-font-size, all shipped)
DETECT=$(ls -d ~/.claude-personal/plugins/cache/impeccable/impeccable/*/skills/impeccable | tail -1)
node "$DETECT/scripts/detect.mjs" --json "src/app/(main)/ploegen" src/components/team

# The English position leak
grep -n -B2 -A2 'positionPsd' src/lib/repositories/player.repository.ts
grep -n 'Verdediger\|POSITION' src/components/team/SquadGrid/SquadGrid.tsx
```

Browser-measured numbers — tap sizes, the 31px overflow, computed fonts, heading order, section presence — cannot be grepped. Re-measure against `kcvv-nextjs.vercel.app`; note that `resize_window` below ~1440 does not take on this machine, so a same-origin 390px `<iframe>` is the working substitute, and `getBoundingClientRect` returns 0 whenever the tab is backgrounded.

## Read first

`apps/web/PRODUCT.md` (Users — youth parents as a co-equal primary audience; Product Principles #2 "Youth is first-class" and #3 "Render only what the data actually provides"; Positioning — the first-class-team-page claim this surface is supposed to cash; Accessibility — the sideline phone and the less-digital visitor) · `apps/web/DESIGN.md` (Navigation — the dropdown-deletion argument that rests on this page's anchors; Layout → The Three Widths Rule) · `apps/web/CLAUDE.md` (the feature→route map naming `/ploegen/[slug]` as the home of the league table) · `src/app/(main)/ploegen/**` · `src/components/team/**` · `src/lib/utils/group-teams.ts` · `src/lib/repositories/player.repository.ts` and `team.repository.ts`.

## Decisions so far

<!-- one line per closed ticket -->

See the canonical issue — #2537 and #2538 (research) and **#2539 (naming rule)** are closed as of 2026-08-13.
**#2539:** one helper `teamDisplayName(team)` = a new editorial `displayName` field ?? a slug-derived label, for `<h1>`,
`<title>`, OG, description, alt, the homepage row and the directory caption; JSON-LD keeps the registered `name`.

## Not yet specified

Per the charting decision, **the mechanical defects are deliberately held here rather than ticketed.** Each is measured and reproducible; each is downstream of a decision on the frontier, and each graduates into a ticket when its decision lands. Filing them now would pre-commit to fixes whose shape the decisions may change.

**Graduates from [Decide what a team page calls its team](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2539):**

- The `TeamHero.tsx:56` `age === "A"` fallback that heads Reserven as `A-ploeg.` The fix is one branch; what replaces it is the decision.
- The `kcvve-u16` / `kcvve-u10p` heading collisions — a Sanity data repair, a code change, or neither, depending on [what competitive data does PSD actually hold per team](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2537)'s finding.
- `<title>`, `<h1>` and the OG card giving three different names for the same team.
- Five team `<title>`s carrying a double space (`KCVVE  U15`, `KCVVE  U13`, `KCVVE  U11 `, `KCVVE  U9`, `KCVVE  U6`) — stray whitespace in the Sanity `name` field.
- The hero meta pill and the tagline rendering verbatim identical strings (`"3e Nationale VV A"` twice; `"Reserven VV AH"` twice).
- Whether `<h1>` uniqueness across a route family deserves a test. `nav-reachability.test.ts` guards that every nav destination _resolves_; nothing guards that every destination is _distinguishable_.

**Graduates from [Decide what a section says when it has nothing to say](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2540):**

- Whether the `StripedSeam` should survive a gated-out section, so the page keeps its rhythm.
- Giving each gated section a real `<h2>`, and giving `#staf` a heading at all.
- `StandingsTable` has no `<caption>` and no visible heading — only `role="region" aria-label="Klassement"`. When it does start rendering it will land as an unheaded table under a nav link.
- The "Seizoen" ticket stub never renders for senior teams (`season` is null on all of them), so one of the hero's most characterful artefacts is invisible on the club's three most-visited pages.

**Graduates from [Decide how the squad and staff describe people the data doesn't classify](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2541):**

- The `positionPsd` fallback at `player.repository.ts:68-70` shipping `DEFENDER` and `attacker` onto Dutch cards.
- `SquadGrid.tsx:19` string-matching `"Verdediger"` exactly, so unmapped players also miss their bucket — the flagship team partitions `Doelmannen 4` / `Spelers 25` and three of four designed groups never fire.
- `/ploegen/kcvve-u10p` shipping `squad = 0` while remaining a tappable card on `/ploegen`.

**Graduates from [Decide whether the team surface's wayfinding still holds](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2544):**

- The missing back link on `/ploegen/[slug]/wedstrijden`, mirroring the JSON-LD breadcrumb that already exists at `wedstrijden/page.tsx:139`.
- `aria-current` on the section nav (grep returns nothing).
- Sticky-chrome arithmetic: header 65px + section nav 47.75px = **112.75px** against a `scroll-margin-top` of 104px at five sites, so an anchor jump lands ~8px behind the bar. The nav also sits 1px under the header. Worth a `--sticky-chrome` custom property so the two cannot drift again.
- `Reserven` — a senior side — filed under `<h2>Jeugdwerking</h2>` on `/ploegen`, as the _first_ group above Bovenbouw.
- The `YouthDirectory` sub-line: `:108-113` gates on a comparison true for all 16 cards because every name carries the "KCVVE " prefix. 13 cards repeat the caption, 1 contradicts it, only 2 are load-bearing — and for those 2 the discriminator sits at 10px under a 24px display line. The hierarchy is exactly inverted.

**Not yet attached to any ticket — genuinely still fog:**

- **Tap targets on this surface.** "Volledige kalender →" measures **19.25px** tall with zero vertical padding; section-nav links measure **27px**. This is the same site-wide question #2529 owns for the article page, and the number must be argued from the sideline scene rather than cited from WCAG (PRODUCT.md adopts no conformance level). Whether this surface waits for #2529 or moves first is undecided.
- **A 31px horizontal overflow at 390px** on `/ploegen/eerste-elftallen-a/wedstrijden` only, traced to two elements in the `sm:hidden` mobile row (`TeamAgendaRow.tsx:392` and `:423-428`). `:400` already carries `min-w-0 flex-1`, so the missing constraint sits above it. Cheap to fix, but it is the same row the #2397 centre-lock governs, so it should not be touched without reading that decision.
- **Zero eager images across all six pages measured.** No `next/image` `priority` anywhere on this surface; every LCP candidate is `loading="lazy"` with no `fetchpriority`. The article map's ticket #2524 is the same finding on a different route, and the rule it lands on ("priority when the hero is the page's first paint") probably governs here too — but that rule is not written yet.
- **Loading-skeleton parity, four defects.** `[slug]/loading.tsx:73` draws a `rounded-full h-16 w-16` circle where `PlayerCard.tsx:37` renders an `aspect-[3/4]` rectangle — a staff-card shape standing in for a squad card, breaking the sharp-corner rule too. `:49` uses `border-y-2` where `TeamSectionNav.tsx:31` deliberately dropped the top border. `:51` renders 4 nav pills where real pages render 2–3. `ploegen/loading.tsx:43` draws youth cards at `h-20`/`minmax(120px,1fr)` against a measured real card of 212px at `minmax(150px,1fr)`. Also `ploegen/loading.tsx` lines 10, 25, 36 use bare `animate-pulse` while its sibling correctly uses `motion-safe:animate-pulse`. These cannot be specified until [Decide what a section says when it has nothing to say](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2540) decides what the loaded page actually contains.
- **`auto-fill` leaves ragged tracks**: at 1372px the youth grid computes 7 columns; the `Reserven` group holds 1 card and ~1050px of empty page. Whether `auto-fit` is right depends on where Reserven ends up ([Decide whether the team surface's wayfinding still holds](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2544)).
- **The A-team fixture list publishes `"KCVV Elewijt — 19:00 — KCVV Elewijt"`** on 22 Aug as a clickable row. This is real data — pitch reservations, per the known KCVV-vs-KCVV case — but it is published unqualified on the club's public fixture list. Whether it should be filtered, labelled, or left alone is not statable until [Decide what a section says when it has nothing to say](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2540) sets the rule for what the fixtures section is claiming.

## Out of scope

- **IBM Plex Mono rendering nowhere — RESOLVED 2026-09-18 by #2520.** The token now occupies Tailwind's `--font-mono` namespace and the face renders. Every type judgement recorded on this surface before that date was made against the wrong face and is worth re-reading. Original finding, kept as the record: `document.fonts.check` is false on all six pages and 43–210 `.font-mono` elements per page fall back to the system stack. Site-wide, already owned by [#2533](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2533) and [#2520](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2520) — recorded here only because every type judgement on this surface is currently made against the wrong face.
- **The focus ring.** Real keyboard Tab yields Chrome's default `outline: rgb(0,95,204) auto 1px` rather than DESIGN.md's 2px jersey-deep ring at 2px offset; only 1 of 87 focusable elements on the A-team page opts into the spec'd utility. Site-wide, owned by [#2530](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2530).
- **The sub-11px register.** 7 detector findings here (9px at `PlayerCard.tsx:74`, `TeamAgendaRow.tsx:382,405`, `TeamStaff.tsx:113,120`; 10px at `TeamAgendaRow.tsx:148`, `YouthDirectory.tsx:110`), plus 53 elements at ≤11px on the A-team page and 154 on the fixture page. Owned by [#2490](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2490) ticket 2; counting them here would double-count one cluster.
- **Staff function codes rendering raw** (`T1 - A-team`). Already filed and measured as [#2495](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2495). [Decide how the squad and staff describe people the data doesn't classify](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2541) covers only the _different_ case its fix does not reach — the last-resort `STAF` label.
- **Where training times live now that #2476 deleted the Trainingsschema block.** Owned by [#2483](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2483). It is a hard dependency of this map's destination, so [Decide what the end of a youth team page is for](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2543) must read it before deciding the youth page's tail — but it is not this map's to decide.
- **Match-data freshness** ([#2403](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2403)) and **meaning carried by colour alone** ([#2404](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2404)) — both already filed against the homepage and both apply verbatim to `TeamAgendaRow` here. Solve once, there.
- **Scroll-arrow behaviour** ([#2447](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2447), [#2448](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2448)) and **`text-white` on jersey-deep** ([#2421](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2421) — `#ffffff` is the one off-palette colour in `<main>`, 11× on the A-team page).
- **Commissioning club photography** ([#2411](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2411)). [how the squad grid reads when most players have no photo](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2542) asks how the squad grid reads _given_ the photo coverage the club has; it does not ask for more photos.
- **`/tegenstander/[clubId]`** ([#2463](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2463), [#2464](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2464)) — linked from the fixture rows, but its own surface.
- **`/spelers/[slug]`.** 29 squad cards on the A-team page link into it and it was never critiqued; that is a sibling map, not this one.

## Tickets

**This map is decisions-only by charting decision.** Every mechanical defect the critique found is held in _Not yet specified_ above and graduates into a ticket when its decision lands — so this list is short on purpose, and the fog is long on purpose.

Five of the eight are on the frontier today. Nothing is claimed yet.

| #   | Ticket                                                                                                                                | Type        | Status                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------- |
| 1   | [research: what competitive data does PSD actually hold per team](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2537)          | `research`  | **closed**            |
| 2   | [research: what PSD sends for player position and staff function](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2538)          | `research`  | **closed**            |
| 3   | [Decide what a team page calls its team](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2539)                                   | `grilling`  | **closed 2026-08-13** |
| 4   | [Decide what a section says when it has nothing to say](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2540)                    | `grilling`  | **frontier**          |
| 5   | [Decide how the squad and staff describe people the data doesn't classify](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2541) | `grilling`  | **frontier**          |
| 6   | [prototype: how the squad grid reads when most players have no photo](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2542)      | `prototype` | **frontier**          |
| 7   | [Decide what the end of a youth team page is for](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2543)                          | `grilling`  | **frontier**          |
| 8   | [Decide whether the team surface's wayfinding still holds](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2544)                 | `grilling`  | **frontier**          |

Both research tickets are AFK and can be fired in parallel — they unblock three of the four remaining decisions between them. **Start there**: the emptiness decision is the map's centre of gravity, and deciding it without knowing whether a U6 side even has a league is deciding against a guess.

The two `grilling` tickets that are already takeable — the youth page's ending and the wayfinding verdict — depend on judgement rather than data, so they can run alongside the research without waiting.
