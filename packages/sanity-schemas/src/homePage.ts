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
      // No field-level `title` — a field label wins over the referenced
      // type's own `title` in Sanity's resolution order, so setting one
      // here would silently shadow `matchesSliderPlaceholder.ts`'s title
      // ("Tussenseizoen-bericht (blok Eerste ploegen)") and make renaming
      // it there invisible to editors (#2505 review finding 5).
      type: 'matchesSliderPlaceholder',
      group: 'widgets',
      description:
        'Optionele inhoud voor het blok "Eerste ploegen" tijdens het tussenseizoen — een aftelling, een korte mededeling en/of een foto. Als er geen aankomende wedstrijden zijn, toont dat blok anders altijd "Nog geen wedstrijden ingepland.".',
    }),
    // #2401 item 4: the jeugd-band stat line ("220+ spelers · 16 ploegen")
    // used to be a hardcoded literal in <YouthSection> with no writer — a
    // club fact that could only ever drift silently. Only the two NUMBERS
    // move to Sanity; "spelers"/"ploegen"/"·" stay code-owned copy, not
    // free text, so an editor can't accidentally break the sentence shape.
    // Two fields, not one free-text line: each number has its own season
    // cadence (squad count vs. team count rarely change together), and a
    // shared field would let an editor overwrite one while retyping the
    // other. <YouthSection> renders the stat line only when BOTH are set —
    // see the Writer Rule (root CLAUDE.md / apps/web/CLAUDE.md): a slot with
    // no value yet degrades by disappearing, it never shows a half-claim.
    defineField({
      name: 'youthPlayerCount',
      title: 'Aantal jeugdspelers',
      type: 'string',
      group: 'widgets',
      description:
        'Getoond in de jeugdsectie op de homepage, bijv. "220+". Vul het volledige label in zoals het moet verschijnen (inclusief een eventueel "+"). Leeg = de statistiekregel verschijnt niet.',
    }),
    defineField({
      name: 'youthTeamCount',
      title: 'Aantal jeugdploegen',
      type: 'string',
      group: 'widgets',
      description:
        'Getoond in de jeugdsectie op de homepage, bijv. "16". Verschijnt samen met het aantal spelers als "220+ spelers · 16 ploegen" — leeg = de statistiekregel verschijnt niet.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Homepage configuration'}
    },
  },
})
