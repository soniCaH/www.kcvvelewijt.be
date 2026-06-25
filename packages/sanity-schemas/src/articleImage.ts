import {defineField, defineType} from 'sanity'

export const articleImage = defineType({
  name: 'articleImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Beschrijf de afbeelding voor toegankelijkheid (schermlezers) en SEO.',
      validation: (r) =>
        r.required().warning('Geef een beschrijvende alt-tekst voor toegankelijkheid.'),
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      description:
        'Breedte van de afbeelding in het artikel. `prose` = standaard tekstbreedte; `wide` = breder dan tekst (1040px); `bleed` = volledige schermbreedte.',
      options: {list: ['prose', 'wide', 'bleed']},
      initialValue: 'prose',
    }),
  ],
  preview: {
    select: {title: 'alt', media: 'image'},
    prepare({title, media}) {
      return {title: title ?? 'Image', media}
    },
  },
})
