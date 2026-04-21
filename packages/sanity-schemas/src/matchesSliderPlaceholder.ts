import {defineField, defineType} from 'sanity'

export const matchesSliderPlaceholder = defineType({
  name: 'matchesSliderPlaceholder',
  title: 'Placeholder wedstrijdenblok (tussenseizoen)',
  type: 'object',
  description:
    'Optionele inhoud voor het wedstrijdenblok wanneer er geen aankomende wedstrijden zijn. Laat leeg voor de standaardweergave.',
  fields: [
    defineField({
      name: 'nextSeasonKickoff',
      title: 'Aftrap nieuw seizoen',
      type: 'date',
      description:
        'Datum van de eerste wedstrijd. Wordt getoond als aftelling. Laat leeg als nog niet bekend.',
      options: {dateFormat: 'DD-MM-YYYY'},
    }),
    defineField({
      name: 'announcementText',
      title: 'Mededeling',
      type: 'string',
      description:
        "Korte tekst (max 80 tekens), bv. 'Kalender 25-26 volgende week online'.",
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'announcementHref',
      title: 'Mededeling — link',
      type: 'url',
      description: 'Optionele link bij de mededeling.',
      validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true}),
    }),
    defineField({
      name: 'highlightImage',
      title: 'Afbeelding (overschrijft standaard)',
      type: 'image',
      description:
        'Optionele afbeelding die de standaardfoto vervangt. Liefst horizontaal, min. 1280x720.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt-tekst',
          type: 'string',
          validation: (rule) =>
            rule.required().error('Alt-tekst is verplicht voor toegankelijkheid.'),
        }),
      ],
    }),
  ],
})
