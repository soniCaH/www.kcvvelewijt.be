# KCVV Elewijt

The football club KCVV Elewijt: its teams, players, staff, matches and the content it publishes. English terms are used in code; the Dutch word in _italics_ is what a visitor reads.

Code names, value lists, rules and history for each term live in [`docs/domain-reference.md`](docs/domain-reference.md).

## Language

### Matches

**Match**:
A single football game between two sides. _Wedstrijd_.
_Avoid_: game, fixture

**Match Status**:
Where a match is in its life: scheduled (_Gepland_), finished (_Afgelopen_), forfeited (_Forfait_), postponed (_Uitgesteld_) or stopped (_Gestaakt_).

**Match Side**:
One of the two participants in a match, home or away; either a KCVV team or an opponent. An opponent exists only inside a match, never as an entity of its own.

**Pitch-Reservation Placeholder**:
A match where both sides are the same club: the association's way to say a team has something on the calendar that day, with the details not settled yet.
_Avoid_: self-match, "KCVV vs KCVV", placeholder (on its own; see **Off-Season Notice**)

**Reduced Row**:
The way a match row or page reads when there is no confirmed two-sided match to show: one crest, a subject line, the real time, no score, no link. A Pitch-Reservation Placeholder and a not-yet-played tournament fixture both read this way, until a score appears.

**Lineup**:
The players picked for one match, each with a lineup status. _Opstelling_.
_Avoid_: squad (that is the season roster)

**Lineup Status**:
A player's part in one match: starter (_Basisspeler_), substitute (_Wisselspeler_), substituted (_Gewisseld_) or subbed in (_Ingevallen_).

**Card**:
A disciplinary card shown in a match: yellow (_Geel_), red (_Rood_) or second yellow (_Tweede geel_).

**Competition**:
The kind of tournament a match belongs to: league (_Competitie_), cup (_Beker_), friendly (_Vriendschappelijk_) or tournament (_Tornooi_).
_Avoid_: reeks (that is the division a team plays in)

**Reeks**:
The specific division a team is placed in for a competition, e.g. `3e Nationale VV A`. The federation and the club each have a name for it; the club's name wins wherever a person reads it.
_Avoid_: competition (that is the kind of tournament)

**Competition Phase**:
One half of a youth season, split by the winter break: _Najaar_ or _Voorjaar_. The second half is often a different reeks with different opponents.
_Avoid_: return round

**Season**:
The football year, running July to June, written `’25/’26`. _Seizoen_. Always worked out from a date; never something a document stores.

### Teams

**Team**:
A KCVV team registered with the club and usually with the football federation. _Ploeg_.

**Team Display Name**:
What a team is called wherever a person reads it: page heading, browser tab, share card, listing row. Distinct from the team's registered name in PSD.
_Avoid_: age group (as a name)

**Squad**:
The players registered to a team for the current season. _Selectie_ / _Kern_.
_Avoid_: lineup (that is one match)

**Squad Label**:
The short label that says which KCVV team a match belongs to, e.g. "A-Ploeg" or "U15 A", shown when matches of several teams are listed together.

**Age Group**:
The competition band a team plays in: `A` for seniors (_eerste elftal_), `U{N}` for youth (_jeugd_). It says which competition a team plays in, never which team it is.

**Youth Division**:
The three age bands the club groups its youth teams in: _Onderbouw_ (U6–U9), _Middenbouw_ (U10–U13) and _Bovenbouw_ (U14–U21). _Afdeling_.
_Avoid_: scholieren, duiveltjes

### People

**Player**:
An athlete registered with the club. _Speler_. A player is on a squad or not; there is no injured, suspended or transferred status.

**Position**:
Where a player plays: _Keeper_, _Verdediger_, _Middenvelder_, _Aanvaller_, or _Speler_ when no finer position exists yet (U6–U9). A player with no known position has none; it is never filled with a default.
_Avoid_: role (that is staff), forward (use attacker)

**Staff Member**:
A non-playing member of the club: coach, board member, admin. _Staflid_.

**Role**:
What a staff member does, e.g. _hoofdtrainer_ or _voorzitter_.
_Avoid_: position (that is players only)

**Department**:
The board a staff member belongs to: _Hoofdbestuur_, _Jeugdbestuur_ or _Algemeen_ when neither fits.

**Organigram**:
Who does the work day to day: the club's boxes and who holds them. The boards on `/club/bestuur` and `/club/jeugdbestuur` are the board on paper, a separate truth; the two never sync.

**Box**:
One position in the organigram, such as _Secretaris_ or _Kantinedienst_, held by zero, one or several staff members.

**Pillar**:
What a box is for, which decides where it is listed in the clubboek: _bestuur_, _sportief_, _jeugd-organisatie_, _jeugd-opleiding_, _club_ or _integriteit_. _Pijler_.

**Chapter**:
A section of the clubboek that shows one or more pillars: _Sportief_, _Jeugd_, _Club & werking_ or _Integriteit_.
_Avoid_: pillar (that is the stored value)

**Key Figure**:
One of the eight boxes shown as a card at the top of the clubboek, such as _Voorzitter_ or _TVJO_.

**Monogram**:
The initials a round avatar shows when a person has no photo.

### Content

**Article**:
A news article on the website. _Artikel_ / _Nieuwsbericht_.

**Call-to-Action**:
The optional closing band an editor adds to an article: a question, a short lead and one button. _Oproep onderaan_.

**Event**:
A club event or announcement, shown until it has passed. _Evenement_.

**Sponsor**:
A partner of the club, shown while it is active.

**Sponsor Package**:
What a sponsor bought: _Crossing_, _Training_, _Wit_, _Groen_, _Paneel_ or _Andere_. A name, not a rank.

**Page**:
A plain content page written in the Studio, shown under `/club/`. _Pagina_.

**Banner**:
A promotional image in one of the homepage's fixed slots.

**Off-Season Notice**:
What an editor writes to fill the homepage first-team band when there are no matches: a countdown to the new season, a short message and an image. _Tussenseizoen-bericht_.
_Avoid_: placeholder (that is a Pitch-Reservation Placeholder)

**Held-Open Frame**:
The empty frame that keeps a slot's shape when data from the provider or system is missing, so the gap reads as known and not as broken. An empty slot an editor did not fill hides instead.

**Draft**:
The half-filled membership form a visitor leaves on `/club/word-lid`, kept for that browser tab only.

**Responsibility**:
A help topic on `/hulp` that sends a visitor to the right contact person. _Verantwoordelijkheid_.

**Audience**:
Who a responsibility is for: _Speler_, _Ouder_, _Trainer_, _Supporter_, _Niet-lid_ or _Andere_.

**Category**:
The topic of a responsibility: _Medisch_, _Sportief_, _Administratief_, _Gedrag_, _Algemeen_ or _Commercieel_.

### Share Tool

**Share Tool**:
The unlisted page at `/share` where the club makes Instagram stories and squares of a match moment, an article or an event. It saves a picture; it publishes nothing.

**Share Look**:
One of the five styles a story is drawn in: _Kaart_, _Plakboek_, _Affiche_, _Ticket_ or _Wedstrijd_ (matches only).

**Share Moment**:
The moment of a match a story tells, such as kickoff, half-time, full-time, a goal or a card.

**Movable Block**:
A part of a look the editor can drag on the preview. It counts as moved once it is off its spot or sent behind.

**Omslag**:
How an article or event cover fills a look's photo slot: _Foto_, _Affiche wazig_ or _Reservefoto_.

**Story Session**:
The story in progress, kept in the browser so it survives a trip to Instagram and back, until the next day.

### Statistics & Ranking

**Player Stats**:
A player's season numbers for one team: matches, goals, assists, cards, minutes.

**Team Stats**:
A team's season numbers: results, goals for and against, clean sheets, top scorers.

**Ranking**:
The league standings table of one reeks. _Klassement_.

**Ranking Entry**:
One team's row in a ranking: position, matches, results, goals and points.

**Competitive Block**:
The ranking and match list on a team page, shown or hidden together as one unit. What it shows depends on the data, never on the age group or on last season.

### Systems

**BFF**:
The club's own API between the website and its data sources (Backend For Frontend).
_Avoid_: Footbalisto, Drupal API

**PSD**:
ProSoccerData, the outside provider that owns matches, rankings, statistics, players, teams and staff membership.
_Avoid_: Footbalisto

**Sanity**:
The content system that owns editorial content and the editorial details of players, teams and staff.

**PSD↔Sanity Sync**:
The nightly job that copies PSD-owned player, team and staff data into Sanity. It never writes an editorial field.

**Permanent Read Failure**:
A failed read that will fail the same way on every retry, so the page shows what it can.

**Transient Read Failure**:
A failed read that the next try will probably fix, so the last good page stays up.

### Navigation

**Club**:
A group of pages about the club's organisation under `/club`; a navigation grouping, not a domain entity.

**Youth**:
The navigation section for youth teams, at `/jeugd`. _Jeugd_.
