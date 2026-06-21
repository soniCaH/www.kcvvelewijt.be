import {defineField, defineType} from 'sanity'

export const player = defineType({
  name: 'player',
  title: 'Player',
  type: 'document',
  // Editor-UX rework groups (#1503). `identiteit` holds the PSD-synced
  // read-only fields; `redactioneel` is where the editor actually works.
  groups: [
    {name: 'identiteit', title: 'Identiteit (PSD)', default: true},
    {name: 'redactioneel', title: 'Redactioneel'},
    {name: 'meta', title: 'Meta'},
  ],
  fields: [
    // ── Identiteit — PSD-synced, read-only ──────────────────────────────────
    defineField({
      name: 'psdId',
      title: 'PSD ID',
      type: 'string',
      group: 'identiteit',
      description: 'Unieke identifier uit PSD, gebruikt als publieke slug. Gesynchroniseerd — alleen-lezen, niet bewerken.',
      readOnly: true,
    }),
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      group: 'identiteit',
      description: 'Voornaam, gesynchroniseerd vanuit PSD. Alleen-lezen — wijzig dit in PSD, niet hier.',
      readOnly: true,
    }),
    defineField({
      name: 'lastName',
      title: 'Last name',
      type: 'string',
      group: 'identiteit',
      description: 'Familienaam, gesynchroniseerd vanuit PSD. Alleen-lezen — wijzig dit in PSD, niet hier.',
      readOnly: true,
    }),
    defineField({
      name: 'birthDate',
      title: 'Birth date',
      type: 'date',
      group: 'identiteit',
      description: 'Geboortedatum, gesynchroniseerd vanuit PSD. Alleen-lezen.',
      readOnly: true,
    }),
    defineField({
      name: 'keeper',
      title: 'Keeper',
      type: 'boolean',
      group: 'identiteit',
      description: 'Geeft aan of de speler een doelman is. Gesynchroniseerd vanuit PSD — alleen-lezen en betrouwbaar voor keepers.',
      readOnly: true,
    }),
    defineField({
      name: 'positionPsd',
      title: 'Position (PSD)',
      type: 'string',
      group: 'identiteit',
      description:
        'Positie zoals PSD ze aanlevert (bestPosition). Vaak leeg voor KCVV — gebruik dan het redactionele veld "Position". Alleen-lezen.',
      readOnly: true,
    }),
    defineField({
      name: 'psdImage',
      title: 'PSD image',
      type: 'image',
      group: 'identiteit',
      description:
        'Spelersfoto gesynchroniseerd vanuit PSD. Alleen-lezen — voeg via "Transparent image" een eigen foto toe om ze op de site te vervangen.',
      readOnly: true,
    }),
    // ── Redactioneel — editor-owned enrichment ──────────────────────────────
    defineField({
      name: 'jerseyNumber',
      title: 'Jersey number',
      type: 'number',
      group: 'redactioneel',
      description: 'Rugnummer van de speler. Redactioneel — PSD levert dit niet aan, vul het zelf in.',
    }),
    defineField({
      name: 'transparentImage',
      title: 'Transparent image',
      type: 'image',
      group: 'redactioneel',
      options: {hotspot: true},
      description: 'PNG met transparante achtergrond — vervangt de PSD-foto op de site. Redactioneel, door jou beheerd.',
    }),
    defineField({
      name: 'celebrationImage',
      title: 'Celebration image',
      type: 'image',
      group: 'redactioneel',
      options: {hotspot: true},
      description: 'Foto gebruikt op de Instagram-deelkaarten van het eerste elftal. Redactioneel.',
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      group: 'redactioneel',
      description: 'De positie zoals getoond op de site. PSD levert dit niet aan voor KCVV — kies ze hier zelf.',
      options: {
        list: ['Keeper', 'Verdediger', 'Middenvelder', 'Aanvaller', 'Speler'],
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      group: 'redactioneel',
      description: 'Korte voorstelling van de speler in vrije tekst. Redactioneel — getoond op het spelersprofiel.',
      of: [
        {
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
              {title: 'Underline', value: 'underline'},
              {title: 'Strike', value: 'strike-through'},
              {title: 'Pullquote', value: 'pullquote'},
            ],
          },
        },
      ],
    }),
    // ── Meta — hidden sync plumbing ─────────────────────────────────────────
    defineField({
      name: 'psdImageUrl',
      title: 'PSD image source URL',
      type: 'url',
      group: 'meta',
      description: 'Ruwe PSD-URL — gebruikt om te detecteren wanneer de foto opnieuw gesynchroniseerd moet worden. Niet getoond op de site. Alleen-lezen.',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      group: 'meta',
      description: 'Automatisch gezet door de sync wanneer de speler niet meer in PSD voorkomt. Alleen-lezen — niet handmatig bewerken.',
      initialValue: false,
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      media: 'transparentImage',
    },
    prepare({firstName, lastName, media}) {
      return {title: `${firstName ?? ''} ${lastName ?? ''}`.trim(), media}
    },
  },
})
