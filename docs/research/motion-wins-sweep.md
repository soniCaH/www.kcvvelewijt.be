# Motion wins, swept by state-change frequency (#2502)

Part of map #2496. Measured 2026-10-02 against `main` at `36678ccda`, and in a browser against production (`kcvv-nextjs.vercel.app`, desktop Chrome on fast wifi, so every number below is a **best case**; a phone on the sideline waits longer).

## Method

The starting set came from state changes, not from components. Every non-test `*.ts`/`*.tsx` under `apps/web/src` with `useState`/`useReducer` (27 files: 24 components, 3 hooks) was checked for a user-visible change that has no motion today, plus each filter consumer traced back to where the list is actually filtered. A candidate had to name four things: **what fires it** (file:line), **how often**, **on which device**, **in front of whom**. Production consumers were checked for each one (`grep` for mounts outside tests and stories). The top candidates were then run in a browser on production.

There is no frequency data. GA4 sees only the `.vercel.app` host until the domain flip, so "how often" is judged from the page's role, not counted.

Out of scope here, because other map tickets own them: drawer open/close and menu entrance (#2497/#2498), the navigation pending indicator (#2499), search results arrival (#2500), and fixture-to-hero travel (#2501). Anything found below that changes one of those is listed under [Facts for sibling tickets](#facts-for-sibling-tickets).

## Where filtered lists actually re-render

`FilterTabs` is presentational, so the real filtering happens in six other places, and they do not behave alike:

| Surface | Filtering site | Mechanism | Async? |
| --- | --- | --- | --- |
| `/nieuws` category | `NewsListingClient.tsx:146-176` (`applyCategory`) | server action fetch, then `history.pushState` | **yes**: fetch per tap |
| `/kalender` type + view | `CalendarWidget.tsx:172-215` → `useRouterFilterParam.ts:73` | `router.push` on a `force-dynamic` route | **yes**: server round-trip per tap, though the data is already in memory (`CalendarWidget.tsx:221`) |
| Homepage agenda team | `UpcomingMatchesClient.tsx:115-128` | local `useState` | no |
| `/evenementen` type | `EventsBrowser.tsx:99-103` | `useHistoryFilterParam` | no |
| `/hulp` category + audience | `HulpFinder.tsx:124-145, 270-289` | `useHistoryFilterParam` | no |
| Subscribe panel teams | `CalendarSubscribePanel.tsx:91-102` | local `useState` | no |

**The synchronous four do not need motion.** The list is already correct when the next frame paints, so a transition could only slow down an answer that is already there. **Both async sites have a defect in how they acknowledge a tap**, and that is where this sweep's top findings are.

## Ranked candidates

Ranked by frequency × how sharp the moment is.

| # | Candidate | Firing state change | Frequency | Device / audience | Job | DESIGN.md speed | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **`/nieuws` category switch: the wait is invisible** | `setActiveCategory` + `setIsLoading(true)` at `NewsListingClient.tsx:151-152`, grid replaced only on success at `:167` | every chip tap on the news archive | phone; supporters, parents | make the state change legible; arrival | waiting: **The Dots** (Waiting-Device Rule); arrival: **500ms** | **ticket** |
| 2 | **`/kalender` chips + view toggle: no acknowledgement until the server answers** | `setType` / `setView` → `router.push` at `useRouterFilterParam.ts:73` / `CalendarWidget.tsx:178`; chip state is derived from `useSearchParams` so it cannot flip early | every filter/view tap on the calendar | phone; parents, supporters | acknowledge the action | none: **this is not a motion fix** | **ticket** (task) |
| 3 | **`/hulp` question accordion jumps** | `handleToggle` at `HulpFinder.tsx:291-292` (single-open), answer mounts via `QuestionCard.tsx:86` `{open && …}` | every question opened after another, on the help page | phone; parents, volunteers, less-digital visitors | preserve continuity | needs a rule (see below) | **ticket** (prototype) |
| 4 | **Gallery lightbox runs off-system motion and a fourth waiting device** | `setIndex` → `<Lightbox open>` at `GalleryLightbox.tsx:116`; every swipe | every photo opened and every swipe in a gallery | phone; players' families | embody the world; make the wait legible | fade/swipe → **300ms**/**500ms** on **The Curve**; loading → **The Dots** | **ticket** (task) |
| 5 | Member panel sheet appears and vanishes as a hard cut | `openMember`/`close` in `HubMemberPanel.tsx`; `MemberDetailPanel.tsx:170` `if (!open \|\| !node) return null` | each person card tapped on `/hulp` | phone bottom-sheet / desktop side panel | preserve continuity | **500ms** arrival | **fold into #2497**, no new ticket |
| 6 | Membership form success: no focus or scroll, and the wait uses text instead of dots | `setState("success")` at `MembershipForm.tsx:290` swaps the whole form at `:315`; `"Versturen…"` at `:595` | once per applicant, but this is the recruitment path | phone; prospective members and parents | direct attention; acknowledge the action | waiting: **The Dots**; no travel | **ticket** (task, mostly not motion) |

### Evidence

**1. `/nieuws`.** Measured on production: the chip flips at **~27ms**. The old grid then stays on screen, unchanged and undimmed, until the fetch settles (**120-240ms** here; seconds on a weak connection). The page's only waiting device is the `LoadMoreFooter` dots (`LoadMoreFooter.tsx:76-79`), and they sit at the **foot of the grid**: 3 703-3 859px from the top of a 1 433px viewport, more than two viewports below the chip that was tapped, and further still on a phone. When the fetch lands, the grid swaps in a hard cut and the page scrolls smoothly to the top (`:176`). So on a weak connection, the visitor sees a chip that says "B-Ploeg" sitting above a grid that is still "Alles". DESIGN.md's Waiting-Device Rule already says how a visitor's request should wait (with The Dots). What has not been decided is **where** the dots go and **what happens to the stale grid** while they show. Once that is settled, the arrival is a 500ms Arrival. This is the same shape as #2500, but on a surface #2500 does not cover.

**2. `/kalender`.** Measured on production: from a chip tap to the chip showing as active took **272ms, 555ms and 759ms** across three taps. The month cursor survived (no remount and no `loading.tsx` flash, which I checked), but for that whole time nothing reacts to the tap. Filtering is client-side over a feed already in memory (`CalendarWidget.tsx:221-233`), so the round-trip buys nothing. The fix is optimistic local state, or moving `?type=`/`?view=` to `writeHistoryFilterParam` the way `/nieuws` and `/hulp` already work (#2564, #2779). It is **not** motion, and adding a press animation would cover the lag without fixing it. It ranks high because it is a real "did my tap register?" moment on a page parents use every week.

**3. `/hulp`.** Measured on production: with question A open, tapping question B directly below it moved B **271px up the screen** in a single frame, because A's answer unmounted at the same moment. Chrome's scroll anchoring does not step in when the collapsing content is in view, and Safari has no scroll anchoring at all. A tall answer on a phone can push B, the thing the visitor just tapped, off the top of the screen. There are two fixes and they are different kinds of answer: (a) keep B where it is with a scroll compensation, which is not motion; (b) animate A's collapse and B's expansion together so the eye can follow. DESIGN.md has **no speed for a height change**: Chrome (150) is colour, Press (300) is the press-down, Arrival (500) is "entering the screen". So (b) needs the Three Speeds Rule to say which bucket a disclosure belongs in. That is why this ticket is a prototype.

**4. Lightbox.** `yet-another-react-lightbox` 3.32.2 is used with its defaults (no `animation` prop at `GalleryLightbox.tsx:116`): fade **250ms `ease`**, swipe **500ms `ease-out`**, navigation **`ease-in-out`**. None of those is one of the three speeds, and none uses The Curve. While a slide image loads it shows its own 8-spoke spinner (`yarl__slide_loading`, a loop that runs for 1s), which makes a **fourth waiting device** the Loop and Waiting-Device Rules do not allow, and it shows exactly when a weak connection is loading a full-size photo. It already respects `prefers-reduced-motion` (in its own `styles.css`). Galleries are live in production (`/galerij/ploegvoorstelling-2026-2027`, 59 images). This is a conformance task: set `animation={{ fade, swipe, easing }}`, and replace the loader through `render.iconLoading` with `<Spinner variant="compact">`. The map ruled out *adding* a motion library. This one is already installed, so the task is to bring it into the system, not to adopt it.

**5. Member panel.** Like the drawer, `MemberDetailPanel.tsx:170` returns `null` when it is closed, so it cannot animate in or out. It is a bottom sheet on a phone, which is exactly the surface that most needs a direction. It is the same defect as #2497, so it belongs with #2497's decision, not in its own ticket. See the facts section.

**6. Membership form.** On success the long form unmounts and a short card takes its place (`:315`), but nothing moves focus or scroll to it. The visitor who tapped submit at the bottom of the form can be left looking at whatever slid up into view, and a screen reader's focus falls to `<body>`. I did **not** check this in a browser, because submitting the production form is a real side effect. While waiting, the button reads `"Versturen…"` (`:595`), which is text where the Waiting-Device Rule calls for The Dots. Neither fix is motion. They belong on this list because the moment is the site's first success criterion (recruitment). `SharePage.tsx:1000` (`"Genereren…"`) has the same text-instead-of-dots drift, but it is an internal `noindex` tool.

## Rejected

| Candidate | State change | Why not |
| --- | --- | --- |
| Homepage agenda team filter | `setSelectedTeam`, `UpcomingMatchesClient.tsx:119` | Synchronous. 17 rows collapse to 1 on the next frame, and the remaining row sits right under the chip. Motion would only delay the answer. |
| `/evenementen` type filter | `setSelected`, `EventsBrowser.tsx:102` | Synchronous, and there are **3** events in production. |
| `/hulp` category/audience chips | `setCategoryParam`/`setAudienceParam`, `HulpFinder.tsx:270-289` | Synchronous. The "Alle N →" case already scrolls the finder back to the top (`:257-264`). |
| `/kalender` month navigation | `setCursor`, `CalendarWidget.tsx:186` | Synchronous, and the large period label changes in place. A slide would suggest a carousel the data does not have. |
| Subscribe-panel copy confirmation | `setCopiedUrl`, `CalendarSubscribePanel.tsx:108` | The label already swaps to "Gekopieerd" for 2s, and the stale-state guard is careful. Rare, and already acknowledged. |
| Match-strip result/fixture switch | `setShowResult`, `MatchStripView.tsx:716/733` | `lg` only, two slides, already `aria-live`. Low frequency, desktop only. |
| Scroller arrows appear/disappear | `canScrollLeft/Right`, `HorizontalSlider.tsx:108/131`, `ScrollOverlay.tsx:152` | Chrome. An arrow disappearing at the end of the content is itself the signal. (A keyboard user focused on an arrow loses focus when it unmounts. That is an a11y note, not motion.) |
| Section-nav active chip | `activeId`, `useSectionNav.ts` | Already `transition-colors duration-150` (`SectionNavChip.tsx:46`), which is Chrome, done. |
| Organigram "show whole structure" disclosure | `setExpanded`, `OrganigramOverview.tsx` | A one-time disclosure. Low frequency. |
| News "Meer nieuws laden" append | `setGridArticles`, `NewsListingClient.tsx:93` | The dots replace the button in place, so the action is already acknowledged. Animating the appended cards would be the global scroll reveal the map declined. |
| Gallery index load-more | `GalleryListingClient.tsx` | **Dead in production**: `/galerij` renders no load-more button (no `hasMore`). |
| VideoBlock play | `setIsPlaying`, `VideoBlock.tsx:181` | A native `<video>` shows its own buffering UI. |
| Share generator | `SharePage.tsx` | `robots: noindex`, an internal tool for one or two volunteers. Native share is the OS sheet, which brings its own motion. |
| Cookie banner | `vanilla-cookieconsent` | Shown once per visitor. The library's modal uses `.25s ease`, which is off-system, but one CSS variable on `#cc-main` (`--cc-modal-transition-duration`) fixes the duration. That is not worth a ticket of its own; fold it into whatever next touches `globals.css:1552`. |
| Search form / `SearchInterface` | `SearchForm.tsx:45` | Owned by #2500. |
| `SiteHeader` drawer | `SiteHeader.tsx:80` | Owned by #2497/#2498. |

## Recommended new tickets

1. **grilling**: *When a news category is tapped and its articles are still loading, where do The Dots go, and what does the stale grid do while they show?* (Answer the Waiting-Device placement, then the 500ms arrival. Coordinate with #2500 so the two async lists share one answer.)
2. **task**: *Make `/kalender`'s type chips and view toggle answer the tap immediately, by filtering the in-memory feed under a history-written param instead of `router.push` on a `force-dynamic` route.* (Not motion, but it was found here and it is the sharpest "did my tap register?" moment in the sweep.)
3. **prototype**: *When one `/hulp` question opens and another closes, should the tapped card hold still (scroll compensation) or should both move together, and if they move, which of the Three Speeds does a height change use?*
4. **task**: *Bring the gallery lightbox onto the system: Three Speeds plus The Curve through its `animation` prop, and `<Spinner variant="compact">` through `render.iconLoading` in place of its own spinner.*
5. **task**: *On a successful membership submission, move focus and scroll to the confirmation, and let the in-flight button wait with The Dots instead of "Versturen…".*

## Facts for sibling tickets

- **#2497** (drawer exit is a hard cut): `NavTakeover.tsx`'s `if (!open) return null` has moved to **`:193`** (the map says `:94`). The same exit-cut shape is in **`MemberDetailPanel.tsx:170`** (the `/hulp` bottom sheet and side panel), **`CalendarSubscribePanel.tsx:137`** and **`OrganigramExplorer.tsx:292`** (which has an entrance via `spotlight-pop`, but no exit). If #2497 settles on a pattern rather than a one-off fix, it covers four surfaces. Candidate 5 above rides on it.
- **#2499** (navigation pending indicator): not every slow "navigation" is a page change. `/kalender`'s filter chips and view toggle are same-page `router.push` calls that went unacknowledged for 272-759ms on fast wifi. A route-level pending indicator would fire for them, but the right fix is not to navigate at all (ticket 2), so #2499 should not design around this case.
- **#2500** (search results arrival): `/nieuws` category switching is a second "honestly async" list arrival (a server-action fetch), and its waiting device is currently off screen. `HubSearch` (`/hulp`) uses the same `useSemanticSearch` hook as `/zoeken`, so whatever #2500 decides for `/zoeken` reaches `HubSearch` too, unless it is scoped out on purpose.
- **#2498, #2501**: nothing found that changes them.
