import {defineField, defineType} from 'sanity'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  // Editor-UX rework groups (#1507). `inhoud` is the default tab; `eventType`
  // (chosen first) drives the agenda colour-coding.
  groups: [
    {name: 'inhoud', title: 'Inhoud', default: true},
    {name: 'datum', title: 'Datum & locatie'},
    {name: 'promotie', title: 'Promotie'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'inhoud',
      description: 'De naam van het evenement (bijv. "Mosselfeest" of "Jeugdtornooi"). Wordt als titel in de agenda en op de detailpagina getoond.',
      validation: (r) => r.required().error('Verplicht. Zonder titel heeft het evenement geen naam in de agenda.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'inhoud',
      description: 'URL-pad van de detailpagina (`/evenementen/{slug}`). Klik "Generate" om het uit de titel af te leiden; niet meer wijzigen na publicatie.',
      options: {source: 'title', maxLength: 96},
      validation: (r) =>
        r.required().error('Verplicht. De slug bepaalt de URL van het evenement — zonder slug is de detailpagina onbereikbaar.'),
    }),
    defineField({
      name: 'eventType',
      title: 'Event type',
      type: 'string',
      group: 'inhoud',
      description:
        'Categorie van het evenement — bepaalt de kleurcode in de agenda. Kies dit eerst. Laat leeg voor "Andere".',
      options: {
        list: [
          {title: 'Clubevent', value: 'Clubevent'},
          {title: 'Supportersactiviteit', value: 'Supportersactiviteit'},
          {title: 'Jeugdwerking', value: 'Jeugdwerking'},
          {title: 'Andere', value: 'Andere'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'inhoud',
      options: {hotspot: true},
      description: 'Sfeerbeeld bovenaan de detailpagina, in kleur getoond. Dient ook als deelafbeelding als er geen aparte OG-afbeelding is.',
    }),
    defineField({
      name: 'dateStart',
      title: 'Start date',
      type: 'datetime',
      group: 'datum',
      description: 'Begindatum en -tijd. Bepaalt waar het evenement in de agenda verschijnt.',
      validation: (r) => r.required().error('Verplicht. Zonder startdatum kan het evenement niet in de agenda geplaatst worden.'),
    }),
    defineField({
      name: 'dateEnd',
      title: 'End date',
      type: 'datetime',
      group: 'datum',
      description: 'Einddatum en -tijd voor meerdaagse evenementen. Laat leeg voor een evenement op één moment.',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      group: 'datum',
      description: 'Waar het evenement plaatsvindt (bijv. "Sportpark Driesput, Elewijt"). Getoond op de detailpagina.',
    }),
    defineField({
      name: 'featuredOnHome',
      title: 'Featured on homepage',
      type: 'boolean',
      group: 'promotie',
      description: 'Zet aan om dit evenement in de uitgelichte slot van de nieuwssectie op de homepage te tonen. Standaard uit.',
      initialValue: false,
    }),
    defineField({
      name: 'externalLink',
      title: 'External link',
      type: 'object',
      group: 'promotie',
      description: 'Optionele externe link, bijv. naar een inschrijvings- of ticketpagina. Getoond als knop op de detailpagina.',
      fields: [
        defineField({name: 'url', title: 'URL', type: 'url'}),
        defineField({name: 'label', title: 'Label', type: 'string'}),
      ],
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      group: 'seo',
      description: 'Optionele SEO-omschrijving (max. 160 tekens). Verschijnt in Google-resultaten en bij delen op sociale media. Laat leeg om automatisch terug te vallen op het begin van de inhoud.',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      group: 'seo',
      description: 'Optionele afbeelding voor het delen op sociale media (Open Graph). Valt terug op de cover-afbeelding als dit leeg blijft.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'coverImage', dateStart: 'dateStart'},
    prepare({title, media, dateStart}) {
      return {
        title,
        subtitle: dateStart ? new Date(dateStart).toLocaleDateString('nl-BE') : '',
        media,
      }
    },
  },
})
