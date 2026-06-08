# PRD: Redesign Phase 7 — `/hulp` hub (formerly `/club/organigram` + `/hulp`)

**Status**: Ready for implementation (design locked)
**Date**: 2026-06-08
**Design contract**: `docs/design/mockups/phase-7-organigram/` — rounds `7o0`–`7o7` + the `7o2c` re-scope
(authoritative architectural lock).
**Epic**: #1529 (Redesign Phase 7) · **Milestone**: `redesign-retro-terrace-fanzine`
**Fuses**: #1530's `/hulp` (Phase 8 `/hulp` removed — see both issues' 2026-06-08 re-scope banners).
**Supersedes**: the organigram portion of any legacy club-landing PRD; master-design §6.10 (organigram)
and §6.11 (`/hulp`) for these surfaces.

---

## 1. Problem statement

Two un-redesigned, overlapping surfaces both answer the same question — _"find the right person or answer
at KCVV"_:

- **`/club/organigram`** — a heavy tabbed `UnifiedOrganigramClient` (Overzicht cards / Diagram / Hulp) on
  legacy chrome (`InteriorPageHero`, `SectionStack`, `bg-kcvv-black`, `diagonal`). The **Diagram** is a
  `d3-org-chart` canvas whose `d3-zoom` wheel handler **scroll-jacks the page**; free pan/zoom means users
  **lose orientation**; the three views are poorly discoverable and the cards↔diagram pair is redundant.
- **`/hulp`** — a separate, newer `<HulpPage>` responsibility-finder (search · browse · answer · contact).
  The organigram's "Hulp" tab **duplicates** it → "which page do I go to?"

The redesign **merges them into one `/hulp` hub** (decision `7o2c`): one unified search front door, two
browse modes (**Structuur** + **Hulp**) of the same contact graph, two nav doors, homed on `/hulp`.
`/club/organigram` is retired as a route (site is pre-launch — no redirects). This is a **Phase 7 + Phase 8
fusion**.

## 2. Scope

### In scope

- **New `/hulp` hub** (cream paper, fanzine vocabulary) replacing both `/club/organigram` and the old
  `/hulp`.
- **Structuur half:** `<OrganigramHero>`, `<OrganigramSectionNav>`, `<StructureDirectory>`,
  `<OrgPersonCard>` (single/shared/vacant states), `<OrganigramExplorer>` (fullscreen 2-D spotlight),
  `<MemberDetailPanel>` (person-first side-panel).
- **Hulp half:** `<HulpFinder>` (reskinned `<HulpPage>`: capped category preview + accordion answers +
  contact w/ "toon in structuur").
- **One unified `<HubSearch>`** (people + answers) — merges `UnifiedSearchBar` + `HulpSearchInput`.
- **Semantic/AI question search** (bge-m3 + Vectorize) over `responsibility` docs.
- **Two nav doors** ("Hulp" → top, "Organigram" → `/hulp#structuur`); retire the `/club/organigram` route.
- **Legacy retirement** (see §4 Phase 7).
- SEO (FAQ + Breadcrumb + Organization JSON-LD), analytics, a11y, e2e + VR.

### Out of scope

- `/zoeken`, `/privacy`, error pages (remain **Phase 8** / #1530).
- The board pages `/club/{bestuur,jeugdbestuur,angels}` (separate #1529 item, 6.C `<TeamStaff>` reuse).
- A general contact form + address/hours block (owner: **CtaBand only**; master §6.11 form dropped).
- A "volledig organigram / print" view (deferred follow-up).

### No data-model change

**Zero Sanity schema changes.** Everything renders from existing fields: `organigramNode`
(title/description/roleCode/department/parentNode/members/active/sortOrder), `staffMember`
(firstName/lastName/email/phone/photo/psdId), `responsibility` (question/summary/steps/audience/category/
icon/primaryContact/relatedPaths). Vacant = the existing 0-members state; "toon in structuur" = the
existing `nodeId` on a position contact; the structure index = derived counts. Semantic search adds
**Vectorize/AI infra** (a Cloudflare index + BFF endpoint), not Sanity schema.

### Packages touched

`apps/web` (routes, components, repos already exist) · `apps/api` (BFF — semantic-search endpoint +
Vectorize index, Phase 6 only) · no `packages/sanity-schemas` change.

## 3. Final shape (locked — `7o7`)

```text
/hulp   cream paper · nav doors "Hulp" (top) / "Organigram" (#structuur)
<OrganigramSectionNav>   sticky: Hulp · Structuur  +  unified ⌕ search
<OrganigramHero>         jersey-deep-dark · "Wie doet wat." (warm ".") · unified search · audience chips · structure index
① #hulp  <HulpFinder>    search-above · audience+category chips · "Alles" = capped category preview (top 3 + "Alle N →")
                         · <QuestionCard> accordion → summary · numbered steps · <ContactCard> (✉/☎ · "toon in structuur →")
<StripedSeam>
② #structuur             <StructureDirectory> per afdeling (compact, "Toon alle 23 →") · "Open verkenner ⤢"
                         → <OrganigramExplorer> fullscreen spotlight (2-D) · click person → <MemberDetailPanel>
<CtaBand>                jersey-deep-dark "Niemand gevonden? → Contacteer de club"
```

Order = **Hulp-first**. Explorer = **2-D spotlight, no 3-D** (investigated + removed, `7o3`). Detail =
**person-first right side-panel** (`7o5`). Card states = single / shared dual-avatar / **vacant recruit**
(`7o4`).

## 4. Phases

> Phases are sequential; each ends green (`check-all`, stories, VR, e2e where relevant). Component-level
> work ships its Storybook story (+ `vr` tag + baselines) and unit tests per the apps/web contract.

### Phase 1 — Tracer: hub shell + route + unified search + nav
Stand up `/hulp` as the hub: `<OrganigramSectionNav>` (two doors + sticky search), `<OrganigramHero>`
(dark band + `<HubSearch>` + audience chips + structure-index artefact from real counts), skeleton
`#hulp` / `#structuur` sections, `<CtaBand>`. Wire both repos server-side (ISR 3600). **Retire the
`/club/organigram` route**; add the "Organigram" → `/hulp#structuur` nav entry. `<HubSearch>` ships
keyword-ranked (people + answers), replacing `UnifiedSearchBar` + `HulpSearchInput`.

### Phase 2 — Structuur directory + person card
`<StructureDirectory>` (people grouped by afdeling, compact + "Toon alle N →"). `<OrgPersonCard>`
(extends 6.C `<TeamStaff>`): **single** (photo/monogram) · **shared** (dual-avatar + "N personen", click →
panel) · **vacant** (recruit: warm card, "deze plek is vrij", "Iets voor jou? →"). Optional roleCode pill.

### Phase 3 — `<OrganigramExplorer>` (fullscreen 2-D spotlight)
Opt-in fullscreen focused mode launched from "Open verkenner ⤢". Spotlight drill-down: selected node
centred · parent above + breadcrumb · siblings flank · children fan below · click/keyboard nav
(↑↓←→/Enter) · zoom/fit · Esc. **Retire `EnhancedOrgChart` + the `d3-org-chart` dependency,
`MobileNavigationDrawer`, `ContactOverlay`.** No 3-D, no WebGL.

### Phase 4 — `<MemberDetailPanel>` (person-first)
Right side-panel (desktop) / full-width bottom sheet (mobile). **Single** → opens directly; **shared** →
lands on first holder + **name-tab holder-switcher**. Contact (✉/☎ if present) · "Helpt met" → Hulp ·
"Volledig profiel →" (`/staf/{psdId}` if present). Opens from a directory card **and** an explorer leaf.
Labelled dialog, focus trap, `?memberId=` deep-link. **Retire `MemberDetailsModal`** (panel replaces it +
`ContactOverlay`).

### Phase 5 — `<HulpFinder>` (reskin `<HulpPage>`)
Reskin to fanzine vocab: category + audience chips · **"Alles" = capped category preview** (top 3 per
category by declaration/`sortOrder`/alpha — **no fabricated "most asked"** + "Alle N →") · `<QuestionCard>`
**inline accordion** → summary · numbered steps · `<ContactCard>`. Contact reuses person vocab + a
**"toon in structuur →"** cross-link (opens that node in the explorer + the panel). Preserve
`resolveContact` / `team-role-resolution` (position / team-role / manual). **Retire the old
`ResponsibilityFinder` + `HulpSearchInput`.**

### Phase 6 — Semantic/AI question search
Embed `responsibility` docs into a Cloudflare **Vectorize** index (`@cf/baai/bge-m3`, 1024-dim cosine,
`MIN_SCORE ≈ 0.35`) via a BFF endpoint; route the hub search's **question intent** through it so natural
language ("mijn kind heeft zich bezeerd") matches without keyword overlap. People-search stays
keyword/structured. Graceful fallback to keyword if the index/endpoint is unavailable. _(Heaviest phase;
may split into "index+endpoint" / "wire-up". If descoped, Phase 5's keyword search stands and this becomes
a fast-follow.)_

### Phase 7 — Assembly · cross-links · SEO · analytics · retirement · tests
Final Hulp-first assembly + `<StripedSeam>` + cross-links (Structuur ⇄ Hulp). FAQ + BreadcrumbList +
Organization JSON-LD. Analytics (§6) + GTM note. Delete all retired legacy + confirm `git grep` clean.
Update `/hulp` e2e smoke (route is now the hub), add the `/club/organigram` removal. VR baselines for every
new component story. `check-all` green.

## 5. Acceptance criteria (per phase)

**Phase 1** — [ ] `/hulp` renders the hub shell + sticky two-door nav + hero + unified search; [ ]
`/club/organigram` route removed, "Organigram" nav → `/hulp#structuur`; [ ] structure-index counts derive
from repo data; [ ] `<HubSearch>` returns people + answers (keyword); [ ] e2e smoke for `/hulp`; [ ]
`check-all` green.
**Phase 2** — [ ] directory groups by afdeling, "Toon alle N →" caps render; [ ] `<OrgPersonCard>` single
/ shared / vacant-recruit stories + VR; [ ] no fabricated data (vacant = real 0-members).
**Phase 3** — [ ] explorer fullscreen spotlight: breadcrumb + click/keyboard nav + zoom/fit + Esc; [ ] **no
scroll-jacking** (no page wheel capture); [ ] `d3-org-chart` removed from `package.json`; [ ]
`EnhancedOrgChart`/`MobileNavigationDrawer`/`ContactOverlay` deleted (`git grep` clean); [ ] mobile tap-only.
**Phase 4** — [ ] panel opens from directory + explorer; single direct / shared switcher; contact actions
only when data present; [ ] labelled dialog + focus trap + `?memberId=`; [ ] `MemberDetailsModal` deleted.
**Phase 5** — [ ] "Alles" never renders the full flat list (capped preview); [ ] accordion answer = summary
+ steps + contact; [ ] "toon in structuur" deep-links the explorer; [ ] `ResponsibilityFinder` +
`HulpSearchInput` deleted; [ ] `resolveContact` paths (position/team-role/manual) covered by tests.
**Phase 6** — [ ] Vectorize index built (1024-dim cosine, bge-m3) + BFF endpoint; [ ] NL query matches the
right answer above `MIN_SCORE`; [ ] keyword fallback on failure; [ ] no PII in embeddings beyond public Q&A.
**Phase 7** — [ ] cross-links both ways; [ ] FAQ/Breadcrumb/Organization JSON-LD validate; [ ] analytics
events fire (GTM note in PR); [ ] all legacy retired (`UnifiedOrganigramClient`, `SectionStack`,
`InteriorPageHero`, `SectionCta`, `diagonal` on these surfaces); [ ] VR baselines committed; [ ]
`check-all` + e2e green.

## 6. Analytics

`organigram_` and `responsibility_` are **already in the live GTM Custom-Event trigger regex** — no regex
change required; new params still need DLVs + GA4 mappings.

| Event | Trigger | Params |
| --- | --- | --- |
| `hub_view` | `/hulp` page view | — |
| `organigram_section_in_view` | Structuur/Hulp section scrolled into view | `section` |
| `organigram_search_used` | unified search query | `query_text` (sanitised via `sanitizeQuery`) |
| `organigram_member_clicked` | open `<MemberDetailPanel>` (incl. holder-switch) | `member_id` (hashed via `hashMemberId`), `source` (directory/explorer/search) |
| `organigram_explorer_opened` | "Open verkenner ⤢" | — |
| `responsibility_view` | open a question accordion | `path_id` (slug) |
| `responsibility_contact_click` | ✉/☎ on a Hulp contact | `path_id`, `contact_type` |
| `responsibility_show_in_structure` | "toon in structuur →" | `node_id` (hashed) |

Drop the legacy 3-D / diagram-mode events (no 3-D). No PII: hash internal ids, sanitise queries, never
send emails/phones/raw names.

## 7. SEO / structured data

- `generateMetadata`: title "Hulp & wie-is-wie | KCVV Elewijt", description, OG, canonical `/hulp`.
- **FAQPage** JSON-LD from `responsibility` Q&As (answers are in the DOM via the accordion — `7o6`).
- **BreadcrumbList** (Home → Hulp). **Organization** (KCVV Elewijt) on the hub.
- Per-answer fragment deep-links `/hulp#<slug>`.

## 8. Accessibility

- Spotlight explorer: full keyboard nav; the fullscreen mode is a labelled dialog ("Organigram-verkenner");
  breadcrumb is the orientation anchor; **no pointer-only interaction** (tap-driven; the dropped hover was
  never a discovery path).
- `<MemberDetailPanel>`: labelled dialog "Contactgegevens — {name}", focus trap, Esc, focus restored.
- Landmark/name uniqueness across hub dialog + nav (per repo convention).
- Contrast: small text on jersey-deep(-dark) uses `text-white`/cream (6.C AA rule).
- `aria-hidden` on decorative seams/artefacts; accordion uses `aria-expanded`/`aria-controls`.

## 9. Open questions / discovered unknowns

- **Hero heading copy** — "Wie doet wat." vs a help-forward variant for the help-primary hub (copy-time).
- **Semantic phase sizing** — Phase 6 may split (index+endpoint / wire-up) or become a fast-follow if the
  Cloudflare AI/Vectorize work outweighs the launch window; Phase 5 keyword search is the safe floor.
- **Real corpus sizes** unknown (positions/people/responsibilities counts) — the capped-preview + "Toon
  alle" patterns are built to scale regardless; verify against production seed.
- **Nav wiring** — confirm the global nav exposes both "Hulp" (top-level) and "Organigram" (under Club)
  pointing at the one hub.
- **"Volledig organigram / print"** collapsible-tree view — deferred; revisit if a printable chart is
  requested.
