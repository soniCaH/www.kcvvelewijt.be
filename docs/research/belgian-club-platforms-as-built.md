# Belgian club platforms, as actually built — federation baseline, Twizzit, PSD, VoetbalAssist, Kicksite

> **Provenance.** Produced by a sub-agent of the synthesis research pass on 2026-08-13, delivered after
> its parent had already finalised. Preserved here verbatim in substance. Companion to
> [`platform-vendors-and-templates.md`](./platform-vendors-and-templates.md), which covers the
> _vendor-side_ template offer (Wix/Squarespace/WordPress+SportsPress pricing and features). This file
> covers the **Belgian market as built** — what clubs near Elewijt actually run, and what the
> federation gives away for free.
>
> Everything below was fetched first-hand. Blocked sources are named rather than guessed around.

## 1. Voetbal Vlaanderen / RBFA — the free federation club page

The baseline **every** Belgian club already has, wanted or not. KCVV Elewijt is club **1002**.

> **ID-space warning:** RBFA club ids and PSD club ids are different id spaces. RBFA `1002` ≠ PSD
> `1235`. In the RBFA space, `1235` is Oostmalle.

Read: `voetbalvlaanderen.be/club/1002` (Angular SPA — the HTML is a 5,925-byte shell, so the GraphQL
backend was read instead), `voetbalvlaanderen.be/main.109580d6f9263e4f.js` (query documents),
`voetbalvlaanderen.be/assets/i18n/nl.json` (exact Dutch UI labels),
`datalake-prod2018.rbfa.be/graphql` (live queries, **no auth, no key**).

**The six tabs a club gets, verbatim:** `Overzicht` · `Clubinfo` · `Ploegen` · `Kaarten` · `Terreinen`
· `Komende wedstrijden`

**Overzicht fields:** `Algemene info`, `Stamnummer`, `Taal`, `Btw-nummer`, `Clubkleuren`,
`Correspondentieadres`, `Gerechtigd correspondent`, `Stadion`, `Bereken route`, `Jeugdlabel`,
`Hoogst geklasseerde ploeg`, `Alle ploegen`, `Bezoek website`, `Discipline`, `Niveau jeugd`.

**Live data already published for KCVV Elewijt:** address, VAT 425020346, stamnummer 00055, venue
Driesstraat, kit colours (`Thuisshirt` Donkergroen/Wit, `Uitshirt` Zwart/Donkergroen), 5 named contacts
with function titles (Gerechtigde Correspondent, Aanspreekpunt Integriteit (API), Futbalista
Ambassador…), youth label `Basic Quality label Gew`, and **all 19 teams** (Eerste Elftal A/B, Reserven,
U21→U6).

**Team pages** (`/club/1002/ploeg/365479`) render `Overzicht en rangschikking` · `Kalender en uitslagen`
· `Rangschikking` · `Spelers en staf`. The live squad pull returned **27 named players with appearances
and goals**, and **6 named staff with roles** (T1, T2, Tvjo/T3, Keeperstrainer, Officiële Team
Afgevaardigde, Verzorger). **Photo fields are empty strings for every player.**

**What this means:** appearances, goals, full standings (points, W/G/V, goals for/against, goal
difference, fair-play %), full fixture lists with referee assignments, and complete squad lists are
**free for every club**. They are not differentiators.

**What the federation page does NOT have:** news, photos, sponsors, club history, membership info,
registration, webshop, events, RSS, and **no ICS/iCal export anywhere** (the bundle was grepped — every
"ical" hit is a substring of "vertical"/"typical").

### Two concrete failures worth acting on

- **KCVV Elewijt's `website` field is `null`.** The federation page does not link to kcvvelewijt.be.
- K.V. Bonheiden (club 1636) has its website recorded as the literal string `http://null`, which the
  page renders as a `Bezoek website` link.

### Trap: "club-API" is not a technical API

In Belgian football **"club-API" means _Aanspreekpersoon Integriteit_** (integrity officer).
`voetbalvlaanderen.be/faq-club-api` is 19 FAQs about that role — including _"Moet ik dit bekend maken op
mijn clubwebsite?"_, a federation-mandated content obligation every Belgian club site carries.

**There is no official public RBFA data API.** The GraphQL endpoint above is undocumented. The only
public alternative, `voetbalinbelgie.be/en/api/`, is hand-maintained by volunteer reporters.

## 2. Twizzit — administration, and a website product being quietly retired

Read: `twizzit.com/v2/site/functionalities`, `twizzit.com/v2/site/pricing` → `twizzit.com/nl-be/pricing.html`,
`app.twizzit.com/v2/site/category/product`.

**Modules, verbatim Dutch.** _Administratie:_ `CRM en ledenbeheer` · `Groepen` · `Agenda` · `Taken en
vrijwilligerswerking` · `Ticketing en toegangscontrole` · `Partner- en sponsorbeheer` · `Familiebeheer`
· `Resourcebeheer` · `Media` · `Reservaties` · `Contracten` · `Evaluaties` · `Mutualiteitsattesten` ·
`Lidkaarten` · `Competitiebeheer` · `Imports, exports en statistieken` · `Export Sport Vlaanderen`.
_Communicatie:_ `Aanwezigheden` · `Inschrijvingen en online formulieren` · `Communicatie app` · `Chat en
e-mail` · `Nieuwsbrieven` · `Enquêtes` · `Polls, doodles en lijsten`. _Financiën:_ `Online betalingen` ·
`Webshop` · `Facturatie` · `Vergoedingen`.

**Pricing** (excl. VAT, 3-year contract; 1-year +10%): SMASH €3.75/lid/jaar · HATTRICK €4.75 · HOMERUN
€5.50 · min. 100 leden · one-off `Begeleid opstarttraject` €195 · online payments €49 setup + €0.30 +
0.75%/transaction.

**Two findings that matter most:**

1. **The plan comparison table contains no website row at all.** The 2026 nav lists Ledenbeheer, App,
   Facturatie en betalingen, Planning en agenda, Webshop omgeving, Inschrijvingen en formulieren,
   Ticketing, Reserveringen, Vrijwilligerswerking, Lidkaarten, Attesten, Enquêtes — no website. The
   builder still exists but is legacy.
2. **`Competitie` is footnoted:** _"De Competitie functionaliteit is enkel beschikbaar voor
   partner-federaties."_ The KBVB is not one. **A Belgian football club on Twizzit gets no fixtures, no
   results, no standings.**

### Real Twizzit club sites

**Koninklijke OLVAC (Edegem)** — `olvac.be`, served from
`app.twizzit.com/website/websitepreview/7300/…`. Nav in three groups: `Wie we zijn` (Onze waarden,
missie en visie · Afspraken · Raad van Bestuur · Aanspreekpersonen Integriteit · Maak kennis met … ·
Historiek · In Memoriam · Clubkleding) / `Wat we doen` (Meisjesvoetbal · OLVAC Referee Academy ·
Trainingen · **Uitslagen & Ranking**) / `Wie we zoeken` (six volunteer vacancies).

**No news feed. No fixtures. No squads.** The `Uitslagen & Ranking` menu item is
`<a href="https://www.voetbalvlaanderen.be/club/8303/ploegen" target="_blank">` — **it hands the visitor
off to the federation site in a new tab.** Their Afspraken page tells members: _"Voor de speelkalender:
download de RBFA-app."_ Stack: Bootstrap 3, jQuery, FontAwesome 4.6.

**SK Peulis** — `skpeulis.be`, footer `© website powered by Twizzit.com`. Nav: `Home` · `News` ·
`Evenementen` · `Seniors` · `Jeugd` (U15…U7 · Voetbalspeeltuin) · `Onze club` (`Lidgelden` · `Contact` ·
`Kalender` · `Foto's` · `Twizzit` · `Webshop` · `Contactformulier`). The `OVER ONZE CLUB` text is
copy-pasted from Wikipedia. Registration and webshop both link out. Again: **no results, no standings,
no squads.**

**ICS:** Twizzit has iCal export, but only for logged-in members via _Mijn Twizzit → planning →
exporteren naar agenda_. **No public per-team feed.**

## 3. ProSoccerData — no public product at all

> **As read on 2026-10-21.** Scope: psd.io now markets a "PSD Clubsite" (teams, schedules and results flow to a public club site). Only one vendor page was found and no live example, so the passage below is the original reading and is not revised.

Read: `psd.io`, `psd.io/football/grassroots`, `prosoccerdata.com/grassroots/en/start`,
`sv-zaffelare.be/prosoccerdata/` (a real Belgian club's PSD explainer).

Modules: Activity Planning, Communication, Member Administration, Financial (lidgeld tracking, coach
payouts), Intradesk, Clothing, Scouting, Medical, Video analysis, Evaluations.

**PSD ships no club website, no public club page, no fan portal, no parent-facing public surface.**
Every club instance is a login-gated subdomain. `psd.io/pricing` is a 404; no pricing is published.

**Implication for KCVV:** syncing PSD data into a public site is not a feature PSD competes on — it is
something PSD does not do. **Nobody else on PSD has a public surface for that data.**

## 4. VoetbalAssist — the maximalist incumbent

`voetbalassist.nl/clubwebsite/` 403s to WebFetch; retrieved with curl + browser UA. Also read
`voetbalassist.nl/kosten/` and `voetbalassist.be`.

Claims **1,202 clubs**, _"1/3 van alle voetbalclubs in Nederland en België."_

**All 37 modules, verbatim:** `Nieuwsmodule` · `Tekstmodule` · `Rechten` · `Statistieken` ·
`OnzeClubwinkel` · `Vrijwilligersmodule` · `Vraag & Aanbod` · `Polls` · `Mediagallery` · `Webshop` ·
`Pupil van de week` · `Crowdfunding` · `FAQ` · `Agenda` · `Digitale formulieren` · `Wie-is-wie` ·
`Forum` · `Vacaturebank` · `Bestandsbeheer` · `Kleedkamerindeling planner` · `Veldindeling planner` ·
`Toernooi beheer` · `Oefenwedstrijden beheer` · `Notificatie centrum afgelast / herkeuring` ·
`Nieuwsbrief` · `Opstelling` · `Social media` · `Liveblog (ClubApp voor nodig)` · `Live tussenstanden` ·
`Wedstrijddetails` · `Topscorers` · `Wedstrijdstatistieken en historie` · `Spelerscarriere` · `Team
informatie` · `Wedstrijdverslagen` · `Verjaardagen` · `Voorbeschouwing`

Plus product lines: `ClubWebsite`, `VA ClubApp`, `ClubTV` (KantineTV/KleedkamerTV/BestuurskamerTV/BarTV),
`VeldTV` (livestream), `Spelervolgsysteem`, `Contributiemodule`.

In their words: _"Elke speler bouwt een eigen profiel op … vanaf de jeugd tot senioren een carrière"_ ·
_"Voor elke wedstrijd een automatisch gegenereerde voorbeschouwing met historische resultaten"_ · _"Een
wedstrijdverslag bestaat uit 3 elementen: een voorbeschouwing (voor), een liveblog (tijdens) en
wedstrijddetails (na)"_ · _"Bijna 100% dekking van alle tussenstanden op de Nederlandse velden"_ ·
AVG-proof birthdays without birth year.

**Pricing** (`/kosten/`): €100 one-off setup · **€2 per clublid per jaar** · minimum €495/yr, maximum
€2,000/yr · Dataservice (official KNVB-approved feed) €60/yr · app one-off €150 · extra support user
€95/yr. Includes hosting, email, domain, backups, anti-DDoS.

> Reconciles a discrepancy: the companion vendor file records VoetbalAssist pricing as gated behind a
> demo request. Both are correct — the price **is** published, just not where the marketing page points.

**Belgium differs:** the `.be` site swaps the KNVB block for `Licentie KBVB betreffende datagebruik` and
drops Sportlink member sync. Belgian clubs get programma, uitslagen & standen, realtime afgelastingen,
kleedkamer-/veldindeling, but no federation member database. Belgian references named: SK Rapid Leest,
FC Alberta Schilde.

**Blocked:** no live VoetbalAssist club site could be read — `fcalbertaschilde.be`, `vvsliedrecht.nl`,
`hsc21.nl` all **403** to curl and WebFetch; `sc-everstein.nl` and `skrapidleest.be` do not resolve;
archive.org returned 429.

## 5. Kicksite — the Belgian football-specific incumbent

The platform most directly comparable to what KCVV is building, and more capable than expected. Read:
`kicksite.be`, `/oplossing`, `/functies.php`, `/tarieven.php`.

**Six headline modules:** `Nieuwe clubwebsite` · `Sportieve module` · `Centraal ledenbeheer` ·
`Koppeling met federatie` · `Online bestellingen` · `Kantine kassa`

**Function list, verbatim:** `Evaluaties` · `Vergaderingen` · `Wedstrijden` (selecties online of op PDF,
verkiezing man van de match, wedstrijdstatistieken, wedstrijdverslagen, online kalender) · `Trainingen` ·
`Nieuwsberichten` · `Sponsors` (logos on website, on kantine TV screens, **on wedstrijdbladen**;
automatic sponsor invoicing; sponsor packages sold online) · `Pagina's` · `Communicatie` · `Configuratie`
· `Documenten` · `Online bestellingen` · `Teams` (per-team page with begeleiders, spelers, wedstrijden,
trainingen, doelstellingen, **gouden-schoen-verkiezing**) · `Events` · `Ledenbeheer` · `Helpers` ·
`Financieel`

**`Helpers` is the standout:** _"vrijwilligers zelf laten registreren via de website voor kantineshiften,
events of algemene taken. Per shift kan u de helper belonen met digitale punten. Aan deze digitale punten
kan u als club zelf beloningen hangen."_

**Pricing:** `Basismodule` from **€30/month** (website, 1000 accounts, ledenbeheer + helperslijsten,
sponsorwerving, events + inschrijvingen, nieuws, teams, mails, mobile app) · `Sportief beheer` **€40/mo**
· `Kassa kantine` **€50/mo** (jetons, cashless cards, "Tournée general met online jetons") · `Online
verkopen` fixed or revenue-share · excl. VAT, 3-season contract · payment processing 1.20%.

### Real Kicksite sites — and the sameness problem

Read in full: `ksvbornem.be`, `eendrachtbuggenhout.com`, `ksksintamands.be`, `fcoppuurs.be`.

**All four share a byte-identical nav skeleton:** `Home` · `CLUB` (`Clubinfo` · `Hoe lid worden?` ·
`Wedstrijdabonnementen` · `Organigram` · `Klassementen` · `Club API`) · `Seniors` · `Kalender` ·
`Jeugdinfo` · `Nieuws` · `Events` · `Helperslijst` · `Business` · `Extra`. Homepage block is literally
labelled **`Matchcenter`**. News items carry a **`909 keer gelezen`** read counter.

**What works well:**

- `Klassementen` renders a real standings table: `Team | Punten | # Wedstrijden | W | G | V | D+ | D- | D+/-`
- Team detail tabs `Teaminfo | Technische staff | Spelers | Kalender | Klassement`, with named staff and
  roles and full squad lists (names only — no numbers, positions, photos or stats)
- **Working per-team ICS feed:** `ksvbornem.be/kalenders/icskalenders.php?tId=888` returns
  `text/calendar`, `PRODID:-//Kicksite//Kalender 1.0//NL`, labelled `Abonneer op de kalender van 1ste
ploeg`. **Defect: every VEVENT has `DTSTART == DTEND`, so all matches are zero-duration.**
- `Inschrijven` sells real lidgeld packages (`Lidgeld Jeugd €150`, `Lidgeld Golden Boot Academy €500`)
  with birth-year eligibility, family discount, UITPAS kansentarief, registering the player with Voetbal
  Vlaanderen with SMS confirmation
- `Helperslijst` has _"Hoeveel punten heb ik al?"_ / `MIJN PUNTEN OPVRAGEN`
- Supporters get **push notifications on goals** via the Kicksite App

**Where the default rots — two verifiable copy-paste leaks on KSV Bornem's live site:**

- `/pages/inschrijven.php` instructs visitors to email **`info@eendrachtbuggenhout.com`** — a _different_
  Kicksite club
- `/pages/helperslijst.php` names a volunteer coordinator (name redacted — a private individual, and
  the leak is evidenced without it) at **`vrijwilligers@fcnoordwind.nl`** — a Dutch address on a
  Belgian club, referencing the Dutch "VOG"

Kicksite's own `functies.php` emits a live PHP notice: `Warning : Undefined variable $paginaTitel …`.

## 6. Platform census — clubs within 12 km of Elewijt

Fingerprinted via the RBFA club finder, then fetched.

| Club                                                                                                                     | Platform                                                    |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `skpeulis.be`, `olvac.be`                                                                                                | Twizzit                                                     |
| `sklaar.be`, `tubantiaborgerhout.be`                                                                                     | **Wix**                                                     |
| `fchofstade.be` (theme `Luyten.Website`), `vcr.be` (WP 7.0.4), `zennester.be` (WPBakery), `racingmechelen.be` (WP 6.9.7) | **WordPress**                                               |
| `kwbvoetbalhombeek.be`                                                                                                   | One.com Web Editor                                          |
| `sportingkampenhout.be`                                                                                                  | Bespoke ASP.NET/Plesk, jQuery + Bootstrap 3 + DataTables    |
| `fczemst.be`                                                                                                             | Agency build by DMS Design, webshop on `webshop-fczemst.be` |
| `lionsfc.be`                                                                                                             | `base44.app` (AI app builder)                               |
| `goka.be`                                                                                                                | Parked domain for sale on Nameshift                         |
| `kcvvelewijt.be` (current live)                                                                                          | Gatsby 5.16.0                                               |

**The Wix failure mode, concretely:**

- **SK Laar** — the entire nav is `Home · Ploegen · Meer info · Instagram · Facebook · Link naar
webshop`. A homepage heading reads: _"Het laatste nieuws over evenementen en wedstrijden kan je
  terugvinden op onze Instagram en Facebook pagina."_ The website exists to point at social media.
- **Tubantia Borgerhout** — nicer, with a real voice (_"De sympathiekste club van 't Stad"_, `Est. 1915`).
  But its hero score block — `1 - 1`, `Zondag 08/03`, `3de Prov. Antwerpen B` — is **Wix rich text,
  hand-typed**. On 13 August 2026 the site advertises a result from March. That is the whole argument
  against builder platforms in one screenshot.

**WordPress clubs** get whatever the agency built. `zennester.be` has real depth (`Handleiding Tapbeurt`,
`Scheidsrechter worden`, `Vervoer van kinderen`, `Panathlon`, `Opleidingsplan`) but only two homepage
headings. `racingmechelen.be` is the most complete. **None of them syncs results automatically.**

## 7. Facebook-as-website

Facebook blocks both curl (HTTP 400) and WebFetch, so post content could not be read — stated rather than
guessed. Clubs identified by cross-referencing the RBFA `website` field against DNS.

**Of 40 clubs sampled within 12 km of Elewijt, 27 have no website recorded with the federation.**
Verified Facebook-only cases: **F.C. Weitse Gans** (Weerde, RBFA 9147; `fcweitsegans.be` does not
resolve), **V.K. Berg-Op** (Kampenhout, RBFA 6075, 3e Provinciale B; `vkbergop.be` does not resolve),
**J.K. GOKA** (Hever, RBFA 6569; `goka.be` parked for sale).

**What Facebook does well:** zero cost, zero maintenance, native push into a feed people already read,
effortless phone-side photo/video from the touchline, comments and reactions as a real community layer,
Events with RSVP.

**What it costs them:** no fixtures, results, standings, squad, lidgeld info, registration or findable
sponsor page; no search-engine presence (Google surfaces `voetbalinbelgie.be` and `voetbalvlaanderen.be`
above the club itself); no archive — last season's post is effectively gone; no ICS; and no control if
the page is lost or the admin leaves. **For these clubs the federation page is the de facto club
website, and they control not one pixel of it.**

## Table stakes vs. rare

### Table stakes — having these differentiates nothing

| Feature                                                     | Who already gives it away                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Fixtures, results, standings                                | Free on `voetbalvlaanderen.be`; automatic in Kicksite + VoetbalAssist |
| Squad lists with staff roles                                | Free on the federation team page                                      |
| Appearances + goals per player                              | Free on the federation team page                                      |
| Referee assignments per match                               | Free (federation `officials` field)                                   |
| Cards/suspensions overview                                  | Free (`Kaarten` tab)                                                  |
| Pitch/venue info, route calculation, defibrillator location | Free (`Terreinen` tab)                                                |
| Kit colours, stamnummer, VAT, board contacts                | Free (`Clubinfo`)                                                     |
| News module with roles/permissions                          | Every paid platform                                                   |
| Photo galleries                                             | Every paid platform                                                   |
| Sponsor logo wall                                           | Every paid platform                                                   |
| Online inschrijving + lidgeld payment                       | Twizzit, Kicksite, VoetbalAssist                                      |
| Webshop / kit ordering                                      | Twizzit, Kicksite, VoetbalAssist, plus clubworld.shop, Trooper, JAKO  |
| Member administration + invoicing                           | Twizzit, Kicksite, VoetbalAssist                                      |
| Volunteer/task scheduling                                   | Twizzit, Kicksite `Helpers`, VoetbalAssist                            |
| Kantine shifts                                              | Kicksite `Helpers` + `Kantine kassa`, VoetbalAssist                   |
| Event ticketing                                             | Twizzit, Kicksite, VoetbalAssist                                      |
| Mobile app with push                                        | Twizzit, Kicksite, VA ClubApp, RBFA app                               |
| Match reports                                               | Kicksite, VoetbalAssist                                               |
| Documents, organigram, club rules, API/integrity page       | Every Belgian club site read (federation-mandated)                    |

### Rare — genuinely distinguishing

| Feature                                                  | Who has it                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Public per-team ICS subscription**                     | Only **Kicksite** — and it ships zero-duration events. Twizzit's is login-only. Federation: none. |
| **Cross-season player career profile**                   | Only VoetbalAssist (`Spelerscarriere`)                                                            |
| **Auto-generated match preview from history/form**       | Only VoetbalAssist (`Voorbeschouwing`)                                                            |
| **Live blog during the match**                           | Only VoetbalAssist                                                                                |
| **Goal push notifications to supporters**                | Only Kicksite                                                                                     |
| **Volunteer points + rewards economy**                   | Only Kicksite                                                                                     |
| **Cashless kantine jetons / "Tournée general"**          | Only Kicksite                                                                                     |
| **Kleedkamer- & veldindeling published to web/app/TV**   | Only VoetbalAssist                                                                                |
| **Kantine narrowcasting (ClubTV) + livestream (VeldTV)** | Only VoetbalAssist                                                                                |
| **Crowdfunding with a visible goal bar**                 | Only VoetbalAssist                                                                                |
| **Man-van-de-match / gouden schoen voting**              | Only Kicksite                                                                                     |
| **Head-to-head history between opponents over years**    | Only VoetbalAssist                                                                                |
| **Genuine editorial voice / design identity**            | Essentially nobody                                                                                |

## Gaps — what NO platform provides

1. **A club-controlled public calendar feed people actually subscribe to.** One platform out of six has
   ICS, and it emits broken zero-length events. The federation — the authoritative source — has none.
   Every club tells its members "download de RBFA-app" because the alternative is retyping fixtures.
2. **Player photography and identity.** The RBFA `photo` field is an empty string for all 27 KCVV
   players. Kicksite squads are plaintext name lists. **Nobody renders a player as a person.**
3. **Design.** There is no platform on which two clubs look different. Four Kicksite clubs share a
   byte-identical nav; the Twizzit shell is decade-old Bootstrap 3; Wix clubs default to a signpost
   pointing at Instagram. The only Belgian clubs with a visual identity paid an agency or built bespoke.
4. **Content integrity at the template level.** A live Belgian club site currently tells visitors to
   email a _different_ club, and publishes a volunteer policy naming a fictional Dutch coordinator. The
   default is not just plain — it is **wrong**, and nobody notices.
5. **Search and archive.** No platform read offers site search. Nothing lets you find last season's
   report about a specific player, or a fixture from three years ago.
6. **Performance and modern web craft.** jQuery 2.2.2 + Bootstrap 3 + FontAwesome 4.6, WPBakery, Wix
   runtime. No platform competes on speed, Core Web Vitals, or accessibility.
7. **Structured data / SEO.** No platform ships JSON-LD for SportsTeam, SportsEvent, or match results.
8. **A public bridge from PSD.** KCVV already syncs PSD. PSD has no public surface at all, and nobody
   else on PSD exposes that data publicly. **Uncontested ground.** _(As read on 2026-10-21; scope note: psd.io now markets a "PSD Clubsite", see section 3.)_
9. **Editorial storytelling.** OLVAC's `In Memoriam` and `Maak kennis met …` pages are the best writing
   found on any Belgian club site — and Twizzit renders them as undifferentiated body text in a
   Bootstrap column. The platforms have no concept of a feature article.

## Confirmed unreachable

All live VoetbalAssist club sites (403 / DNS failure / archive.org 429), Facebook page content (HTTP
400), and `vlaamsesportfederatie.be` (Cloudflare 403).
