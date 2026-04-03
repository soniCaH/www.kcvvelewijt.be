# Staff Data Migration & Organigram Seeding

**Datum:** 2026-04-03
**Milestone:** 32 (staff-migration)

## 1. Probleemstelling

De staffgegevens van de club zijn verspreid over drie bronnen: 124 verouderde `staff-board-*` documenten uit de Drupal-migratie (sommige met foto's, zonder psdId), 59 PSD-gesynchroniseerde `staffMember-psd-*` documenten (met psdId, zonder foto's), en ~12 personen uit het Excel-rooster die helemaal niet in Sanity bestaan. Veel personen zijn gedupliceerd. Het organigram (verplaatst naar `organigramNode` in milestone/25) bevat nul nodes — de hiërarchie is nooit aangemaakt. De verantwoordelijkhedenvinder (#1207) bevat nul documenten. De Studio-deskstructuur (#1206) is kapot. En de PSD-sync kan stilletjes mensen archiveren die in het organigram staan maar niet aan een team gekoppeld zijn in PSD.

Zonder dit werk toont de organigram-pagina niets, is de verantwoordelijkhedenvinder leeg, en is staffbeheer in Studio onbruikbaar.

## 2. Scope

### Betrokken packages

| Package                   | Wijzigingen                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `packages/sanity-studio`  | **Nieuw package** — Document Action ("Koppel aan PSD"), gedeelde deskstructuur, preview-configuratie, validatiehelpers |
| `packages/sanity-schemas` | Preview-verbeteringen (organigramNode subtitle met ledennamen, responsibility subtitle met contactnaam)                |
| `apps/studio`             | Consumeert `@kcvv/sanity-studio`, vervangt lokale `structure.ts`                                                       |
| `apps/studio-staging`     | Idem                                                                                                                   |
| `apps/api`                | Reconciliatie-veiligheid: sla archivering over voor staff gerefereerd door organigramNode/responsibility               |
| Data (Sanity API)         | Dearchiveren, handmatige staffMembers aanmaken, organigramNodes seeden, bulk board→PSD migratie                        |

### Package-structuur `@kcvv/sanity-studio`

```text
packages/sanity-studio/src/
├── actions/
│   └── link-to-psd.ts           # "Koppel aan PSD" Document Action
├── structure/
│   ├── staff.ts                  # Staff deskstructuur (mappen, filters)
│   ├── organigram.ts             # Organigram deskstructuur (afdelingsgroepen)
│   └── responsibility.ts         # Verantwoordelijkheden deskstructuur (categoriegroepen)
├── validation/
│   └── organigram-members.ts     # Waarschuwing gearchiveerd lid op organigramNode
└── index.ts                      # Barrel exports
```

### Buiten scope

- Geen e-mail/telefoon-verrijking uit het Excel (privacy — handmatige invoer)
- Geen seeding van verantwoordelijkhedenvragen (dat is #1207, geblokkeerd door dit werk)
- Geen wijzigingen aan de web-frontend rendering (organigram-pagina en staffdetailpagina werken al)
- Geen PSD-sync logica-wijzigingen buiten de reconciliatie-veiligheid
- Geen player-document opschoning (alleen staffMember)
- Geen Sanity-schema veldtoevoegingen (organigramNode en staffMember schema's zijn compleet)
- `team-angels` wordt niet bijgewerkt (staat niet in het organigram)

## 3. Tracer bullet

Scaffold `packages/sanity-studio` met de "Koppel aan PSD" Document Action. Eén knop op een enkel `staffMember`-document (bv. een `staff-board-*` doc met een bekende PSD-match), die:

1. Een psdId accepteert via een invoerveld
2. Een nieuw `staffMember-psd-{psdId}` document aanmaakt met alle velden gekopieerd
3. Alle `references(oldId)` vindt en herlinkt naar het nieuwe document
4. Het oude document verwijdert

Test op staging met één echt board-document (bv. Tom Bautmans `staff-board-dcb0e9e6` → `staffMember-psd-252`). Dit bewijst: nieuw package werkt, actie rendert in Studio, transactielogica verwerkt referenties, foto migreert correct.

## 4. Fasen

### Fase 1 — Tracer bullet: `@kcvv/sanity-studio` + "Koppel aan PSD"-actie (#1210)

- Scaffold `packages/sanity-studio` (package.json, tsconfig, turbo.json entry)
- Bouw de "Koppel aan PSD" Document Action met Nederlandse labels
- Wire in beide `apps/studio` en `apps/studio-staging`
- Test op staging: migreer één `staff-board-*` doc naar zijn PSD-tegenhanger

### Fase 2 — Reconciliatie-veiligheidsnet (#1211)

- Update `apps/api` reconciliatie om archivering over te slaan voor staffMembers gerefereerd door `organigramNode` of `responsibility` documenten
- Voeg tests toe voor de nieuwe veiligheidscheck

### Fase 3 — Staff data opschoning (via Sanity API) (#1212)

- Dearchiveer ~10 onterecht gearchiveerde staffMembers
- Maak ~12 nieuwe `staffMember-manual-*` documenten voor ontbrekende personen
- Verwijder het Kevin Schutijser draft-duplicaat (`drafts.staffMember-psd-8576`)
- Bulk-migreer bekende `staff-board-*` → PSD matches (hergebruik Fase 1 logica)
- Alles op staging eerst, dan productie

#### Personen te dearchiveren

| Naam                | Sanity ID               | Reden                                |
| ------------------- | ----------------------- | ------------------------------------ |
| David Symkens       | `staffMember-psd-850`   | JC Middenbouw + U11 trainer          |
| Sebastien Decnoop   | `staffMember-psd-8948`  | JC Bovenbouw + U17 trainer           |
| Christophe Alaers   | `staffMember-psd-3050`  | T1 B-elftal                          |
| Erik Talboom        | `staffMember-psd-261`   | Hoofdbestuur Infra + meerdere teams  |
| Stefan De Wael      | `staffMember-psd-257`   | Kledij                               |
| Tim Moens           | `staffMember-psd-6588`  | PSD admin + Jeugdbestuur             |
| Niels De Wael       | `staffMember-psd-10748` | U10 trainer                          |
| Sven Cooreman       | `staffMember-psd-10929` | U21 trainer                          |
| Nick Lauwers        | `staffMember-psd-259`   | U16 trainer + afgevaardigde          |
| Robbie Lebrun       | `staffMember-psd-10747` | U15 trainer                          |
| Anthony Lagae       | `staffMember-psd-524`   | U14 trainer                          |
| Joeri Vanhove       | `staffMember-psd-519`   | Afgevaardigde                        |
| Koen Verest         | `staffMember-psd-7786`  | Afgevaardigde                        |
| Christophe Jessen   | `staffMember-psd-8939`  | Afgevaardigde                        |
| Tim Ooghe           | `staffMember-psd-6530`  | Afgevaardigde + Jeugdbestuur         |
| Mike Meuwis         | `staffMember-psd-11278` | Afgevaardigde + Jeugdbestuur         |
| Mats Uyttebroeck    | `staffMember-psd-10837` | U10 trainer                          |
| Elias Van Paesschen | `staffMember-psd-8690`  | U13 trainer                          |
| Lucas Goovaerts     | `staffMember-psd-2062`  | U13 trainer                          |
| Jeroen Vanhelden    | `staffMember-psd-7787`  | Afgevaardigde U21                    |
| Koen Muyldermans    | `staffMember-psd-1699`  | Afgevaardigde fanion P4              |
| Laurens Maes        | `staffMember-psd-9169`  | Afgevaardigde U9                     |
| Kristof Desmet      | `staffMember-psd-9255`  | U12 trainer (als "De Smet" in Excel) |
| Chris Maes          | `staffMember-psd-258`   | Afgevaardigde U17                    |
| Yannick Brabant     | `staffMember-psd-4244`  | U12 trainer                          |
| Jordy Benoot        | `staffMember-psd-8615`  | U16 trainer                          |

#### Personen nieuw aan te maken

| Naam                | ID-formaat                               | Reden                                              |
| ------------------- | ---------------------------------------- | -------------------------------------------------- |
| Rudy Bautmans       | `staffMember-manual-rudy-bautmans`       | Voorzitter                                         |
| Ilona Trouwkens     | `staffMember-manual-ilona-trouwkens`     | Penningmeester                                     |
| Matthias Knevels    | `staffMember-manual-matthias-knevels`    | Jeugdvoorzitter                                    |
| Werner Sanfrinnon   | `staffMember-manual-werner-sanfrinnon`   | Sponsoring                                         |
| Igor Michiels       | `staffMember-manual-igor-michiels`       | Keeperstrainer jeugd                               |
| Mike Vermoes        | `staffMember-manual-mike-vermoes`        | Keeperstrainer jeugd                               |
| Kim Bautmans        | `staffMember-manual-kim-bautmans`        | API (aanspreekpunt integriteit)                    |
| Dennis Thyssens     | `staffMember-manual-dennis-thyssens`     | Jeugdbestuur materiaal                             |
| Sven De Smedt       | `staffMember-manual-sven-de-smedt`       | Jeugdbestuur kantinedienst                         |
| Shauni Hellemans    | `staffMember-manual-shauni-hellemans`    | Jeugdbestuur GDPR                                  |
| Fred Degryse        | `staffMember-manual-fred-degryse`        | Trainer VST + U6                                   |
| Lena Van Marsenille | `staffMember-manual-lena-van-marsenille` | Afgevaardigde U10                                  |
| Paul Vanhamme       | `staffMember-manual-paul-vanhamme`       | Lid Hoofdbestuur                                   |
| Chris Nobels        | `staffMember-manual-chris-nobels`        | Kledij                                             |
| Jurgen Vergalle     | `staffMember-manual-jurgen-vergalle`     | Afgevaardigde + Jeugdbestuur (PSD-koppeling later) |
| Pieter De Keyser    | `staffMember-manual-pieter-de-keyser`    | Afgevaardigde U11 (PSD toont "Pieter Joanna")      |

**Opmerking:** Alle handmatig aangemaakte documenten kunnen later via de "Koppel aan PSD"-actie gekoppeld worden als hun psdId bekend wordt.

### Fase 4 — Organigram seeding (via Sanity API) (#1213)

Maak ~30 organigramNode documenten aan met volledige hiërarchie. Staging eerst, dan productie.

#### Hoofdbestuur (root, department: `hoofdbestuur`)

| Positie                    | sortOrder | Leden                            | parentNode |
| -------------------------- | --------- | -------------------------------- | ---------- |
| Voorzitter                 | 10        | Rudy Bautmans                    | — (root)   |
| Secretaris                 | 20        | Kevin Van Ransbeeck              | Voorzitter |
| Penningmeester             | 30        | Ilona Trouwkens                  | Voorzitter |
| Sportief Verantwoordelijke | 40        | Mark Talbut                      | Voorzitter |
| Sponsoring                 | 50        | Werner Sanfrinnon                | Voorzitter |
| Kledij                     | 60        | Stefan De Wael, Chris Nobels     | Voorzitter |
| Infrastructuur             | 70        | Stefan Robberechts, Erik Talboom | Voorzitter |
| Kantine & Evenementen      | 80        | Ilona Trouwkens                  | Voorzitter |
| Lid Hoofdbestuur           | 90        | Paul Vanhamme                    | Voorzitter |

#### Jeugdbestuur (department: `jeugdbestuur`)

| Positie                               | sortOrder | Leden                                                  | parentNode      |
| ------------------------------------- | --------- | ------------------------------------------------------ | --------------- |
| Jeugdvoorzitter                       | 10        | Matthias Knevels                                       | Voorzitter      |
| Jeugdsecretaris & Afgevaardigden      | 20        | Bram Van Zegbroeck                                     | Jeugdvoorzitter |
| PSD & Administratie                   | 30        | Tim Moens                                              | Jeugdvoorzitter |
| Interne Scheidsrechters               | 40        | Jurgen Vergalle                                        | Jeugdvoorzitter |
| Materiaal & Kantinedienst Wedstrijden | 50        | Dennis Thyssens                                        | Jeugdvoorzitter |
| Kantinedienst Trainingen              | 60        | Sven De Smedt                                          | Jeugdvoorzitter |
| GDPR & Materiaal                      | 70        | Shauni Hellemans                                       | Jeugdvoorzitter |
| Lid Jeugdbestuur                      | 80        | Erik Talboom, Kevin Schutijser, Tim Ooghe, Mike Meuwis | Jeugdvoorzitter |

#### Management Sportief (department: `hoofdbestuur`)

| Positie                     | sortOrder | Leden                       | parentNode                 |
| --------------------------- | --------- | --------------------------- | -------------------------- |
| Sportief Manager            | 10        | Mark Talbut                 | Sportief Verantwoordelijke |
| TVJO                        | 20        | Kevin Schutijser            | Sportief Manager           |
| ATVJO (vacant)              | 25        | —                           | TVJO                       |
| Jeugdcoördinator Onderbouw  | 30        | Kevin Schutijser            | TVJO                       |
| Jeugdcoördinator Middenbouw | 40        | David Symkens               | TVJO                       |
| Jeugdcoördinator Bovenbouw  | 50        | Sebastien Decnoop           | TVJO                       |
| Doorstroom (vacant)         | 55        | —                           | Sportief Manager           |
| T1 A-elftal                 | 60        | Dieter Van Dionant          | Sportief Manager           |
| T1 B-elftal                 | 70        | Christophe Alaers           | Sportief Manager           |
| Keeperstrainer Jeugd        | 80        | Igor Michiels, Mike Vermoes | TVJO                       |
| Keeperstrainer Fanion       | 90        | Tom Bautmans                | Sportief Manager           |

#### Ondersteunende Staff (department: `algemeen`)

| Positie                           | sortOrder | Leden               | parentNode       |
| --------------------------------- | --------- | ------------------- | ---------------- |
| ProSoccerData                     | 10        | Tim Moens           | TVJO             |
| Website & Communicatie            | 20        | Kevin Van Ransbeeck | TVJO             |
| API (Aanspreekpunt Integriteit)   | 30        | Kim Bautmans        | TVJO             |
| Hoofd Ethische Commissie (vacant) | 40        | —                   | API              |
| Lid Ethische Commissie            | 50        | Sam Lesage          | API              |
| Videoanalist (vacant)             | 60        | —                   | TVJO             |
| Scouting (vacant)                 | 70        | —                   | Sportief Manager |
| Revalidatietrainer (vacant)       | 80        | —                   | TVJO             |
| Kinesist (vacant)                 | 90        | —                   | TVJO             |
| Studentenbegeleiding (vacant)     | 100       | —                   | TVJO             |
| Spelersraad (vacant)              | 110       | —                   | TVJO             |
| Ouderraad (vacant)                | 120       | —                   | Jeugdvoorzitter  |

### Fase 5 — Studio deskstructuur + preview-verbeteringen (#1214)

#### Staff-weergaven in Studio

| Weergavenaam                        | Filter                                                                                            | Sortering     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | ------------- |
| 📋 Alle leden                       | `_type == "staffMember" && !archived`                                                             | lastName asc  |
| 🏛️ Organigram beheer → Hoofdbestuur | `_type == "organigramNode" && department == "hoofdbestuur"`                                       | sortOrder asc |
| 🏛️ Organigram beheer → Jeugdbestuur | `_type == "organigramNode" && department == "jeugdbestuur"`                                       | sortOrder asc |
| 🏛️ Organigram beheer → Algemeen     | `_type == "organigramNode" && department == "algemeen"`                                           | sortOrder asc |
| ⚠️ Vacante posities                 | `_type == "organigramNode" && active == true && count(members) == 0`                              | sortOrder asc |
| 🔗 Niet gekoppeld aan PSD           | `_type == "staffMember" && !defined(psdId) && !archived`                                          | lastName asc  |
| 📷 Geen foto                        | `_type == "staffMember" && !defined(photo) && !archived`                                          | lastName asc  |
| 📷 In organigram maar geen foto     | `_type == "staffMember" && !defined(photo) && _id in *[_type == "organigramNode"].members[]._ref` | lastName asc  |
| 🔄 PSD gesynchroniseerd             | `_type == "staffMember" && defined(psdId) && !archived`                                           | lastName asc  |

#### Verantwoordelijkheden-weergaven in Studio

| Weergavenaam                  | Filter                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 📋 Alle verantwoordelijkheden | `_type == "responsibility"`                                                                                                             |
| → Administratief              | `_type == "responsibility" && category == "administratief"`                                                                             |
| → Medisch                     | `_type == "responsibility" && category == "medisch"`                                                                                    |
| → Sportief                    | `_type == "responsibility" && category == "sportief"`                                                                                   |
| → Gedrag                      | `_type == "responsibility" && category == "gedrag"`                                                                                     |
| → Algemeen                    | `_type == "responsibility" && category == "algemeen"`                                                                                   |
| → Commercieel                 | `_type == "responsibility" && category == "commercieel"`                                                                                |
| ⚠️ Zonder contactpersoon      | `_type == "responsibility" && !defined(primaryContact.staffMember) && !defined(primaryContact.email) && !defined(primaryContact.phone)` |

#### Preview-verbeteringen

- **organigramNode**: subtitle toont ledennamen (bv. "Kevin Schutijser, David Symkens") of "Vacant" als `members` leeg is
- **responsibility**: subtitle toont contactnaam (staffMember naam of fallback role label)

#### Validatie

- **organigramNode.members[]**: waarschuwing als een gerefereerd staffMember `archived == true` is. Bericht: "Dit lid is gearchiveerd — controleer of deze positie nog actueel is"

#### Labels

Alle labels, filterbeschrijvingen, actieknoppen, validatieberichten en dialoogvensters in het Nederlands.

### Fase 6 — Board-document opschoning (#1215)

- Migreer resterende `staff-board-*` documenten met foto's en bekende PSD-match (via de actie of bulkscript — zelfde herlink-logica als Fase 1)
- Update `team-bestuur` en `team-jeugdbestuur` teamreferenties naar de juiste (PSD/manual) documenten
- Resterende niet-gerefereerde board-documenten archiveren of verwijderen
- Eindaudit: geen verweesde referenties

## 5. Acceptatiecriteria per fase

### Fase 1 — Tracer bullet (#1210)

- [ ] `packages/sanity-studio` bestaat als workspace package, geconsumeerd door beide studio's
- [ ] "Koppel aan PSD"-actie zichtbaar op staffMember-documenten zonder `psdId`, labels in het Nederlands
- [ ] Actiedialoog accepteert een psdId, toont bevestiging met oud/nieuw ID
- [ ] Actie maakt nieuw document aan, herlinkt alle `references(oldId)`, verwijdert oud document in één transactie
- [ ] Foto en alle redactionele velden behouden na migratie
- [ ] Geverifieerd op staging: Tom Bautmans `staff-board-dcb0e9e6` → `staffMember-psd-252`
- [ ] `pnpm --filter @kcvv/studio check-all` slaagt
- [ ] `pnpm --filter @kcvv/studio-staging check-all` slaagt

### Fase 2 — Reconciliatie-veiligheidsnet (#1211)

- [ ] Reconciliatie slaat staffMembers over die gerefereerd worden door actieve `organigramNode` of `responsibility` documenten
- [ ] Vitest tests dekken: orphan met organigram-ref → niet gearchiveerd; orphan zonder refs → gearchiveerd
- [ ] `pnpm --filter @kcvv/api check-all` slaagt

### Fase 3 — Staff data opschoning (#1212)

- [ ] Alle gearchiveerde staffMembers uit de tabel gedearchiveerd (staging + productie)
- [ ] Alle nieuwe `staffMember-manual-*` documenten aangemaakt (staging + productie)
- [ ] `drafts.staffMember-psd-8576` verwijderd
- [ ] Bekende `staff-board-*` → PSD bulk-migratie voltooid (foto's behouden)
- [ ] Geen dubbele staffMembers voor dezelfde persoon

### Fase 4 — Organigram seeding (#1213)

- [ ] ~30 organigramNode documenten aangemaakt met correcte hiërarchie (parentNode refs)
- [ ] Afdelingen toegewezen (hoofdbestuur / jeugdbestuur / algemeen)
- [ ] Leden gelinkt aan correcte staffMember documenten
- [ ] Vacante posities aangemaakt (actief, 0 leden)
- [ ] Organigram-pagina (`/club/organigram`) rendert de hiërarchie
- [ ] Staffdetailpagina's tonen "Posities in het organigram" sectie

### Fase 5 — Studio deskstructuur + previews (#1214)

- [ ] Alle deskstructuur-labels in het Nederlands
- [ ] Staff: 9 weergaven (Alle leden, 3× Organigram per afdeling, Vacante posities, Niet gekoppeld aan PSD, Geen foto, In organigram maar geen foto, PSD gesynchroniseerd)
- [ ] Verantwoordelijkheden: gegroepeerd per categorie + "Zonder contactpersoon" filter
- [ ] organigramNode preview toont ledennamen of "Vacant"
- [ ] responsibility preview toont contactnaam
- [ ] Gearchiveerd-lid validatiewaarschuwing op organigramNode.members[]
- [ ] Beide studio's gebruiken gedeelde structuur uit `@kcvv/sanity-studio`
- [ ] `pnpm --filter @kcvv/studio check-all` slaagt
- [ ] `pnpm --filter @kcvv/studio-staging check-all` slaagt

### Fase 6 — Board-document opschoning (#1215)

- [ ] Alle `staff-board-*` documenten met bekende PSD-match gemigreerd (foto + refs)
- [ ] `team-bestuur` en `team-jeugdbestuur` referenties bijgewerkt
- [ ] Resterende niet-gerefereerde board-documenten gearchiveerd of verwijderd
- [ ] Geen verweesde referenties in de dataset

## 6. Effect Schema / api-contract wijzigingen

Minimaal. Alleen Fase 2 raakt code:

- `apps/api/src/sync/psd-sanity-sync.ts` — reconciliatie-query krijgt een GROQ-subquery om te controleren op organigram/responsibility-referenties vóór archivering
- Geen api-contract wijzigingen
- Geen nieuwe schema's

## 7. Open vragen

Alle vragen opgelost tijdens brainstorming-sessie van 2026-04-03.

## 8. Ontdekte onbekenden (gevuld tijdens implementatie)

_(Leeg — wordt aangevuld tijdens de Ralph-loop)_

## Afhankelijkheden

```text
Fase 1: Tracer bullet (sanity-studio + actie)
  └→ Fase 2: Reconciliatie-veiligheid
  └→ Fase 3: Staff data opschoning (gebruikt Fase 1 herlink-logica)
       └→ Fase 4: Organigram seeding
            └→ #1207 (responsibility seeding) — geblokkeerd door Fase 4
       └→ Fase 6: Board-document opschoning (gebruikt Fase 1 herlink-logica)
            └→ Update team-bestuur / team-jeugdbestuur
  └→ Fase 5: Studio deskstructuur
       └→ #1206 wordt geabsorbeerd door Fase 5
```
