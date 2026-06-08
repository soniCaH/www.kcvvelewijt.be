# Phase 7 · `/club/organigram` — Round 0 (DATA + UX REALITY) — LOCKED

**Date:** 2026-06-07
**Owner:** @climacon
**Tracker:** #1529 (Phase 7 master) · **Milestone:** `redesign-retro-terrace-fanzine`
**Supersedes (on landing):** the organigram portion of any legacy club-landing PRD.

> **🔀 RE-SCOPED 2026-06-08 → unified `/hulp` hub.** Mid-drill, `/club/organigram` and `/hulp` were found
> to be one job and merged into a single hub (canonical `/hulp`, two nav doors, org-as-`#structuur`,
> finder folded in). Phase 7 + Phase 8 fused. **The authoritative frame is now
> [`7o2c-hulp-hub-rescope-locked.md`](./7o2c-hulp-hub-rescope-locked.md).** Read it alongside this doc —
> the data/UX facts below still hold (they're the Structuur half), but the surface is the hub, not a
> standalone organigram page.

This is the grounding round: **verified facts only**, no design decision. Everything here was
read out of the live code on `main` (not planning docs). It bounds what the drill can choose.

---

## 1. What `/club/organigram` actually is today

A **tabbed interactive tool** wrapped in legacy chrome, server-rendered then hydrated.

- **Shell:** `app/(main)/club/organigram/page.tsx` → `<SectionStack>` with three bands:
  hero (`<InteriorPageHero>`, `bg-kcvv-black`), content (`<UnifiedOrganigramClient>`, `bg-gray-100`),
  CTA (`<SectionCta>` "Wie zoek je?", `bg-kcvv-black`), joined by `diagonal` `<SectionTransition>`s.
  ISR `revalidate = 3600`. Breadcrumb JSON-LD. Legacy hero strings: label `"De club"`,
  headline `"Clubstructuur"`, body `"Ontdek de organisatie achter KCVV Elewijt."`.
- **Client:** `<UnifiedOrganigramClient>` — three views switched by a tab bar:

  | Tab value | Label | Component | What it is |
  | --- | --- | --- | --- |
  | `cards` | **Overzicht** | `<CardHierarchy>` | vertical expand/collapse card tree (mobile default) |
  | `chart` | **Diagram** | `<EnhancedOrgChart>` | `d3-org-chart` pan/zoom canvas (desktop default) |
  | `responsibilities` | **Hulp** | `<ResponsibilityFinder>` | "wie kan me helpen met…" finder |

- Plus: a top **`<UnifiedSearchBar>`** (searches people + responsibilities), **`<MemberDetailsModal>`**
  (click any node/card/result → modal), department filter (`all`/`hoofdbestuur`/`jeugdbestuur`),
  PNG export, keyboard shortcuts, swipe gestures, deep-linkable via `?view=`/`?member=`.

## 2. UX problems we are fixing (not just reskinning)

Confirmed against code; the owner loves the **diagram concept** but the interaction is poor:

1. **Diagram scroll-jacking (the #1 pain).** `<EnhancedOrgChart>` builds a `new OrgChart()`
   (`EnhancedOrgChart.tsx:196`) whose `d3-zoom` behaviour binds `wheel` on the SVG → mouse-wheel
   **zooms the chart instead of scrolling the page**. On a long editorial page the diagram becomes a
   scroll trap.
2. **Orientation / "getting lost."** Free pan + zoom + expand/collapse with no persistent "you are
   here." Recovery is the lone `fit()` button. No breadcrumb, no anchored root.
3. **Three-view discoverability.** `Overzicht` / `Diagram` / `Hulp` read as equal peers, but
   **Hulp** (find the right contact for a real-life question) is the most useful end-user job and is
   buried as the 3rd tab. The two browse views (`cards` + `chart`) render the **same hierarchy**
   twice — redundancy with a desktop/mobile default split, not a deliberate IA.
4. **Mobile diagram.** A pan/zoom canvas needs its own `<MobileNavigationDrawer>`; pinch-zoom inside
   a vertically-scrolling page is awkward.

> **Confirmed (Round-0 sign-off):** "the organigram in 3d" = this **`d3-org-chart` Diagram view**
> (keep the node-tree idea, fix the interaction). A **literal 3-D spatial visualization** was
> investigated as a serious contender in 7o3 and **rejected** (owner, 2026-06-08: "doesn't add value,
> au contraire — remove this 3D completely"). The explorer ships **2-D spotlight drill-down only**.
> All four pains below are in-scope priorities (owner picked every one).

## 3. DATA REALITY — what a node / person / question actually carries

Everything renderable is bounded by three Sanity schemas (`packages/sanity-schemas/src/`). **Design
must not invent fields.**

### `organigramNode` (a position/box in the chart)

| Field | Type | Populated? | Use |
| --- | --- | --- | --- |
| `title` | string | **always** (required) | position name — "Voorzitter", "Hoofdtrainer" |
| `description` | text | optional | role blurb (shown in modal) |
| `roleCode` | string ≤6 | optional | short badge — "T1", "VP" |
| `department` | enum | usually | `hoofdbestuur` \| `jeugdbestuur` \| `algemeen` (filter) |
| `parentNode` | ref | root=null | hierarchy edge |
| `members[]` | ref[] → staffMember | **0 / 1 / 2+** | drives **vacant / single / shared** states |
| `active`, `sortOrder` | bool / num | — | query filter + ordering |

A synthetic **`club` root** ("KCVV Elewijt", flat logo) is prepended in the repository.

### `staffMember` (a person inside a node)

Projected into the chart as: `id`, `name` (`firstName+lastName`, can be empty), `imageUrl`
(`photo` → **often missing → `/images/logo-flat.png` fallback**), `email?`, `phone?`, `psdId`
(→ links to the `/staf/{psdId}` profile page). **NOT surfaced here** (lives on the profile page):
`bio`, `functionTitle`, `birthDate`, `joinDate`. So a node card can reliably show **photo-or-fallback,
name, position title, optional role badge, optional email/phone** — nothing richer.

### `responsibility` (a "Hulp" entry)

`id` (slug), `audience[]` (`speler`/`ouder`/`trainer`/`supporter`/`niet-lid`/`andere`), `question`
(lowercase, no period), `keywords[]`, `summary` (1–2 sentences), `category`
(`medisch`/`sportief`/`administratief`/`gedrag`/`algemeen`/`commercieel`), `icon?`
(**Lucide name today — redesign canonical is Phosphor Fill → build must map or re-key**),
`primaryContact` (discriminated: `position` → resolves to current node holders / `team-role` →
trainer·afgevaardigde / `manual` → role+email+phone), `steps[]` (`description` + optional `link` +
optional per-step `contact`), `relatedPaths[]`.

## 4. MUST PRESERVE (functionality contract)

- **Three jobs:** browse the hierarchy, see a person's detail, find the right contact for a question.
- **Deep-linking:** `?view=`, `?member=`, and Hulp→chart "Bekijk in organigram" centering.
- **Analytics (5 events, names frozen — `organigram_` is in the live GTM regex):**
  `organigram_view_changed {view, source}` · `organigram_member_clicked {member_id(hashed), view}` ·
  `organigram_search_used {query_text(sanitised)}` · `organigram_department_filtered {department}` ·
  `organigram_export_png`. Member IDs hashed via `hashMemberId`, queries via `sanitizeQuery`.
- **A11y:** `<SkipLink>`, `<KeyboardShortcuts>` (`?` `1` `2` `3` `/` `Esc`), `<ScreenReaderAnnouncer>`
  (aria-live view announcements), focus management in the modal, swipe gestures on mobile.

## 5. RETIRE vs REUSE (seed for the PRD)

**Retire (legacy chrome / tokens):** `<InteriorPageHero>`, `<SectionStack>`, `<SectionCta>`,
`diagonal` `<SectionTransition>`, `bg-kcvv-black`, the `kcvv-green`/`kcvv-green-hover` node accents
and modal-header gradient, the hard-coded hex palette in `NodeRenderer.tsx`
(`#4acf52`/`#41b147`/…). **Keep the jobs, reskin the surfaces.**

**Reuse (Phase 7 vocabulary — locked elsewhere, do not re-drill):** cream-paper field + paper-grain;
`EditorialHeading` (italic serif display — **never** the Ultras heavy-sans, a one-page exception);
`MonoLabel`/kicker; `<StripedSeam>` (replaces `diagonal`); `<CtaBand>` (jersey-deep-dark,
warm paper-stamp button); the **6.C `<TeamStaff>` people-card** vocabulary (round newsprint photo /
jersey-deep monogram, name first-semibold + last-italic, mono function label) as the node/person idiom;
the dark "roster spotlight" hero with warm "." accent; tokens `--cream(-soft/-deep)`, `--ink(-soft/-muted)`,
`--jersey-deep`, `--jersey-deep-dark`, `--warm`, `--paper-edge`. Phosphor Fill icons via
`@/lib/icons.redesign`.

## 6. Open decisions → the drill plan (each its own `*-compare.html` + `*-locked.md`)

| Round | Decision | Why it's a decision |
| --- | --- | --- |
| **7o1** | **Voice / register** — hero treatment + overall chrome tone (editorial-story vs find-a-contact tool) | sets center of gravity |
| **7o2** | **View model / IA** — how many views, which is primary, default, ordering; kill the cards↔diagram redundancy; surface Hulp | the discoverability fix |
| **7o3** | **Diagram interaction model** — the scroll/orientation fix (contained pan-zoom vs in-page tree vs spotlight-drill-down vs lanes) | the #1 pain |
| **7o4** | **Node / people-card chrome** — `<TeamStaff>` idiom applied to vacant/single/shared nodes | per-element detail |
| **7o5** | **Member detail disclosure** — modal vs side-panel vs bottom-sheet vs inline expand | per-element detail |
| **7o6** | **Responsibility Finder (Hulp)** — category-grid vs audience-first vs search-first; contact + steps treatment | per-element detail |
| **7o7** | **Page assembly** — search placement, seams, `<CtaBand>` destination, empty states, SEO/analytics wiring | final assembly |

Sequence honours **voice → IA → details**. 7o2 must lock before 7o3 (IA decides whether the diagram
is a co-equal view or an opt-in deep-explore). Rounds may merge if a decision collapses.
