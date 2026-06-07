# Phase 7 · /sponsors — Round 1 (VOICE) — LOCKED

**Date:** 2026-06-07
**Mockup:** `7d1-voice-compare.html`
**Owner:** @climacon

## Decision

**Voice = Direction A "Merci" (grateful terrace) + Direction D's prominent featured card.**

The `/sponsors` page adopts a **warm gratitude register** inside the existing cream-paper
vocabulary, with **one borrowed element from D**: the "In de kijker" featured partner gets a
prominent **editorial feature card** (logo + name + blurb), not a quiet grid cell.

- Cream-paper field (no dark page), club-motto kicker, big italic-display headline
  **"Merci aan onze sponsors."**, warm gratitude lead.
- Tiers as gratitude sections with `MonoLabel` kickers (Hoofdsponsors / Sponsors /
  Sympathisanten) + taped logo tiles, hierarchy by cell size.
- **"In de kijker" featured card carried from D** — a real highlight near the top, not a
  carousel and not buried in a grid. Exact count/placement/visual = IA + detail rounds.
- "Word sponsor +" CTA present but **not** the page's organizing purpose (rejected D's
  recruitment-forward framing).

## Rejected (and why)

- **B · Ereblad (honour board)** — too quiet/archival; sits in tension with a prominent
  featured card. (Borrow its tier-grouping discipline into the IA, not its register.)
- **C · Reclameborden (pitchside boards)** — most distinctive and on-theme, but introduces
  net-new vocabulary (wide board tile + jersey-deep-dark page) and reads colder than the
  club's "plezante compagnie" warmth. Parked as a possible future flourish, not the base.
- **D · Partners (recruitment-forward)** — its featured card is kept, but its sales register
  ("bereik honderden supporters") reframes the page as a funnel. KCVV is a club, not a sales
  page (`feedback_no_magazine_chrome` spirit). Gratitude wins; recruitment is a footer CTA.

## Carry-forward into the IA round (7.d2)

- **Featured count + placement:** multiple sponsors can be `featured=true` — does the page
  show one marquee card, a row of cards, or hero-integrated vs. its own band below the hero?
- **Tier hierarchy treatment:** size-graded grids (A as drawn) vs. hoofd-as-feature-cards vs.
  flat wall — how differentiated are the three tiers?
- **Tile field anatomy:** is the name caption always shown beneath the logo, or only as the
  missing-logo fallback? (master plan leans "small mono caption beneath"; homepage
  `<SponsorsBlock>` currently shows logo-only.)
- **CTA placement:** footer band vs. inline after the grids.
- The featured card's exact **visual treatment** (card chrome, blurb length, link) is a
  later DETAIL round, per the 7.d0 deferral.
