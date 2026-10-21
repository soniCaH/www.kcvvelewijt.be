# KCVV Elewijt

The football club KCVV Elewijt: its teams, players, staff, matches and the content it publishes. English terms are used in code; the Dutch word in _italics_ is what a visitor reads.

Value lists, code names, rules and history for each term live in [`docs/domain-reference.md`](docs/domain-reference.md).

## Language

### Matches

**Match**:
A single football game between two sides. _Wedstrijd_.
_Avoid_: game, fixture

**Match Status**:
The lifecycle state a match is in. A postponed match may still be rescheduled; a cancelled match will not be played. [Values](docs/domain-reference.md#match-status).

**Match Side**:
One of the two participants in a match, home or away; either a KCVV team or an opponent. An opponent exists only inside a match, never as an entity of its own.

**Pitch-Reservation Placeholder**:
A match where both sides are the same club: the association's way to say a team has something on the calendar that day, with the details not settled yet.
_Avoid_: self-match, "KCVV vs KCVV", placeholder (on its own; see **Off-Season Notice**)

**Reduced Row**:
The way a match row or page reads when there is no confirmed two-sided match to show: one crest, a subject line, the real time, no score, no link.

**Lineup**:
The players picked for one match. _Opstelling_.
_Avoid_: squad (that is the season roster)

**Lineup Status**:
A player's part in one match lineup. [Values](docs/domain-reference.md#lineup-status).

**Card**:
A disciplinary card shown to a player in a match. [Values](docs/domain-reference.md#card-type).

**Competition**:
The kind of tournament a match belongs to. [Values](docs/domain-reference.md#competition).
_Avoid_: reeks (that is the division a team plays in)

**Reeks**:
The specific division a team is placed in for a competition, e.g. `3e Nationale VV A`.
_Avoid_: competition (that is the kind of tournament)

**Competition Phase**:
One half of a youth season, split by the winter break. [Names](docs/domain-reference.md#competition-phase).
_Avoid_: return round

**Season**:
The football year a match or team belongs to, written `’25/’26`. _Seizoen_.

### Teams

**Team**:
A KCVV team registered with the club and usually with the football federation. _Ploeg_.

**Team Display Name**:
What a team is called wherever a person reads it. Distinct from the team's registered name in PSD.
_Avoid_: age group (as a name)

**Squad**:
The players registered to a team for the current season. _Selectie_ / _Kern_.
_Avoid_: lineup (that is one match)

**Squad Label**:
The short label that says which KCVV team a match belongs to, e.g. "A-Ploeg" or "U15 A".

**Age Group**:
The competition band a team plays in, e.g. `A` for seniors or `U17` for youth. It says which competition a team plays in, never which team it is.

**Youth Division**:
One of the three age bands the club groups its youth teams in. _Afdeling_. [Bands](docs/domain-reference.md#youth-division-afdeling).
_Avoid_: scholieren, duiveltjes

### People

**Player**:
An athlete registered with the club. _Speler_.

**Position**:
Where a player plays on the field. [Values](docs/domain-reference.md#position).
_Avoid_: role (that is staff), forward (use attacker)

**Staff Member**:
A non-playing member of the club: coach, board member, admin. _Staflid_.

**Role**:
What a staff member does, e.g. _hoofdtrainer_ or _voorzitter_.
_Avoid_: position (that is players only)

**Department**:
The board a staff member belongs to. [Values](docs/domain-reference.md#department).

**Organigram**:
Who does the work day to day: the club's boxes and who holds them. The boards on `/club/bestuur` and `/club/jeugdbestuur` are the board on paper, a separate truth.

**Box**:
One position in the organigram, such as _Secretaris_ or _Kantinedienst_, held by zero, one or several staff members.

**Pillar**:
What a box is for, which decides where it is listed in the clubboek. _Pijler_. [Values](docs/domain-reference.md#pillar).

**Chapter**:
A section of the clubboek that shows one or more pillars. [Values](docs/domain-reference.md#pillar).
_Avoid_: pillar (that is the stored value)

**Key Figure**:
One of the boxes shown as a card at the top of the clubboek, such as _Voorzitter_ or _TVJO_.

**Monogram**:
The initials a round avatar shows when a person has no photo.

### Content

**Article**:
A news article on the website. _Artikel_ / _Nieuwsbericht_.

**Call-to-Action**:
The optional closing band an editor adds to an article: a question, a short lead and one button. _Oproep onderaan_.

**Event**:
A club event or announcement. _Evenement_.

**Sponsor**:
A partner of the club.

**Sponsor Package**:
What a sponsor bought; a name, not a rank. [Values](docs/domain-reference.md#sponsor).

**Page**:
A plain content page written in the Studio, shown under `/club/`. _Pagina_.

**Banner**:
A promotional image in one of the homepage's fixed slots.

**Off-Season Notice**:
What an editor writes to fill the homepage first-team band when there are no matches. _Tussenseizoen-bericht_.
_Avoid_: placeholder (that is a Pitch-Reservation Placeholder)

**Held-Open Frame**:
The empty frame that keeps a slot's shape when data from the provider or system is missing, so the gap reads as known and not as broken.

**Draft**:
The half-filled membership form a visitor leaves on `/club/word-lid`.

**Responsibility**:
A help topic on `/hulp` that sends a visitor to the right contact person. _Verantwoordelijkheid_.

**Audience**:
Who a responsibility is for. [Values](docs/domain-reference.md#audience).

**Category**:
The topic of a responsibility. [Values](docs/domain-reference.md#category).

### Share Tool

**Share Tool**:
The unlisted page at `/share` where the club makes Instagram stories and squares of a match moment, an article or an event.

**Share Look**:
One of the visual styles a story is drawn in. [Values](docs/domain-reference.md#share-look).

**Share Moment**:
The moment of a match a story tells, such as kickoff, a goal or a card.

**Movable Block**:
A part of a look the editor can drag on the preview.

**Omslag**:
How an article or event cover fills a look's photo slot. [Values](docs/domain-reference.md#omslag).

**Story Session**:
The story in progress, which survives a trip to Instagram and back.

### Statistics & Ranking

**Player Stats**:
A player's season numbers for one team. [Fields](docs/domain-reference.md#player-stats).

**Team Stats**:
A team's season numbers. [Fields](docs/domain-reference.md#team-stats).

**Ranking**:
The league standings table of one reeks. _Klassement_.

**Ranking Entry**:
One team's row in a ranking. [Fields](docs/domain-reference.md#ranking-entry).

**Competitive Block**:
The ranking and match list on a team page, shown or hidden together as one unit.

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
The nightly job that copies PSD-owned player, team and staff data into Sanity.

**Permanent Read Failure**:
A failed read that will fail the same way on every retry.

**Transient Read Failure**:
A failed read that the next try will probably fix.

### Navigation

**Club**:
A group of pages about the club's organisation under `/club`; a navigation grouping, not a domain entity.

**Youth**:
The navigation section for youth teams, at `/jeugd`. _Jeugd_.
