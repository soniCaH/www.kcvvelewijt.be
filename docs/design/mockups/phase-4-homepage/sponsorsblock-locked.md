# Phase 4 · `<SponsorsBlock>` — Locked

**Locked 2026-05-07 across rounds 7, 7b (rejected for being too busy), 7c.**

## Composition

```text
<SponsorsBlock>                         // server component
  <SectionHeader title="Met dank aan onze sponsors">
  <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
    {sponsors.map(s => (
      <li>
        <Link href={s.url} target="_blank" rel="noopener">
          <SponsorLogo            // cream-soft tile · M.3
            logo={s.logo}
            name={s.name}        // accessible label / fallback wordmark
          />
        </Link>
      </li>
    ))}
  </ul>
  <Link href="/sponsors">Alle sponsors &amp; sympathisanten →</Link>
```

## Data flow

| Aspect | Value | Source |
| --- | --- | --- |
| Source | Sanity `sponsor[]` ordered by tier then name | `SPONSORS_QUERY` (existing or new) |
| Filter | `tier in ["hoofdsponsor", "sponsor"]` AND `active === true` | Per `reference_sponsor_tiers` |
| Sort | hoofdsponsors first, then sponsors (alphabetical within tier) | Tier ordering convention |
| Per-logo treatment | Greyscale by default → colour on hover via `filter: grayscale(100%)` + transition | Per `reference_sponsor_tiers` rule (locked 2026-04-28) |
| Tile | Cream-soft fill (`var(--cream-soft)`), no border, no shadow, no rotation | Round 7c M.3 |
| Tile size | Equal across hoofdsponsors and sponsors | Round 7 L.2 |
| Click target | Whole tile → external link to `s.url` | New tab, `rel="noopener"` |
| /sponsors link | "Alle sponsors &amp; sympathisanten →" — visible always at section bottom | Round 7 owner add |
| Empty state | Section returns null if 0 sponsors match filter | Same convention as NewsGrid / UpcomingMatches |

## Locked decisions

| Round | Decision | Rationale |
| --- | --- | --- |
| 7 | **L.2 · Single equal grid** | All sponsors same size; cleanest grid; tier hierarchy not on homepage |
| 7b | ~~Paper card with rotation/tape~~ → **rejected** | Too busy alongside paper-pasted weight elsewhere on the page |
| 7c | **M.3 · Cream-soft tile, no border, no shadow** | Quietest separation that still handles white-bg logos via tone shift |

## Responsive grid

```css
grid-cols-2          /* mobile <640px  */
sm:grid-cols-3       /* sm  ≥640px     */
lg:grid-cols-5       /* lg  ≥1024px    */
```

Gap: 14px desktop, 10px mobile. Tile padding: 14px × 8px. Min-height: 70px (logo doesn't
affect grid height when shorter).

## Tier hierarchy on homepage

**Not visible.** Hoofdsponsors and sponsors render at identical size on `/`. Tier is preserved
via order only (hoofdsponsors first). For full tier-explicit hierarchy with sympathisanten,
visitors click "Alle sponsors &amp; sympathisanten →" to `/sponsors` (Phase 7 redesign).

## Hover / focus

- Tile cursor: `pointer`
- Greyscale → colour transition: `filter` over 200ms ease
- `prefers-reduced-motion: reduce` → drop the transition; instant snap
- No translate / shadow change on hover (kept calm)
- Focus-visible: 2px jersey-deep outline at 2px offset (a11y standard, applies to keyboard nav)

## Section-level treatment

The section header ("Met dank aan onze sponsors") gets the standard `<SectionHeader>` from
Phase 2 (now wraps `<EditorialHeading>` + `<MonoLabelRow>`). The section background is
`cream-deep` so the tiles' cream-soft fill produces the tone shift.

## VR baseline contract

- Story: `Home/SponsorsBlock/Default` — 3 hoofdsponsors + 10 sponsors
- Story: `Home/SponsorsBlock/HoofdsponsorsOnly` — 3 hoofdsponsors, no sponsors
- Story: `Home/SponsorsBlock/SponsorsOnly` — 0 hoofdsponsors, 8 sponsors
- Story: `Home/SponsorsBlock/Empty` — returns null
- Story: `Home/SponsorsBlock/MissingLogos` — mix of sponsors with/without `logo` (renders italic
  Freight Display name fallback in the no-logo cells)

## Out of scope this section

- **Spotlight section** (`featured: true` sponsors with `description`) — that's a separate
  sub-component shown only on the dedicated `/sponsors` page (Phase 7), not on `/`.
- **Per-tier styling** — homepage doesn't expose tier hierarchy visually. Tier-explicit
  rendering lives on `/sponsors` (Phase 7).
- **Logo upload tooling** — Studio editor-ux rework concern, separate ticket.
