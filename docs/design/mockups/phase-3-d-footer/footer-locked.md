# `<SiteFooter>` — locked design (Phase 3, Checkpoint D)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.C.3 (`SiteFooter` rework).
**Mockup:** `option-x-footer-detail.html`.
**Drill-down record:** `option-x-footer-comparisons.html` (Q0 audit + Q1 + Q2 + Q2.5 + Q3 with all archived options preserved `display:none` for diff history).
**Companions:** `header-locked.md` + `matchstrip-locked.md` (other Checkpoint C/D locks).

> **★ Reuse audit correction (2026-05-05):** the `<FooterLink>` primitive originally proposed in this spec is **not** built. Audit against the design-system barrel found that `<EditorialLink variant="inline" tone="light">` already provides the ink-soft default + jersey-deep hover (with `<HighlighterStroke>` sweep) at the right density for footer columns. Footer directory links use `<EditorialLink variant="inline" tone="light">` directly — no new primitive, no new Storybook story (existing primitive's baselines apply). The reuse map and approval checklist below still mention `<FooterLink>` for historical accuracy of the drilling; **the canonical source of truth is the Phase 3 PRD §8b**.

## Scope

Site-wide footer rendered in the root layout — colofon anchor on **every page** (homepage, section indexes, article detail, single-team / single-player / single-match detail, hero-less utility pages, error pages). Three-band composition: top zone with modest wordmark + 2-colour motto · 3-column task-oriented directory · ink bottom bar. **Founding year `1909`** (correcting three existing buggy locations — see open follow-ups).

## Composition

### Desktop (≥ 1024px) — ~ 320–360px tall

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │ ← top zone (cream)
│                          KCVV Elewijt                                        │   ← Playfair italic 900, 44px, jersey-deep on Elewijt
│             Er is maar één plezante compagnie.                               │   ← Playfair italic 700, 21px, jersey-deep on plezante
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤ ← 1px paper-edge
│  ONTDEK              AANSLUITEN          BIJ DE CLUB                         │ ← Mono caps headings, 11/700, jersey-deep underline (1.5px)
│  ──────────          ──────────          ──────────                          │
│  Nieuws              Als speler          Geschiedenis                        │ ← Inter 14/500 ink-soft links
│  Kalender            Als vrijwilliger    Bestuur                             │   jersey-deep + bottom rule on hover
│  Evenementen         Als sponsor         Contact                             │
│  Onze ploegen                            Praktische info                     │
│  Jeugdwerking                                                                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤ ← ink bar
│  © 1909–2026 KCVV ELEWIJT · DRIESSTRAAT 32 · 1982 ELEWIJT                    │ ← Mono caps, 10.5/500, cream on ink
│                                  PRIVACY · COOKIES · [f] [○]                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (≤ 768px) — ~ 480–540px tall

- Wordmark: `44 → 32px`. Tagline: `21 → 18px`.
- Directory: `grid-template-columns: 1fr` — Ontdek → Aansluiten → Bij de club stack vertically with the same heading rule.
- Ink bar: `flex-direction: column` — group 1 (copyright + address) above, group 2 (privacy + cookies + social) below. Font drops to `9.5px`.

## Slots

| Slot               | Content                                                          | Source                                                                        |
| ------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Wordmark           | `KCVV Elewijt` (jersey-deep on `Elewijt`)                        | Static literal                                                                |
| Tagline            | `Er is maar één plezante compagnie.` (jersey-deep on `plezante`) | Static literal — `reference_club_identity.md`                                 |
| Ontdek column      | Nieuws · Kalender · Evenementen · Onze ploegen · Jeugdwerking    | Hard-coded link list (new constant or extend `menuItems.ts`)                  |
| Aansluiten column  | Als speler · Als vrijwilliger · Als sponsor                      | Hard-coded link list (role-based per `feedback_role_based_engagement_naming`) |
| Bij de club column | Geschiedenis · Bestuur · Contact · Praktische info               | Hard-coded link list                                                          |
| Copyright          | `© 1909–<currentYear> KCVV Elewijt`                              | Founding year `1909` literal + `new Date().getFullYear()`                     |
| Address            | `Driesstraat 32 · 1982 Elewijt`                                  | Static literal                                                                |
| Privacy            | → `/privacy`                                                     | Real route                                                                    |
| Cookies            | Cookie-consent library trigger                                   | Existing `CookiePreferencesButton` integration                                |
| Social glyphs      | Facebook + Instagram                                             | `EXTERNAL_LINKS.facebook` + `EXTERNAL_LINKS.instagram`                        |

## Locked link list (real routes)

| Column          | Label            | Href                      |
| --------------- | ---------------- | ------------------------- |
| **Ontdek**      | Nieuws           | `/nieuws`                 |
|                 | Kalender         | `/kalender`               |
|                 | Evenementen      | `/evenementen`            |
|                 | Onze ploegen     | `/ploegen`                |
|                 | Jeugdwerking     | `/jeugd`                  |
| **Aansluiten**  | Als speler       | `/club/inschrijven`       |
|                 | Als vrijwilliger | `/club/word-vrijwilliger` |
|                 | Als sponsor      | `/sponsors`               |
| **Bij de club** | Geschiedenis     | `/club/geschiedenis`      |
|                 | Bestuur          | `/club/bestuur`           |
|                 | Contact          | `/club/contact`           |
|                 | Praktische info  | `/club/praktische-info`   |

**Verify route paths during implementation** — some may need to be reconciled with the existing `clubLinks` in `PageFooter.tsx` (which uses different paths in production today).

## Component composition — reuse existing, ship one new shared sub-component

**Existing primitives used verbatim:**

| Primitive                   | Source                                                                  | Use                                                |
| --------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| `<EditorialHeading>`        | `apps/web/src/components/design-system/EditorialHeading/`               | Wordmark (display italic 900 + jersey-deep accent) |
| `<MonoLabel>`               | `apps/web/src/components/design-system/MonoLabel/`                      | Directory column headings (size `sm`, weight 700)  |
| `<SocialLinks>`             | `apps/web/src/components/design-system/SocialLinks/`                    | Facebook + Instagram glyphs in ink bar             |
| `<CookiePreferencesButton>` | `apps/web/src/components/layout/PageFooter/CookiePreferencesButton.tsx` | Cookie consent trigger (reused as-is)              |

**New shared sub-component (Storybook required):**

| New component  | Purpose               | Composition                                                                                                                                                                 |
| -------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<FooterLink>` | Footer directory link | Inter 14/500 ink-soft default → jersey-deep + 1px bottom rule on hover. Sized for footer column density (distinct from `<EditorialLink>` which is body-content prominence). |

**Composition glue (no new primitive — inline in `<SiteFooter>`):**

| Element                         | Notes                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- |
| Top zone wordmark+tagline block | Centred 2-row stack; cream paper background                            |
| 3-col directory grid            | `grid-template-columns: 1fr 1fr 1fr` desktop · `1fr` mobile · 28px gap |
| Ink bottom bar                  | Flexbox 2-group layout with dot separators; column wrap on mobile      |

**Storybook coverage required:**

- `<FooterLink>` — `UI/FooterLink`, vr-tagged, stories for default + hover states
- `<SiteFooter>` — `UI/SiteFooter`, vr-tagged, stories for desktop default + mobile default. Single rendered state (no hidden state); render-rule is per-page-type, not per-data-state.

## Field-source map

Every rendered string traces to a real source. **No fabrications.** No newsletter, no fake fields.

| UI element      | Source                                                    | Notes                                                    |
| --------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| Wordmark        | Static literal `"KCVV Elewijt"`                           | jersey-deep accent on "Elewijt" via inline JSX           |
| Tagline         | Static literal                                            | jersey-deep emphasis on "plezante" — see motto reference |
| Column headings | Static literals (`Ontdek` · `Aansluiten` · `Bij de club`) | Per Q2 lock                                              |
| Link labels     | Static literals (per Locked link list table above)        | Hard-coded — no Sanity siteSettings exists               |
| Link hrefs      | Static literals (per Locked link list table above)        | Real routes                                              |
| Copyright year  | `1909` literal + `new Date().getFullYear()`               | `1909` per `reference_club_founding_year.md`             |
| Address         | Static literal "Driesstraat 32 · 1982 Elewijt"            | From existing PageFooter audit                           |
| Facebook URL    | `EXTERNAL_LINKS.facebook`                                 | `apps/web/src/lib/constants.ts`                          |
| Instagram URL   | `EXTERNAL_LINKS.instagram`                                | Same                                                     |
| Privacy link    | Static literal `/privacy`                                 | Real route                                               |
| Cookies button  | `CookiePreferencesButton` integration                     | Reused as-is                                             |

## Render rule

Footer renders on **every page** via the root layout slot. Unlike the MatchStrip (Checkpoint C Q5 G3 — landing-only), the footer is colofon: copyright, address, legal links, and cookie controls must reach every page including detail templates and hero-less utility pages.

| Page type                                  | Render | Notes                                                                                  |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------- |
| Homepage `/`                               | ✓      | SponsorsSection sits above footer (separate)                                           |
| Section indexes (`/nieuws`, etc.)          | ✓      | MatchStrip + footer both present                                                       |
| Article detail (any articleType)           | ✓      | Footer is below article body — chrome-free article zone above; footer is colofon below |
| Single team / player / match detail        | ✓      | Same colofon role                                                                      |
| Hero-less utility (`/zoeken`, error pages) | ✓      | Cookie + privacy controls reach error pages too                                        |

## API (target shape)

```typescript
type SiteFooterProps = {
  // No caller props — pure presentational Server Component.
  // All content lives in static literals + existing constants.
};
```

## Schema dependencies

**None.** All data is static literals or existing constants (`EXTERNAL_LINKS`, copyright year computation). No Sanity migrations, no API changes for Checkpoint D.

## Mobile collapse

| Breakpoint | Behaviour                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≤ 768px    | 3-col directory → 1-col stack · wordmark 44 → 32px · tagline 21 → 18px · ink bar wraps to 2 rows · social glyphs stay 24px · ~ 480–540px total height |
| ≥ 1024px   | 3-col directory · wordmark 44px · tagline 21px · ink bar single row · ~ 320–360px total height                                                        |

## Reuse mandate

1. **Audit before building.** Confirm `<FooterLink>` doesn't already exist in `apps/web/src/components/design-system/`. If a similar primitive exists (e.g. some link variant under `EditorialLink`), reuse with size override.
2. **Extract before duplicating.** `<FooterLink>` earns primitive status because (a) it has its own ink-soft → jersey-deep + bottom-rule-on-hover idiom, (b) likely usage in any future "directory of links" pattern.
3. **Storybook coverage** on every new primitive (`<FooterLink>`, `<SiteFooter>`).
4. **No hidden state.** Footer is a Server Component with zero client-side interactivity. The `CookiePreferencesButton` is the only client-island and inherits its `"use client"` boundary from the existing component.

## Open follow-ups (non-blocking for the lock)

These are implementation-time tasks discovered during the drill — capture in the Phase 3 plan / sub-issue 3.C.3 description.

- **Founding year fixes (3 locations)** per `reference_club_founding_year.md`:
  - `apps/web/src/components/home/MissionBanner` — currently renders "sinds 1948"; correct to `1909`.
  - `apps/web/src/components/PageHeader/PageHeader.tsx` — wordmark superscript renders `SINDS 1948`; correct to `SINDS 1909`.
  - `apps/web/src/lib/jsonld.ts` — `foundingDate: "1924"`; correct to `1909`.
- **Verify locked link list against existing routes.** During implementation, run each href against the actual Next.js route tree; if any routes don't exist (e.g. `/club/praktische-info`, `/club/bestuur`), either create them or relocate the link.
- **Webshop link** — currently in `clubLinks` constant + as `EXTERNAL_LINKS.webshop`. The locked footer doesn't include it. Decision: webshop is an external destination, lives in the header CTA-row context (or a future top-bar promo). Don't add it to the footer.
- **`<PosterWordmark>` band** — master design §5.1 step 11 referenced this primitive; it doesn't exist in the design-system barrel and isn't needed (H3's modest wordmark replaces it). Update master design §5.1 step 11 to remove the band.
- **Address geocoding / map link** — current footer has a "Routebeschrijving" link to Google Maps via `DirectionsLink` component. The locked footer's ink bar doesn't include this — it lives on the Contact page instead. Keep `DirectionsLink` as-is for the Contact page; remove from footer.

## Approval checklist

- [x] Q1 — base direction H3 (modest wordmark + tagline) locked.
- [x] Q2 — IA structure I2 (task-oriented: Ontdek · Aansluiten · Bij de club) locked.
- [x] Q2.5 — middle column refined to role-based items (Als speler / Als vrijwilliger / Als sponsor); cashless dropped.
- [x] Q3 verifications — sponsor strip separate · `<PosterWordmark>` absorbed · every-page render · 3-col → 1-col mobile collapse with 2-row ink bar.
- [x] No fabricated data — every UI element traces to static literals or existing constants.
- [x] No newsletter (per `feedback_no_newsletter`).
- [x] No decorative ornaments on links (per `feedback_no_decorative_nav_ornaments`).
- [x] Founding year `1909` (per `reference_club_founding_year.md`); 3 buggy code locations captured as follow-ups.
- [x] Reuse mandate captured — existing primitives (`EditorialHeading`, `MonoLabel`, `SocialLinks`, `CookiePreferencesButton`) + new `<FooterLink>` shared sub-component, Storybook-covered.
- [x] No schema migrations required for Checkpoint D.
