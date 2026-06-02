# 6.C.d7 · Youth enrolment CTA — LOCKED

**Decision:** A youth-only "Word lid" recruitment ad — a standalone fanzine
section on `/ploegen/[slug]`, between `<SquadGrid>` and `<TeamStaff>`, linking
to the static `/club/inschrijven` route. Drilled 2026-06-01 → 2026-06-02 across
3 rounds (placement → copy → visual) plus a 2-fix design review. Issue #1949.

Drill artefact: `6cd7-enrolment-cta/visual-compare.html` (V1/V2/V3 side-by-side
in true tokens + real `<JerseyShirt>` paths). Out-of-PRD addition (not in
`detail-ia-locked.md`, not in `redesign-phase-6c-team.md`).

---

## 1. Render gate — youth only

- Renders **only when `team.teamType === "youth"`**; returns `null` for senior
  (A/B-ploeg). Computed in `team.repository.ts` (`computeTeamType`: age `u*` /
  `jeugd` → youth). Senior recruitment runs via trials/contact, and
  `/club/inschrijven` is in practice the **youth** enrolment route (target of
  `/jeugd`, the homepage `YouthSection`, `JeugdEditorialGrid`,
  `ResponsibilityBlock`).
- Must render correctly on a **thin youth page** (hero + squad + staff only;
  standings/matches auto-hidden). Verified in the artefact's page-context strip.

## 2. Placement (round 1 → **B**)

- **Own `<section>` between `<SquadGrid>` and `<TeamStaff>`**, mounted in
  `apps/web/src/app/(main)/ploegen/[slug]/page.tsx`.
- Framed by the page's existing rhythm: a `<StripedSeam colorPair="ink-cream"
height="md">` precedes it, exactly like every other section. Reuses the page
  `sectionClass` (`mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-10`).
- **No `<TeamSectionNav>` anchor** — it's a CTA, not navigable content (brief
  default). The nav's `navItems` list is untouched.
- Rejected: A (inline in `<TeamHero>` — touches the locked hero); C (sticky
  mobile footer band — competes with the sticky section-nav + MatchStrip, and
  leaves desktop with no CTA).

## 3. Copy (round 2 → **v1, club-motto warm**)

| Slot     | Text                                                             |
| -------- | ---------------------------------------------------------------- |
| Overline | `Word lid`                                                       |
| Heading  | `Sluit je aan bij de jeugd van Elewijt.` (accent on **Elewijt**) |
| Lead     | `Er is maar één plezante compagnie — en die begint op het veld.` |
| Button   | `Word lid →`                                                     |

- Voice: youth-oriented **"Word lid" / "Sluit je aan"** — never "Registreer",
  never "Inschrijven" as a verb (the URL slug already carries it). This is why
  the existing `YouthSection` "Schrijf je in" wording is **not** reused here.
- The lead is the canonical club motto ("Er is maar één plezante compagnie" —
  never "meer dan een club").
- Copy is **static** — no Sanity schema change, no per-team editorial field.

## 4. Visual (round 3 → **V2, jersey-deep**)

- **Card:** `<TapedCard bg="jersey-deep" shadow="soft">` (default `div`),
  wrapped by the page's `<section className={sectionClass}>` — avoids nesting a
  second sectioning element. The `border-ink border-2` + hard offset shadow is
  baked into `<TapedCard>`. `soft` shadow (`--shadow-paper-sm-soft`, ink-muted)
  per the locked "ink-bg cards need a soft shadow to avoid black-on-black
  silhouette loss" rule.
- **Card is STATIC** — **no** `interactive` prop / no press-down. Only the
  `<LinkButton>` presses. (Review fix #2: a card-level + button-level press was
  a double hover; the card is not itself a link.)
- **Overline:** `<MonoLabel tone="cream">` (full opacity — `cream/85` over
  jersey-deep trips axe).
- **Heading:** `<EditorialHeading level={2} tone="cream"` with
  `emphasis={{ text: "Elewijt", tone: "warm" }}` → `accentTone="warm"` (the
  warm token reads on dark surfaces; `jersey-deep` accent is for cream surfaces
  only). The label + heading **reserve a right gutter** (`pr` ≈ motif width +
  inset + gap) so they never run behind the corner motif (review fix #1).
- **Lead:** cream body text, **full-width** (no `max-width`) — it sits below the
  motif's bottom edge, so no gutter (review fix #3).
- **CTA:** `<LinkButton variant="inverted" withArrow href="/club/inschrijven">`
  — cream fill / ink text, the page's only interactive element here. Canonical
  press-down hover comes from `<LinkButton>` itself.
- **Motif:** corner `<JerseyShirt letterOverlay={ageGroup}>`, ~138px,
  **inset** from the top-right (~20px top / ~24px right) with a slight rotate —
  inset, not bleeding off the edge (review tweak). `letterOverlay` carries the
  team's age group (e.g. "U13"). On jersey-deep the ink underprint reads as a
  dark jersey silhouette with the cream chest letter — the intended look (the
  green-on-green stripe wash that ruled V2's motif "broken" is mitigated because
  the ink underprint dominates).
- Rejected: V1 (cream card — quieter, lower CTA prominence); V3 (split poster —
  adds a net-new 2-column layout with no precedent).

### Card shade + contrast (drill round 4)

Cream/warm text on `jersey-deep` (#008755) misses WCAG AA for non-large text:
cream label/lead **4.04:1** (< 4.5), warm accent **2.74:1** (< 3). The display-lg
heading passes as large text. Owner decision (2026-06-02, `contrast-shade.html`):
**keep #008755** — it is the shade `YouthSection` already ships, and the repo's
`@storybook/addon-a11y` runs in **warn** mode (non-failing in CI). The
AA-passing alternative — darken to `jersey-deep-dark` (#133d28, as
`ClubshopBanner` uses; cream ~10.9:1 / warm ~7.4:1) — was offered and declined
to preserve the approved shade + cross-consistency with `YouthSection`. Flagged
in the PR body.

## 5. Analytics

- Click event **`team_enrolment_cta_click`** (snake, `team_` prefix) with a
  **`team_slug`** param, via `trackEvent` (the `ClubshopBanner` inline-handler
  pattern). `team_slug` is the established team param (`team_detail_view` /
  `team_squad_in_view`).
- **No GTM change** — `team_` is already in the live Custom Event trigger regex
  (added in #1945). Per the owner's workflow the trigger regex is the only
  manual GTM step; new params need no DLV/custom-dimension work. Confirm + note
  in the PR body.

## 6. Scope / non-goals

- `apps/web` only: new component + page mount + story/test + these drill docs.
- **No** `packages/sanity-schemas` change (static link). **No** new BFF endpoint
  or api-contract change. **No** `<TeamSectionNav>` change.

## Cross-references

- Drill artefact: `6cd7-enrolment-cta/visual-compare.html` + `compare.md`.
- Sits outside `detail-ia-locked.md` (locked IA) and
  `docs/prd/redesign-phase-6c-team.md` (6.C PRD) — a discovered-unknown
  follow-up mounted on top of the shipped Phase 6.C page.
- Primitives: `<TapedCard>`, `<JerseyShirt>`, `<MonoLabel>`,
  `<EditorialHeading>`, `<LinkButton>`, `<StripedSeam>`.
