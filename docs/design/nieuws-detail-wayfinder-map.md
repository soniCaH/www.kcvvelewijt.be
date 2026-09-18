# News article detail — findings map (`apps/web` `/nieuws/[slug]`, 2026-08-12)

> Filed as [#2519](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2519), tickets [#2520–#2531](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2519). **The issue is canonical — update it there, not here.** Source: `/impeccable critique` on `src/app/(main)/nieuws/[slug]/page.tsx`, dual-agent run, scored **23/40**. Snapshot at `apps/web/.impeccable/critique/2026-08-12T12-00-55Z__src-app-main-nieuws-slug-page-tsx.md`.

## Destination

A reader who opens a KCVV article finishes it, knows how long it will take before they start, can navigate it by heading, and leaves it **somewhere** — and the 680px column they spend 95% of their time in is a designed surface rather than the gap between two designed surfaces.

The walk **decides, it does not build.** Each ticket resolves to one rule plus the files that must change; `/spec` then makes it ready for `/ralph`. Five tickets are mechanical, carry no design question, and can be pulled forward independently of everything else.

Baseline measured 2026-08-12 against `main` at `bb64b0da`. Live evidence from `kcvv-nextjs.vercel.app` (the apex still serves the old Gatsby site) across four real articles chosen to span the shape range: the flagship interview (`vincent-haegeman-geen-afscheidsinterview`, 1,279 words, 11 Q&A pairs), the B-squad reveal (`kcvv-elewijt-b-stelt-de-kern-voor-van-seizoen-2026-2027`, ~25 player names), a short recruitment post (`2026-03-04-meetrainen-met-de-plezantste-compagnie`), and a 2023 transfer archive piece with `htmlTable` blocks.

## Notes

### IBM Plex Mono renders nowhere on the site — this is not an article-page finding, it is the biggest one the walk found

> **RESOLVED 2026-09-18 by #2520.** `--font-mono` is now the declared token and
> the losing `.font-mono` base override is gone. Re-measured on a production
> build of `/kalender`: 73 of 73 `.font-mono` elements resolve to IBM Plex Mono,
> `document.fonts.check('12px "IBM Plex Mono"')` is `true`, and the ten digits
> share one advance width instead of nine. **Everything below this line is the
> walk's original record of the defect — the token names, line numbers and
> measurements in it are historical and no longer describe the code.**

Two `.font-mono` rules ship, and the wrong one wins:

```css
.font-mono {
  font-family: var(--font-family-mono);
} /* ours, @layer base */
.font-mono {
  font-family: var(--font-mono);
} /* Tailwind's, @layer utilities — wins */
--font-mono:
  ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
  "Courier New", monospace;
```

`globals.css:651` defines `.font-mono` inside `@layer base` (the block runs 569–678), so Tailwind v4's generated utility in `@layer utilities` overrides it by layer order. That utility reads `--font-mono`, which **is defined nowhere in the repo** — so Tailwind's default stack holds. The project's own variable, `--font-family-mono` (`globals.css:273`), is correct and points at IBM Plex; it is simply not the name Tailwind looks up.

This is the **fourth instance of the same bug class** the design walks keep finding: `globals.css` defines a token under a name Tailwind does not own, never resets Tailwind's namespace, and the default silently wins. `--text-*` (typeset map, ramp B), `--leading-*` (typeset map, ramp B′), `--animate-*` (delight map) — and now `--font-mono`. Four namespaces, one cause.

Confirmed three independent ways, so this is not a reading of the source:

| Evidence             | Result                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Deployed CSS bundle  | Both `.font-mono` rules present; `--font-mono:ui-monospace, SFMono-Regular…` shipped verbatim                                   |
| Live DOM, 4 articles | **0 of 411** elements resolve to any IBM Plex face; all 36 `.font-mono` elements compute to the Tailwind default stack          |
| `document.fonts`     | All 16 registered `IBM Plex Mono` FontFace entries report `unloaded`; `document.fonts.check('12px "IBM Plex Mono"')` is `false` |

**Blast radius: 251 uses across 105 files** (excluding tests and stories). DESIGN.md calls this register "the system's connective tissue" and "the most-used non-body style in the system" — every kicker, date, score, timestamp, pill, stamp, table header and nav item on every page. The photocopied-team-sheet texture the entire fanzine world runs on is not shipping, and has never shipped.

`src/stories/foundation/Typography.mdx:201` documents the mono register using `var(--font-mono)` — so Storybook, the place a developer goes to check the type system, also renders it wrong. Nobody could have caught this by looking.

The fix is one line. The consequence is that **every mono glyph on the site changes width**, which is a VR question, not a code-review question — see _Not yet specified_.

### The body of the article is the only part of the page the design system never touches

This is the design question the map hangs on, and it is not a bug.

The hero is genuinely authored — `renderArticleHero` (`page.tsx:96-197`) fans one shell into six variants with credit-chips, transfer meta lines, event day-blocks and crest·score·crest bars, plus a documented graceful-degrade path when PSD returns null (`page.tsx:335-343`). `EndMark` (`★ EINDE GESPREK ★`), `QASectionDivider` (`✦ Technische staf ✦`) and `ArticleCredits` are real fanzine artefacts.

Then the reader crosses the metadata bar. Between there and `EndMark`, on three of the four articles, the fanzine vocabulary DESIGN.md enumerates — tape, stamps, perforations, striped seams, highlighter strokes — appears **zero times**. What remains is 680px, 16px sans, 1.6 line-height, 16px paragraph gaps, and one drop cap. Strip the drop cap and the column is indistinguishable from any Ghost or Medium template.

Two facts sharpen this from taste into a finding:

- **The index is louder than its own destination.** `/nieuws` has taped cards, cut-out player photos on a green-camo field, and an ink filter band. The reader clicks from a specific room into a generic one — the wrong direction of travel.
- **The club's one uncopyable asset is unused.** PRODUCT.md's first positioning claim is first-class `/spelers/[slug]`, `/ploegen/[slug]`, `/wedstrijd/[matchId]`. The B-squad article names ~25 players and ~4 staff and contains **exactly one link inside `<main>`** — the Facebook sharer. `resolveInternalLinkHref` in `ArticleBody.tsx` already routes `player`/`team`/`staffMember`/`article`/`page`. The capability exists and no article uses it.

### The article has no exit, and the flagship pieces are the ones that lack it

`<VerderLezenRow>` returns `null` at 0 items ("Sparse states: 0 items → row does not render"). Measured on the interview and the B-squad reveal: `linksInMain: 1`, the Facebook sharer. Nothing else.

There is also no back link and no breadcrumb — and the reason is a comment describing something that was never built:

```text
apps/web/src/components/article/ArticleMetadata/ArticleMetadata.tsx:46
 * "< Terug naar nieuws" back link on the hero and the type-specific kicker.
```

`grep -rn "Terug naar" apps/web/src` returns **that comment and nothing else**. The breadcrumb was traded away for an affordance that does not exist.

The inversion is the sharp part: **the 2023 archive article has a better ending than the 2026 flagship interview.** The old, thin piece gets a full "Verder lezen." row; the club's best editorial of the season ends on `💚🤍 #KCVVE`, `★ EINDE GESPREK ★`, ~70px of empty cream, a credits block, more cream, then the footer. Peak-end scores a Read surface on its ending, and this ending is nothing.

Match articles are the **only** type with an authored closer — `page.tsx:590-608` gives them a centred `LinkButton` "Bekijk de wedstrijd". The recruitment post, which serves success criterion #1, closes with `https://forms.gle/LXxfaSdz5rvpM14FA` pasted as inline link text.

### Reading time counts questions and ignores every answer

`apps/web/src/lib/utils/reading-time.ts:31-37`:

```ts
if (item._type === "qaBlock" && Array.isArray(item.pairs)) {
  return item.pairs.map((pair) => {
    const q = pair.question ?? "";
    const a = extractBodyText(pair.answer);   // ← always undefined
```

`packages/sanity-schemas/src/qaBlock.ts` stores answers at `qaPair.respondents[].answer` (`qaPair.respondents` is an array of `qaPairRespondent`, each holding its own `answer` block array). There is no `pair.answer` and there never was. Only question strings are counted.

Live result: 1,279 words in `<main>`, the bar reads **"1 MIN LEZEN"** — off by roughly 6×, on the article type where the estimate matters most.

`AnyBlockItem.pairs` is typed to a shape the CMS does not produce, so `tsgo` cannot catch it and neither can `tsc`. This is a type that lies, not a missing type.

### Section headings are not headings — the body has no `<h2>` at all

`QASectionDivider.tsx` renders `<aside role="separator" aria-label={plain}>`, and `ArticleBody`'s `buildComponents` maps the Portable Text `h2` block style straight into it:

```ts
h2: ({ value }) => <QASectionDivider title={[value]} />
```

Live heading audit of the B-squad article returns `H1` (the title), then `H2: KCVV Elewijt`, `H3: ONTDEK / AANSLUITEN / BIJ DE CLUB` — **all three of the latter from the footer**. "Technische staf" is an `<aside>`. On the interview, the 11 questions are `<h3>` under an `<h1>`, so the outline skips a level with nothing in between.

Two audiences lose here, and PRODUCT.md names both. A screen-reader user loses the standard long-form navigation primitive (a separator's `aria-label` never enters a heading list). A sighted reader loses grouping, because a hairline rule is a weaker signal than a heading — which is why the cognitive-load pass failed on _visual grouping_ and _working memory_ simultaneously.

The fix should be visually inert: the title is already its own flex child, so promoting the span to `<h2>` and marking the rules and `✦` glyphs `aria-hidden` preserves the three-centerline alignment contract exactly.

### The reading measure has now been rendered — this answers typeset ticket 11

The typeset map (#2490, ticket 11) scoped a browser session to measure what `--container-prose: 680px` actually yields at 16px Freight Sans Pro, explicitly refusing to pre-judge. **It has now been measured**, and the answer should be folded back there rather than re-derived:

| Viewport | Column        | Characters per line                                            |
| -------- | ------------- | -------------------------------------------------------------- |
| 1440px   | 680px (exact) | **109** (drop-cap paragraph), **101–103** (Q&A answers, 636px) |
| 500px    | 343px         | 73                                                             |

So the 680px cap is behaving exactly as declared — the container is not the problem, and per #2436 it is locked anyway. The drift is pairing a locked 680px measure with a 16px body size. The 45–75 CPL guidance is roughly half what desktop delivers, and it gets **worse** as the viewport widens toward the cap.

`body-lg` (1.125rem / lh 1.55) already exists in DESIGN.md and lands ~97 CPL. Reaching ~75 CPL honestly needs ~20px, which would be a new token. That is the decision, and it belongs to the typeset map's ramp, not to this page.

### The only two controls on the article are unlabelled 16px glyphs

`ArticleMetadata.tsx:129,137` render `<ShareNetwork size={16} />` and `<FacebookLogo size={16} />`. Measured hit area: **16×16 CSS px** at both 1440 and 375. They carry `aria-label` but no visible text label, and they sit at the far right of the metadata bar.

PRODUCT.md → Accessibility names this exact failure mode for the less-digital audience: _"generous tap targets, no jargon, and no interaction that must be discovered (hover-only affordances, hidden gestures, unlabelled icons)."_ Sharing a club article into a WhatsApp group is plausibly the single most common mobile action on this page, and it is a third of a usable thumb target behind an unlabelled glyph.

Wider context, so this is not fixed in isolation: 34 of 36 interactive elements at 1440 and 22 of 26 at 390 fall under 44×44 across the whole page including chrome — footer links are 27px tall at 390, header nav 39px, header search 18×18. The article's two controls are the worst instance of a site-wide pattern, not an outlier.

### The detector agrees with the design world, which is itself a finding

`detect.mjs` exit 2, 49 findings, **38 in shipped components** (30 `design-system-font-size`, 8 `design-system-color`). The single finding driving the exit code is a false positive: `broken-image` at `NewsCard.test.tsx:10`, a Vitest `next/image` mock.

The useful signal is what did **not** fire. Nothing was flagged against sharp corners, 0-blur offset shadows, press-down hover, the cream ground or sub-degree rotation — every one of DESIGN.md's deliberate deviations from generic design defaults passed clean. The detector and the committed world are not in tension on this surface, so every surviving finding can be treated as real drift rather than triaged against the brief.

What survived, scoped to this page's component tree:

- **18 sites below the 11px label floor** (16 × `text-[10px]`, 2 × `text-[9px]`), rendering as low as 9.5px live at `_variant-parts.tsx:439` and `TransferFactCard.tsx:158`. Contrast is fine (`#6b6b6b` on `#f5f1e6` = 4.72:1); size is the risk. This is the article-page slice of the typeset map's 63-use sub-11px cluster — **do not decide it here**, ticket 2 of #2490 owns it.
- **12 sites at 12/13/15/17/20/22/26/30px** — off-ramp drift between documented steps. Same owner.
- **A neutral grey ships**: `#6b7280` at `DownloadButton.tsx:49` (`FILE_TYPES.other`), a direct hit on The No-Grey-UI Rule. Seven further undocumented file-type colours sit alongside it at `:38-48` (`#c0392b` `#2563b3` `#15803d` `#f97316` `#7c3aed` `#0f766e` `#d97706`) — plausibly deliberate conventional file-type coding, but off-palette and written down nowhere.
- **Press-down hover ungated**: `VideoBlock.tsx:331` has `hover:translate-x-1 hover:translate-y-1 hover:shadow-none` with no `motion-safe:`. DESIGN.md: the translate is gated, the shadow collapse is not. `ArticleBodyMotion` gets this right via `matchMedia`; `VideoBlock` does not.
- **Focus ring is the UA default**: measured `outline: auto 1px rgb(31,31,31)` at 0–1px offset on every focusable element including footer links. DESIGN.md specifies a 2px jersey-deep ring at 2px offset. Visible, so not an accessibility failure — an off-system one, and site-wide.

### Editors improvise because the system gave them nothing

Three separate symptoms, one cause:

- **22 `🔄` emoji** as row icons at 15px inside `<td>` on the transferoverzicht article, rendering through the `ui-serif` fallback. `❌` appears alongside them.
- **`💚🤍 #KCVVE`** closing the interview body — the last thing before `★ EINDE GESPREK ★`.
- **A bare `https://forms.gle/…`** as the sole call to action on the recruitment article.

None of these violate "Don't use emoji as icons" as written, because all three arrive as Portable Text / `htmlTable` content authored in Studio, not as UI. But the visible result is Apple system emoji sitting in a cream-and-ink print system, and a naked Google URL at the moment of highest intent. The design system offers no table-icon vocabulary, no sign-off primitive and no CTA block — so editors reach for what Facebook taught them. PRODUCT.md calls authoring friction "a real product constraint, not a nicety"; this is what that constraint looks like when it goes unaddressed.

### Two things that look like findings and are not

- **The hero (1040) and body (680) left edges do not align**, creating a ~75px step at the metadata bar. Both widths are legal under The Three Widths Rule; the step is unarticulated, not wrong. Notably `loading.tsx` renders a `StripedSeam` at exactly that junction and the real page does not — the skeleton proposes an answer the page never adopted.
- **`ArticleBodyMotion`'s reveal is fail-safe.** The base hidden class is JS-applied on mount, with a `prefers-reduced-motion` short-circuit and a CSS safety net at `globals.css:781-790`. It is correctly built. Whether an article body on a sideline phone should have entrance animation at all is a separate question, and a delight-map one.

## How to re-derive every number here

Per the #2425 lesson — charted measurements go stale, so re-run rather than trust. From `apps/web`:

```bash
# The font-mono bug: two rules ship, Tailwind's wins. Expect BOTH lines, and the ui-monospace default.
CSS=$(curl -s https://kcvv-nextjs.vercel.app/nieuws/vincent-haegeman-geen-afscheidsinterview \
  | grep -oE 'href="[^"]*\.css[^"]*"' | sed 's/href="//;s/"//')
for c in $CSS; do curl -s "https://kcvv-nextjs.vercel.app$c"; done > /tmp/kcvv-all.css
grep -o '\.font-mono{[^}]*}' /tmp/kcvv-all.css | sort -u
grep -o -- '--font-mono:[^;]*;' /tmp/kcvv-all.css | sort -u

# --font-mono is defined nowhere in the repo — that IS the finding (matches are comments/stories only)
grep -rn -- '--font-mono' src

# Blast radius (expect ~251 uses / ~105 files)
grep -ro '\bfont-mono\b' src --include='*.tsx' --include='*.ts' | grep -viE '\.(test|stories)\.' | wc -l
grep -rl '\bfont-mono\b' src --include='*.tsx' | grep -viE '\.(test|stories)\.' | wc -l

# Reading time reads a shape the schema does not produce
grep -n -A6 'qaBlock' src/lib/utils/reading-time.ts
grep -n 'respondents\|name: .answer.' ../../packages/sanity-schemas/src/qaBlock.ts

# The back link that was never built — expect exactly one hit, and it is a comment
grep -rn 'Terug naar' src --include='*.tsx' --include='*.ts'

# priority is set at exactly one call site, and it is not this page
grep -rn 'priority' src/components/article src/app/\(main\)/nieuws | grep -viE '\.(test|stories)\.'

# Detector over this page's component tree
DETECT=$(ls -d ~/.claude-personal/plugins/cache/impeccable/impeccable/*/skills/impeccable | tail -1)
node "$DETECT/scripts/detect.mjs" --json "src/app/(main)/nieuws" src/components/article

# Share controls (expect size={16} twice)
grep -n 'ShareNetwork\|FacebookLogo' src/components/article/ArticleMetadata/ArticleMetadata.tsx
```

Browser-measured numbers — CPL, tap sizes, heading order, the 4px overflow — cannot be grepped. Re-measure in a real tab against `kcvv-nextjs.vercel.app`; note that `resize_window` below ~1440 does not take on this machine, so a same-origin 390px `<iframe>` is the working substitute, and `getBoundingClientRect` returns 0 whenever the tab is backgrounded.

## Read first

`apps/web/DESIGN.md` (Typography + Named Rules; Layout → The Three Widths Rule) · `apps/web/PRODUCT.md` (Users — the two co-equal audiences; Accessibility — the sideline phone and the less-digital visitor; Positioning — the player/team/match claim this page does not cash) · `globals.css:269-280` for the mono variable and `:569-678` for the `@layer base` block that loses · `src/app/(main)/nieuws/[slug]/page.tsx` + `loading.tsx` · `src/components/article/**` · `packages/sanity-schemas/src/qaBlock.ts` · the typeset map (`docs/design/typeset-wayfinder-map.md`, tickets 2 and 11) and the delight map, both of which this map hands work to rather than duplicating.

## Tickets

**Most tickets here are not fog.** The critique already did the investigation, so all but the four `grilling` tickets are sharp defects rather than decisions. **This map is an index, not a frontier to be walked in order — take anything.** Same shape as #2402, and for the same reason.

Ordered cheapest-and-most-constraining first. Nothing is claimed yet.

1. **Define `--font-mono` so IBM Plex Mono actually renders** · `wayfinder:task` — [#2520](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2520)
   One line in `@theme`, then delete the now-redundant `.font-mono` override at `globals.css:651`. Restores the mono register on 251 uses across 105 files, site-wide. Also fix `stories/foundation/Typography.mdx:201` so Storybook stops documenting the wrong font. **Every mono glyph on the site changes width** — read the VR note under _Not yet specified_ before starting. **Blocks nothing, blocked by nothing, and should ship first** because every later visual judgement on this page is made against the wrong typeface.

2. **Fix the Q&A reading-time count** · `wayfinder:task` — [#2521](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2521)
   Walk `pair.respondents[].answer` instead of the non-existent `pair.answer`, correct `AnyBlockItem.pairs` to the real schema shape, and add a regression test built from a real `qaPair` fixture. Pure bug fix, no design question, no VR impact. Can go in parallel with #2520.

3. **Give the article an exit** · `wayfinder:task` — [#2522](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2522)
   Build the `← Terug naar nieuws` link that `ArticleMetadata.tsx:46` already documents as existing, and make `VerderLezenRow` fall back to the 3 most recent articles (already fetched for `generateStaticParams`, minus the current slug) instead of rendering `null`. Add a segment-level `not-found.tsx` under `nieuws/[slug]/` whose recovery action is the news archive, not the homepage. _Independent of the grilling tickets — a fallback row is strictly better than a footer regardless of how #2525 lands._

4. **Promote `QASectionDivider`'s title to a real `<h2>`** · `wayfinder:task` — [#2523](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2523)
   Add a heading-level prop; render the title span as `<h2>` inside the existing flex row with rules and `✦` glyphs `aria-hidden`; keep `role="separator"` on the `dotted` variant only. Restores heading navigation and fixes the h1 → h3 skip. Should be visually inert — confirm against the three-centerline alignment contract.

5. **Set `priority` on the detail-page hero** · `wayfinder:task` — [#2524](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2524)
   `priority` is set at exactly one call site (`to-editorial-hero-props.ts:52`, the homepage). The detail hero is the LCP element and currently `loading="lazy"`, so the article opens on an empty taped frame. Pass it for all six variants in `renderArticleHero` and correct the docstring at `EditorialHero.tsx:98-102` — the rule is "priority when the hero is the page's first paint", which is true of both call sites.

6. **Decide what the end of an article is for** · `wayfinder:grilling` — [#2525](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2525)
   Match articles are the only type with an authored closer (`page.tsx:590-608`). The 2023 archive piece ends better than the 2026 flagship. Should a recruitment article end differently from a match recap and an interview — and if so, is that a per-type closer, an editor-authored CTA block, or one universal ending? Outcome: the ending rule plus the list of types it branches on. _#2522 ships the safety net; this decides the intent._

7. **Decide whether the reading column is a designed surface** · `wayfinder:grilling` — [#2526](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2526)
   The map's central question. Zero fanzine primitives appear between the metadata bar and `EndMark` on three of four articles, while `/nieuws` is materially louder than its own destination. Outcome: either a rule (e.g. one primitive per ~400 words, drawn from the existing vocabulary) with the primitives named, or an explicit written decision that the body stays quiet and the character lives in hero and chrome — which is a legitimate answer for a Read surface, but it should be chosen rather than inherited. **Blocked by #2520** — judging the body's texture while every mono glyph renders in SF Mono is judging the wrong artifact. Hold the line on consistency-without-flattening: one treatment per purpose, not one treatment for everything.

8. **Decide whether player and team names in article bodies should link** · `wayfinder:grilling` — [#2527](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2527)
   `resolveInternalLinkHref` already routes `player`/`team`/`staffMember`/`article`/`page`, and no article uses it. The B-squad reveal names ~25 players and links none. Outcome: an authoring affordance (editors mark links in Studio), automatic resolution against the PSD roster at render time, or a decision that neither is worth the authoring friction. Weigh against PRODUCT.md's "authoring friction is a real product constraint" — automatic resolution has zero editor cost and a false-positive risk; manual has the inverse. **Ties directly to the club's #1 positioning claim.** _Blocked by nothing, but it is the highest-leverage design decision in the map._

9. **Fix the article's tap targets, and decide the floor site-wide** · `wayfinder:grilling` — [#2529](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2529)
   The two 16×16 share controls are the worst instance, but 34 of 36 interactive elements at 1440 and 22 of 26 at 390 sit under 44×44 including footer and header. PRODUCT.md's "generous tap targets" and "no unlabelled icons" are the constraint; no WCAG level is a target, so the number must be argued from the sideline-phone scene rather than cited. Outcome: a minimum hit area, whether visible text labels are mandatory on solitary controls, and the list of sites to lift. _Fixing only the article's two controls is available immediately if the site-wide decision stalls._

10. **Bring the focus ring back on-system** · `wayfinder:task` — [#2530](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2530)
    Every focusable element renders the UA default `outline: auto 1px rgb(31,31,31)`; DESIGN.md specifies a 2px jersey-deep ring at 2px offset. Site-wide, visible either way, so this is correctness-of-system rather than accessibility. Pairs naturally with #2529 — both are "the interactive layer was never brought on-system", on the same elements.

11. **Sweep the small mechanical drift on this component tree** · `wayfinder:task` — [#2531](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2531)
    `VideoBlock.tsx:331` press-down hover missing `motion-safe:` · `DownloadButton.tsx:49` ships `#6b7280` against The No-Grey-UI Rule, plus seven undocumented file-type colours at `:38-48` that need documenting or replacing · the 4px horizontal overflow at 375px from `VerderLezenRow`'s scroll arrow · the date rendering three times in two casings · the composite `EndMark` → credits → footer gap. _The 18 sub-11px and 12 off-ramp size findings are **excluded** — they belong to #2490 ticket 2._

## Not yet specified

- **What primitives editors are improvising around, and what replaces them.** Filed as [#2528](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2528) and **withdrawn to fog the same day** — a consequence of two pending decisions, not a question statable sharply yet. The symptoms are measured (22 `🔄` table icons, `💚🤍` as a sign-off, a bare `forms.gle` CTA); what replaces them is downstream of #2525 and #2526. Graduates when both land. The `htmlTable` block accepting arbitrary authored HTML is the pressure point.
- ~~**Ticket 1 almost certainly needs the VR bot, not a local run.**~~ **Confirmed by the owner before the #2520 build; baselines were regenerated on CI.** Original reasoning kept: Restoring IBM Plex Mono changes the metrics of every mono glyph on every page — the definition of a site-wide token change. Per the #2380 precedent a site-wide change goes through the bot (~10min native) rather than an unscoped local run, which the guard refuses anyway. Confirm before starting; this may be the single largest baseline sweep the redesign has needed.
- ~~**Whether `--font-family-mono` should be renamed or shadowed.**~~ **Decided in #2520: renamed.** One name owns the family and the base-layer override that existed only to fight the namespace was deleted with it. `.font-body` stays, because `font-body` is not a Tailwind namespace and nothing competes with it.
- **Whether any _other_ Tailwind namespace is still unreset.** Four instances found so far across three maps (`--text-*`, `--leading-*`, `--animate-*`, `--font-mono`). Nobody has enumerated Tailwind v4's full namespace list against `globals.css` to find the fifth. This deserves its own audit rather than a fifth accidental discovery.
- **Whether the byline should exist at all.** `ArticleMetadata` hard-defaults the author to "KCVV ELEWIJT" while the hero and credits on the same page say "Kevin" — the page contradicts itself in three places. Is a per-article byline something the club wants, or should the `author` field go rather than be papered over with a default? Folds into ticket 6 or spins a sibling.
- **Whether the article body needs its entrance animation.** `ArticleBodyMotion` is correctly built and fail-safe, but it hides `p, h2, h3` behind a 500ms transition on a surface whose stated scene is a weak connection. A delight-map question, not this map's.
- **The `/nieuws` index shows "A-PLOEG" twice** in its filter row — the known Sanity title-case / GROQ case-sensitivity trap. Index-scope, out of this map's target, but it is the last thing a reader sees before entering an article and nobody owns it yet.
- **Whether the hero→body width step wants the `StripedSeam` that `loading.tsx` already draws there.** Both widths are legal; the skeleton proposes an answer the page never adopted. Cheap either way, but it is a ticket 7 question, not a bug.

## Out of scope

- **The 680px reading measure itself.** Locked by [#2436](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2436) and expressed in px deliberately, never in `ch`. This map **measured** it (109 CPL at 1440) and hands that number to [#2490](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2490) ticket 11, which scoped the measurement. The body-size decision that follows belongs to the type ramp, not here. Do not narrow the container.
- **The sub-11px register and the off-ramp size drift.** 18 + 12 findings on this component tree, owned by #2490 ticket 2. Counting them here would double-count the same cluster.
- **The typefaces themselves.** Locked by PRODUCT.md → Brand Commitments. Ticket 1 makes an already-chosen typeface render; it does not change the set.
- **The homepage.** Critiqued separately on 2026-08-06; its own snapshot is in `.impeccable/critique/`.
- **Test and story files.** All counts here exclude `*.test.tsx` and `*.stories.tsx`, except where a story is itself the finding (`Typography.mdx`, ticket 1).
