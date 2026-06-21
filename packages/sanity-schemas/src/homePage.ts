import {defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  // @ts-expect-error __experimental_actions is not in the public type yet
  __experimental_actions: ['update', 'publish'],
  // Editor-UX rework groups (#1510). Singleton — `bannerslots` is the default tab.
  groups: [
    {name: 'bannerslots', title: 'Bannerslots', default: true},
    {name: 'widgets', title: 'Widgets'},
  ],
  fields: [
    defineField({
      name: 'bannerSlotA',
      title: 'Banner slot A (below Match Widget)',
      type: 'reference',
      to: [{type: 'banner'}],
      group: 'bannerslots',
      description:
        'Optionele banner die op de homepage onder het wedstrijdenblok verschijnt. Verwijst naar een Banner-document (bijv. een webshopactie). Laat leeg om deze slot over te slaan.',
    }),
    defineField({
      name: 'bannerSlotB',
      title: 'Banner slot B (below News section)',
      type: 'reference',
      to: [{type: 'banner'}],
      group: 'bannerslots',
      description:
        'Optionele banner die onder de nieuwssectie verschijnt. Verwijst naar een Banner-document. Laat leeg om deze slot over te slaan.',
    }),
    defineField({
      name: 'bannerSlotC',
      title: 'Banner slot C (below Youth section)',
      type: 'reference',
      to: [{type: 'banner'}],
      group: 'bannerslots',
      description:
        'Optionele banner die onder de jeugdsectie verschijnt. Verwijst naar een Banner-document. Laat leeg om deze slot over te slaan.',
    }),
    defineField({
      name: 'matchesSliderPlaceholder',
      title: 'Placeholder wedstrijdenblok',
      type: 'matchesSliderPlaceholder',
      group: 'widgets',
      description:
        'Optioneel tekstblok dat het wedstrijdenblok vervangt wanneer er geen aankomende wedstrijden zijn (bijv. tijdens de winterstop). Laat leeg om het blok dan gewoon te verbergen.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Homepage configuration'}
    },
  },
})
