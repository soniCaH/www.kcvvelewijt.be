# Phase 3 — Implementation plan

> **PRD:** `docs/prd/redesign-phase-3.md`
> **Tracking issue:** [#1525](https://github.com/soniCaH/issues/1525)
> **Master design:** `docs/plans/2026-04-27-redesign-master-design.md`
> **Design brief:** `docs/plans/2026-05-03-redesign-phase-3-design.md`
> **Predecessor plan:** `docs/plans/2026-04-29-redesign-phase-1-plan.md` (structure mirrored)
> **Sub-issues to create:** 11 children of #1525 (see §16 for `gh` recipes + GraphQL `addBlockedBy` script)

This plan executes the 11 sub-issues. Per repository convention each sub-issue is a separate Ralph-eligible work item with its own PR; this document is the source of execution order, file paths, acceptance criteria, and `addBlockedBy` graph.

---

## Pre-flight

Run once before opening any sub-issue:

1. **Worktree:** `pnpm ralph create 1525` to create an isolated worktree on `feat/issue-1525-tracer` (sub-branch per issue thereafter).
2. **Sanity studio access verified** for the 5 schema migrations (3.B.2 prerequisite). Confirm permissions on staging + production.
3. **VR baseline drift check:** `pnpm vr` against current `main` to confirm no pre-existing failures before the redesign work starts.
4. **Audit existing call sites:**
   - `<PageHero>` consumers (greppable: `from "@/components/.*PageHero"` or `<PageHero`).
   - `<PageHeader>` (in root layout) — single mount point.
   - `<MatchStripClient>` consumers — single Suspense mount in `(main)/layout.tsx`.
   - `<PageFooter>` (in root layout) — single mount point.
5. **Master design doc** open in another tab — §6 deltas of the PRD will fold back into this doc as sub-issues complete.

---

## Task 3.0 — Tracer · `<EndMark>` end-to-end

**Sub-issue:** create as child of #1525, no `blockedBy`. Title: `3.0 · Tracer — <EndMark> primitive shipped end-to-end`.

**Goal:** Smallest cross-layer slice that proves the Phase 3 architecture works.

**Files to create:**

- `apps/web/src/components/design-system/EndMark/EndMark.tsx`
- `apps/web/src/components/design-system/EndMark/EndMark.stories.tsx`
- `apps/web/src/components/design-system/EndMark/index.ts`

**Files to modify:**

- `apps/web/src/components/design-system/index.ts` — add `EndMark` export.

**Implementation:**

1. Component — composition per `phase-3-a-tier-c-figures/endmark-locked.md`:
   - Flex row: `[1px ink rule]` · `★ EINDE GESPREK ★` · `[1px ink rule]`.
   - Glyphs are flex children, NOT `::before`/`::after` pseudos (per locked spec — pseudo positioning was rejected during the drill).
   - Three-centerline alignment: rule centerline = glyph baseline = visual midline of the row. Document the contract in a one-line component comment.
2. Storybook story:
   - Title `UI/EndMark`.
   - `vr` tag in meta.
   - Default story showing the locked composition.
3. VR baseline:
   - `pnpm --filter @kcvv/web vr:update:story EndMark`.
   - Commit baseline alongside the component.

**Acceptance:**

- `EndMark` exported from design-system barrel.
- Storybook renders the locked composition (visually matches `endmark-locked.md` reference screenshot).
- VR baseline committed.
- `pnpm --filter @kcvv/web check-all` green.

**Closes:** master design §5.2 step "interview template — EndMark drops `flourish` prop" delta.

---

## Tasks 3.A.1 – 3.A.4 — Tier C figures (parallel after 3.0)

Each task has its own sub-issue. After 3.0 lands, all four can run in parallel; Ralph picks any unblocked one.

### Task 3.A.1 · `<PlayerFigure>`

**Sub-issue:** `3.A.1 · <PlayerFigure> primitive (photo + illustration states)` — `addBlockedBy 3.0`.

**Files to create:**

- `apps/web/src/components/design-system/PlayerFigure/PlayerFigure.tsx`
- `apps/web/src/components/design-system/PlayerFigure/PlayerFigure.stories.tsx`
- `apps/web/src/components/design-system/PlayerFigure/index.ts`
- `apps/web/src/components/design-system/PlayerFigure/illustration.svg` (canonical block-print figure)

**Implementation per `playerfigure-locked.md`:**

1. Two mutually-exclusive states picked at runtime by `psdImage` availability:
   - **Photo state**: rectangular `psdImage` in a polaroid `<TapedCard>` frame, no surrounding illustration. Composes `<TapedCard rotation>` + `<img>`.
   - **Illustration state**: canonical block-print figure (jersey-deep underprint + ink overprint, ellipse head, V-collar, 4 vertical stripes). Render the SVG; same paths as `<JerseyShirt>` but home palette.
2. **No hybrid** — never combine photo face + drawn body (per `feedback_playerfigure_no_hybrid`).
3. Side meta column rendered identically in both states (per locked spec).
4. **No `<TicketStub>` inside** `<PlayerFigure>` (sibling-not-child per locked spec).
5. Storybook stories: photo-present, photo-missing (illustration), photo-cropped-tight.
6. VR baseline.

**Acceptance:**

- Two states render correctly given `psdImage` undefined / present.
- VR baseline matches locked spec screenshots.
- Reuse mandate: `<TapedCard>` consumed; no new sibling primitives invented.
- Storybook + VR green.

### Task 3.A.2 · `<JerseyShirt>`

**Sub-issue:** `3.A.2 · <JerseyShirt> primitive (decorative jersey illustration)` — `addBlockedBy 3.0`.

**Files to create:** `apps/web/src/components/design-system/JerseyShirt/{JerseyShirt.tsx, JerseyShirt.stories.tsx, index.ts, jersey.svg}`

**Implementation per `jerseyshirt-locked.md`:**

1. Single decorative jersey illustration. Same SVG paths as `<PlayerFigure>` illustration — **palette inverted** (ink underprint + jersey-deep overprint).
2. **YouthBlock only** — not used in WebshopStrip (per master design §5.1 step 9 delta in PRD §6).
3. Storybook story.
4. VR baseline.

**Acceptance:**

- Inverted palette renders correctly.
- VR baseline matches.
- Storybook green.

### Task 3.A.3 · `<EndMark>` polish (already shipped in 3.0)

**Sub-issue:** `3.A.3 · <EndMark> — final VR baseline + Storybook polish` — `addBlockedBy 3.0`.

**Action:** confirm 3.0's tracer ship is acceptable as the final 3.A.3 deliverable. If any polish (additional stories, axe-a11y check) wanted, ship here. Likely closed in same PR as 3.0 if no additional work surfaces.

### Task 3.A.4 · `<QASectionDivider>`

**Sub-issue:** `3.A.4 · <QASectionDivider> primitive + Sanity schema block` — `addBlockedBy 3.0`.

**Files to create:**

- `apps/web/src/components/design-system/QASectionDivider/{QASectionDivider.tsx, QASectionDivider.stories.tsx, index.ts}`
- `packages/sanity-schemas/src/blocks/qaSectionDivider.ts` (NEW schema block)

**Files to modify:**

- `packages/sanity-schemas/src/article.ts` — add `qaSectionDivider` to `body` field's `block.of[]`.

**Implementation per `qasectiondivider-locked.md`:**

1. Component renders: `[rule]` · `✦ {title} ✦` · `[rule]` (Note: ✦ glyph, distinct from EndMark's ★).
2. Sanity schema:
   - Constrained Portable Text `title` field (single block, max 1 block).
   - "Accent" decorator only (no other marks/styles).
   - Optional `kicker: string` rendered beneath the rule.
3. Editors apply emphasis by selecting + clicking the Accent decorator (NOT typing substrings — per `feedback_inline_emphasis_via_portable_text`).
4. Component renders the PT title with the Accent decorator span styled italic + jersey-deep.
5. Storybook stories: title without accent, title with accent, title + kicker.
6. VR baseline.
7. **Sanity migration** — none needed; new optional field. Existing articles without `qaSectionDivider` blocks render unchanged.

**Acceptance:**

- Schema block compiles + appears in Studio.
- Editor can insert + apply Accent decorator.
- Component renders the locked spec.
- VR baseline matches.
- `pnpm --filter @kcvv/sanity-schemas check-all` green.

---

## Task 3.B.1 — `<EditorialHero>` shell + discriminated union types

**Sub-issue:** `3.B.1 · <EditorialHero> shell + discriminated union types (no variants)` — `addBlockedBy 3.0`.

**Files to create:**

- `apps/web/src/components/article/EditorialHero/EditorialHero.tsx` (Server Component, discriminated union dispatch)
- `apps/web/src/components/article/EditorialHero/EditorialHero.types.ts` (TS union)
- `apps/web/src/components/article/EditorialHero/EditorialHeroShell.tsx` (60/40 grid + ink rule)
- `apps/web/src/components/article/EditorialHero/EditorialKicker.tsx`
- `apps/web/src/components/article/EditorialHero/EditorialLead.tsx`
- `apps/web/src/components/article/EditorialHero/EditorialByline.tsx`
- `apps/web/src/components/article/EditorialHero/HeroCoverImage.tsx`
- All paired `*.stories.tsx` and `index.ts` files
- `apps/web/src/components/design-system/index.ts` — barrel exports for the shared sub-components

**Implementation per `announcement-locked.md` §"Component composition":**

1. Discriminated union types — strict per-variant prop shapes (start with announcement-only, others extend in 3.B.2):

```typescript
type EditorialHeroProps =
  | EditorialHeroAnnouncementProps
  | EditorialHeroTransferProps // stub in this task; populated in 3.B.2
  | EditorialHeroEventProps // stub
  | EditorialHeroInterviewProps; // stub
```

2. `placement?: "detail" | "homepage"` (default `"detail"`) on every variant. The `"homepage"` placement wraps the rendered hero in `<a href={`/nieuws/${article.slug}`}>` and applies press-up hover styling + `★ Lees verder →` hint.
3. Shared sub-components built per the locked spec — kicker, lead, byline, cover image. Each ships with a Storybook story.
4. **Reuse mandate** (per `feedback_editorial_hero_reuse_mandate`):
   - Audit existing primitives before any new file.
   - Extract before duplicating — kicker / lead / byline / cover all used 4× (per variant), so they earn shared sub-component status.
5. NO variant rendering yet — `<EditorialHero>` dispatches to `<EditorialHeroAnnouncement>` etc., but those throw `not yet implemented` until 3.B.2.

**Acceptance:**

- Discriminated union types compile clean.
- All 5 shared sub-components ship with `<Name>.stories.tsx` (title `UI/<Name>`, `vr` tag, baseline committed).
- `<EditorialHero>` exported from `apps/web/src/components/article/`.
- TypeScript type-check + Storybook + VR green.

---

## Task 3.B.2 — `<EditorialHero>` variants + 5 schema migrations

**Sub-issue:** `3.B.2 · <EditorialHero> variants + Sanity schema migrations` — `addBlockedBy 3.A.1, 3.A.2, 3.B.1`.

**Schema migrations (BLOCKING — run before code merges to staging):**

Per PRD §7. All five must run on staging first; production runs after dataset audit.

```text
packages/sanity-schemas/src/migrations/
  ├── 2026-05-XX-add-article-lead.ts                       (Ask 1)
  ├── 2026-05-XX-event-body-validator-eventfact.ts         (Ask 6, eventFact)
  ├── 2026-05-XX-transfer-body-validator-transferfact.ts   (Ask 6, transferFact)
  ├── 2026-05-XX-coverimage-required.ts                    (Ask 8)
  └── 2026-05-XX-title-to-portable-text.ts                 (Ask 9)
```

Each migration ships with:

- Schema diff (+ Sanity validator change in `packages/sanity-schemas/src/article.ts`)
- Migration script (run via `pnpm --filter @kcvv/studio sanity exec migrations/<file> --with-user-token`)
- "Run before deploy" step in PR description
- **Critical for #5 (title→PT):** every consumer must update to PT-aware rendering or use `serializeTitle()` helper. Affected consumers (audit before merge): article cards, EditorialHero, OG meta, JSON-LD, sitemap, search, RSS.

**Component implementation files:**

- `apps/web/src/components/article/blocks/TransferFactStrip/TransferFactStrip.tsx` (+ stories)
- `apps/web/src/components/article/blocks/EventFactStrip/EventFactStrip.tsx` (+ stories)
- `apps/web/src/components/article/blocks/SubjectsStrip/SubjectsStrip.tsx` (+ stories)
- `apps/web/src/components/article/EditorialHero/variants/{Announcement,Transfer,Event,Interview}.tsx`

**Implementation per locked specs:**

| Variant      | Spec                     | Per-variant artefact                                                                                                                     |
| ------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| announcement | `announcement-locked.md` | Cover image only (right column)                                                                                                          |
| transfer     | `transfer-locked.md`     | TransferFactStrip below hero · PullQuote tone="jersey" between strip and body for `transferFact.note` (Option B)                         |
| event        | `event-locked.md`        | EventFactStrip Layout C — ticket-stub banner with jersey-deep date block · `ticketUrl`-empty hides CTA · sessions[] inline in strip body |
| interview    | `interview-locked.md`    | SubjectsStrip (N=1/2/3/4 layouts) · Q&A divider in body · EndMark closing                                                                |

**Homepage placement extension** — applies to all 4 variants per the locked spec extension folded into each `*-locked.md`:

- `placement="homepage"` wraps the hero block in `<a>` with `/nieuws/{article.slug}`.
- Press-up hover (`transform: translate(-2px, -2px)` + grown shadow) + `★ Lees verder →` hint fade-in.
- Body content (factStrips, Q&A, EndMark) suppressed.
- Storybook story per variant per placement (8 stories total).

**Acceptance:**

- All 5 schema migrations executed on staging successfully (no errors).
- Production migration plan documented in PR (audit + backfill steps for `coverImage`).
- All 4 variants render correctly at both placements.
- 8 Storybook stories ship (4 variants × 2 placements).
- VR baseline per story.
- Mobile breakpoint VR captured (`vr.viewport: "mobile"`).
- `pnpm --filter @kcvv/web check-all` green.
- `pnpm --filter @kcvv/sanity-schemas check-all` green.

---

## Task 3.B.3 — `<PageHero>` retirement + call-site migration

**Sub-issue:** `3.B.3 · <PageHero> retirement + call-site migration` — `addBlockedBy 3.B.2`.

**Files to delete:**

- `apps/web/src/components/design-system/PageHero/` (entire folder — component + stories + tests)
- `apps/web/src/components/design-system/index.ts` — remove `PageHero` export.

**Files to modify (call-site migration):**

- Every consumer of `<PageHero>` (audit via `grep -rn "<PageHero" apps/web/src/`) migrates to `<EditorialHero variant=…>` or its appropriate replacement.

**Implementation:**

1. Grep all `<PageHero` call sites. Document the list in PR description.
2. For each call site:
   - If the page renders an article, swap to `<EditorialHero variant={article.articleType} placement="detail" article={article} />`.
   - If the page renders a non-article hero (legacy "page" documents, error pages, sitemap), evaluate: keep a thin custom hero per page, OR render content without a hero. The locked Phase 3 doesn't ship a `<PageHero>` replacement — non-article heroes are a separate phase per design brief §1.
3. Run VR full-suite. Investigate any regression.
4. Remove `<PageHero>` files + barrel export.

**Acceptance:**

- Zero `<PageHero` references in `apps/web/src/`.
- VR full-suite green (or every regression explicitly approved).
- Page-document heroes that don't have an `<EditorialHero>` replacement render acceptably with custom inline JSX (acknowledged debt for a future phase).

---

## Task 3.C.1 — `<SiteHeader>` rework

**Sub-issue:** `3.C.1 · <SiteHeader> rework + drawer + sticky behaviour` — `addBlockedBy 3.0`.

**Files to create:**

- `apps/web/src/components/layout/SiteHeader/SiteHeader.tsx` (Server Component, fetches senior/youth teams via `TeamRepository`)
- `apps/web/src/components/layout/SiteHeader/NavTakeover.tsx` (Client Component, drawer state)
- `apps/web/src/components/layout/SiteHeader/NavTakeover.Item.tsx`
- `apps/web/src/components/design-system/IconButton/IconButton.tsx` (+ stories)
- All paired `*.stories.tsx` files (UI/SiteHeader, UI/NavTakeover, UI/NavTakeover/Item, UI/IconButton)

**Files to modify:**

- `apps/web/src/app/layout.tsx` — replace `<PageHeader>` with `<SiteHeader>`.
- `apps/web/src/components/PageHeader/PageHeader.tsx` — **mark for deletion** (delete in same PR after the new component is wired).
- `apps/web/src/components/PageHeader/PageHeader.tsx:wordmark-superscript` — `SINDS 1948` becomes `SINDS 1909` (handled inline by replacement).

**Implementation per `header-locked.md`:**

1. **Sticky at `top: 0`** on every page (Q1 B1 lock). Pure CSS — no JS scroll listener.
2. **Icon-only search** (Q2 C1) — click → `/zoeken`. Use `<IconButton>` + Phosphor `MagnifyingGlass` (production swap; mockup uses `⌕` glyph).
3. **WORD LID hidden on mobile** (Q3 D3) — `<button class="...hidden md:flex">` pattern. Full `KCVV Elewijt` wordmark with jersey-deep on `Elewijt` preserved at every viewport.
4. **Mobile drawer** = `<NavTakeover>` full-viewport takeover (Q4 E2 refined):
   - Top bar: wordmark + ✕ close button (replaces hamburger in same slot, ink/cream inverted).
   - Nav items as Playfair italic 22px display lines with paper-edge bottom rules.
   - Right slot: `▾` only on submenu items (Teams, Jeugd, De club). Leaf items render no right glyph. Active item color signal only — no underline, no number, no `★` suffix (per `feedback_no_decorative_nav_ornaments`).
   - Word lid as full-width hero block below nav list.
   - Sub-items render lazily (open on tap); body scroll lock while open; close paths = ✕ button + Escape key + click on a navigating link.
5. **Founding year fix:** `SINDS 1948` → `SINDS 1909` in the wordmark superscript (one-line fix, handled by the new component).
6. **Existing logic preserved:**
   - `seniorTeams: TeamNavVM[]` + `youthTeams: TeamNavVM[]` props from root layout.
   - `usePathname()` for active route detection.

**Acceptance:**

- `<SiteHeader>` ships at `apps/web/src/components/layout/SiteHeader/`.
- `<IconButton>`, `<NavTakeover>`, `<NavTakeover.Item>` all in Storybook with VR baselines.
- Drawer closed/open/submenu-expanded all VR-captured.
- Legacy `<PageHeader>` deleted.
- Root layout swap done.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 3.C.2 — `<MatchStrip>` rework

**Sub-issue:** `3.C.2 · <MatchStrip> rework + landing-only render rule` — `addBlockedBy 3.0`.

**Files to create:**

- `apps/web/src/components/layout/MatchStrip/MatchStrip.tsx` (replaces `<MatchStripClient>`)
- `apps/web/src/components/layout/MatchStrip/MatchStrip.stories.tsx`
- `apps/web/src/components/design-system/ShieldFigure/ShieldFigure.tsx` (+ stories)

**Files to modify:**

- `apps/web/src/app/(main)/layout.tsx` — wrap with the new `<MatchStrip>` only on landing surfaces (homepage + section indexes per Q5 G3 lock).
- Delete `apps/web/src/components/layout/MatchStrip/MatchStripClient.tsx` (legacy).

**Implementation per `matchstrip-locked.md`:**

1. **2-state matrix:**
   - `getFirstTeamNextMatch()` returns `null` → component returns `null` (zero DOM, no placeholder).
   - Returns an upcoming match → render the locked composition.
   - **No live state, no concluded state, no ticketing CTA** (owner-confirmed scope).
2. **Render rule:** wrap the strip in a layout slot that's only included on landing surfaces. Detail-page templates (article detail, single team / player / match) inherit from a layout that omits the slot. Hero-less utility pages omit too.
3. **Composition:**
   - Fixture cluster: `<ShieldFigure variant="kcvv">` + KCVV name + `vs.` (or `@`) + opponent name + `<ShieldFigure variant="opponent">`.
   - Meta cluster: 3 cells (Competitie · Aftrap · Terrein) with paper-edge dividers.
   - CTA: `<Button variant="primary" size="sm">` linking to `/wedstrijden/{match.id}`.
   - Mobile: single-column stack, drop Competitie + Terrein labels.
4. `<ShieldFigure>`:
   - Variants: `kcvv` (jersey-deep fill, cream initial) · `opponent` (cream-soft fill, ink initial).
   - Heraldic clip-path: `polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)`.
   - Renders opponent logo URL inside if provided; falls back to initial.
5. **Reuses existing data shape** (`UpcomingMatch` from `/matches/next`); zero schema/API changes.

**Acceptance:**

- Strip renders only on landing surfaces (homepage, section indexes).
- 2-state behaviour verified at integration test level.
- `<ShieldFigure>` Storybook + VR baseline.
- `<MatchStrip>` Storybook story for upcoming state at desktop + mobile widths.
- Legacy `<MatchStripClient>` deleted.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task 3.C.3 — `<SiteFooter>` rework

**Sub-issue:** `3.C.3 · <SiteFooter> rework + founding year fixes` — `addBlockedBy 3.0`.

**Files to create:**

- `apps/web/src/components/layout/SiteFooter/SiteFooter.tsx`
- `apps/web/src/components/layout/SiteFooter/SiteFooter.stories.tsx`
- `apps/web/src/components/layout/SiteFooter/footerLinks.ts` (locked link list)
- `apps/web/src/components/design-system/FooterLink/FooterLink.tsx` (+ stories)

**Files to modify:**

- `apps/web/src/app/layout.tsx` — replace `<PageFooter>` with `<SiteFooter>`.
- `apps/web/src/components/layout/PageFooter/PageFooter.tsx` — **mark for deletion** after wiring.
- `apps/web/src/components/home/MissionBanner/...` — `sinds 1948` → `sinds 1909` (one-line fix, in passing).
- `apps/web/src/lib/jsonld.ts` — `foundingDate: "1924"` → `"1909"` (one-line fix, in passing).

**Implementation per `footer-locked.md`:**

1. **H3 top zone:** modest `KCVV Elewijt` wordmark (Playfair italic 900, 44px, jersey-deep on `Elewijt`) + 2-colour motto (`Er is maar één <em>plezante</em> compagnie.`, jersey-deep emphasis on `plezante`).
2. **3-col directory** (I2 task-oriented):
   - Ontdek — Nieuws · Kalender · Evenementen · Onze ploegen · Jeugdwerking
   - Aansluiten — Als speler · Als vrijwilliger · Als sponsor (role-based per `feedback_role_based_engagement_naming`)
   - Bij de club — Geschiedenis · Bestuur · Contact · Praktische info
3. **Ink bottom bar:** `© 1909–{currentYear} KCVV Elewijt` · `Driesstraat 32 · 1982 Elewijt` · Privacy · Cookies · social glyphs (Facebook + Instagram).
4. **Mobile collapse** (≤ 768px): 3 cols → 1 col stack, wordmark 44 → 32px, tagline 21 → 18px, ink bar wraps to 2 rows.
5. **`<FooterLink>` primitive:** body font 14/500, ink-soft default, jersey-deep with bottom rule on hover. Distinct from `<EditorialLink>` (different sizing).
6. **Reuses verbatim:** `<EditorialHeading>`, `<MonoLabel>`, `<SocialLinks>`, `<CookiePreferencesButton>`.
7. **Founding year fixes** — three one-line edits in passing (`MissionBanner` · `jsonld.ts` · `PageHeader` wordmark already handled by 3.C.1).
8. **No newsletter** — never include a newsletter signup column or CTA. Permanent constraint.
9. **Route reconciliation:** verify each href in the locked link list against actual Next.js routes during implementation. Some current `clubLinks` routes (`/kalender`, `/ploegen`, `/bestuur`) need verification; create routes if missing OR relocate the link to a real path.

**Acceptance:**

- `<SiteFooter>` ships at `apps/web/src/components/layout/SiteFooter/`.
- `<FooterLink>` Storybook + VR baseline.
- `<SiteFooter>` Storybook stories for desktop + mobile.
- Legacy `<PageFooter>` deleted.
- All 3 founding-year locations corrected.
- All footer routes verified (404-free).
- Root layout swap done.
- `pnpm --filter @kcvv/web check-all` green.

---

## Task `--` Update `apps/web/CLAUDE.md`

After the chrome-track sub-issues land:

- Document the new layout component paths (`SiteHeader`, `MatchStrip`, `SiteFooter`).
- Note the `<EditorialHero>` discriminated union pattern under "Design System & Storybook (MANDATORY)".
- Cross-reference the Phase 3 PRD.

This is captured in the PRD's §6 (master design deltas) but `apps/web/CLAUDE.md` is the live developer reference; keep it current.

---

## Task `--` Capture Phase 3 VR baselines

Run after **3.B.3** (`<PageHero>` retirement) lands and the layout-track is in:

```bash
pnpm vr:update
```

Wall time ~41 min for full Phase 2+3 set (per `reference_vr_update_walltime.md`); run in background with tightened Monitor filters. Investigate any regression before merge.

---

## Task `--` Master design doc updates

After the entire Phase 3 ships, fold the PRD §6 deltas into `docs/plans/2026-04-27-redesign-master-design.md`:

1. §4.4 — `<PlayerFigure>` two-state spec.
2. §4.4 — `<JerseyShirt>` inverted-palette spec.
3. §5.1 step 9 — drop `<JerseyShirt>` from WebshopStrip.
4. §5.1 step 11 — remove `<PosterWordmark>` band.
5. §5.2 — drop `flourish` prop from EndMark + QASectionDivider.
6. §5.3 — `<PlayerFigure>` no longer contains `<TicketStub>`.

This is a docs-only PR. Optional but completes the Phase 3 closure.

---

## Sub-issue creation recipe

After this plan lands and the owner confirms, create the 11 sub-issues:

```bash
# 3.0 — Tracer
gh issue create --title "3.0 · Tracer — <EndMark> primitive shipped end-to-end" \
                --body-file <(cat <<'EOF'
Per Phase 3 plan §"Task 3.0":
…
EOF
) --label "phase-3,tracer,ready"

# 3.A.1 — PlayerFigure (blocked by 3.0)
gh issue create --title "3.A.1 · <PlayerFigure> primitive (photo + illustration states)" \
                --body-file ... --label "phase-3,ready"

# … (8 more)

# Then add blockedBy edges via GraphQL (per `feedback_blockedby_not_subissues`):
# Use `addBlockedBy` mutation on each issue. Example:
gh api graphql -f query='
  mutation {
    addIssueBlockedBy(input: {
      issueId: "<3.A.1 issue id>",
      blockedByIssueId: "<3.0 issue id>"
    }) { ... }
  }'
```

The full set of `addBlockedBy` edges:

| Sub-issue | Blocked by               |
| --------- | ------------------------ |
| 3.A.1     | 3.0                      |
| 3.A.2     | 3.0                      |
| 3.A.3     | 3.0                      |
| 3.A.4     | 3.0                      |
| 3.B.1     | 3.0                      |
| 3.B.2     | 3.0, 3.A.1, 3.A.2, 3.B.1 |
| 3.B.3     | 3.0, 3.B.2               |
| 3.C.1     | 3.0                      |
| 3.C.2     | 3.0                      |
| 3.C.3     | 3.0                      |

**All 11 are children of #1525**, but per `feedback_blockedby_not_subissues` we use `addBlockedBy` GraphQL relationships, **not** `addSubIssue`.

The actual `gh` CLI invocations are deferred to a separate session (after owner confirms this plan); a sub-issue creation script will be drafted alongside that work.

---

## Estimate (recap)

Per PRD §13: **~14–17 days total** across the 11 sub-issues, parallelisable per the dependency graph.

---

## Summary

This plan executes the Phase 3 redesign work after design Checkpoints A · B · C · D all locked. 11 sub-issues across 4 tracks (tracer + Tier C figures + composition + layout chrome) with explicit `addBlockedBy` graph and per-task acceptance criteria.

The plan is a Ralph-eligible source of truth: each task section is concrete enough that the agent (or human) can pick a sub-issue and start. The PRD (`docs/prd/redesign-phase-3.md`) carries the design rationale; this plan carries the execution.

After Phase 3 ships:

- All Phase 4+ surfaces have a coherent chrome above them (header / strip / footer) and a consistent figure vocabulary inside them (Tier C primitives + EditorialHero).
- `<PageHero>` is dead.
- The MatchStrip is forward-looking only and lands only on landing surfaces.
- The footer is a colofon + secondary nav with role-based engagement clusters.
- Founding year `1909` is canonical site-wide.
