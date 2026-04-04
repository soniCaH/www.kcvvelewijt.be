# Responsibility Finder Seeding — Design

**Issue:** #1207
**PRD:** `docs/prd/staff-migration-organigram-seeding.md` (phases 1-5 complete)
**Date:** 2026-04-03
**Depends on:** #1213 (organigram seeding, CLOSED), #1212 (staff migration, CLOSED)
**Prepares for:** #1220 (dynamic team-level routing)

## Problem

The responsibility finder (`/hulp`) has zero `responsibility` documents in Sanity. The ~28 approved questions live only in `docs/plans/responsibility-finder-questions.md`. Now that the organigram is seeded with all positions and staff members assigned, we can seed the questions — but the original plan assumed flat staffMember refs, which is brittle and doesn't match the real-world "Contactpersonen Jeugdwerking" flow chart.

## Design decisions

### 1. Contacts reference positions, not people

**Every contact references an `organigramNode`, never a `staffMember` directly.** Even seemingly personal roles (API = Kim Bautmans) are positional — when someone else fills that organigram node, all linked responsibilities auto-update.

### 2. Contact type discriminator

The `contactFields` shared object in the `responsibility` schema gets a `contactType` field that conditionally shows/hides fields:

| `contactType` | Visible fields | Use case |
|---|---|---|
| `"position"` | `organigramNode` ref picker | Any organigram position (TVJO, Secretaris, API, Kledij) |
| `"team-role"` | `teamRole` dropdown | Dynamic: "your team's trainer/afgevaardigde" (seeded in #1220) |
| `"manual"` | `role`, `email`, `phone`, `department` | Fallback for contacts not in the organigram |

Sanity `hidden` callbacks ensure editors see only the relevant fields per type. Validation enforces: pick a type, fill in its required field.

### 3. Scope split with #1220

| This issue (#1207) | Deferred to #1220 |
|---|---|
| Schema extension (contactType, organigramNode ref, teamRole field) | Team selection UI ("Selecteer je ploeg") |
| Seed ~20 static questions (niet-sportieve + admin/medical) | Seed ~8 dynamic sportieve vragen |
| GROQ query update for organigramNode dereferencing | Frontend runtime resolution of team-role contacts |
| Frontend Contact component update for multi-member nodes | Age-group → JC resolution logic |
| Update `api-contract` Contact type if needed | New API endpoint for team → staff resolution |

### 4. Search & indexing: no changes needed

Vectorize index text = `title + question + keywords + summary`. No contact info is indexed. The schema change affects only contact **resolution**, not question **matching**. Confirmed: search quality is unaffected.

## Schema changes

### `packages/sanity-schemas/src/responsibility.ts`

Replace the current `contactFields` with:

```typescript
const contactFields = [
  defineField({
    name: 'contactType',
    title: 'Type contact',
    type: 'string',
    options: {
      list: [
        { title: 'Organigram positie', value: 'position' },
        { title: 'Teamrol (dynamisch)', value: 'team-role' },
        { title: 'Handmatig', value: 'manual' },
      ],
      layout: 'radio',
    },
    initialValue: 'position',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'organigramNode',
    title: 'Positie',
    type: 'reference',
    to: [{ type: 'organigramNode' }],
    description: 'Kies de organigram-positie (bijv. Secretaris, TVJO, API)',
    hidden: ({ parent }) => parent?.contactType !== 'position',
  }),
  defineField({
    name: 'teamRole',
    title: 'Teamrol',
    type: 'string',
    options: {
      list: [
        { title: 'Trainer', value: 'trainer' },
        { title: 'Afgevaardigde', value: 'afgevaardigde' },
      ],
    },
    description: 'Wordt dynamisch ingevuld op basis van de ploeg die de gebruiker kiest',
    hidden: ({ parent }) => parent?.contactType !== 'team-role',
  }),
  defineField({
    name: 'role',
    title: 'Rol',
    type: 'string',
    description: 'Weergavenaam (bijv. "Kantine")',
    hidden: ({ parent }) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'email',
    title: 'Email',
    type: 'string',
    hidden: ({ parent }) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'phone',
    title: 'Telefoon',
    type: 'string',
    hidden: ({ parent }) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'department',
    title: 'Afdeling',
    type: 'string',
    options: {
      list: [
        { title: 'Hoofdbestuur', value: 'hoofdbestuur' },
        { title: 'Jeugdbestuur', value: 'jeugdbestuur' },
        { title: 'Algemeen', value: 'algemeen' },
      ],
    },
    hidden: ({ parent }) => parent?.contactType !== 'manual',
  }),
]
```

### Validation

The existing `primaryContact` custom validation changes from "staffMember OR inline fields" to:

```typescript
validation: (Rule) => Rule.required().custom((contact) => {
  if (!contact?.contactType) return 'Kies een type contact'
  switch (contact.contactType) {
    case 'position':
      return contact.organigramNode ? true : 'Kies een organigram-positie'
    case 'team-role':
      return contact.teamRole ? true : 'Kies een teamrol'
    case 'manual':
      return (contact.email || contact.phone || contact.role)
        ? true
        : 'Vul minstens één van: rol, email, telefoon in'
    default:
      return 'Ongeldig type contact'
  }
})
```

## GROQ query changes

### `apps/web/src/lib/repositories/responsibility.repository.ts`

The `primaryContact` and `steps[].contact` projections change to resolve through organigramNode:

```groq
"primaryContact": primaryContact {
  contactType,
  teamRole,
  // Position-based: resolve through organigramNode
  "position": organigramNode->title,
  "roleCode": organigramNode->roleCode,
  "members": organigramNode->members[]->{
    "id": _id,
    "name": firstName + " " + lastName,
    email, phone
  },
  "nodeId": organigramNode->_id,
  // Manual fallback
  "role": role,
  "email": email,
  "phone": phone,
  "department": department,
}
```

The frontend `Contact` type expands to accommodate both:

```typescript
interface Contact {
  contactType: 'position' | 'team-role' | 'manual'
  // position
  position?: string       // organigramNode title
  roleCode?: string       // organigramNode roleCode
  members?: Array<{ id: string; name: string; email?: string; phone?: string }>
  nodeId?: string         // for "Bekijk in organigram" link
  // team-role
  teamRole?: 'trainer' | 'afgevaardigde'
  // manual
  role?: string
  email?: string
  phone?: string
  department?: 'hoofdbestuur' | 'jeugdbestuur' | 'algemeen'
}
```

## Frontend rendering

All three types render to a consistent contact card. The component switches on `contactType`:

- **`position`**: Title from `position`, list `members[]` with name/email/phone, "Bekijk in organigram" link using `nodeId`
- **`team-role`**: Shows placeholder "Selecteer je ploeg om de contactpersoon te zien" (handled in #1220, not this issue — for now renders as a generic label like "Trainer van je ploeg")
- **`manual`**: Title from `role`, inline `email`/`phone`

Multi-member positions (e.g., Kledij with 2 people) show all members.

## New organigramNode: Gerechtelijk Correspondent

The "Contactpersonen Jeugdwerking" flow chart references a **Gerechtelijk Correspondent** (GC) role for sports accident reporting. This node doesn't exist yet. Create it as part of this issue:

```text
organigramNode-gerechtelijk-correspondent
  title: "Gerechtelijk Correspondent"
  department: hoofdbestuur
  parentNode: organigramNode-voorzitter  (club-wide role, not under Secretaris)
  members: [staffMember-psd-245]         (Kevin Van Ransbeeck)
  roleCode: "GC"
  sortOrder: 95                          (after Lid Hoofdbestuur)
```

## Seeding approach

### Script location

`scripts/responsibility-seeding/src/seed-responsibilities.ts` — same pattern as `scripts/staff-cleanup/`.

### Contact mapping

Authoritative source: "Contactpersonen Jeugdwerking" flow chart + brainstorm plan. organigramNode IDs from `scripts/staff-cleanup/src/phase4-organigram-seeding.ts`.

| Contact role | organigramNode ID | contactType |
|---|---|---|
| Secretaris | `organigramNode-secretaris` | position |
| TVJO | `organigramNode-tvjo` | position |
| Jeugdsecretaris | `organigramNode-jeugdsecretaris` | position |
| Jeugdvoorzitter | `organigramNode-jeugdvoorzitter` | position |
| Sportief Verantw. | `organigramNode-sportief-verantwoordelijke` | position |
| Gerechtelijk Correspondent | `organigramNode-gerechtelijk-correspondent` | position |
| API (integriteit) | `organigramNode-api` | position |
| Sponsoring | `organigramNode-sponsoring` | position |
| Kledij | `organigramNode-kledij` | position |
| Kantine & Evenementen | `organigramNode-kantine-evenementen` | position |
| Materiaal & Kantinedienst Wedstrijden | `organigramNode-materiaal-kantinedienst-wedstrijden` | position |
| Kantinedienst Trainingen | `organigramNode-kantinedienst-trainingen` | position |
| ProSoccerData | `organigramNode-prosoccerdata` | position |
| Website / Communicatie | `organigramNode-website-communicatie` | position |
| Voorzitter | `organigramNode-voorzitter` | position |
| JC Onderbouw | `organigramNode-jc-onderbouw` | position |
| JC Middenbouw | `organigramNode-jc-middenbouw` | position |
| JC Bovenbouw | `organigramNode-jc-bovenbouw` | position |
| Verzekering | _(no node)_ | manual (`verzekering@kcvvelewijt.be`) |
| Trainer | _(deferred to #1220)_ | team-role |
| Afgevaardigde | _(deferred to #1220)_ | team-role |

### Complete question list — from flow chart + brainstorm plan

Source key: **FC** = flow chart (authoritative), **BP** = brainstorm plan (supplementary).

#### Sportieve vragen — deferred to #1220 (need dynamic team routing)

These have Trainer/Afgevaardigde as first contact, requiring team selection:

| ID | Question | Source | Steps (escalation chain) | Why #1220 |
|---|---|---|---|---|
| FC-S1 | "Gaat het over je eigen kind of zijn/haar ploeg?" | FC | Trainer → JCs (per leeftijd) → TVJO + Sportief Verantw. | team-role first step |
| FC-S2 | "Gaat het over het sportieve beleid?" | FC | Trainer → JCs (per leeftijd) → TVJO + Sportief Verantw. | team-role first step |
| FC-S3 | "Heeft je kind een sportongeval?" (jeugd) | FC | Trainer → Jeugdsecretaris → Gerechtelijk Correspondent → JCs | team-role first step |
| FC-G1 | "Ongewenst gedrag / pesten / discriminatie" | FC + BP G1/G2 | Trainer → API | team-role first step |

#### Sportieve vragen — static (seed now)

| ID | Question | Source | Primary contact | Steps |
|---|---|---|---|---|
| FC-S4 | "Vragen als afgevaardigde?" | FC | Jeugdsecretaris (`organigramNode-jeugdsecretaris`) | 1. Neem contact op met de Jeugdsecretaris & Afgevaardigden |
| BP-S1 | "wil een proeftraining aanvragen" | BP | TVJO (`organigramNode-tvjo`) | 1. Neem contact op met de TVJO |
| BP-S4 | "wil van ploeg veranderen" | BP | TVJO (`organigramNode-tvjo`) | 1. Bespreek met de TVJO |
| BP-S6 | "wil scheidsrechter worden" | BP | Secretaris (`organigramNode-secretaris`) | 1. Neem contact op met de Secretaris |
| FC-S5 | "Heeft je kind een sportongeval?" (senioren) | FC | Gerechtelijk Correspondent (`organigramNode-gerechtelijk-correspondent`) | 1. Neem direct contact op met de GC |

#### Niet-sportieve vragen — static (seed now)

| ID | Question | Source | Primary contact | Steps |
|---|---|---|---|---|
| FC-N1 | "Opmerking over trainer of afgevaardigde" | FC | JC Onderbouw + JC Middenbouw + JC Bovenbouw (multi-node step) | 1. JC voor de juiste leeftijdsgroep → 2. Jeugdvoorzitter / TVJO |
| FC-N2 | "Wil je je engageren als vrijwilliger?" | FC + BP AL1 | Jeugdvoorzitter (`organigramNode-jeugdvoorzitter`) | 1. Neem contact op met het Jeugdbestuur |
| FC-N3 | "Wil je je engageren als afgevaardigde of trainer?" | FC | TVJO (`organigramNode-tvjo`) | 1. Neem contact op met de TVJO |
| FC-N4a | "Wil je sponsor worden?" | FC + BP C1 | Sponsoring (`organigramNode-sponsoring`) | 1. Neem contact op met de Commerciële Cel |
| FC-N4b | "Wil je helpen sponsors te werven?" | FC | Sponsoring (`organigramNode-sponsoring`) | 1. Neem contact op met de Commerciële Cel |
| FC-N5 | "Vraag over kantinedienst op wedstrijddagen?" | FC | Mat. & Kantinedienst Wedstrijden (`organigramNode-materiaal-kantinedienst-wedstrijden`) | 1. Neem contact op |
| FC-N6 | "Vraag over kantinedienst op trainingen?" | FC | Kantinedienst Trainingen (`organigramNode-kantinedienst-trainingen`) | 1. Neem contact op |
| FC-N7 | "Vraag over lidgeld of inschrijving?" | FC + BP A1 | Jeugdsecretaris (`organigramNode-jeugdsecretaris`) | 1. Neem contact op met de Jeugdsecretaris |
| FC-N8 | "Vraag over kledij of uitrusting?" | FC + BP A5 | Kledij (`organigramNode-kledij`) | 1. Neem contact op met de verantwoordelijke Kledij |
| FC-N9 | "Allerlei vragen over jeugd of ouders" | FC | Jeugdvoorzitter (`organigramNode-jeugdvoorzitter`) | 1. Neem contact op met de Jeugdvoorzitter |

#### Administratief — from brainstorm plan (seed now)

| ID | Question | Primary contact | Steps |
|---|---|---|---|
| BP-A2 | "wil de club verlaten / uitschrijven" | Secretaris | 1. Neem contact op met de Secretaris |
| BP-A3 | "kom van een andere club en wil overstappen (transfer)" | Secretaris | 1. Neem contact op met de Secretaris |
| BP-A4 | "wil mijn contactgegevens wijzigen" | ProSoccerData | 1. Log in op ProSoccerData of neem contact op |
| BP-A6 | "heb een probleem met mijn aansluiting bij Voetbal Vlaanderen" | Secretaris | 1. Neem contact op met de Secretaris |
| BP-A7 | "wil weten wanneer het nieuwe seizoen begint" | TVJO | 1. Neem contact op met de TVJO |

#### Medisch — from brainstorm plan (seed now)

| ID | Question | Primary contact | Steps |
|---|---|---|---|
| BP-M1 | "heb een medisch attest nodig voor sport" | Verzekering (manual: `verzekering@kcvvelewijt.be`) | 1. Neem contact op met de verzekering |
| BP-M3 | "wil allergieën of medicatie van mijn kind melden" | TVJO | 1. Meld het aan de TVJO en de trainer van je ploeg |
| BP-M4 | "zoek de AED of heb EHBO nodig op het terrein" | Kantine & Evenementen | 1. Ga naar de kantine, de AED hangt aan de ingang |

#### Gedrag — from brainstorm plan (seed now, static subset)

| ID | Question | Primary contact | Steps |
|---|---|---|---|
| BP-G3 | "heb een conflict met een andere ouder of speler" | API (`organigramNode-api`) | 1. Neem contact op met het API |
| BP-G4 | "wil het fair play charter raadplegen" | API (`organigramNode-api`) | 1. Raadpleeg het charter op de website |

#### Algemeen — from brainstorm plan (seed now)

| ID | Question | Primary contact | Steps |
|---|---|---|---|
| BP-AL2 | "wil het terrein of de kantine huren" | Kantine & Evenementen | 1. Neem contact op |
| BP-AL3 | "heb iets verloren op het terrein (gevonden voorwerpen)" | Kantine & Evenementen | 1. Vraag aan de kantine |
| BP-AL5 | "wil een klacht indienen" | Secretaris | 1. Stuur een mail naar de Secretaris → 2. API indien gedragsgerelateerd |
| BP-AL6 | "wil contact met het bestuur" | Voorzitter | 1. Neem contact op met de Voorzitter |
| BP-AL7 | "ontvang geen mails meer van de club" | ProSoccerData | 1. Controleer je gegevens in ProSoccerData |

#### Commercieel — from brainstorm plan (seed now)

| ID | Question | Primary contact | Steps |
|---|---|---|---|
| BP-C2 | "wil een evenement organiseren op het terrein" | Kantine & Evenementen | 1. Neem contact op |

### Deduplication notes

- **BP-A1** (lidgeld betalen) merged into **FC-N7** (lidgeld/inschrijving) — same topic, FC version is broader
- **BP-A5** (kledij bestellen) merged into **FC-N8** (kledij/uitrusting) — same topic
- **BP-AL1** (vrijwilliger worden) merged into **FC-N2** — same topic, FC has correct contact (Jeugdvoorzitter, not Secretaris)
- **BP-C1** (reclamebord plaatsen) merged into **FC-N4a** (sponsor worden) — same destination
- **BP-G1/G2** (pesten/discriminatie melden) merged into **FC-G1** — same topic, FC has correct escalation (Trainer → API)
- **BP-AL6** contact updated: brainstorm plan said Voorzitter, but for youth/parent context it's Jeugdvoorzitter (FC-N9). Keep BP-AL6 as general "wil contact met het bestuur" → Voorzitter. FC-N9 covers youth-specific catch-all → Jeugdvoorzitter.

### Totals

- **Seed now (#1207):** ~28 static responsibility documents
- **Seed later (#1220):** ~4 dynamic sportieve vragen (need team selection)

### FC-N1 — special case: multi-node step

"Opmerking over trainer of afgevaardigde" has a step that references **all 3 JC nodes** (Onderbouw, Middenbouw, Bovenbouw). The user picks the right one based on their child's age group. This is a static question (no team-role first step), but the first step contact is multi-node.

Model: The step's contact references one JC node, but the step `description` lists all three with context: "Neem contact op met de Jeugdcoördinator van je leeftijdsgroep." Three sub-steps with one organigramNode ref each, or three separate steps. **Decision: three steps, one per JC, each with organigramNode ref. Frontend shows all three; #1220 can later highlight the relevant one based on team selection.**

Escalation: Step 4 = Jeugdvoorzitter, Step 5 = TVJO.

### Seeding pipeline

1. Create `organigramNode-gerechtelijk-correspondent` in both datasets
2. Preflight: verify all referenced organigramNode IDs exist in the dataset
3. Generate responsibility documents with auto-generated slugs, keywords, summaries
4. `createIfNotExists` + patch (idempotent, re-runnable)
5. Run on staging first, verify in Studio, then production

### Document ID convention

`responsibility-{slug}` — e.g., `responsibility-lidgeld-inschrijving`, `responsibility-transfer-aanvragen`.

## Backward compatibility

The existing `staffMember` ref field is removed from `contactFields`. Since there are **zero responsibility documents** in either dataset, this is a non-breaking change — no data migration needed.

The GROQ query in `responsibility.repository.ts` and the frontend `Contact` type both change, but since no documents exist, there's no rendering regression.

The staff detail page reverse query (`primaryContact.staffMember._ref == ^._id`) needs updating to resolve through organigramNode → members instead.

The PSD sync protection query in `apps/api/src/sanity/projection.ts` (`getProtectedStaffPsdIds`) also needs updating — currently checks `primaryContact.staffMember._ref`, must change to dereference through organigramNode → members.

## Out of scope

- Team selection UI and dynamic team-role resolution (#1220)
- Sportieve vragen that need trainer/afgevaardigde as first step (#1220)
- Age-group → JC auto-highlighting (#1220)
- Vectorize index changes (none needed)
- LLM answer generation changes (none needed)
