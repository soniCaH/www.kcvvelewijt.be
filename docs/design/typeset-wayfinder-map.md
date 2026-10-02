# Typography system — findings map (`apps/web/src/components`, 2026-08-12)

> Filed as [#2490](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2490). The issue is canonical — update it there, not here.

## Destination

`apps/web` has **one** type ramp, and every size, tracking and leading in `src/components` either uses a role token from it or is a written-down exception — so a new component has exactly one place to look, and the detector's output is trustworthy enough to gate on.

The walk **decides, it does not build.** Each ticket resolves to one rule plus the list of files that must change; `/spec` then makes it ready for `/ralph`. Following [#2425](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2425), this map is **not a go-live blocker** — it runs alongside.

Baseline measured 2026-08-12 against `main` at `d13cff7d`. A **second pass the same day, same commit**, added the line-height, font-delivery, `src/app`-coverage and reading-measure findings below (tickets 9–12) — sections carrying an _"Added 2026-08-12 (second pass)"_ note are from it. No first-pass number was invalidated; one was re-scoped (the leading count, see below).

## Notes

### There are four parallel type ramps, not one

This is the finding the whole map hangs on. `globals.css` defines two ramps, Tailwind contributes a third, and components invent a fourth.

|       | Ramp                                   | Where                  | Uses in `src/components`                             | In DESIGN.md? | Detector sees it?     |
| ----- | -------------------------------------- | ---------------------- | ---------------------------------------------------- | ------------- | --------------------- |
| **A** | `--text-*` role tokens (11)            | `globals.css:396-418`  | ~182 `text-<role>` utilities                         | 9 of 11       | it _is_ the reference |
| **B** | Tailwind defaults `text-xs`…`text-6xl` | inherited, never reset | 124                                                  | **no**        | **no**                |
| **C** | arbitrary `text-[…]`                   | inline                 | 255 lines                                            | **no**        | 132 flagged           |
| **D** | `--font-size-*` (13 numeric steps)     | `globals.css:278-293`  | 0 — all 13 consumers are inside `globals.css` itself | **no**        | **no**                |

**The mechanical scan understates the problem by roughly half.** Ramp B is invisible to it — `text-sm` is a named utility, not an arbitrary value, so 124 uses of an undocumented parallel scale pass clean. Any decision made from the detector's 132 alone will miss them.

Ramp B is live because `globals.css` never resets the namespace — there is no `--text-*: initial`, so Tailwind's default scale sits alongside the role tokens. Four of its steps are value-identical to role tokens (`text-xs`≡mono-sm 12px ×32, `text-sm`≡body-sm/mono-md 14px ×45, `text-base`≡body-md ×15, `text-lg`≡body-lg ×13) — that is 105 uses of **untyped aliasing**: right value, missing role. The other 19 (`text-xl` 20 / `text-2xl` 24 / `text-3xl` 30 / `text-4xl` 36 / `text-6xl` 60) have no role equivalent at all and compete directly with the display clamps.

### DESIGN.md's frontmatter is a subset of its own prose, which is a subset of the code

Three layers disagree, and the detector reads the smallest one:

- `globals.css` defines 11 `--text-*` tokens.
- DESIGN.md's **prose** describes 10 (it narrates the display "small step" and the mono role).
- DESIGN.md's **frontmatter** — the machine-readable block — lists 9. Missing: **`mono-sm`** (0.75rem / 12px) and **`display-sm`** (`clamp(1.25rem, 1rem + 1vw, 1.5rem)`).

So all 10 `text-[12px]` findings are the detector flagging a real token that the doc forgot to declare. Fix the frontmatter first or every later count is contaminated.

### The largest single cluster is a register that does not exist

63 uses sit **below** the documented 11px label floor — `10px`×45, `9px`×14, `9.5px`×4 — plus one `7px`. That is ~48% of all flagged drift, spread across 20+ component families (`match`, `calendar`, `article/blocks`, `search`, `team`, `hulp`, `organigram`, `design-system`).

It reads as a de-facto **micro-label** register that the system never sanctioned. Two documents pull against it:

- PRODUCT.md → Accessibility: _"a phone held in daylight on the sideline… Legibility, contrast in sunlight, and page weight are functional requirements, not polish"_ and _"Older supporters and volunteers are a real part of the audience."_
- DESIGN.md → **The No Middle Register Rule** governs the space _above_ the label, and is silent on the space below it.

45 developers-worth of independent decisions landing on 10px is evidence of a real need. Whether the answer is "sanction one sub-label token" or "there is no legal size below 11px, fix all 63" is the map's central design question — not a cleanup.

### Tracking has drifted harder than size

156 arbitrary `tracking-[…]` values across **16 distinct values**, plus 51 named-utility uses (`tracking-wide` ×24, `wider` ×21, `widest` ×4, `tight` ×2). DESIGN.md documents exactly one tracking value — `0.08em` on the label token — and it accounts for only 42 of 156. On the 10px/9px cluster alone, `0.08em` is the _seventh_ most common choice, behind `0.16em`, `0.18em` and `0.06em`.

Only 19 uses route through `var(--text-label--tracking)`.

### Line-height has the same four-ramp structure — and the walk only counted one of them

_Added 2026-08-12 (second pass). The first pass logged "49 arbitrary `leading-[…]`" as a loose end. It is not a loose end; it is a fourth axis with the identical shape to the font-size problem, and 49 was the wrong number to hang it on._

|        | Ramp                                               | Where                  | Uses in `src/components`                   | In DESIGN.md?                         | Detector sees it? |
| ------ | -------------------------------------------------- | ---------------------- | ------------------------------------------ | ------------------------------------- | ----------------- |
| **A′** | `--text-*--lh` paired with every role token (11)   | `globals.css:396-418`  | inherited by ~182 `text-<role>` uses       | as prose only, **not** in frontmatter | no                |
| **B′** | Tailwind defaults `leading-none`…`leading-relaxed` | inherited, never reset | **122**                                    | **no**                                | **no**            |
| **C′** | arbitrary `leading-[…]` literals                   | inline                 | **26**                                     | **no**                                | **no**            |
| **D′** | `--line-height-*` (6 steps)                        | `globals.css:296-301`  | 0 — 2 internal uses, 4 steps entirely dead | **no**                                | **no**            |

Four things follow, and each is new:

- **The 49 must be split the same way the 132/255 split was.** 50 `leading-[…]` occurrences exist; **24 of them route through `var(…)`** and are correct usage. The drift subset is **26 literal values across 13 distinct steps** (`1.05`×8, `1.4`×3, `1.15`×3, `1.55`×2, `0.9`×2, then nine singletons incl. `1.08`, `1.38`, `1.45`, `0.5`). Quoting 49 as a drift count overstates it by ~1.9×, the mirror of the 132↔255 trap this map already warns about for `text-[`.
- **Ramp B′ is the big one and nothing can see it.** 122 named-utility uses (`leading-none`×67, `tight`×23, `relaxed`×17, `snug`×14, `normal`×1). `--leading-*` — Tailwind v4's namespace for these utilities — **is defined nowhere in the repo**, and there is no `tailwind.config.*` (v4 CSS-first), so `@theme` in `globals.css` is the only reset point and it never resets. `leading-tight` therefore resolves to Tailwind's 1.25, while `--line-height-tight` says 1.2 — the project's own token and the utility of the same name disagree by 0.05 and nothing connects them.
- **Every one of those 148 uses overrides a role token that already carries its own leading.** Unlike font size, ramp A′ is complete: all 11 `--text-*` tokens ship a paired `--lh`. So a `leading-*` on an element that already has `text-<role>` is not filling a gap — it is discarding a decision. That reframes the fix: the question is not "which leading scale" but "why is any leading utility present on a role-tokened element at all".
- **Ramp D′ is deader than ramp D.** Font-size's ramp D at least has 13 internal consumers; `--line-height-*` has 2 (`loose` at :588, `tight` at :601). `hero`, `snug`, `normal`, `relaxed` have zero consumers anywhere.

### Nothing in the walk looked at how the fonts arrive

The first pass measured only what type _is_, never how it _loads_ — and the loading path has an unresolved TODO sitting in shipped CSS.

- **The three Freight faces load after hydration.** `layout.tsx:101-103` injects Typekit as an async `<script>` under `strategy="afterInteractive"`. Display, headline and body type therefore always render in fallback first and swap. IBM Plex Mono is unaffected — it is self-hosted through `next/font/google` (`layout.tsx:3`).
- **The swap is cushioned by two metric-matched faces, and their tuning was never finished.** `globals.css:15-27` defines `Freight Sans Fallback` (`size-adjust: 94%`, local Arial/Helvetica Neue/Liberation Sans/Segoe UI) and `Freight Display Fallback` (`size-adjust: 90%`, local Georgia/Times New Roman/Liberation Serif). The comment directly above them reads: _"size-adjust values are a first pass — fine-tune visually on the dev server."_ **That fine-tune never happened.** Both values are still the original guess.
- **Why this matters here rather than in a perf ticket.** PRODUCT.md → Accessibility pins the usage scene to a phone outdoors on a possibly weak connection. A mistuned `size-adjust` on that connection is a visible reflow of every heading and every paragraph, on every cold load — which is a typography defect, not a loading-speed one.

### The walk measured `src/components` only — `src/app` was never counted

Fog now cleared, and the answer is "small, but not zero". Excluding tests and stories, `src/app` holds **6 arbitrary `text-[…]`** and **9 ramp-B uses** (`text-sm`×3, `text-base`×2, `text-xs`/`text-lg`/`text-3xl`/`text-4xl`×1) against **34 ramp-A role-token uses**. Route files are the healthiest surface in the codebase — roughly 70% role-token adoption vs. `src/components`' much weaker share — so every ticket below can stay scoped to `src/components` without leaving a blind spot. Record the number so a later pass does not re-ask.

### The reading measure was never rendered, only declared

`--container-prose: 680px` (`globals.css:422`) with body at `--text-body-md: 1rem`. 19 non-test sites consume it. The measure is **locked** — [`#2436`](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2436) owns it and it is expressed in px deliberately, never in `ch`. What is unknown is what 680px actually _yields_ in characters at 16px Freight Sans Pro, because nothing in this walk rendered a page. The generic 45–75ch guidance suggests 680px may sit above it, but that is arithmetic on an assumed average glyph width, not a measurement — and it cannot become a finding until someone measures the real face. Ticket 11 measures it; it does not pre-judge the outcome.

### The primitives themselves are off-ramp

Drift is not confined to leaf components — the shared primitives that other components copy are the source:

- `design-system/MonoLabel/MonoLabel.tsx:59` — `md` size is `text-[13px] tracking-[0.06em]`, with an in-code comment: _"no design token represents 13px/0.06em yet; promote to a token when a second consumer needs the same size."_ **There are now 11 consumers of 13px and 26 of `0.06em`.** The comment's own trigger fired long ago.
- `design-system/FilterTabs/FilterTabs.tsx:91` — three sizes, three different label scales: `text-[10px]` / `text-[11px]` / `text-xs` (12px). One ramp-A token, one ramp-B utility, one invented value, inside a single primitive.
- `design-system/Label/Label.tsx:44` — hardcoded `text-[10px]`.
- `layout/SiteHeader/SiteHeader.tsx:42,119,147` — the nav ramp (11→13→14px) and wordmark ramp (20→24→28px) are hardcoded at three breakpoints each. DESIGN.md _documents_ the nav ramp in prose ("scaling 11px → 13px → 14px across `xl`/`2xl`") but no token exists, so the doc sanctions an exception it never systemised.

### How to re-derive every number here

Per the #2425 lesson — charted measurements go stale, so re-run rather than trust. From `apps/web`:

```bash
# Ramp C, flagged subset (the 132). DETECT=$(ls -d ~/.claude-personal/plugins/cache/impeccable/impeccable/*/skills/impeccable | tail -1)
node "$DETECT/scripts/detect.mjs" --json --scope type src/components

# Ramp C, full superset of arbitrary values (the 255 lines)
grep -rn 'text-\[[0-9]' src/components --include='*.tsx' | grep -v -E '\.(test|stories)\.tsx'

# Ramp B — invisible to the detector
for t in text-xs text-sm text-base text-lg text-xl text-2xl text-3xl text-4xl text-5xl text-6xl; do
  printf "%-10s %s\n" "$t" "$(grep -ro "\b$t\b" src/components --include='*.tsx' | grep -vE '\.(test|stories)' | wc -l)"
done

# Ramp A adoption
for t in label mono-sm mono-md body-sm body-md body-lg display-sm display-md display-lg display-xl display-2xl; do
  printf "%-12s %s\n" "$t" "$(grep -ro "text-$t\b" src/components --include='*.tsx' | wc -l)"
done

# Tracking
grep -rhoE 'tracking-\[[^]]+\]' src/components --include='*.tsx' | grep -v var | sort | uniq -c | sort -rn

# Ramp C′ — literal leading only (the 26). Drop the `grep -v var` and you get 50, which is NOT the drift count.
grep -rhoE 'leading-\[[^]]+\]' src/components --include='*.tsx' | grep -v var | sort | uniq -c | sort -rn

# Ramp B′ — invisible to the detector, same as ramp B
for t in leading-none leading-tight leading-snug leading-normal leading-relaxed leading-loose; do
  printf "%-18s %s\n" "$t" "$(grep -ro "\b$t\b" src/components --include='*.tsx' | grep -vE '\.(test|stories)' | wc -l)"
done

# Ramp D′ — confirm it is still dead, and that Tailwind's leading namespace is still unreset
grep -n 'line-height' src/app/globals.css          # 6 defs at :296-301, 2 uses at :588/:601
grep -rn '\-\-leading-' src                         # expected: no output — that is the finding

# src/app coverage (swap src/components → src/app in the ramp A/B/C commands above)
```

`--scope type` reports **132** non-test findings in `src/components`; a bare `text-\[[0-9]` grep reports **255** lines. The delta is arbitrary values that reproduce a token's value literally instead of using the token — a separate drift class, and the reason the two numbers must never be quoted interchangeably. **The same trap applies to leading: 49 lines, but only 26 are literal drift** — the other 24 route through `var(…)` correctly.

### Read first

`apps/web/DESIGN.md` (Typography + its Named Rules) for intent · `globals.css:270-424` for what actually ships — note this range now covers the `--line-height-*` block at :296-301 and the container widths at :422-424, both of which the first pass read past · `globals.css:15-27` for the two `size-adjust` fallback faces · `src/app/layout.tsx:1-105` for how the fonts actually arrive · `apps/web/PRODUCT.md` (Brand Commitments — **typography is fixed, no new typefaces**; Accessibility — the sideline-phone scene) · Storybook `Foundation/Typography`.

## Tickets

Ordered cheapest-and-most-constraining first. Nothing is claimed yet.

1. **Reconcile DESIGN.md's typography frontmatter with `globals.css`** · `wayfinder:task`
   Add `mono-sm` and `display-sm` to the frontmatter block. Removes 10 false `12px` findings and makes every count below trustworthy. **Blocks 2, 3, 4, 6.**

2. **Decide the sub-11px register** · `wayfinder:grilling`
   63 uses below the label floor vs. PRODUCT.md's outdoor-phone and less-digital-visitor requirements. Outcome: either one sanctioned micro-label token, or a rule that 11px is the floor plus the list of 63 sites to lift. _Blocked by 1._

3. **Decide whether Tailwind's default ramp is legal** · `wayfinder:grilling`
   124 uses, invisible to the detector. Outcome: either `--text-*: initial` (forcing role tokens, ~105 mechanical rewrites) or a documented legal subset. _Blocked by 1._

4. **Decide the tracking system** · `wayfinder:grilling`
   16 arbitrary values + 4 named utilities against one documented value. Is tracking a property of the role, or does it scale optically with size? _Blocked by 1._

5. **Tokenise the nav and wordmark responsive ramps** · `wayfinder:task`
   DESIGN.md describes both in prose; `SiteHeader.tsx` hardcodes both at three breakpoints. Either mint tokens or write the exception down as an exception.

6. **Fix the primitives before the leaves** · `wayfinder:task`
   `MonoLabel` md, `FilterTabs`' three scales, `Label.tsx`. These are what leaf components copy — fixing them first shrinks the tail. _Blocked by 2, 3, 4._

7. **`--font-size-*`: keep or delete** · `wayfinder:research`
   13 steps, zero component consumers, 13 internal uses driving `globals.css` prose and heading defaults. Can those defaults route through `--text-*` instead, deleting ramp D outright? **Pair with ticket 10** — `--line-height-*` is the same question on the leading axis and the two dead ramps should live or die together.

8. **Enforcement** · `wayfinder:task`
   Nothing currently lints font size **or line-height** — both re-drift the moment the walk ends. Options: an eslint rule on `text-[…]` / `leading-[…]`, or turning the Impeccable detector hook on for this repo (`/impeccable hooks on`). Note the detector alone is not sufficient: it sees neither ramp B nor ramp B′, so a lint rule must cover the named Tailwind utilities that the detector passes clean. Should be the last ticket, once there is a ramp worth enforcing.

_Tickets 9–12 added 2026-08-12 by the second pass. Numbering continues rather than reflowing so earlier references stay valid._

9. **Decide whether a `leading-*` utility may sit on a role-tokened element at all** · `wayfinder:grilling`
   148 overrides (122 named + 26 literal) against 11 role tokens that each already ship a paired `--lh`. This is the line-height axis's central question and it is **not** a sub-case of ticket 4 — tracking has one documented value and no role pairing, leading has a complete role pairing that is being discarded. Outcome: either "role tokens own leading, `leading-*` is banned outside named exceptions", or a documented legal subset. _Blocked by 1. Supersedes the first pass's "may fold into ticket 4"._

10. **Decide whether Tailwind's default leading ramp is legal, and settle `--line-height-*`** · `wayfinder:task`
    `--leading-*` is undefined repo-wide so Tailwind's scale is live and unreset (122 uses); meanwhile `--line-height-*` defines 6 steps with 2 internal consumers and 4 entirely dead ones, and its `tight` (1.2) contradicts the utility of the same name (1.25). Outcome: reset the namespace, or document the legal subset — and in either case delete or wire up the 4 dead steps. _Blocked by 9. Mirror of ticket 3._

11. **Measure the reading measure and the display clamps** · `wayfinder:research`
    Neither has ever been rendered. Two questions, one browser session: (a) what character count does `--container-prose: 680px` actually yield at 16px Freight Sans Pro — the px value is locked by [#2436](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2436), so this measures whether the _type_ inside it needs tuning, never the container; (b) do `display-sm` → `display-2xl`'s clamps behave across 390px → 1440px, and do the two `size-adjust` fallback faces hold their metric match at each stop. The dev server is the instrument — this ticket cannot be done by grep.

12. **Finish the `size-adjust` fine-tune the CSS asks for** · `wayfinder:task`
    `globals.css:15-27` ships `94%` / `90%` with an in-code comment calling them a first pass to be tuned visually. Typekit loads `afterInteractive`, so every cold load renders fallback first — on the sideline-phone scene that is a visible reflow of every heading. Outcome: measured values, or the comment replaced with a statement that the guess was verified. _Blocked by 11, which does the measuring._

## Not yet specified

_Resolved by the second pass and moved into tickets: the display clamps (→ 11) and the line-height analysis (→ 9, 10). Everything below is still open._

- Whether any of this is worth a VR baseline sweep. A ramp change is site-wide, and per the #2380 precedent a site-wide token change must go through the bot, not a local scoped run. **Sharper now:** tickets 9–10 touch leading on ~148 sites, which moves text vertically on nearly every page — if any ticket in this map forces the bot route, it is one of those two.
- Whether the 105 "untyped aliasing" uses are worth touching at all, or are acceptable as-is once ticket 3 rules on them. The same question applies to ramp B′, where the aliasing is _worse_ than untyped: `leading-tight` (1.25) and `--line-height-tight` (1.2) are near-identical names holding different values, so a reader cannot tell aliasing from divergence by sight.
- **Whether the `--lh` values paired to ramp A are themselves right.** The second pass established that they exist and are being overridden; it never asked whether the override is sometimes _correct_ — i.e. whether 148 developers routing around `--text-display-2xl--lh: 1` were each wrong, or whether the token's leading is wrong for some sizes. Ticket 9 must not assume the token wins by default.
- **Whether `font-display` behaviour is set anywhere.** The Typekit loader is `Typekit.load({async:true})` with no `font-display` control visible at the call site, and `next/font/google` defaults to `swap` for the mono. Nobody has confirmed what the three Freight faces actually do during load — only that they load late. Fold into ticket 12 if it turns out to be settable.
  _Note (2026-10-02, #3387): the loader is now the kit's CSS embed (`<id>.css`), not `Typekit.load`; the kit still ships `font-display: auto` on freight-sans-pro (display/big are `swap`)._
- **Whether the ramp-A `--lh` pairs belong in DESIGN.md's frontmatter.** Ticket 1 adds the two missing _size_ tokens. It does not address that the frontmatter carries no line-height for any role, while `globals.css` pairs one to all 11 — the same doc-vs-code subset problem, one axis over. Decide inside ticket 1 or spin a sibling.

## Out of scope

- **The typefaces themselves.** Freight Sans Pro / Freight Display Pro / Freight Big Pro / IBM Plex Mono are locked by PRODUCT.md → Brand Commitments. This walk changes sizes, tracking, leading and roles — never families. **This does not exclude how those families load:** tickets 11–12 tune the fallback metrics and the swap, which changes nothing about which typefaces ship. Do not bounce them as family changes.
- **`share/shared/*`** (3 findings: 40px, 42px×2). Satori-rendered OG cards, not browser UI — a different rendering engine and a poster scale. Needs its own decision if any.
- **`scheurkalender/`** (5 findings). `/scheurkalender` is a private poster source, not a public page. Poster typography, not UI typography.
- **`apps/studio` / `apps/studio-staging`.** Sanity Studio has its own type system.
- **Test and story files.** All counts here already exclude `*.test.tsx` and `*.stories.tsx`.
