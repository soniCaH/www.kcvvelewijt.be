import {defineField, defineType} from 'sanity'
import {responsibilityPreviewSelect, prepareResponsibilityPreview} from './preview/responsibility-preview'

const hasContent = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0

const contactFields = [
  defineField({
    name: 'contactType',
    title: 'Type contact',
    type: 'string',
    options: {
      list: [
        {title: 'Organigram positie', value: 'position'},
        {title: 'Teamrol (dynamisch)', value: 'team-role'},
        {title: 'Handmatig', value: 'manual'},
      ],
      layout: 'radio',
    },
    initialValue: 'position',
    validation: (Rule) =>
      Rule.required().error(
        'Verplicht. Bepaalt welke velden hieronder verschijnen — kies "Organigram positie" voor vaste functies (bijv. Secretaris), "Teamrol" voor trainer/afgevaardigde van een ploeg, of "Handmatig" voor ad-hoc contacten.',
      ),
  }),
  defineField({
    name: 'organigramNode',
    title: 'Positie',
    type: 'reference',
    to: [{type: 'organigramNode'}],
    description:
      'Kies de organigram-positie (bijv. Secretaris, TVJO, API). De naam en gegevens van de huidige titularis worden automatisch overgenomen op de site — zo blijft de info up-to-date als iemand wisselt van rol.',
    hidden: ({parent}) => parent?.contactType !== 'position',
  }),
  defineField({
    name: 'teamRole',
    title: 'Teamrol',
    type: 'string',
    options: {
      list: [
        {title: 'Trainer', value: 'trainer'},
        {title: 'Afgevaardigde', value: 'afgevaardigde'},
      ],
    },
    description:
      'Wordt dynamisch ingevuld op basis van de ploeg die de gebruiker kiest. Bijvoorbeeld: een speler van het A-team die "trainer" selecteert krijgt zijn eigen trainer als contactpersoon te zien.',
    hidden: ({parent}) => parent?.contactType !== 'team-role',
  }),
  defineField({
    name: 'teamRoleFallback',
    title: 'Fallback teamrol',
    type: 'string',
    options: {
      list: [
        {title: 'Trainer', value: 'trainer'},
        {title: 'Afgevaardigde', value: 'afgevaardigde'},
      ],
    },
    description:
      'Optioneel: als de primaire teamrol niet beschikbaar is voor de gekozen ploeg, wordt deze rol geprobeerd. Voorkomt dat gebruikers met een lege contactkaart eindigen.',
    hidden: ({parent}) => parent?.contactType !== 'team-role',
  }),
  defineField({
    name: 'role',
    title: 'Rol',
    type: 'string',
    description:
      'Weergavenaam (bijv. "Kantine"). Wordt op de site getoond als de naam van de contactpersoon — kies iets dat een buitenstaander herkent.',
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'email',
    title: 'Email',
    type: 'string',
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'phone',
    title: 'Telefoon',
    type: 'string',
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
  defineField({
    name: 'department',
    title: 'Afdeling',
    type: 'string',
    options: {
      list: [
        {title: 'Hoofdbestuur', value: 'hoofdbestuur'},
        {title: 'Jeugdbestuur', value: 'jeugdbestuur'},
        {title: 'Algemeen', value: 'algemeen'},
      ],
    },
    hidden: ({parent}) => parent?.contactType !== 'manual',
  }),
]

export const responsibility = defineType({
  name: 'responsibility',
  title: 'Responsibility',
  type: 'document',
  groups: [
    {name: 'vraag', title: 'Vraag', default: true},
    {name: 'antwoord', title: 'Antwoord'},
    {name: 'contact', title: 'Contact'},
    {name: 'meta', title: 'Meta'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'vraag',
      description:
        'Korte interne titel die je in Studio terugziet (bijv. "Blessure – herstel"). Niet zichtbaar op de site — alleen bedoeld om dit info-pad terug te vinden in zoekresultaten en lijsten in Studio.',
      validation: (Rule) =>
        Rule.required().error(
          'Verplicht. Zonder titel is dit info-pad niet terug te vinden in Studio en kan je het niet later bewerken.',
        ),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'vraag',
      description:
        'Unieke identifier voor de URL (`/info/{slug}`). Eens gepubliceerd: niet meer wijzigen — externe links breken anders. Gebruik kebab-case (kleine letters, koppeltekens).',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) =>
        Rule.required().error(
          'Verplicht. De slug bepaalt de URL waar gebruikers dit info-pad bereiken — zonder slug verschijnt het niet op de site.',
        ),
    }),
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      group: 'vraag',
      description:
        'De vraag in spreektaal, zoals een gebruiker hem zou typen (bijv. "heb een ongeval op training"). Lowercase, geen punt op het einde. Dit is de tekst die getoond wordt in zoekresultaten op de site.',
      validation: (Rule) =>
        Rule.required().error(
          'Verplicht. Zonder vraag verschijnt dit info-pad niet in zoekresultaten — gebruikers kunnen het dan niet vinden.',
        ),
    }),
    defineField({
      name: 'audience',
      title: 'Audience',
      type: 'array',
      group: 'vraag',
      description:
        'Wie kan deze vraag stellen? Selecteer alle relevante doelgroepen — gebruikers krijgen alleen info-paden te zien die op hen van toepassing zijn na de eerste filterklik op de site.',
      of: [
        {
          type: 'string',
          options: {
            list: [
              {title: 'Speler', value: 'speler'},
              {title: 'Ouder', value: 'ouder'},
              {title: 'Trainer', value: 'trainer'},
              {title: 'Supporter', value: 'supporter'},
              {title: 'Niet-lid', value: 'niet-lid'},
              {title: 'Andere', value: 'andere'},
            ],
          },
        },
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error(
            'Verplicht — kies minstens één doelgroep. Zonder doelgroep blijft dit info-pad voor alle bezoekers verborgen.',
          ),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'vraag',
      description:
        'Bovenliggende categorie waar dit info-pad onder valt. Bepaalt het icoon-thema en de groepering op de site (bijv. medische vragen worden samen gepresenteerd).',
      options: {
        list: [
          {title: 'Medisch', value: 'medisch'},
          {title: 'Sportief', value: 'sportief'},
          {title: 'Administratief', value: 'administratief'},
          {title: 'Gedrag', value: 'gedrag'},
          {title: 'Algemeen', value: 'algemeen'},
          {title: 'Commercieel', value: 'commercieel'},
        ],
      },
      validation: (Rule) => Rule.required().error('Verplicht — kies een categorie zodat dit info-pad correct gegroepeerd wordt op de site.'),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      group: 'vraag',
      of: [{type: 'string'}],
      description:
        'Zoeksynoniemen en gerelateerde termen — wees genereus. Voorbeelden voor "blessure": "letsel", "geblesseerd", "kreukel", "ongeval". Zorgt dat gebruikers dit info-pad vinden ook al gebruiken ze niet de exacte woorden uit de vraag.',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      group: 'antwoord',
      description:
        '1-2 zinnen die direct getoond worden zodra de gebruiker dit info-pad opent. De kern van het antwoord — alle details horen in de stappen hieronder.',
      validation: (Rule) =>
        Rule.required().error('Verplicht. De summary is het eerste wat gebruikers zien na het openen — zonder dit veld lijkt de pagina leeg.'),
    }),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      group: 'antwoord',
      description:
        'Geordende oplossingsstappen. De volgorde in de lijst = de volgorde op de site. Splits het antwoord in concrete acties die de gebruiker één voor één kan doorlopen.',
      of: [
        {
          type: 'object',
          name: 'solutionStep',
          fields: [
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: (Rule) =>
                Rule.required().error(
                  'Verplicht. Een stap zonder beschrijving wordt op de site weergegeven als een leeg item.',
                ),
            }),
            defineField({
              name: 'link',
              title: 'Link',
              type: 'string',
              description:
                'Optioneel: relatieve of absolute URL (bijv. `/contact` of `https://...`). Als ingevuld, wordt de beschrijving een klikbare actie op de site.',
              // @ts-expect-error .uri() exists at runtime but is missing from StringRule types
              validation: (Rule) => Rule.uri({allowRelative: true}),
            }),
            defineField({
              name: 'contact',
              title: 'Contact (this step)',
              type: 'object',
              description:
                'Optioneel: contactpersoon specifiek voor déze stap (bijv. "stuur het ingevulde formulier naar [secretaris]"). Overschrijft de primaire contact alleen voor deze stap.',
              fields: contactFields,
              validation: (Rule) =>
                Rule.custom((contact: Record<string, unknown> | undefined) => {
                  if (!contact?.contactType) return true // step contacts are optional
                  switch (contact.contactType) {
                    case 'position':
                      return contact.organigramNode ? true : 'Kies een organigram-positie'
                    case 'team-role':
                      return contact.teamRole ? true : 'Kies een teamrol'
                    case 'manual':
                      return hasContent(contact.email) || hasContent(contact.phone) || hasContent(contact.role) || hasContent(contact.department)
                        ? true
                        : 'Vul minstens één van: rol, email, telefoon, afdeling in'
                    default:
                      return 'Ongeldig type contact'
                  }
                }),
            }),
          ],
          preview: {
            select: {description: 'description'},
            prepare({description}: {description?: string}) {
              return {title: description ?? '(no description)'}
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'primaryContact',
      title: 'Primary contact',
      type: 'object',
      group: 'contact',
      description:
        'Hoofdcontactpersoon voor dit info-pad. Verschijnt rechtsboven op de detailpagina als "Voor vragen, contacteer …". Kies tussen een vaste organigram-positie, een dynamische teamrol, of handmatige contactgegevens.',
      fields: contactFields,
      validation: (Rule) =>
        Rule.required().custom((contact: Record<string, unknown> | undefined) => {
          if (!contact?.contactType) return 'Kies een type contact'
          switch (contact.contactType) {
            case 'position':
              return contact.organigramNode ? true : 'Kies een organigram-positie'
            case 'team-role':
              return contact.teamRole ? true : 'Kies een teamrol'
            case 'manual':
              return hasContent(contact.email) || hasContent(contact.phone) || hasContent(contact.role) || hasContent(contact.department)
                ? true
                : 'Vul minstens één van: rol, email, telefoon, afdeling in'
            default:
              return 'Ongeldig type contact'
          }
        }),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'meta',
      description:
        'Laat staan op `true` voor zichtbaar op de site. Zet op `false` om dit info-pad tijdelijk te verbergen zonder het te verwijderen — handig tijdens herwerking of als de info even niet klopt.',
      initialValue: true,
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      group: 'meta',
      description: 'Lucide icon name (e.g. "heart", "file-text", "shield"). Optioneel; valt anders terug op het categorie-icoon.',
    }),
    defineField({
      name: 'relatedPaths',
      title: 'Related paths',
      type: 'array',
      group: 'meta',
      of: [{type: 'reference', to: [{type: 'responsibility'}]}],
      description: '"Zie ook"-links onderaan de detailpagina. Verwijs naar verwante info-paden zodat gebruikers hun vraag kunnen verfijnen of gerelateerde acties terugvinden.',
    }),
  ],
  preview: {
    select: responsibilityPreviewSelect,
    prepare: prepareResponsibilityPreview,
  },
})
