import {defineField, defineType} from 'sanity'

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'url', title: 'Website', type: 'url'}),
    defineField({
      name: 'tier',
      title: 'Tier',
      description: 'Selecteer het sponsorniveau. Bestaande sponsors zonder tier moeten bij bewerking een tier krijgen.',
      type: 'string',
      options: {
        list: [
          {title: 'Hoofdsponsor', value: 'hoofdsponsor'},
          {title: 'Sponsor', value: 'sponsor'},
          {title: 'Sympathisant', value: 'sympathisant'},
        ],
      },
      validation: (r) => r.warning('Gelieve een tier te selecteren'),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description: 'Highlight this sponsor in the spotlight section',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Spotlight description',
      description: 'Optional tekst die getoond wordt in de spotlight sectie (bv. "Leverde de matchbal voor de wedstrijd van 12 april")',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'type',
      title: 'Type (legacy)',
      type: 'string',
      options: {
        list: [
          {title: 'Crossing', value: 'crossing'},
          {title: 'Training', value: 'training'},
          {title: 'White', value: 'white'},
          {title: 'Green', value: 'green'},
          {title: 'Panel', value: 'panel'},
          {title: 'Other', value: 'other'},
        ],
      },
      hidden: true,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'string',
      description: 'Override for SEO meta description and OG description (max 160 characters).',
      validation: (r) => r.max(160),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG image',
      type: 'image',
      description: 'Optional override for the Open Graph image. Falls back to the logo.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'name', media: 'logo', tier: 'tier'},
    prepare({title, media, tier}) {
      return {title, subtitle: tier, media}
    },
  },
})
