# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences, weighted equally — when they conflict, neither one automatically wins:

1. **Supporters on matchday.** Fans and Elewijt locals checking results, standings, lineups, goalscorers and the calendar. Mostly on a phone, frequently outdoors at or near the pitch. This includes **opposition supporters** travelling to a national-league fixture, whose need is narrow and sharp — kickoff time, venue, result — and who do not scroll.
2. **Youth parents.** Parents of U6–U21 players following their kid's team: schedule, squad, practical info, photos.

Secondary, confirmed but not decision-driving: prospective members and volunteers, sponsors and partners, and the club's own board/staff/volunteers.

**Recruitment is a goal, not a standing audience.** "Recruit players and volunteers" is the first success criterion below, which reads as a contradiction with prospective members sitting in the secondary list. It is not one: a recruit visits, converts, and thereafter _is_ a youth parent or a supporter. Design for the conversion, but do not weight prospective members as a third audience that can veto a decision (#2408).

**Sponsors are a commercial obligation, not a persona.** Current sponsors are owed visible value; potential sponsors are an audience of a different kind. Neither is a visitor whose needs rank the page. Do not reach for "but sponsors need visibility" as an argument about hierarchy (#2408).

All visitors are anonymous — there is no registration or login anywhere on the site, and all content is free.

## Product Purpose

The official website of KCVV Elewijt, a Belgian amateur football club (stamnummer 55) in Elewijt, a sub-municipality of Zemst in Vlaams-Brabant. It publishes the club's competitive record and editorial life: news, match results and details, league tables, team squads, player and staff profiles, the club calendar, events, photo galleries, sponsors, and club information.

Success means three things, in the club's own terms:

- **Recruit players and volunteers.** Membership signups, volunteer roles, and youth intake.
- **Deliver sponsor value.** Visible, credible return for sponsors — a reason to renew, and a reason for new partners to join.
- **Show the club is serious.** A small amateur club whose site punches well above its division.

Being the club's canonical publishing channel over social media was explicitly _not_ selected as a success criterion. Do not design as if displacing Facebook/Instagram is a goal.

## Positioning

Amateur clubs at this level either run a template site or live entirely on Facebook. KCVV Elewijt runs neither. Two things a neighbouring club could not truthfully copy:

- **Real, synced competitive data across the whole club** — not just the first team. Match results, lineups, goal events, cards, standings and per-player season statistics are synced from ProSoccerData for senior A/B _and_ every youth team U6–U21, and rendered as first-class pages (`/wedstrijd/[matchId]`, `/spelers/[slug]`, `/ploegen/[slug]`).
- **An authored visual identity, not a theme.** A committed design world with its own typography, primitives and photography rules, maintained as a documented design system in Storybook.

## Operating Context

- **Language:** Dutch throughout the UI (labels, slugs, display values); English in code. The canonical glossary is `docs/ubiquitous-language.md`.
- **Matchday rhythm.** Traffic and relevance peak around fixtures: before (lineup, opponent, kickoff, location) and immediately after (score, goalscorers, standings movement, report).
- **Season rhythm.** Squads, teams and standings turn over per season; youth teams are organised as Bovenbouw / Middenbouw / Onderbouw.
- **Home ground:** Driesstraat 32, 1982 Elewijt, Belgium.
- **Editorial workflow.** Club editors — volunteers, not professionals — author news, events, pages, galleries and Q&A content in Sanity Studio. Authoring friction is a real product constraint, not a nicety.
- **Data workflow.** Competitive data flows ProSoccerData → BFF (Cloudflare Workers) → site. The club does not hand-enter results.

## Capabilities and Constraints

**Has:** news and article detail; match calendar and match detail with lineups, events and a match-day standings snapshot; team pages with squad, fixtures and league table; senior and youth team overviews; player and staff profiles with season statistics; opponent pages; club information pages (history, board, youth board, Angels, Ultras, contact, membership); help / who-is-who; events; photo galleries; sponsor overview; site search; membership application form; iCal calendar export; share cards.

**Does not have, and must not be designed as if it did:** ticket sales, an online shop, live match streaming, live in-play scores, betting or odds, paid or gated content, user accounts or login, and a newsletter or email-signup of any kind.

**Technical constraints that shape design:**

- Competitive data comes from a rate-limited upstream (ProSoccerData) via the BFF. Pages that depend on it use ISR or dynamic rendering, never build-time prerendering of every match or player. Match data can legitimately be stale; designs must survive missing or partial data.
- Fields the upstream does not reliably provide — venue on a match, some competition metadata, `is_home` on match detail — must never be designed into a layout as guaranteed. Audit real data before rendering a field.
- Editorial content is Portable Text from Sanity; rich-text emphasis is expressed as decorator marks, not as separate accent fields.

**Undecided / open:** none recorded at product level.

## Brand Commitments

- **Name:** KCVV Elewijt. Stamnummer **55**.
- **Origin is told, never asserted:** the club reached its present form through takeovers and mergers, so **1909 is not the club's to market**. The year may be narrated as history alongside the mergers that produced it — `/club/geschiedenis` is the one place that does — and never stated as a bare founding fact in copy, chrome, structured data or `llms.txt`. Where the fact is useful, write it qualified ("ontstaan uit fusies; de oudste voorloper speelde vanaf 1909"), not as a founding date (#2422, #2435).
- **Motto:** "Er is maar 1 plezante compagnie" — the club's only tagline. Never "meer dan een club" or any invented variant.
- **Club colours:** green and white.
- **Voice:** Dutch, plain, club-insider warmth without corporate polish. Never fabricate club history, honours, quotes, testimonials or magazine/edition chrome.
- **Typography is fixed:** Freight Sans Pro (body), Freight Display / Freight Big Pro (headings), IBM Plex Mono. No new typefaces.
- **Icons:** Phosphor Fill, via the single icon source. No emoji in UI.
- **Sponsor treatment:** three tiers — main, second, regular. Sponsor logos are the only imagery rendered greyscale-to-colour-on-hover; every other photograph stays in colour. Exception: on `/sponsors`, where the logos are the content rather than the tail, every logo renders in colour at rest, at every tier — the wall (homepage + team pages) is unaffected (#2511/#2655).

## Evidence on Hand

- **Real competitive data:** live ProSoccerData sync for all senior and youth teams — results, lineups, goal events, cards, standings, per-player statistics.
- **Real editorial archive:** club news and match reports, an authored club history, events, and photo galleries in Sanity.
- **Real people:** player, staff and organigram records with photos; a who-is-who of club contacts.
- **Real sponsors:** a live sponsor roster with tiered logos.
- **Real photography, but dated — treat as a constraint, not an asset.** The club and matchday archive predates the ground renovation: both pitches went from grass to synthetic and the surroundings were rebuilt. Any image showing the ground or its surroundings — including the panorama at `docs/design/Untitled_Panorama-1.jpg` — now misrepresents the club and must not be used. People-focused photography (players, coaches, supporters) ages better and remains usable. The homepage's youth backdrop (`public/images/youth-trainers.jpg`) is accurate and current — but it is a **one-off three-panel composite**, not a template: it cannot be re-cropped to another aspect ratio without destroying its composition, and there is no second image in that style. Treat it as one asset, not as a pattern to repeat. **No recent photography exists beyond it**; commissioning is tracked in #2411. Do not design a surface that depends on current imagery of the ground, or on a second composite existing.
- **Socials:** facebook.com/KCVVElewijt, instagram.com/kcvve.
- **Absent — never fabricate:** testimonials, attendance or engagement figures, honours or trophy claims, press coverage, and any club statistic the ProSoccerData sync does not actually provide.

## Product Principles

1. **Match data must read at a glance.** Wherever a result or fixture appears, a supporter answers "what happened / what's next" without effort, on a phone, outdoors. This is a **legibility** requirement, not a ranking one. During a season the result is the most _current_ thing on the site — it is not the headline for every visitor, and this principle must never be cited to argue that it outranks the rest of a page (see principle 6).
2. **Youth is first-class, not a sub-section.** Every affordance built for the first team — squad, fixtures, profiles, statistics — must hold up for a U9 team and a nine-year-old's profile page, including its privacy constraints.
3. **Render only what the data actually provides.** Design against real ProSoccerData and Sanity shapes; a layout that needs a field the source may omit is a broken layout.
4. **Sponsors get real estate, not decoration.** Sponsor presence is a product obligation with commercial consequences, and is designed deliberately rather than tucked into a footer strip.
5. **Punch above the division.** The bar is not "good for an amateur club" — visible craft is itself one of the three success criteria.
6. **The homepage does not declare a primary section.** Its bands sit at one weight by deliberate choice, not by neglect. With two co-equal primary audiences, any fixed ranking permanently demotes one of them on every visit. Five ranked and routed alternatives were built and rejected in favour of the flat baseline (#2408). A usability review will read this as a failed "single focus" heuristic; that outcome is understood and accepted. The jersey-deep youth band is the sheet's one deliberate visual break, not a rank.

   The same rule governs the page's ending. The last content band is the most prominent position on a scrolled page, so it cannot be handed to either primary audience without reintroducing the ranking this principle refuses. The homepage tail is therefore audience-neutral by design — the sponsor wall and the clubshop band — and the club's signature is the footer's job, not a second identity band (#2422).

## Accessibility & Inclusion

Two confirmed, product-specific requirements. No formal WCAG conformance level has been adopted as a target.

- **Phone-first, outdoors.** The realistic usage scene is a phone held in daylight on the sideline, possibly on a weak connection. Legibility, contrast in sunlight, and page weight are functional requirements, not polish.
- **Less-digital visitors.** Older supporters and volunteers are a real part of the audience: plain Dutch, generous tap targets, no jargon, and no interaction that must be discovered (hover-only affordances, hidden gestures, unlabelled icons).
