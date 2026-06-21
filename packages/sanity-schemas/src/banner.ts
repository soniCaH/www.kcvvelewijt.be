import {defineField, defineType} from 'sanity'

export const banner = defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  // Editor-UX rework groups (#1509). `inhoud` is the default tab.
  groups: [
    {name: 'inhoud', title: 'Inhoud', default: true},
    {name: 'link', title: 'Link'},
  ],
  fields: [
    defineField({
      name: 'image',
      title: 'Banner image',
      type: 'image',
      group: 'inhoud',
      options: {hotspot: true},
      description:
        'De bannerafbeelding (bijv. een webshop- of sponsoractie). Wordt op de homepage volledig in kleur getoond in een breed, liggend kader (verhouding ~6:1). Gebruik een brede afbeelding zodat ze niet ongelukkig bijgesneden wordt.',
      validation: (r) =>
        r.required().error(
          'Verplicht. Zonder afbeelding is er geen banner om te tonen en blijft de bannerslot op de homepage leeg.',
        ),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      group: 'inhoud',
      description:
        'Beschrijf wat er op de banner staat (bijv. "Bestel je nieuwe thuistruitje in de webshop"). Wordt voorgelezen door schermlezers en getoond wanneer de afbeelding niet laadt.',
      validation: (r) =>
        r.required().error(
          'Verplicht voor toegankelijkheid. Zonder alt-tekst is de banner onbruikbaar voor schermlezergebruikers en onleesbaar voor zoekmachines.',
        ),
    }),
    defineField({
      name: 'href',
      title: 'Click-through URL',
      type: 'url',
      group: 'link',
      description:
        'Optioneel: de bestemming wanneer een bezoeker op de banner klikt (bijv. "https://shop.kcvvelewijt.be"). Maakt de hele banner klikbaar en opent in een nieuw tabblad. Laat leeg voor een niet-klikbare banner.',
    }),
  ],
  preview: {
    select: {title: 'alt', media: 'image'},
  },
})
