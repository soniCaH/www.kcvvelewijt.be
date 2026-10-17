import {defineField, defineType} from 'sanity'
import {validateLink} from './validation/link'

export const matchesSliderPlaceholder = defineType({
  name: 'matchesSliderPlaceholder',
  title: 'Tussenseizoen-bericht (blok Eerste ploegen)',
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
      validation: (rule) => rule.uri({scheme: ['http', 'https'], allowRelative: true}).custom(validateLink),
    }),
    defineField({
      name: 'highlightImage',
      title: 'Afbeelding',
      type: 'image',
      description:
        'Optionele foto bovenaan het bericht (bv. boven de mededeling, of boven de aftelling). Er is geen standaardfoto — laat leeg om geen afbeelding te tonen. Liefst horizontaal, min. 1280x720.',
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
