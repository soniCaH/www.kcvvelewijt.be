# Decision sheet — from 89 open questions to what actually needs deciding

Consolidated from the "Open questions for Kevin" sections of the seven research files in this
directory (2026-08-13). 89 raw questions → **17 club decisions, 21 facts to look up, 22 answered
below, 8 technical investigations, 3 blocked on go-live**. The rest were duplicates.

**Filed as GitHub issues:** the 20 remaining facts are [#2592–#2597](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2592), grouped by who you ask. The homepage overflow is [#2598](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2598); the A17 prototype is [#2599](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2599). The tag-casing bug was fixed and migrated ([PR #2591](https://github.com/soniCaH/www.kcvvelewijt.be/pull/2591)).

**Status 2026-08-13:** 16 of the 17 club decisions are answered (only **C5**, publishing lidgeld, is
still with the board). Six of the eight technical investigations are done. Facts grew from 14 to 21 —
answers open new questions, which is how it should go.

Nothing here is a spec. This exists so a spec can be written without silently inventing answers.

---

## 1. Club decisions — the board's call, not ours

These are values, commercial and policy questions. A recommendation is given where the research
supports one, but the decision is not a web decision.

### Commercial — ANSWERED 2026-08-13 (Kevin)

**C1 — Publish sponsor package prices? NO, with a named exception.**
Prices stay private for negotiated packages. **Matchbal and onderleggers are the exception** — those are
fixed-price, never negotiated, so nothing is lost by publishing them.

**C2 — Wedstrijdbal / wedstrijdsponsor? YES, and it already exists on paper.**
The club has a **full sponsor brochure with prices, in hardcopy**. This is not new inventory to invent —
it is existing inventory that is invisible online. Kevin: _"we could promote the packages themselves a
bit more."_

**C3 — Sponsor categories we would refuse? NONE so far.**
The question has never come up. Closed — but see the note under C10 below.

#### What C1 + C2 resolve to, together

The two answers combine into one clean rule, and it happens to be the strongest commercial position
available:

> **Publish every package's _contents_ publicly. Publish prices only where the price is fixed.**

- The brochure's descriptions — what a sponsor actually gets — go on the site in full. That is the part
  that is currently invisible, and it costs nothing to reveal.
- Matchbal and onderleggers carry real euro amounts. **That alone makes us the second club in Belgium
  to publish any sponsor price at all**, and the first to do it on a product page rather than buried in
  a news article (Racing Mechelen's €300 matchbal is a news post).
- Everything else says what you get and ends in a conversation, which is what the board wants anyway.

**New follow-up facts needed (added to §2):** F15 the actual matchbal and onderleggers prices; F16 who
holds the brochure source file, and in what format.

**Note against C10:** with no refusal policy, a values page cannot claim an ethical stance on sponsors.
That is fine — it just means C10, if it happens, is about the club's character, not its commercial
ethics. Don't let a drafted values page quietly imply a policy that doesn't exist.
**C4 — Who writes sponsor descriptions? SPONSOR-ASSISTED — and the premise needed correcting.**

Kevin asked back: _"where do we even show these texts? At this moment we never show them anywhere."_
Half right, and the half that isn't is the useful part.

The surface **exists**:

- `sponsor.description` is a real field (`packages/sanity-schemas/src/sponsor.ts:75`, titled "Spotlight description")
- it **is** fetched — `sponsor.repository.ts:11` selects it
- it **is** rendered — `FeaturedSponsorCard.tsx:57`, with a ~3-line clamp, omitted when absent

Two things make it invisible in practice:

1. **It only renders for `featured` sponsors.** The schema says so outright: _"Enkel zichtbaar wanneer de
   sponsor uitgelicht is."_ So even a filled-in description stays hidden for a non-featured sponsor.
2. **Production: 33 sponsors, 0 with a description.** Nothing has ever been written into it.

**Decision recorded:** ask the sponsor for a draft, club edits. Kevin's instinct is right and it also
solves the effort problem that made me recommend club-written.

**The field's own example is the giveaway:** the schema's placeholder text is _"Leverde de matchbal voor
de wedstrijd van 12 april"_ — this field was designed for precisely the matchbal package that C1 and C2
just decided to publish. The pieces were built to fit and never connected.

**Follow-up:** decide whether description should render beyond `featured`. If the sponsor page is going
to carry brochure content (C2), a description that only appears in the spotlight slot is too narrow.

### Money and access

**C5 — Publish lidgeld? DEFERRED, and the dependency is now explicit.**

The board still has to decide, but Kevin has named what gates it: _"will probably be blocked by the
detailed numbers of what a player costs us — as long as we don't have these details, we won't publish."_

**So C5 is not waiting on willingness, it is waiting on F18** (what a youth player actually costs per
season, opened by C9). That is a real dependency and it points the same way C9 already did: the
bookkeeping exercise is the unlock for two separate decisions, not one.

**Sequence:** F18 → C9 → C5. Until F18 exists, nothing on the fee page can carry a price — which is
exactly why **A21 already specifies a fee page that works without prices** (what's included, sibling
discount and where it stops, deadline, what happens if you miss it, the split-payment arrangement from
C6, a visible "last updated" stamp). Build that now; the numbers drop in later without a redesign.

**C6 — Hardship provision? IT ALREADY EXISTS — as split payment, not reduction.**

The club already mentions this in the **pre-season letter sent via PSD**: not a discount, but a
**gespreide betaling**. Crucial operating condition, in Kevin's words: it _"has to be asked upfront to
prevent people just paying random amounts when they feel like it, like we had a lot in the past."_

**This is publishable today and it needs no new policy.** It is a weaker offer than Víkingur's hardship
clause but it is real, it is already club practice, and it answers the same question a parent is
actually asking — _"what if I can't pay it all at once?"_ Publish it with the upfront condition stated
plainly; the condition is not fine print, it is the thing that makes the arrangement work, and saying
why (so the club can plan, and so nobody improvises) reads as honest rather than restrictive.

Note it currently reaches **only people already in PSD** — i.e. existing members. A prospective family
deciding whether they can afford to join never sees it. That is the gap the website closes.

**C7 — UiTPAS: RESEARCHED. Yes, a football club can join — but the conditions are heavy.**

Per [UiTPAS's own helpdesk](https://helpdesk.uitpas.be/hc/nl/articles/360011579340-Kan-een-sportclub-vereniging-commerci%C3%ABle-aanbieder-ook-aansluiten-bij-UiTPAS)
and [publiq](https://www.publiq.be/nl/projecten/uitpas/veelgestelde-vragen-over-uitpas): any leisure
organisation that accepts the agreement can offer UiTPAS. Joining is free. The conditions are the catch:

- the club needs a **UiTID**
- **every activity must be entered in the UiTdatabank**
- members must be able to **save points on every UiTPAS activity**
- the club must **offer the reduced rate on every activity**

Kansentarief is an **80% discount — the member pays 20%** — funded by solidarity cost-sharing between
the user, the provider (us) and the local authority. Eligibility is assessed socially (verhoogde
tegemoetkoming, collectieve schuldenregeling, leefloon) and **the specific terms are set per
municipality**.

**Honest read:** "every activity in the UiTdatabank, reduced rate on every activity" is a real
administrative commitment for a club running 19 teams. This is not a checkbox. **Next step is a question
to Zemst** — do they run UiTPAS, what are the local agreements, and does membership of a sports club
fall inside their scheme? ([Herent](https://www.herent.be/uitpas-voor-verenigingen) and
[Brugge](https://www.brugge.be/uitpas-partner-brugge) publish their local rules; Zemst's are the ones
that matter.) Added as **F17**.

**C8 — "Breng een sponsor" — the mechanism already exists, and it is unusual.**

Also sent via PSD today. The actual mechanism, in Kevin's words: _"we add the lidgeld to the sponsor's
invoice, so they get the taxes in return."_ The sponsor pays, the club invoices it as sponsorship, and
the sponsor can treat it as a deductible business expense rather than a gift.

**That is a genuinely clever arrangement and no researched club publishes anything like it.** Two things
block a public page:

1. **No minimum has ever been set.** Without a threshold the offer cannot be described — "bring a
   sponsor and pay less" needs to say _how much less, from what amount_.
2. **Be careful with the tax framing.** Describe the mechanism factually (the club invoices the
   sponsorship; how the sponsor books it is between them and their accountant). **The club should not
   publish tax advice.** Get the wording past whoever does the club's bookkeeping.

**C9 — Cost transparency: NOT YET, and the blocker is bookkeeping, not willingness.**

Kevin: _"it would be awesome to have a complete picture of what one youth player costs on a season's
base, but we simply don't have these numbers correctly at this point."_

**But the answer reframed the question, and this is the important part.** The reason to want that page
is now specific and concrete: _"This is a lot of discussion every year. Parents blaming the club that
all lidgeld for youth players goes to the first team wages."_

So this is not "how transparent do we feel like being" — it is **a recurring accusation the club faces
annually, which a single honest cost breakdown would settle.** That moves it from a nice-to-have
editorial idea to a page with a defined job.

It is also **a finance task before it is a website task.** The website cannot help until the numbers
exist. Recommend: park the page, and treat "work out what a youth player actually costs per season" as
a separate bestuur action — worth doing regardless of whether it is ever published, because the argument
happens every year either way.

### Values, people and sensitive content

| #                                                                                                     | Decision | What the research says |
| ----------------------------------------------------------------------------------------------------- | -------- | ---------------------- |
| **C10 — Principles page? YES, but it has to be written.** Kevin suggests it may fall out of the       |
| **Double Pass audit**, which is the right instinct — those audits produce mission, vision and policy  |
| text as a by-product. **Action:** check whether the Double Pass material already contains publishable |
| wording before anyone drafts from scratch. Added as **F20**. *(Also updates F10: we are evidently     |
| engaged with Double Pass, so the certification question is partly answered.)*                         |

Register reminder: at our level the voice that works is Chemie Leipzig's — _"nooit op het allerhoogste
niveau, meestal de underdog"_ — not imported activism. And per C3, it cannot claim a stance on sponsors.

**C11 — In memoriam page? YES ("would be awesome").**

Recorded. One thing still has to be settled before it is built, and it is not a technical thing: **who
decides who appears on it.** Detroit City runs a family submission form; Fram simply marks the deceased
in an existing honours list, which is the lighter option and needs no editorial judgement per person.
Not a blocker to planning it — a blocker to publishing it.

**C12 — Youth data: the machinery is already correct, and nothing is published today.**

Kevin asked back: _"do we publish the number of games?"_ Measured against production:

|                                                      |          |
| ---------------------------------------------------- | -------- |
| player documents                                     | **294**  |
| with a full `birthDate` (read-only, synced from PSD) | **292**  |
| born 2008 or later (i.e. minors)                     | **231**  |
| **with a slug — i.e. with a public page**            | **0**    |
| with a jersey number                                 | **0**    |
| appearance counts rendered anywhere in the web app   | **none** |

So the answer to the question as asked: **no — we publish nothing about individual players at all right
now.** `/spelers/[slug]` exists as a route and generates zero pages.

**And when it does go live, the privacy design is already right** — this was clearly thought about:

- `PlayerHero` is a **Server Component**, so the full ISO birthdate is consumed server-side and never
  reaches the browser as a prop.
- `formatAgeGradedBirthDate` splits on an 18 threshold: **adults** render `dd·mm·yyyy`, **minors**
  render `"14 jaar · '12"` — age plus a two-digit year, no day, no month.
- `Person` JSON-LD is gated behind `isAdult()`, so no structured data is emitted for a minor.

That matches what Kevin described (year of birth only) and implements it more carefully than the
description suggests. **Nothing to fix.** The remaining question is narrower than "what may we publish":
it is whether an _appearance count_ is acceptable for a minor — noting the federation already publishes
named youth squads with appearances and goals on `voetbalvlaanderen.be`, so that data is public
regardless of what we do.

**C13 + C14 — the technical objection is valid, and it is already solved.**

Kevin: _"we don't have any editorial match data in Sanity, it's all read-sync from PSD — how would this
even work?"_

**The editorial↔PSD join exists and is validated.** `packages/sanity-schemas/src/article.ts` carries a
`matchId` field: _"PSD-wedstrijd-id — kopieer het uit de /wedstrijd/[matchId] URL"_, required (and
numeric-validated) when `articleType` is `matchPreview` or `matchRecap`, hidden otherwise. So an
editorial document can already be bound to a specific PSD match.

Production: **125 articles, using only `announcement`, `interview` and `transfer`. Zero with a
`matchId`.**

So man-van-de-match is not blocked on architecture. The cheap version is a field on a `matchRecap`
article — no new document type, no new sync, no write-back to PSD. Recommendation stands: **seniors
only** (C13), and the same mechanism answers C14's poll, which would need a vote store but the same
match binding.

> **Correction to an earlier claim in this file and in `belgian-club-websites.md`.** Those said
> `matchPreview` and `matchRecap` were _document types_ with zero documents. They are not — they are
> **values of `articleType` on `article`**. The count of `*[_type=="matchPreview"]` was therefore
> measuring a type that has never existed, which returns 0 for the wrong reason. The conclusion happens
> to survive — 0 articles carry a `matchId` — but the mechanism, and therefore the cost of using it, is
> completely different: **an editor creates a normal article, picks a type, and pastes a number from a
> URL.** There is nothing to build.

### Editorial capacity — the constraint behind a third of the recommendations

| #                                                                                        | Decision | What the research says |
| ---------------------------------------------------------------------------------------- | -------- | ---------------------- |
| **C15 — NO recurring format. This is the most clarifying answer of the whole exercise.** |

There used to be **KCVV TV**; the reporter left the club. There are no volunteers for it now, let alone
for something with a fixed cadence. In Kevin's words: _"It's all me myself and I for now"_ — with the
hope of changing that.

**This closes a large cluster outright**, and that is a good outcome rather than a disappointing one:
the column, the podcast, the matchday krantje, the per-age-band streams, the volunteer interview series.
None survive one person. Anything with a publishing rhythm is out of scope until a second writer exists.

**It also reorders everything else.** With one author, the content that pays off is content that does
not need re-writing:

1. **Evergreen pages that stay true without maintenance** — how to get there, fees, matchday guide, FAQ,
   the split-payment arrangement, the kantine facts. Write once, correct for years. Every one is already
   a top recommendation from an unrelated research file.
2. **Content the system generates** — fixtures, results, standings, cancellations. Already synced from
   PSD, already normalised, needs no author at all.
3. **One-off-per-subject content that accumulates** — the Criacao-style player questionnaire (ten
   minutes per player, filled in _by the player_), a Detroit-style appearance archive that grows
   algorithmically. A hundred pages of personality without one person writing a hundred pages.

**Design consequence:** build so that adding a writer later is _additive_, not a rebuild. Nothing should
assume a cadence; nothing should break when one appears.

**And it explains the five unused capabilities.** One person cannot feed match previews, recaps,
training schedules, sponsor descriptions and player profiles. **Authoring friction is the binding
constraint on this project, not features** — exactly what `PRODUCT.md` already says.

**C16 — NO per-team streams. One writer for the whole youth department would already be a win.**

The taxonomy backs the decision. All 125 articles carry tags, but there are only 12 distinct ones and
youth is a single flat **`Jeugd`** (22 articles) — there is no per-age-band tag. A per-band stream is
not supported by the data either way. **Don't build it.** If one youth writer appears, filtering on
`Jeugd` already works, and that delivers the Binfield effect at a twentieth of the cost.

> **Live data bug found while checking this.** Two tags differ only by casing: **`A-Ploeg` (76
> articles)** and **`A-ploeg` (1 article)**. GROQ's `in` is case-sensitive, so that one article is
> invisible to any correctly-cased filter. One-article retag. Added as **F21**.

**C17 — MY ERROR. There is an upcoming event, and Kevin caught it.**

`Mosselfestijn 2026`, **4 September 2026**, already flagged `featuredOnHome`. Corrected counts: **80
events total — 79 past, 1 future, 0 without a date.**

The earlier "zero in the future" claim came from my own query bug: I filtered on `startDate`, but the
field is **`dateStart`**. A GROQ comparison against an undefined field never matches, so the query
returned a confident zero to a question it never actually asked.

**Nothing to fix.** A mosselfestijn in September, featured on the homepage in August, is the system
working. C17 closes.

> **Pattern worth naming, because it is three for three this session.** Every false finding here came
> from a **guessed identifier returning a silent zero**: `_type=="matchPreview"` (never a document type),
> and `startDate` (the field is `dateStart`). A GROQ count against a misspelled type or field does not
> error — it returns `0`, which reads exactly like a real finding. **Check the schema before trusting
> any zero.**

---

## 2. Facts to look up — no judgment needed, just answers

These block real pages. Most are one phone call or one look in PSD.

- [ ] **F1 — Kantine:** actual opening hours (or is "open tijdens clubactiviteiten" the honest rule?), payment methods (Payconiq/card/cash), a publishable phone number, who runs it and are they nameable.
- [ ] **F2 — Entry price** at the Dries for a home first-team match; does it include a drinkbon; youth match price; abonnementen; are under-12s free.
- [ ] **F3 — Parking and access:** preferred route to Driesstraat 32 on a busy matchday, where people should _not_ park, anything shared with a neighbouring club, and any neighbour sensitivities to address directly.
- [ ] **F4 — Which pitch:** post-renovation, how many, what they're called locally, which team plays where.
- [ ] **F5 — API / vertrouwenspersoon:** who is it, will they be named with a direct contact route, and **is there a second** so a parent has a choice of who to approach.
- [ ] **F6 — Volunteer coordinator:** is there a named human willing to have their email on the page, or does it route to the algemeen secretaris? _(A volunteer page with a generic inbox converts nobody.)_
- [ ] **F7 — Open volunteer roles right now**, with an honest time commitment per role — "two hours, once a month, no experience needed" is the pattern that works.
- [ ] **F8 — Referee recruitment:** does the club pay for the course? The page only works if the offer is concrete.
- [ ] **F9 — Charters / gedragscodes:** do they exist in writing? If yes, publishing as HTML is small and high-trust. If no, writing them is a board job (→ C10).
- [ ] **F10 — Certification:** do we hold Double Pass, Panathlon, or a Voetbal Vlaanderen quality label? _(The federation page already shows `Basic Quality label Gew`.)_ If not, nothing should imply it.
- [ ] **F11 — Physical archive:** old clubbladen, programmaboekjes, scheurkalenders in a cupboard — and is anyone willing to scan? Worth one question to the oldest board member. Scope of the whole heritage idea depends on it.
- [ ] **F12 — Honours records:** jubilarissen, 100/250-match milestones, past kampioenenvieringen. _"We don't have the records"_ is a valid answer that closes the idea — `PRODUCT.md` forbids fabricating honours.
- [ ] **F13 — Other teams:** veterans, wandelvoetbal, G-ploeg? Muizen runs walking football; Hofstade and Kampenhout run a G-ploeg. Our `/ploegen` tree surfaces none.
- [ ] **F21 — Retag one article: `A-ploeg` → `A-Ploeg`.** 76 articles use the capitalised form, 1 uses lowercase. GROQ `in` is case-sensitive, so that article is invisible to any correctly-cased filter. Two-minute fix in the Studio.
- [ ] **F20 — Does the Double Pass material already contain publishable wording?** (opened by C10). Mission, vision, youth policy, gedragscode. Check before anyone drafts a values page from scratch — and it may also answer F9 and F10 outright.
- [ ] **F17 — Ask Zemst about UiTPAS** (opened by C7). Does the municipality run it, what are the local agreements, and does sports-club membership fall inside their scheme? Joining is free but commits us to entering every activity in the UiTdatabank and offering the reduced rate on all of them — get the local terms before deciding.
- [ ] **F18 — What does a youth player cost per season?** (opened by C9). Not a website deliverable. A finance exercise worth doing regardless, because the "youth lidgeld pays first-team wages" argument recurs every year whether or not anything is published.
- [ ] **F19 — Minimum amount for "breng een sponsor"** (opened by C8). Without a threshold the offer cannot be written down. Also: have the tax wording checked by whoever does the club's books.
- [ ] **F15 — Matchbal and onderleggers prices** (opened by C1). The exact euro amounts, incl. or excl. btw, and what the sponsor gets for each. These are the only two figures going public, so they must be right.
- [ ] **F16 — The sponsor brochure source file.** Who holds it, in what format (InDesign, Word, PDF-only?), and how often it changes. If the only copy is a printed booklet, the descriptions need retyping once — a one-off job that unlocks the whole sponsor section. Also: does it name the tiers the same way the site does (main / second / regular)?
- [ ] **F14 — Elewijt idiom:** a local nickname or phrase members actually use, the way Bonheiden uses _"Bênaa"_. Cannot be researched from outside; it is the raw material for any voice work.

---

## 3. Answered — web and design decisions, with recommendations

Proceeding on these unless you say otherwise.

### Design

**A1 — Tap-target rule: "44px hit area, any visual size."**
Not "44px visual" and not per-surface. `py-2 -my-2` or pseudo-element expansion gets there with **no
visual change**, which preserves the 32px mono label as a deliberate register. One rule, invisible,
applied site-wide. This unblocks the biggest measured failure in the scorecard.

**A2 — Keep the homepage `<h1>` as the lead news headline.**
It is the fanzine front-page splash and it is good. The legitimate concern is search snippets and
screen-reader page identification — resolve that in `<title>` (which carries "KCVV Elewijt"), not by
demoting the splash.

**A3 — Standings are a _lookup_, not a comparison.** Our reader asks "where do we sit", not "compare
row 4 to row 9". So: **stop hiding W/G/V**, keep every column, horizontal scroll with a sticky team
column. That also fixes the live defect where columns are `display:none` _inside_ an
`overflow-x-auto` that consequently never scrolls.

**A4 — The past/future seam: plain 2px ink rule + `VANDAAG` stamp.** Not `StripedSeam`, which is
full-bleed by contract and must not be wrapped in a list. Cheapest of the three options and still
idiomatic.

**A5 — Zone colouring loses to the KCVV highlight bar.** `StandingsTable` already spends the
inset-left-bar channel on "this is our row", and that is the more useful signal. If promotion and
relegation zones are ever wanted, they take a different channel _and_ a printed legend — FotMob always
ships one, which is also the answer to the colour-alone outcome underline.

**A6 — Pair the outcome underline with wording.** It is currently colour-alone (green win / red
loss) and it affects shipped UI, not a proposal. Given "readable is the test", a `W`/`G`/`V` glyph or
the score itself carrying the weight is enough — no ratio argument needed.

### Structure and scope

**A7 — No `/spelers` index.** Players stay reachable via team pages. An index of ~300 players U6–U21
has privacy implications (→ C12) and no demonstrated user need. Treat the absence as deliberate.

**A8 — Age-category explainer goes on `/jeugd` as a block, plus a glossary line.** Not its own page.
It is contextual where the confusion actually happens, and it is one of the cheapest genuine
differentiators found — nobody in the tier explains what U9 means.

**A9 — `/hulp` and an FAQ are two entry points into one content set.** `/hulp` stays who-is-who; the
FAQ is question-first. Cross-link, do not merge.

**A10 — Away-ground directions: a static table keyed on PSD club id.** Not Sanity-per-opponent.
Fifteen opponents a season, stable data, far lower authoring burden.

**A11 — Start "follow my team" as a homepage strip, not a peer tab.** Sofascore's favourites-as-a-tab
is more capable and much more surface area. Ship the strip; earn the tab.

**A12 — `localStorage` for a followed team is acceptable** — it is per-device state, not an account.
But **don't build it first**: ship the team index plus small-category chips, and add persistence only
if the simpler thing proves insufficient.

**A13 — No day strip on `/kalender`.** The month window is an explicit lock and a different mental
model. OneFootball's `GISTEREN | VANDAAG | MORGEN | 15 ZA` strip belongs on a per-team fixture list,
if anywhere.

**A14 — Counted state chips on `FilterTabs`** (`UITSLAGEN | 12`). `FilterTabs` already renders counts
inline after a hairline pipe, so this is near-free, and the count pre-empts "is this empty or just
filtered?" before the reader spends a tap.

**A15 — Empty states get specific, factual copy.** "Geen statistieken" becomes _"in deze reeks worden
geen individuele statistieken bijgehouden"_ — same data, opposite emotional result, and more true. Add
the post-completion case the taxonomies miss: a team page in June is not missing fixtures, it is
`SEIZOEN AFGELOPEN`.

**A16 — Reject empty-state illustrations.** Mobbin explicitly recommends them "to make it visually
appealing". A printed blank does not apologise, and we have no illustration system. Recorded as an
anti-pattern so nobody cites Mobbin at us later.

### Deferred to the design owner, not decided here

**A17 — Two-line match row.** _(Filed as [#2599](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2599) — needs a full prototype comparison, not a decision from a research doc.)_ `AgendaMatchRow` renders `{home} — {away}` on one truncated line, which
two long Belgian club names destroy. Sofascore's stacked row fixes it and is arguably _more_ fanzine
(a printed results grid stacks home over away). But it doubles row height, and the 6.D "labelled wall"
density lock was a considered decision. **Instinct: responsive — stacked below `sm`, single-line
above.** A research doc should not override a design lock; this needs your nod.

**A18 — `llms.txt` is not a question.** Per CLAUDE.md it is a required deliverable whenever routes
change. If any new route ships, it gets updated in the same PR.

**A19 — Don't submit to Awwwards yet.** It is the only rubric that rewards what we deliberately do
(Design 40 / Usability 30 / Creativity 20 / Content 10), and HM at ≥6.5 is realistic — but fixing the
usability 30% first raises the score, and submitting now spends the shot early. Fix A1, then submit.

**A20 — Don't invest further in `/galerij`.** One gallery exists in production and there is no
photographer. Keep the surface, stop building image-dependent ones. _(Partly depends on C15.)_

**A21 — Publish the fee page even if lidgeld stays private.** Structure works without prices: what's
included, sibling discount and where it stops, deadline, what happens if you miss it, hardship
clause, visible "last updated" stamp. Prices can be added later.

**A22 — RBFA `website` field.** Not a decision — just do it (see §6).

---

## 4. Technical investigations — results (run 2026-08-13)

- [x] **T1 — Does PSD expose a cancelled/postponed status? YES — and richer than assumed.**
      `packages/api-contract/src/schemas/match.ts` already normalises a **six-state** machine:
      `scheduled · finished · forfeited · postponed · cancelled · stopped`. PSD code `2 (AFG)` maps to
      `postponed` (afgelast, may be rescheduled), code `3 (STOP)` to `stopped` (ended prematurely), and a
      PSD `cancelled` boolean overrides all numeric codes — `cancelled` meaning it will _not_ be played.
      **Afgelastingen is a rendering problem, not a data problem.** No manual Sanity flag needed. This
      unblocks the question four separate research files arrived at independently. We also carry
      `forfeited` and `stopped`, states essentially no club site displays.
- [x] **T2 — Does the BFF distinguish "played, unreported" from "0-0"? YES.**
      `score: S.optional(S.Number)` — `undefined` and `0` are different values. The printed-blank empty
      state in A15 is buildable.
- [x] **T3 — Per-competition stats availability: PARTIAL.** `competitionType` exists
      (`OFFICIAL`/`LEAGUE` → `"league"`, `CUP` → `"cup"`) and there is a
      `getPlayerStats` endpoint at `/statistics/player/:memberId` — but **no flag saying "this competition
      publishes no individual statistics."** So A15's dignity copy needs either an emptiness-derived
      heuristic (stats endpoint returns nothing for every player in the series) or a small authored field
      in Sanity. Recommend the authored field: a heuristic cannot distinguish "not published" from "not
      yet entered", which is exactly the distinction the copy depends on.
- [ ] **T4 — How far back does the PSD sync go?** Not yet run; needs a live PSD query via
      `apps/api/.dev.vars`.
- [x] **T7 — LCP and INP: MEASURED, and the news is good.** Playwright + Chromium against
      `kcvv-nextjs.vercel.app`, 5 routes × 3 viewports. LCP must be read through `PerformanceObserver`
      with `buffered: true` — `getEntriesByType("largest-contentful-paint")` returns `[]` in Chromium,
      which is what made the first probe look like another failure.

  |                          | LCP           | FCP       | TTFB     | CLS            |
  | ------------------------ | ------------- | --------- | -------- | -------------- |
  | range across all 15 runs | **96–756 ms** | 56–244 ms | 16–91 ms | **0 – 0.0163** |
  | budget                   | 2500 ms       | —         | —        | 0.1            |

  **Nothing is over budget anywhere.** The LCP element is an `IMG` on 13 of 15 runs. The
  "lazy-loading is a guaranteed Core Web Vitals failure" claim is now definitively refuted — measured,
  not argued. Worst CLS is `/kalender` on desktop at 0.0163, still six times inside budget.

  _(INP needs real interaction traces and cannot be synthesised meaningfully from a scripted load;
  field data via CrUX or a RUM beacon is the honest route. Not a blocker — INP problems would show as
  main-thread stalls, and none appeared.)_

- [x] **T5 — Training schedules: ALREADY BUILT, ENTIRELY UNPOPULATED.**
      `trainingSchedule` is a field on the `team` schema (`packages/sanity-schemas/src/team.ts:199`),
      rendered on `/ploegen/[slug]` through `TeamEditorial`, with stories and tests covering it. In
      production: **26 teams, 0 with a training schedule.** So this is not an S-sized build that PSD might
      shortcut — **it is shipped code waiting on data entry.** The highest-value item in the professional
      tier file costs zero engineering.
- [x] **T6 — ACFF → FFA: no drift.** No `ACFF` occurrences in `docs/ubiquitous-language.md`,
      `apps/web/public/llms.txt`, or `packages/api-contract/src`. Nothing to fix.

### What T1/T2/T5 mean together

Three of the most-requested "new features" in the corpus are **already built**: match cancellation
states, the unreported-vs-nil-nil distinction, and per-team training times. Combined with
`matchPreview`/`matchRecap` (0 documents) and `trainingSchedule` (0 of 26 teams), the pattern is
consistent enough to state plainly: **the gap between this site and the research recommendations is
mostly content, not code.** That should reorder any spec — authoring paths and editor onboarding
before new surfaces.

- [ ] **T7 — Real LCP and INP** via Playwright + Chromium or Lighthouse. Unobtainable through the Chrome extension: `visibilityState` stays `hidden` when the window is occluded, so paint timing never fires. Not a flake — a hard limit.
- [ ] **T8 — A scripted regression probe** for the six numbers that drifted during this research: 320px overflow, CLS, TTFB, tap-target percentages, heading structure, alt coverage. Every correction in the scorecard would have been caught automatically. _(Assert the page actually rendered — a blank iframe also reports 0px overflow.)_

---

## 5. Blocked on go-live

- **B1 — What is the apex plan?** `www.kcvvelewijt.be` still serves Gatsby 5.16.0 and 404s every Next.js route. Every measurement in every research file describes a site the public cannot reach.
- **B2 — Are match previews / recaps staged or stalled?** _(Corrected — see C13/C14 above. These are `articleType` values on `article`, not document types.)_ Production holds 125 articles using only `announcement`, `interview` and `transfer`; **zero carry a `matchId`.** The surface is not publicly reachable yet, so "unadopted" and "not yet launched" remain indistinguishable. If stalled, the cause matters: editors don't know the type exists / the PSD match id is awkward to find / nobody owns writing them. **The authoring cost is far lower than "build a match report feature" implied — it is a normal article with a type and a pasted number.**
- **B3 — How do fixture postponements reach people today?** Presumably Facebook. The real current workflow determines whether a site-side afgelasting state helps or merely duplicates.

---

## 6. Do now — needs no decision at all

1. **Set the club's `website` field with the RBFA.** It is `null`, so voetbalvlaanderen.be does not link to kcvvelewijt.be. Admin change, zero build cost, and the federation page outranks us in Google for several neighbouring clubs.
2. **`StandingsTable`** — W/G/V unreachable below `sm` (→ A3).
3. **`AgendaMatchRow`** — truncation (→ A17, pending your nod).
4. **Footer nav tap targets** — 27px, the largest remaining volume driver (→ A1).
5. **`/nieuws/[slug]` hero is `loading="lazy"`** — the article opens on an empty taped frame. _(Note: measured LCP is fine everywhere, so this is a perceived-quality fix, not a performance one.)_
6. **Homepage overflows horizontally on phones** — filed as [#2598](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2598) with full root-cause diagnosis. **Not fixed in this session** — deliberately kept as spec work rather than a mid-session bug fix.
   `document.scrollWidth` is a constant **418px** regardless of viewport, so:

   | viewport | overflow | offending elements |
   | -------- | -------- | ------------------ |
   | 390px    | 28px     | 14                 |
   | 320px    | **98px** | 32                 |

   Also affects `/ploegen/eerste-elftallen-a` (27px at 390, 31px at 320). **This contradicts the
   earlier "320px passes, zero overflow" finding** — that pass measured the article detail page and
   `/ploegen/[slug]/wedstrijden`, which do pass. The homepage was never checked.

   **Root cause not yet isolated — file as a debugging ticket, not a fix.** What is established: the
   widest offenders are a chain of nested elements all 402px wide with a right edge at 418px, running
   `ARTICLE.flex.items-stretch.gap-0` → `A` → `DIV.flex.flex-col.justify-center` →
   `SPAN.font-display.text-cream.text-2xl`. The 402px is constant across viewports, so something is
   not shrinking. `AccentStrip` (`fixed top-0 right-0 left-0`) shows up as the widest element but is a
   **symptom** — it stretches to the already-too-wide document; it has no transformed ancestor and is
   not the cause. Don't "fix" AccentStrip.

   Repro: `scratchpad/ovf.cjs` in this session, or any Playwright context at 320×720 with
   `isMobile: true` against `/`.

---

## 7. What was dropped as duplicate

Sponsor pricing was asked independently in four files; afgelastingen in four; the named API in four;
entry price in three; recurring editorial capacity in five; physical archive in three. The
convergence is itself a finding — those six are the questions the research kept arriving at from
unrelated directions, and they should be answered first.

---

## 8. Design upgrades — the D-series

The material the consolidation skipped: `retro-fanzine-design-inspiration.md` §1, §4 and §5. These
are aesthetic calls, not prose questions with a defensible answer, so they are drilled the way this
project drills design — **one question at a time against an HTML comparison page**, never as a list
ruled on in the abstract. Pages live in `docs/design/mockups/research-d-series/`.

### §1 is not a fourth source — it is a ranking of §4 and §5

All ten "highest-leverage moves" resolve to entries that already exist further down the same file.
Triaging §1 separately would have counted every idea twice:

| §1 move                       | Is              |     | §1 move             | Is          |
| ----------------------------- | --------------- | --- | ------------------- | ----------- |
| 1 hairline table off headline | S1              |     | 6 overprint duotone | T2          |
| 2 persistent wire strip       | S7 + §5B(1)     |     | 7 scroll ruler      | M8          |
| 3 riso misregistration        | T1 + §5A        |     | 8 match-day marquee | M3 + §5B(2) |
| 4 leader-dot index            | S5 (+ D6 / §5C) |     | 9 ghost numerals    | Y3          |
| 5 `::selection`               | C6              |     | 10 "verder op p. 4" | D1          |

So the real surface is **§4's 47 ideas plus §5's three signature moves**, with §1 read as a priority
ordering over them.

### Two open issues constrain what may be prototyped

Named here so no comparison page assumes today's markup is final.

**[#2599](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2599) — the two-line match row (A17).**
Seven D-series ideas land on the same component or its neighbours: M2 (marching ants on a live
fixture card), M7 (background-fill row hover on fixture lists), S3 (a 45° `AFGELAST` corner ribbon),
S5 (leader dots on `/kalender` entries), C1 (fluoro on a cancelled match), D7 (self-demonstrating
metadata on `MatchStatusBadge`), and all of §5B. **The row's own geometry is unsettled** — single-line
vs stacked changes the available width, the hover target and where a status marker can sit. Any of
these seven that is accepted must be sequenced _after_ #2599 resolves, or it will be built twice.

**[#2598](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2598) — homepage horizontal overflow.**
Root cause not isolated; the widest offender is a chain ending in
`SPAN.font-display.text-cream.text-2xl`, constant at 402px across every viewport. Three D-series
ideas add inline width to display type in exactly that region — **Y2** (0.08em → 0.2em tracking, which
changes wrapping), **S1** (a spec table hung off a headline's right edge), and **Y3** (oversized ghost
numerals that depend on a working `overflow: hidden` to be clipped rather than to overflow). None may
be prototyped against the live homepage until #2598's cause is found, or the two defects will be
confused for one another. Plate-style effects (§5A) are exempt: they are `position: absolute` and add
no layout width by construction.

### Decisions

| #   | Question                                       | Answer                                                                                                  |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| D1  | Two-ink registration — scope (§5A / T1 / §1·3) | **A — none.** `d1-two-ink.html`                                                                         |
| D2  | Ink temperature (C4)                           | **A — `#0a0a0a` stays.** `d2-warm-ink.html`                                                             |
| D3  | Which print artefacts survive (T3 / T5 / T7)   | **T3 yes · T5 no · T7 no.** `d3-print-artefacts.html`                                                   |
| D3a | Mottle execution                               | **Broad noise, in ink, 9% multiply.** `d3a-mottle.html`                                                 |
| D3b | Band-edge execution                            | **Rejected — the seam already does both jobs.** `d3b-torn-edge.html`                                    |
| D4  | A fluoro accent (C1)                           | **A — no fluoro.** `d4-fluoro.html`                                                                     |
| D5  | A fifth band ground (T6)                       | **C — one new non-semantic tint.** `d5-tinted-bands.html`                                               |
| D6  | A colour per team (C5)                         | **C — tone per age band.** `d6-per-item-accent.html`                                                    |
| D6a | Where the band tone lands                      | **C — group bar _and_ card kicker.** `d6a-band-tones.html`                                              |
| D7  | Match day as a register (§5B)                  | **B — no new band; `MatchStrip` changes register.** `d7-match-day.html`, `d7a-one-band.html`            |
| D7b | The match-day ground                           | **`jersey-deep-dark` #133d28.** `d7b-matchday-ground.html`                                              |
| D7c | The desktop CTA on that ground                 | **`primary → inverted`; dark-ground variant of both layouts.** `d7c-desktop-cta.html`                   |
| D8  | `/index`, the contents page (§5C)              | **Build it, minus players, at `/inhoud`.** `d8-index-page.html`                                         |
| D9  | Overprint on photographs (T2)                  | **B — `lighten` clamp to `jersey-deep-dark`.** `d9-overprint.html`                                      |
| D10 | Section openers (S2 / Y3 / S6)                 | **S2 yes · Y3 yes · S6 no.** `d10-section-openers.html`                                                 |
| D11 | Dense-list devices (S5 / S4 / S1)              | **S5 yes · S4 no · S1 no.** `d11-dense-lists.html`, `d11a-newspaper-heads.html`, `d11b-deck-agate.html` |
| D12 | Small delights, group one                      | **D4 yes · D8 no · D9 no.** `d12-small-delights.html`                                                   |
| D13 | Small delights, group two                      | **D7 yes (lineups only) · D2 no · D5 no.** `d12-small-delights.html`                                    |
| D14 | Type ramp (Y1 / Y8 / Y2)                       | **Y1 yes · Y8 yes · Y2 no.** `d14-type-craft.html`                                                      |
| D15 | Prose type (Y5 / Y6 / Y7)                      | **Y6 yes · Y5 no · Y7 no.** `d14-type-craft.html`                                                       |
| D16 | Motion (M4 / M5 / M7 / M8)                     | **M4 yes · M7 yes · M5 no (occupied) · M8 no.** `d16-motion.html`                                       |
| D17 | Rule weights (C3 / C2)                         | **C3 = documentation debt, not a decision · C2 no.** `d17-rule-weights.html`                            |

**D1 — no misregistration anywhere. Rejected, not deferred.**

The site does not adopt the two-ink fiction. This closes **§5A** outright, and with it **T1**
(misregistration) and **T4** (ink bleed on the seam edge, which was only ever a refinement of a
two-plate seam). **§5B** loses switch 4 of its five — the match-day crest plate — so if the match-day
register is built it is four elements, not five. **§1 move 3** is gone.

Two corrections found while prototyping it, kept because they outlive the decision:

- **There is no single crest.** `kcvv-crest-retro.png` is a monochrome mark used in the footer and
  decoratively; `kcvv-logo.png` is the **full-colour** club crest and is what the header and
  `MatchStrip` render. Any future proposal phrased as "the crest does X" has to say which one, and
  anything requiring a mono silhouette is unavailable on the colour mark.
- **`--color-ink` is spent in three roles** — glyph colour, band ground, and the ink used to draw
  every `--shadow-paper-*`. A change to it is never a text change. This matters to D2.

**T5** (photocopy degradation on a large decorative crest) is a different technique on the same
asset and does **not** fall with D1 — it stays open and is drilled with the texture questions.

**D2 — the ink stays neutral. C4 closes.**

`--color-ink: #0a0a0a` is unchanged. Measured while prototyping: on cream the three candidates run
17.5 : 1, 16.8 : 1 and 15.4 : 1, so contrast was never going to decide this — it was a
readability-by-eye call, which is the project's stated test.

Two things worth keeping from the exercise:

- **A site-wide token change is the only kind of change in this series that cannot be VR-captured
  locally.** The unscoped guard refuses it, so it becomes a bot-driven re-baseline of the whole
  suite. That cost belongs in the argument for any future palette proposal, not just this one.
- **The seven `--shadow-paper-*` tokens resolve to `var(--color-ink)`**, so an ink change is
  simultaneously a shadow change. No ink proposal can be scoped to text.

**D3 — the paper gets a texture; the band edge and the crest stay clean.**

**The correction that reframed T3: there is no texture on the paper today.**
`--pattern-paper-grain` is wired into exactly one rule — `.taped-figure::after`, 4% opacity,
`mix-blend-mode: multiply` — plus `SubjectAvatar`. It is a **photo** treatment. `body` and every
section ground are flat cream. §2's "one 4%-opacity turbulence grain" is accurate but was read as
describing the page; it describes the photos. So T3 is not "replace the grain", it is **"give the
paper a texture for the first time"**, and the speckle layer is as new as the mottle.

- **T3 — accepted, executed as panel A of `d3a-mottle.html`:** the existing speckle token on the
  ground at 5%, plus a broad low-frequency mottle (`baseFrequency 0.014`, 4 octaves) drawn **in ink
  at 9% multiply**. Two custom properties and one rule on `body`. No asset, no network request, no
  fallback path. The scanned-JPEG version of T3 (§4.1 as written) is **not** taken — it buys fibre
  detail, and the axis actually missing was low frequency, which is free.

  > **Recorded knowingly, so a reviewer does not re-litigate it.** Ink at 9% over cream is a
  > desaturated darkening — arguably a grey layer, on a palette that deleted its last neutral in
  > #2342. Three alternatives drawn in `--color-cream-deep` were shown side by side and lost. The
  > reconciliation: the No-Grey-UI rule governs **surfaces** — panels, chrome, listing grounds — and
  > a multiply texture is not a surface. Anyone re-proposing a cream-tone mottle should read
  > `d3a-mottle.html` first; it was considered and rejected on the render, not overlooked.

- **T5 — rejected.** No photocopy degradation on the crest, at any size. §4.1's texture section is
  now closed apart from T3 above.

- **T7 — rejected.** No cut, torn or trimmed band edge. Ruled by the owner on 2026-09-20 against
  the render ([#2625](https://github.com/soniCaH/www.kcvvelewijt.be/issues/2625)): the smallest
  version, `D — trimmed` in `d3b-torn-edge.html`, did not blend into the design style. The render
  stays as the source this was ruled against.

  The structural reason matters more than the verdict. The proposed split (seam for a section that
  continues, trim for a section that ends) does not hold, because `StripedSeam` already carries both
  meanings. One seam between two blocks reads "the page continues, new subject". A flipped pair
  around a block reads "this is a discrete package, it ends": the `flip` prop exists so "the top and
  bottom stripes lean toward each other and visually 'tape' the section as a discrete package". The
  seam alone satisfies one treatment per _purpose_. Giving "ends" to a cut edge would first mean
  taking it off the seam, which nobody asked for.

  Nothing was built, so nothing is removed. The two execution constraints (the 600px-tiled mask,
  the ~24px of extra bottom padding) die with it.

**D4 — no fluoro. C1 closes.**

The colour was never the problem; the job was. C1 names three use cases and the code answers all
three before the question is asked:

1. **"Cancelled match" — occupied.** `MatchStatusBadge` ships `cancelled → bg-card-red text-cream`
   ("CANC"), alongside `postponed`, `forfeited` and `stopped`. The loud tier exists and has a colour.
2. **"Live score" — forbidden.** `apps/web/PRODUCT.md:56` lists _live in-play scores_ among the
   things this site "does not have, and must not be designed as if it did".
3. **"An alert stamp" — `card-red` again.**

Also measured, and it outlives the decision: **a fluoro badge cannot keep cream type.** Cream on
`#ff3300` is 3.3 : 1 against the shipped badge's 4.4 : 1, at 10px mono caps. Ink on fluoro reads
better (5.4 : 1) but flips the gesture — cream-on-red is a stamp, ink-on-fluoro is a highlighter.
Any future "louder tier" proposal inherits that trade.

One idea from the exercise is worth keeping even though its colour died: **a club-wide cancellation
band** — "alle wedstrijden van dit weekend gaan niet door" — is a real thing a per-match badge
cannot say, and it is what a parent opens the site for on a wet Saturday morning. It does not need a
new colour to exist. Not filed; noted here so it is findable.

**D5 — a fifth ground, but not one of ours.**

`--color-alert-soft`, `--color-warning-soft` and `--color-success-soft` are **semantic** — the
comment above them in `globals.css` says they exist to give _"the three Alert variants
visually-balanced soft bodies"_ (Phase 2.A.5 ticket-stub). §4.1 proposed exactly those three as
decorative section grounds, which makes a section band the same colour as "this went well" or
"something is wrong". Rendered adjacently in `d5-tinted-bands.html`, it does not survive.

**Decision: one new non-semantic paper tint** — a manila stock around `#f0e4c4`, warmer and more
saturated than `cream-deep`, with no Alert to collide with. One token plus a `SectionBg` option.

Two conditions recorded with it:

- **Index pages only, once.** The chaptering argument is strong on a long homepage and weak on a
  detail page, so the rule is narrower than §4.1's "one per page maximum".
- **`cream-soft` keeps its job.** It remains the documented step-down ground. The tint is a
  _chapter_, not a step — if a section only needs to sit back, it still gets `cream-soft`.

**D6 — a colour per age band, not per team. C5 survives, transformed.**

**The arithmetic killed the proposal as written.** Production holds 26 team documents; §4.3 caps the
tone set at four "or it is product UI". Four tones across twenty-six teams repeat every fourth card,
so the colour identifies nothing — ornament wearing the clothes of a system. Rendered in
`d6-per-item-accent.html`, the cycle is visible within eight cards.

**What ships instead:** the tone maps to **Senioren / Bovenbouw / Middenbouw / Onderbouw**, four
groups that are real and already modelled.

**Overhead, verified rather than assumed** — this was the condition on the answer:

- `getYouthDivision()` in `apps/web/src/lib/utils/group-teams.ts` already derives the band from the
  age code (`U17–U21` → Bovenbouw, `U12–U16` → Middenbouw, `U6–U11` → Onderbouw).
- `YouthDirectory` already renders those groups, plus `Reserven` — whose Sanity `age` is `"A"`, so
  no age parsing places it and it has its own group.
- So the build is a four-entry map from an existing derived value to an existing token. **No schema
  change, no authoring, no new colours, no data migration.** The one edge to handle:
  `getYouthDivision()` returns `null` for senior codes _and_ for `U5`, so the map needs a null branch
  — which the Senioren tone already is.

**D6a — the tone lands on the group bar _and_ the card kicker.** Thirty coloured elements per page.
The deciding argument is out-of-context: inside `/ploegen` the group heading is always visible and a
per-card tone is redundant, but a team card lifted into a search hit or a related-teams strip has no
heading, and the tone is then the only thing carrying its band.

Two tensions recorded rather than resolved, both for build time:

- **The tone set reuses `--color-alert` and `--color-warning`** — the same semantic reuse D5 rejected
  for section grounds. Accepted here on scale and adjacency: an 11px kicker and a 10px tick are not a
  full-bleed ground, and no Alert renders beside a team card. D6a's answer is the loudest of the
  three placements, so this is the version where that defence is thinnest — worth one look on the
  real page before it is locked.
- **`jersey-deep` becomes the Bovenbouw tone.** Today _every_ kicker on `/ploegen` is jersey-deep, so
  after this change three of the four bands lose it and one keeps it. Since `jersey-deep` is also
  `--color-jersey-link`, Bovenbouw kickers will read as links in a way the other three no longer do.
  Whether green belongs in the set at all is the open half of this; the grouping decision does not
  depend on it.

**D7 — match day gets a register, but no new chrome. §5B shrinks to one relabelled band.**

Four facts, checked against the code, removed most of the proposal before the aesthetics were
reached:

1. **There is no "in progress" state anywhere.** `MATCH_STATUS_VALUES` in
   `packages/api-contract/src/schemas/match.ts` is
   `scheduled · finished · forfeited · postponed · cancelled · stopped`. A match being played right
   now is `scheduled`. **Nothing in the data can say "live"** — so §5B switch 3 (marching ants, M2)
   and switch 5 (the flickering live dot, M10) have no source and **close**.
2. **PSD flips `scheduled → finished` the instant a goal exists** — the mapping is literally _0 (no
   goals) → scheduled, 0 (has goals) → finished_. Any score reaching PSD before the whistle makes
   the site read `finished 1–0` during the second half.
3. **`apps/web/PRODUCT.md:56` forbids live in-play scores.** A `● LIVE` marker promises coverage the
   product has decided not to have.
4. **The homepage is `revalidate = 900`** (`apps/web/src/app/(landing)/page.tsx:493`), so anything
   clock-derived is up to 15 minutes wrong in both directions, and a page cached mid-match serves
   that state to everyone until it regenerates.

**And the slot is occupied.** `MatchStripSlot` is mounted in the `(landing)` layout — already a band
directly under the navigation on the homepage and every section index — under a locked spec
(`docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`). §5B's wire strip was a
second band stacked on a band that already carries the next fixture.

**The real defect turned out to be one line wide:** `MatchStrip` has no concept of _today_. There is
no `isToday`, no "Vandaag", in `MatchStrip`, `dates.ts` or `match-display.ts` — a fixture eight days
out and one in two hours render identically, so the reader does the date comparison themselves.
That is precisely the work a match-day register was invented to remove.

**Decision: no new band.** On the day of its fixture the existing strip relabels the fixture row to
`Vandaag · 15:00 · De Dries` and takes a dark ground. **No marquee** (M3 closes), no dot, no ants.

- **D7b — the ground is `--color-jersey-deep-dark` #133d28.** Green rather than ink: the Rare Green
  Rule says green is an event, and match day is the only recurring event this site has, roughly
  thirty Saturdays a year. Dark rather than `jersey-deep`: it reads as a ground and declares itself
  as green only on a second look. Red was rendered and rejected on the page — `--color-alert` is the
  Alert body and `--color-card-red` paints the `CANC` badge, so a red band on a match morning is the
  same colour as _afgelast_.
- **`isToday` must be computed in Europe/Brussels.** PSD match dates are Belgian wall-clock; a naive
  UTC comparison flips the label at the wrong hour. Day-granular, so `revalidate = 900` is harmless —
  worst case the label appears fifteen minutes after midnight.

**D7c — the desktop half, and it resizes the job.** Above `lg` the strip is a two-slide switch with
arrows and a `Wedstrijddetails` CTA, all built on cream-ground assumptions. On `#133d28` the CTA's
`bg-jersey-deep` fill is 2.3 : 1 against the ground and its `border-ink` + `shadow-paper-sm` are
1.6 : 1 — both effectively invisible.

The fix needs no new variant: `Button`'s **`inverted`** is already `bg-cream text-ink` with
`shadow-paper-sm-soft`, and that shadow token exists in its own words for _"any chrome surface on a
dark / ink panel"_. Cream on the ground reads 10.8 : 1; the soft offset 2.3 : 1.

But it means the ground swap is **not one class on the `<aside>`** — it is a dark-ground variant of
both layouts: CTA `primary → inverted`, arrows and dividers to cream alphas, team names and score to
cream, slide label to a cream alpha, meta line to `warm`. Roughly a dozen swaps behind one boolean,
against a locked component. **Scope it as a checkpoint against `matchstrip-locked.md` with a
Storybook story per ground, not as an edit.**

**D8 — the contents page ships, without players, at `/inhoud`.**

**§5C's player section is impossible twice over.** A7 in §3 of this sheet already rejected a player
index — _"Players stay reachable via team pages… privacy implications (→ C12) and no demonstrated
user need. Treat the absence as deliberate."_ And C12 measured that it could not be built even if it
were wanted: **294 player documents, 0 with a slug** (no pages to link to) and **0 with a jersey
number** (§5C's "with their team and number" column would be empty on every row). Cut it.

**What ships:** teams (26), articles (125), events (80), club pages (9) — about 240 rows, three
columns collapsing to one. **Every entry derived from Sanity or the BFF, never authored.** §5C's own
warning applies to this repo specifically: `llms.txt` already drifted exactly this way once, shipping
`/club/organigram` long after the route was removed.

**The path is `/inhoud`, not `/index`.** Every route on this site is Dutch, so an English one would
be the only exception. `index` is also the _default document name_ a web server returns for a
directory — `/` already resolves to it — so a route of that name invites trailing-slash and
static-normalisation surprises for no benefit. (It would work: the reserved-`index` behaviour was
Pages Router, not App Router.) `/inhoudstafel` is the more characterful Flemish alternative and the
rename is cheap while nothing links to it yet.

Two obligations that ride with the new route:

- **`llms.txt` is updated in the same PR** — CLAUDE.md requires it whenever routes change, and A18
  says the same.
- **It needs a footer link**, and it must not become navigation. The nav is flat and stays flat; the
  four dropdowns were deleted deliberately in #2409/#2415.

The leader dots in the mockup are **S5**, which is a separate question — they appear there because
§5C specifies them, not because they are decided.

**D9 — photographs get a second plate in the shadows only.**

**T2's stated mechanism does the opposite of its stated intent, and its own source has the fix.**
§4.1 specifies `background-blend-mode: multiply` against a jersey-deep→cream ramp _"so shadows go
green and highlights stay paper"_. Multiply is `a × b`: a white highlight multiplied by green
**becomes green**. Rendered as column D in `d9-overprint.html`, the whole frame goes green, which
also brushes the photos-stay-in-colour rule. The note beside it records that Stripe Press uses
`mix-blend-mode: lighten` — and lighten _is_ the shadow-only operator: every pixel darker than the
plate clamps up to it, every lighter pixel passes through untouched.

**Decision: `mix-blend-mode: lighten` against a `--color-jersey-deep-dark` (#133d28) plate.** Only
the deepest shadows move — blacks stop being black and become dark green. On the skin-tone test
(`youth-trainers.jpg`) skin is lighter than the plate, so faces pass through unchanged and only hair,
shade and dark kit take the ink. The `#007c46` plate was rendered too and clamps shadowed cheeks to
green, which is where the technique starts reading as a fault.

**Opt-in per figure, not global.** `TapedFigure` already carries `data-tint="none"` as a
per-instance opt-out, so `data-print="overprint"` has a precedent and needs no new pattern. Each
instance is a pseudo-element with a blend mode — one promoted compositing layer per figure. Fine on
an article hero; worth watching on a card grid.

**D10 — two of the three section openers.**

- **S2 — rule–heading–rule: yes.** Hairlines running out from the title. **The rules are the small
  part; centring the heading is the real change** — a two-line heading centred between rules scans
  worse than a ranged-left one, so the variant wants a length rule or a single-line constraint.
  **Owner is `SectionHeader`** (#2552 made it the owner of section-heading air). **Never
  `EditorialHeading`** — that breaks nine heroes, which is the mistake #2552 exists to prevent.
- **Y3 — oversized ghost numerals: yes.** Section ordinals at display scale in `ink/6`, clipped by
  the container, `aria-hidden`. Two conditions ride with it:
  1. **The numbers must be stable.** A homepage whose sections are conditional — the featured-event
     band only renders when an event exists — would renumber itself between visits. The ordinal has
     to come from a fixed section list, not from render order.
  2. **Gated on #2598.** It depends on `overflow: hidden` clipping rather than overflowing, which is
     exactly the unresolved defect. Do not prototype it against the live homepage until the root
     cause is isolated.
- **S6 — one heavyweight frame: no.** Closed.

**D11 — leader dots ship; the chip wall and the spec table do not.**

- **S5 — leader dots: yes.** `label · · · · · value` via a `flex` row with a dotted bottom border
  expanding between the two. Surfaces: `/inhoud` (D8 depends on it — a contents page without leader
  dots is just a list), `/kalender` entries, the article "in dit stuk" list, footer link columns.
  **The filler must be `aria-hidden`** — a screen reader announcing a run of dots between every label
  and value is the failure mode.
- **S4 — chip wall: no.** Closed. Two things came out of rendering it that are worth keeping:
  **sponsors can never be a chip wall** (the logo is what a sponsor is paying for, and greyscale→hover
  is a locked treatment — a wall of names in 10px mono deletes the deliverable), and a player chip
  wall would have to be styled as a label rather than a button, because 0 of 294 players carry a slug
  so the chips link nowhere.
- **S1 — spec table: no. Every home it was proposed for is already occupied.**

### S1: the research that killed it, kept because it outlives the decision

§1 ranked S1 as the number-one highest-leverage move, so it is worth recording exactly why it closed.

**First — the ancestor is wrong.** Asked how old newspapers solved this, the answer is that they
never did it: a headline lived inside its column, so extra facts went **downward**. The 1912 NYT
Titanic head was a "three-column" head — that was the whole width it got — and it still stacked
further decks underneath. Multi-deck headlining exists _because_ the measure was narrow. The
vocabulary:

- **Deck** (drop head, bank) — a smaller headline below the main one that _adds_ information;
  craft rule is typographic contrast (bold main → lighter decks) and size contrast (36 → 18 → 14pt).
  Stacked decks became common during the Mexican-American War, 1846–48.
- **Cut-off rule** — a 1–2pt horizontal rule separating stories, and separating one deck from the next.
- **Agate** — 5.5pt (≈7pt relative to body) reserved for _statistical_ matter: box scores, standings,
  transactions. First rudimentary box score, _New York Morning News_, 1845. It sat in its own
  tabulated block, **never attached to the headline**. **Our 11px Floor Rule forbids true agate** —
  which is why a modern spec-sheet device exists at all.

So the historical answer is two devices: identity in the decks, statistics in an agate block.

**Second — gating it to the contract produced a rule worth keeping.** Built strictly from
`packages/api-contract/src/schemas/match.ts`, **only three fields on `MatchDetail` are required**:
`home_team.name` / `away_team.name`, `date`, and `status`. Everything else — `time`, `venue`,
`competition`, `competitionType`, `kcvv_team_label`, `is_home`, both scores, `lineup`, `events` — is
`S.optional`. **`hasReport` is the one other guaranteed value.**

> **Two fields were invented in the first mockup and must never be designed in: `Scheidsrechter` and
> `Toeschouwers`.** Neither exists anywhere in `MatchDetail` or `BaseMatchFields`, and `PRODUCT.md`
> forbids fabricating attendance figures outright.

Two dashes that will appear in production, not hypothetically: **`competition` is frequently absent
on match detail** (reliable only on the season-games list), and **`venue` is named in `PRODUCT.md`**
as a field the upstream does not reliably provide. `MatchEvent.player` is optional too, so an unnamed
scorer stays a dash rather than a guess.

**Third — and decisively — the slot is taken, three times over:**

| §4.4's proposed home   | What already renders there                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/wedstrijd/[matchId]` | `MatchHero` — which already takes `date, time, venue, status, competition, kcvvTeamLabel`, i.e. the exact agate field set — plus `MatchLineupSection` and `MatchEventsSection` for lineups, goals and cards |
| `/ploegen/[slug]`      | `TeamHero` + `TeamSectionNav` + `StandingsTable` + `TeamMatchesSection`                                                                                                                                     |
| `/evenementen/[slug]`  | `EventHero` (centred, variant D "Editoriaal") + `EventDetailCtas`                                                                                                                                           |

**This is the second time in this pass a §1/§5 move turned out to be a second component on an
occupied slot** (the first was §5B's wire strip over `MatchStrip`). Worth treating as a standing
check: before accepting any "new chrome" proposal from this corpus, grep for what already renders in
that position.

**Fourth — the head itself was then compared directly, and the hero won.** `MatchHero` is a
**ticket stub**: a `TapedCard` split into a dashed-edge stub zone (weekday + day / month in
`display-big`, time in mono, venue in 9.5px caps) and a body (∗ kicker, three-column
team–score–team row, hairline meta row of competition · team · season), with a rotated
`MatchStatusBadge` as a corner stamp. Set against a newspaper deck stack, the question resolved to:
**is a match hero a scoreboard or a headline? Answer: a scoreboard.** The three-column
team–score–team row serves `PRODUCT.md` principle 1 — _"match data must read at a glance … on a
phone, outdoors"_ — in a way a centred headline stack does not. **`MatchHero` is unchanged.**

**The provenance discipline survives S1 and `MatchHero` already implements it:** `time && (…)`,
`venue && (…)`, and `buildCompetitionMeta()` filtering absent parts — render from present fields,
never from a fixed row template, so the hero shrinks rather than gaps.

### The agate fact-block is kept as a device, without a surface yet

The one part of `d11b-deck-agate.html` that survives on its own merits: the **agate block styling** —
a mono-caps label (`DE FEITEN`), a 2px rule above and below, and tabulated key/value rows at the
label floor in two columns, each absent value an honest `—`.

It is **not** going on `/wedstrijd/[matchId]` (`MatchHero` plus `MatchEventsSection` own those
facts), and it is not a replacement for any existing hero. It is recorded here as an approved
treatment looking for a surface that genuinely has tabulated facts and no existing design for them.
**Before it is placed anywhere, run the standing check above** — the three surfaces §4.4 proposed all
turned out to be occupied, and that is the failure mode this device is most likely to repeat.

Constraint it inherits: true agate is 5.5–7pt and the **11px Floor Rule** forbids it, so the block
sets at `text-label-sm` (10px), which the sheet already records as the floor and already spent.

**D12 / D13 — §4.5 closes with two additions. Three of the eight were already built.**

Ran the standing occupancy check before proposing anything, and it paid twice:

- **D1 — print-navigation footer: already built.** `VerderLezenRow` ships the article-footer
  "Verder lezen." row (a `HorizontalSlider` of `NewsCard`s, Phase 5 5.d4 lock), and `EndMark` already
  closes an article with `rule · ★ · LABEL · ★ · rule` under its own locked spec. Closed as occupied.
- **S3 — 45° corner ribbon: already built.** `MatchHero` mounts `MatchStatusBadge` rotated 2° at the
  top-right corner. That _is_ the corner ribbon, and D4 already confirmed `card-red`/`CANC` as the
  cancelled treatment. Closed as occupied.

**Accepted:**

- **D4 — bracket affordances.** `[×]` and `[?]` in mono, **beside** the Phosphor Fill icons, never
  instead of them and never instead of an accessible name. Surfaces: alerts, the cookie banner, form
  hints. The named risk to watch in review: it must join the icon language, not become a second one.
- **D7 — self-demonstrating metadata, scoped to lineups only.** A shirt number set in the shirt
  register (black italic display) while counts stay mono. **Not on player profiles**: 0 of 294
  players carry a jersey number, so there is nothing to render. `MatchLineupPlayer.number` is in the
  contract and PSD does send it on lineups, so a match lineup is the one surface with real data
  behind the device.

**Rejected:** D8 (postmark byline), D9 (label with air), D2 (square pagination — it would be a third
element in a zone #2444 deliberately reduced to two registers), D5 (margin notes — the 680px column
has no gutter on a phone, so the device only exists in the minority scene).

**D14 / D15 — the ramp gains two steps; prose gains one refinement.**

- **Y1 — negative leading: yes.** A `line-height: 0.85` sibling step for **two-line heroes only**,
  never the default. Needs `padding-block` or the first line's ascenders clip against the box.
- **Y8 — tighter display tracking: yes.** `-0.025em → -0.035em` at the **two largest steps only**,
  where Freight Big can carry it.
- **Y2 — 0.2em label tracking: no.** Rejected. It widened every label measurably, and it was one of
  the three moves flagged against #2598 precisely because it changes wrapping — the nav's real
  `max-w-[14ch]` bound puts "Evenementen" at risk.
- **Y6 — hanging punctuation: yes.** On pull quotes. `hanging-punctuation: first last` is Safari-only
  and the fallback is a negative `text-indent`, so **the two must be mutually exclusive or the quote
  hangs twice.**
- **Y5 — body 500 on dark: no.** Rejected on the render.
- **Y7 — raised initial: no.** `DropCapParagraph` keeps the dropped cap as the only initial.

> **Both Y1 and Y8 are ramp changes and go in `@theme` as steps.** Never as hand-applied
> `leading-*` / `tracking-*` utilities — that is the exact drift #2417 repaired, and the reason four
> parallel type systems existed before it.

**D16 — motion gains two gestures, and M5 turned out to be built already.**

- **M4 — squeegee wipe: yes.** A `clip-path: inset()` wipe on section entry — ink pulled across
  paper. Needs `IntersectionObserver` or `animation-timeline: view()`, and **must degrade to "already
  visible"**: a section that never animates must never stay hidden.
  **Retired 2026-09-21 (#2623) — do not re-propose without reading that ruling.** The timed build
  (PR #2888) never fired on its one call site, which is already in view at mount, and where it did
  fire it showed the section, blanked it, then swept it open. A timed wipe that may never pre-hide
  must fire after the section is visible, so the flash is structural. A scroll-linked
  `animation-timeline: view()` rebuild was prototyped and works, but it repaints the clip on every
  scroll frame on the cheap phones this site is read on. Deleted.
- **M7 — background-fill row hover: yes.** For list rows, where translating the whole row reads as
  the list coming apart. **Must be documented as scoped to list rows** or it erodes the canonical
  press-down everywhere else — §4.2's own warning, and the condition on this acceptance.
- **M8 — scroll ruler: no.** Closed.
- **M5 — wipe-in underline: no, because `EditorialLink` already ships a better version of it.**

> **Fourth occupancy hit of the pass, and the only one where the shipped code beats the proposal.**
> `EditorialLink`'s inline variant already sweeps an underline on hover —
> `scale-x-0 → scale-x-100`, `origin-left`, 300ms `ease-out`, with `motion-reduce:transition-none` —
> masked through `STROKE_PATH`, the same hand-pulled slab outline as `HighlighterStroke`. So the
> sweep is a **marker stroke**, not a straight rule. M5 proposes a plain `background-size` gradient
> line and explicitly assumes inline links have no sweep and the SVG stroke is heading-only. Both
> halves of that premise are false here, and adopting M5 would be a **downgrade**.

**D17 — C3 is a documentation debt; C2 is rejected.**

**§4.3's premise is factually wrong about this codebase.** It proposes adding a 1px listing rule "our
border is 2px everywhere". Counted in `apps/web/src`, product code only, order-independent:

|                                        | uses    |
| -------------------------------------- | ------- |
| `border-2` ink, any order (2px object) | **163** |
| `border-paper-edge` (1px hairline)     | 32      |
| `border-ink/15` · `/10` (1px alpha)    | 10      |
| `border-jersey-deep`                   | 12      |

**Correction (#2611 review, 2026-08):** the count originally shown here (90 / 13 / 16 / 22) matched
only the literal adjacent string `border-2 border-ink`, which undercounted `2px` ink roughly tenfold.
Measured correctly, the `2px` object border outnumbers the `1px` structural rule **163 to 96**
combined — the reverse of the "90 to 16" this entry originally claimed, and closer to §4.3's own
"2px everywhere" than to this entry's rebuttal of it. The semantic split §4.3 asks for is not the
clean binary this entry assumed; see `DESIGN.md`'s Shapes section for the one-directional version the
code actually supports. **What is missing is still the sentence in `DESIGN.md` recording the real
pattern**, which is why the split was invisible to a reviewer and one edit from drifting. §4.3's
stated risk still applies: an undocumented pattern drifts either way. **Not a design decision; file
it as documentation.**

**C2 — accent hairlines: no.** Green stays an event — the kicker, the link, the match-day ground. At
the density rendered in `d17-rule-weights.html` a section drawn in green hairlines reads as a green
section whatever the pixel count says, which is what the Rare Green Rule exists to prevent.

### Coverage — the pass is complete

All 50 items in §4 and §5 are ruled on. §1 needed no separate treatment (it is a ranking of §4
and §5, as recorded above). §6's sixteen rejections were already reasoned and are untouched.

|               | Accepted                 | Rejected        | Already built     |
| ------------- | ------------------------ | --------------- | ----------------- |
| §4.1 Texture  | T2*, T3, T6*             | T1, T4, T5, T7  | —                 |
| §4.2 Motion   | M1, M4, M6, M7, M9       | M2, M3, M8, M10 | M5                |
| §4.3 Colour   | C5, C6                   | C1, C2, C4      | C3 (undocumented) |
| §4.4 Shape    | S2, S5, S8               | S1, S4, S6, S7  | S3                |
| §4.5 Delights | D4, D6, D7               | D2, D5, D8, D9  | D1                |
| §4.6 Type     | Y1, Y3, Y4, Y6, Y8       | Y2, Y5, Y7      | —                 |
| §5 Signatures | B (reduced), C (reduced) | A               | —                 |

\* T2 accepted in altered form (`lighten`, not `multiply`); T6 accepted with a new non-semantic
token rather than the proposed status tints.

**Twenty-three accepted, twenty-three rejected, four already built: fifty items.** Recounted from the
table on #2625; the earlier tally (fourteen / twenty-three / six of 43) did not add up to it. The
pattern below names six already-shipped devices because two of them, S1 and §5B's wire strip, also
sit in the Rejected and Accepted columns.

### The pattern worth carrying into the spec

**Six of the corpus's proposals were already shipped, and one of those shipped better than
proposed.** `MatchStrip` (vs §5B's wire strip), `MatchHero` + `MatchEventsSection` (vs S1),
`VerderLezenRow` + `EndMark` (vs D1), `MatchStatusBadge`'s rotated corner stamp (vs S3), the 90-use
1px hairline convention (vs C3), and `EditorialLink`'s masked hover sweep (vs M5 — richer than the
proposal, which would have been a downgrade).

**This is the same finding the README already states about content, restated for design: the gap
between this site and the research recommendations is smaller than the corpus assumes, because the
corpus could not read the code.** Adopt the standing check — **before accepting any "new chrome"
proposal from this corpus, grep for what already renders in that position.**

Three further proposals were built on premises the code contradicts: §4.3's "our border is 2px
everywhere" (it is 90 : 16 the other way), T2's `multiply` (which does the opposite of its stated
intent — its own cited source has the right operator), and §5B's `● LIVE` (no in-progress state
exists in the contract, and `PRODUCT.md:56` forbids live scores).

### Gated on open issues — sequence these, do not build them first

- **#2598 (homepage overflow):** **Y3** depends on `overflow: hidden` clipping rather than
  overflowing. Do not prototype it against the live homepage until the root cause is isolated.
  _(Y2 and S1 were the other two exposed moves; both are now rejected, so #2598's design blast radius
  is down to one item.)_
- **#2599 (two-line match row):** nothing accepted here lands on the match row — M2, M3, M10, S3 and
  C1 all closed. **The gate is now clear.**
- **M1 is a prerequisite, not a peer:** M4 and M7 are two gestures, not a vocabulary, until the
  `DESIGN.md` Motion section exists and Tailwind's `--animate-*` namespace is reset the way
  `--text-*` was in #2417.

### D0 — the free tier, taken without a comparison page

Six ideas carry no aesthetic choice: they are either three lines of CSS with no downside, or a defect
fix wearing an idea's clothes. Recorded rather than drilled.

- **C6 `::selection`** — jersey-deep ground, cream text; inverted inside ink and jersey bands.
- **S8 transparent reserved borders** — `1px solid transparent` wherever a hover adds a border, so
  nothing shifts. Pure discipline.
- **M6 thickening underline on hover** — `transition: text-decoration-thickness`. No layout cost.
- **M9 named image-load keyframes** — and with it the **69 unguarded `animate-pulse` uses**, which is
  a reduced-motion accessibility defect, not a nicety.
- **Y4 figure sets applied consistently** — scores and tables to mono or `lining-nums`, in-prose dates
  left oldstyle. Already a documented project rule; this is applying it, not deciding it.
- **M1 write the Motion rules down** — the prerequisite for everything in §4.2, and it decides
  nothing on its own. Reset Tailwind's `--animate-*` namespace the way `--text-*` was reset in #2417.
