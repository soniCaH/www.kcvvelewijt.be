import {defineField, defineType} from 'sanity'
import {editorialBioOf, PULLQUOTE_BIO_HELP} from './blocks/editorial-marks'

export const trainingDay = defineType({
  name: 'trainingSession',
  title: 'Training session',
  type: 'object',
  fields: [
    defineField({
      name: 'day',
      title: 'Day',
      type: 'string',
      description: 'Dag van de training.',
      options: {
        list: ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'],
      },
    }),
    defineField({
      name: 'time',
      title: 'Time',
      type: 'string',
      description: 'Aanvangsuur (bijv. "19:30").',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Locatie van de training (bijv. "Sportpark Elewijt - Veld 1").',
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      description: 'Soort training.',
      options: {
        list: ['Training', 'Fysiek', 'Tactisch', 'Keeperstraining', 'Andere'],
      },
    }),
  ],
})

export const team = defineType({
  name: 'team',
  title: 'Team',
  type: 'document',
  // Editor-UX rework groups (#1504). `identiteit` holds the PSD-synced identity
  // (plus the editable competition/visibility config); the rest is editorial.
  groups: [
    {name: 'identiteit', title: 'Identiteit', default: true},
    {name: 'redactioneel', title: 'Redactioneel'},
    {name: 'trainingen', title: 'Trainingen'},
    {name: 'staf', title: 'Staf'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // ── Identiteit — PSD-synced (read-only) + editable competition/visibility ─
    defineField({
      name: 'psdId',
      title: 'PSD ID',
      type: 'string',
      group: 'identiteit',
      description: 'Unieke identifier uit PSD. Gesynchroniseerd — alleen-lezen.',
      readOnly: true,
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'identiteit',
      description: 'Naam van de ploeg, gesynchroniseerd vanuit PSD. Alleen-lezen — wijzig dit in PSD, niet hier.',
      readOnly: true,
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'identiteit',
      options: {source: 'name'},
      description: 'URL-pad van de ploegpagina (`/ploegen/{slug}`), gesynchroniseerd vanuit de naam. Alleen-lezen.',
      readOnly: true,
      validation: (Rule) =>
        Rule.required().error(
          'Verplicht. De slug bepaalt de URL van de ploeg en wordt gesynchroniseerd vanuit PSD — als hij ontbreekt, liep de sync mis.',
        ),
    }),
    defineField({
      name: 'age',
      title: 'Age group',
      type: 'string',
      group: 'identiteit',
      description: 'Leeftijdsgroep (bijv. "A", "U17", "U15"), gesynchroniseerd vanuit PSD. Alleen-lezen.',
      readOnly: true,
    }),
    defineField({
      name: 'gender',
      title: 'Gender',
      type: 'string',
      group: 'identiteit',
      description: 'Geslacht van de ploeg, gesynchroniseerd vanuit PSD. Alleen-lezen.',
      readOnly: true,
    }),
    defineField({
      name: 'footbelId',
      title: 'Footbel ID',
      type: 'number',
      group: 'identiteit',
      description: 'Footbel-identifier, gesynchroniseerd vanuit PSD. Alleen-lezen.',
      readOnly: true,
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'string',
      group: 'identiteit',
      description: 'Seizoen, gesynchroniseerd vanuit PSD. Alleen-lezen.',
      readOnly: true,
    }),
    defineField({
      name: 'players',
      title: 'Players',
      type: 'array',
      group: 'identiteit',
      of: [{type: 'reference', to: [{type: 'player'}]}],
      description: 'De spelers van de ploeg, gesynchroniseerd vanuit PSD. Alleen-lezen — beheer de selectie in PSD.',
      readOnly: true,
    }),
    defineField({
      name: 'division',
      title: 'Division',
      type: 'string',
      group: 'identiteit',
      description: 'Korte competitiecode (bijv. "3NA"). Redactioneel — vul zelf in.',
    }),
    defineField({
      name: 'divisionFull',
      title: 'Division (full)',
      type: 'string',
      group: 'identiteit',
      description:
        'Volledige competitienaam (bijv. "Eerste Elftal A - 3e Nationale A" of "U9 - Wit"). Redactioneel — getoond op de ploegpagina.',
    }),
    defineField({
      name: 'showInNavigation',
      title: 'Show in navigation',
      type: 'boolean',
      group: 'identiteit',
      description:
        'Zet uit om deze ploeg te verbergen uit de navigatie en de ploegoverzichten (bijv. voor externe/tegenstander-ploegen). Standaard aan.',
      initialValue: true,
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      group: 'identiteit',
      description:
        'Automatisch gezet door de sync wanneer de ploeg niet meer in PSD voorkomt. Alleen-lezen — niet handmatig bewerken.',
      initialValue: false,
      readOnly: true,
      hidden: true,
    }),
    // ── Redactioneel — editor-owned ─────────────────────────────────────────
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'redactioneel',
      description: 'Korte slogan onder de ploegnaam. Redactioneel — optioneel.',
    }),
    defineField({
      name: 'body',
      title: 'Description',
      type: 'array',
      group: 'redactioneel',
      // Shares `editorialBioOf()` with player.bio / staffMember.bio (STUDIO-4/6)
      // so <TeamEditorial> can surface a styled "Het verhaal" pull-quote.
      // Styles are locked to Normal — only paragraphs + the pullquote render.
      description: `Beschrijving / het verhaal van de ploeg in vrije tekst. Redactioneel. ${PULLQUOTE_BIO_HELP}`,
      of: editorialBioOf(),
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact info',
      type: 'array',
      group: 'redactioneel',
      description: 'Contactgegevens voor deze ploeg (vrije tekst). Redactioneel — optioneel.',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'teamImage',
      title: 'Team image',
      type: 'image',
      group: 'redactioneel',
      options: {hotspot: true},
      description: 'Ploegfoto, in kleur getoond bovenaan de ploegpagina. Redactioneel.',
    }),
    // ── Trainingen ──────────────────────────────────────────────────────────
    defineField({
      name: 'trainingSchedule',
      title: 'Training schedule',
      type: 'array',
      group: 'trainingen',
      description: 'Trainingsmomenten van de ploeg. Voeg per training dag, uur, locatie en type toe. Getoond op de ploegpagina.',
      of: [{type: 'trainingSession'}],
    }),
    // ── Staf ────────────────────────────────────────────────────────────────
    defineField({
      name: 'staff',
      title: 'Staff',
      type: 'array',
      group: 'staf',
      description: 'De staf van de ploeg. Koppel een staflid en kies zijn rol (trainer of afgevaardigde) voor déze ploeg.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'member',
              title: 'Staff member',
              type: 'reference',
              to: [{type: 'staffMember'}],
              description: 'Het gekoppelde staflid.',
            }),
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              description: 'De rol van dit staflid binnen deze ploeg.',
              options: {
                list: [
                  {title: 'Trainer', value: 'trainer'},
                  {title: 'Afgevaardigde', value: 'afgevaardigde'},
                ],
              },
            }),
          ],
          preview: {
            select: {
              firstName: 'member.firstName',
              lastName: 'member.lastName',
              role: 'role',
            },
            prepare({firstName, lastName, role}) {
              return {
                title: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
                subtitle: role ?? '',
              }
            },
          },
        },
      ],
    }),
    // ── SEO ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      group: 'seo',
      description: 'Optionele SEO-omschrijving (max. 160 tekens). Verschijnt in Google-resultaten en bij delen op sociale media. Laat leeg om automatisch terug te vallen.',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      group: 'seo',
      description: 'Optionele afbeelding voor het delen op sociale media (Open Graph). Valt terug op de ploegfoto als dit leeg blijft.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'name', media: 'teamImage'},
  },
})
