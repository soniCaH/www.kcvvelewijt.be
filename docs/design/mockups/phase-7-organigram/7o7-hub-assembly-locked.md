# Phase 7 · `/hulp` hub — Round 7 (FULL ASSEMBLY) — LOCKED

**Date:** 2026-06-08
**Mockup:** `7o7-hub-assembly-compare.html`
**Owner:** @climacon
**Tracker:** #1529 (fused Phase 7+8) · **Milestone:** `redesign-retro-terrace-fanzine`

## Decision

The unified **`/hulp` hub** assembles as a single-scroll page, **Hulp-first**, with a **CtaBand-only**
contact close (no form).

### Final spine

```text
/hulp   (canonical) — cream paper · two nav doors: "Hulp" → top · "Organigram" → #structuur
<OrganigramSectionNav>  sticky: Hulp · Structuur  +  the unified ⌕ search (repeated here)
<OrganigramHero>        jersey-deep-dark band · kicker "De club" · EditorialHeading "Wie doet wat." (warm ".")
                        · ONE unified search (people + answers) · audience chips → Hulp · structure index artefact
① #hulp  <HulpFinder>   unified search above · audience + category chips · "Alles" = capped category preview
                        (top 3 + "Alle N →") · <QuestionCard> inline accordion → summary · numbered steps ·
                        <ContactCard> (person vocab + ✉/☎ + "toon in structuur →")
   <StripedSeam>
② #structuur            <StructureDirectory> people by afdeling (compact, "Toon alle 23 →"; states:
                        single / shared dual-avatar / vacant-recruit) · "Open verkenner ⤢" →
                        <OrganigramExplorer> fullscreen spotlight drill-down (2-D, NO 3-D) · breadcrumb +
                        zoom/fit + Esc · click person → <MemberDetailPanel> (right side-panel, person-first,
                        holder-switcher for shared)
<CtaBand>               jersey-deep-dark "Niemand gevonden? → Contacteer de club" (mailto/contact)
```

Hero heading copy ("Wie doet wat." vs a help-forward variant) is finalised at PRD/copy time — structure
is locked.

## Baked-in defaults (locked unless flagged)

- **No general contact form, no address/hours block** (owner: CtaBand only — the finder routes to specific
  people). Master §6.11's form is dropped for this hub.
- **SEO:** FAQ JSON-LD (from `responsibility` Q&As — answers in-DOM via the accordion) + BreadcrumbList +
  Organization, all on the hub. "Hulp & Contact" metadata + canonical `/hulp`.
- **Analytics:** keep `organigram_*` + `responsibility_*` families (both already in the live GTM regex).
  `organigram_view_changed` → a single `hub_view`/section-in-view set; **drop** the 3-D + explorer-mode
  events (no 3-D); preserve `organigram_member_clicked` (hashed), `organigram_search_used` (sanitised),
  `responsibility_*`. New: `organigram_explorer_opened`. GTM regex already covers `organigram_|responsibility_`.
- **Legacy retired** (these surfaces): `UnifiedOrganigramClient`, `EnhancedOrgChart` + **d3-org-chart dep**,
  `MobileNavigationDrawer`, `ContactOverlay`, `MemberDetailsModal`, the old `ResponsibilityFinder`,
  `HulpSearchInput`, `InteriorPageHero` / `SectionStack` / `SectionCta` / `diagonal` on `/hulp` + the old
  `/club/organigram`.
- **`/club/organigram` route retired** (pre-launch, no redirect); a nav entry "Organigram" points at
  `/hulp#structuur`.
- **"Volledig organigram / print" view** (the A-style collapsible tree from 7o3) = **deferred follow-up**,
  not v1.

## Drill complete

Rounds `7o0`–`7o7` (+ `7o2c` re-scope) are locked. Next: the PRD
(`docs/prd/redesign-phase-7-hulp-hub.md`) → `/prd-to-issues`.
