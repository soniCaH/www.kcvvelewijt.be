# Phase 7 · `/club/organigram` → unified **`/hulp` HUB** — RE-SCOPE — LOCKED

**Date:** 2026-06-08
**Owner:** @climacon
**Tracker:** #1529 (Phase 7) **fuses** #1530's `/hulp` (Phase 8) · **Milestone:** `redesign-retro-terrace-fanzine`
**Amends:** `7o0`, `7o2`/`7o2b` · **Supersedes:** `7o6` bridge decision (`7o6-hulp-bridge-compare.html` — kept as history)

## Decision

`/club/organigram` and `/hulp` are **one job** — _"find the right person or answer at KCVV"_ — so they
become **one hub**, not two pages. Discovery confusion today comes from **duplication** (the organigram's
old "Hulp" tab re-renders the same finder as `/hulp`); the fix is to **merge into a single surface**, not
to bridge between two.

### The hub

- **One search front door** (people **and** answers): a name/role → a **person**; a problem
  ("mijn kind is geblesseerd") → an **answer + contact + steps**.
- **Two browse modes** of the same contact graph:
  - **Structuur** — org **directory** (people by afdeling) + fullscreen **`<OrganigramExplorer>`** spotlight
    drill-down (2-D, **no 3-D**) + **`<MemberDetailPanel>`** (right side-panel, person-first).
  - **Hulp** — the **responsibility finder** (reskinned `<HulpPage>`: search · category browse · answer ·
    contact), with `team-role` / `manual` / `position` contact resolution intact.
- Because a responsibility's contact **is** an organigram position, the two modes cross-reference
  (answer's contact → "toon in structuur"; a person → "helpt met …").

### URL + navigation

- **Canonical URL = `/hulp`** (the human-friendly, already-linked, FAQ-SEO'd help front door).
- **Two nav doors → one hub:** **"Hulp"** lands at the top (search + finder); **"Organigram"** (under
  Club) lands at **`#structuur`**. Both audiences get the door they expect; both arrive at the same page.
- **`/club/organigram` is retired as a route.** Site is **pre-launch → no redirects** (owner, 2026-06-08).
- FAQ JSON-LD + "Hulp & Contact" metadata live on the hub.

### Scope fusion

- **#1529 (Phase 7) now delivers the `/hulp` hub, including the finder** that was #1530's `/hulp` scope.
- **#1530 (Phase 8)** drops `/hulp`; retains `/zoeken`, `/privacy`, error pages. Both issues updated
  2026-06-08.
- Master-design **open question 7** (paper aesthetic on chrome — panels/forms) resolves **here**.

## What carries over (the Structuur half — already locked)

All prior locks become the **Structuur** half of the hub, unchanged:
`7o1` hero (dark band + one search + audience chips) · `7o2` single-scroll + sticky nav + fullscreen
verkenner · `7o3` spotlight explorer (2-D, **3-D removed**) · `7o4` card states (single / shared dual-avatar /
**vacant recruit**) · `7o5` person-first `<MemberDetailPanel>` (right side-panel).

## What is newly in scope (the Hulp half + glue)

- **Reskin `<HulpPage>`** (finder: `HulpSearchInput`, `BrowseContent`, `CategorySection`, `QuestionCard`,
  `AnswerCard`, `ContactCard`, `resolveContact`) to the fanzine vocabulary → **Round 7o6 (re-drilled)**.
- **One unified search** spanning people + responsibilities as the hub's front door (replaces both the
  organigram `UnifiedSearchBar` and the finder's `HulpSearchInput`); **semantic/AI** (bge-m3 + Vectorize)
  folded in here.
- **Cross-links** Structuur ⇄ Hulp (contact → "toon in structuur"; person → "helpt met").
- **General contact form + address/hours** (master §6.11) — **LOCKED `7o7`: dropped** (CtaBand only).
- **Section order** — **LOCKED `7o7`: Hulp-first** (finder under the hero, Structuur second).
- **Two-nav-door wiring** + retiring `/club/organigram` route — **7o7** / PRD.

## Superseded

- **`7o6` bridge decision** ("B richer teaser → /hulp"): obsolete — Hulp is no longer a teaser to a
  separate page; it's a **first-class section/half of this hub**. `7o6` is re-drilled as the **finder
  reskin**.

## Net

One hub. One search. Two browse modes. Two nav doors. Homed on `/hulp`. Phase 7 + 8 fused. This **reduces**
confusion (one job, one surface) instead of relocating it.
