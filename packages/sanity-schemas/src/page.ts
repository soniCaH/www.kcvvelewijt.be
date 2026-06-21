import {defineField, defineType} from 'sanity'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  // Editor-UX rework groups (#1508). `inhoud` is the default tab.
  groups: [
    {name: 'inhoud', title: 'Inhoud', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'inhoud',
      description:
        'De titel van de pagina (bijv. "Praktische info" of "Geschiedenis"). Wordt als hoofdtitel bovenaan de pagina getoond en in de browsertab.',
      validation: (r) =>
        r.required().error('Verplicht. Zonder titel heeft de pagina geen kop en geen bruikbare browsertitel.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'inhoud',
      options: {source: 'title'},
      description:
        'Het URL-pad van de pagina (`/{slug}`). Eens gepubliceerd: niet meer wijzigen — externe links breken anders. Klik "Generate" om hem uit de titel af te leiden.',
      validation: (r) =>
        r.required().error(
          'Verplicht. De slug bepaalt de URL waarop de pagina bereikbaar is — zonder slug verschijnt ze niet op de site.',
        ),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'inhoud',
      options: {hotspot: true},
      description:
        'Optionele bannerafbeelding bovenaan de pagina. Wordt in kleur en volle breedte getoond. Zonder afbeelding start de pagina meteen met de titel en de tekst.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'inhoud',
      of: [{type: 'block'}, {type: 'articleImage'}, {type: 'fileAttachment'}],
      description:
        'De inhoud van de pagina: opgemaakte tekst, afbeeldingen en bijlagen (bijv. een PDF met reglement). Dit is wat bezoekers als hoofdtekst lezen.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      group: 'seo',
      description:
        'Optionele SEO-omschrijving (max. 160 tekens). Verschijnt in Google-zoekresultaten en bij het delen op sociale media. Laat leeg om automatisch terug te vallen op het begin van de tekst.',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      group: 'seo',
      description:
        'Optionele afbeelding voor het delen op sociale media (Open Graph). Valt terug op de hero-afbeelding als dit leeg blijft. Gebruik bij voorkeur een liggende afbeelding van 1200×630 pixels.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'heroImage', subtitle: 'slug.current'},
  },
})
