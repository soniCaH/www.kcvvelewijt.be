import {defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  // @ts-expect-error __experimental_actions is not in the public type yet
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'bannerSlotA',
      title: 'Banner slot A (below Match Widget)',
      type: 'reference',
      to: [{type: 'banner'}],
    }),
    defineField({
      name: 'bannerSlotB',
      title: 'Banner slot B (below News section)',
      type: 'reference',
      to: [{type: 'banner'}],
    }),
    defineField({
      name: 'bannerSlotC',
      title: 'Banner slot C (below Youth section)',
      type: 'reference',
      to: [{type: 'banner'}],
    }),
    defineField({
      name: 'matchesSliderPlaceholder',
      title: 'Placeholder wedstrijdenblok',
      type: 'matchesSliderPlaceholder',
      description: 'Optioneel. Getoond wanneer er geen aankomende wedstrijden zijn.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Homepage configuration'}
    },
  },
})
