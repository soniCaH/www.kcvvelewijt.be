import {defineField, defineType} from 'sanity'

export const photoGallery = defineType({
  name: 'photoGallery',
  title: 'Photo gallery',
  type: 'document',
  // Editor-UX rework groups (#1471, #1502 convention). `inhoud` is the default
  // tab; `fotos` holds the image array + credit; `koppeling` links the gallery
  // to a wedstrijd or evenement so it surfaces on those detail pages.
  groups: [
    {name: 'inhoud', title: 'Inhoud', default: true},
    {name: 'fotos', title: "Foto's"},
    {name: 'koppeling', title: 'Koppelingen'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'inhoud',
      description:
        'De naam van de galerij (bijv. "3-1 tegen Zemst" of "Mosselfeest 2026"). Wordt als titel op de overzichts- en detailpagina getoond.',
      validation: (r) => r.required().error('Verplicht. Zonder titel heeft de galerij geen naam in het overzicht.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'inhoud',
      description:
        'URL-pad van de detailpagina (`/galerij/{slug}`). Klik "Generate" om het uit de titel af te leiden; niet meer wijzigen na publicatie.',
      options: {source: 'title', maxLength: 96},
      validation: (r) =>
        r.required().error('Verplicht. De slug bepaalt de URL van de galerij — zonder slug is de detailpagina onbereikbaar.'),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'inhoud',
      description:
        'Publicatiedatum. Bepaalt de volgorde in het overzicht (nieuwste eerst) en wordt als datum op de galerijkaart getoond.',
      validation: (r) => r.required().error('Verplicht. Zonder publicatiedatum kan de galerij niet correct gesorteerd worden.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      group: 'inhoud',
      description:
        'Optionele inleiding bovenaan de detailpagina (bijv. context bij de reeks foto\'s). Laat leeg voor een galerij zonder tekst.',
    }),
    defineField({
      name: 'defaultCredit',
      title: 'Default credit',
      type: 'string',
      group: 'fotos',
      description:
        'Standaard fotograaf-vermelding voor de hele reeks (bijv. "Foto: Jan Janssens"). Per foto kan je dit overschrijven met een eigen credit.',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'fotos',
      description:
        'De foto\'s in de galerij. De eerste foto is automatisch de cover (gebruikt op de overzichtskaart en als deelafbeelding). Sleep om de volgorde te wijzigen.',
      of: [
        defineField({
          name: 'galleryImage',
          title: 'Image',
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (r) => r.required().error('Verplicht. Een lege fotoslot wordt niet getoond.'),
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optioneel onderschrift, getoond als overlay in de lightbox.',
            }),
            defineField({
              name: 'credit',
              title: 'Credit',
              type: 'string',
              description:
                'Optionele fotograaf-vermelding voor deze ene foto. Overschrijft de standaard-credit van de galerij.',
            }),
          ],
          preview: {
            select: {title: 'caption', subtitle: 'credit', media: 'image'},
            prepare({title, subtitle, media}) {
              return {title: title || 'Foto', subtitle, media}
            },
          },
        }),
      ],
      validation: (r) => [
        r.required().min(1).error('Voeg minstens één foto toe — de eerste foto is de cover van de galerij.'),
        r.max(80).warning("Meer dan 80 foto's kan de galerij traag laden. Splits grote reeksen op in meerdere galerijen."),
      ],
    }),
    defineField({
      name: 'linkedMatch',
      title: 'Linked match',
      type: 'string',
      group: 'koppeling',
      description:
        'Optioneel PSD-wedstrijd-id (kopieer het uit de /wedstrijd/[id] URL). Koppelt de galerij aan een wedstrijd: ze verschijnt dan onderaan die wedstrijdpagina.',
    }),
    defineField({
      name: 'linkedEvent',
      title: 'Linked event',
      type: 'reference',
      to: [{type: 'event'}],
      group: 'koppeling',
      description:
        'Optionele koppeling aan een evenement. De galerij verschijnt dan onderaan de detailpagina van dat evenement.',
    }),
  ],
  preview: {
    select: {title: 'title', media: 'images.0.image', publishedAt: 'publishedAt', images: 'images'},
    prepare({title, media, publishedAt, images}) {
      const count = Array.isArray(images) ? images.length : 0
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString('nl-BE') : ''
      const subtitle = [count ? `${count} foto's` : '', date].filter(Boolean).join(' · ')
      return {title, subtitle, media}
    },
  },
})
