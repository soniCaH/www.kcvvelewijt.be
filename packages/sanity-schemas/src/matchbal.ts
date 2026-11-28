import {defineField, defineType} from 'sanity'
import {validateMatchbalMatchId} from './validation/matchbal'
import {matchbalPreviewSelect, prepareMatchbalPreview} from './preview/matchbal-preview'

/**
 * The matchday sponsor of one Match (#3913, #3917): the Sponsor that offered
 * the match ball. The Match page names it under the score box, before and
 * after kick-off. One document per Match; the Studio refuses a second one.
 */
export const matchbal = defineType({
  name: 'matchbal',
  title: 'Matchbal',
  type: 'document',
  groups: [{name: 'matchbal', title: 'Matchbal', default: true}],
  fields: [
    defineField({
      name: 'matchId',
      title: 'Wedstrijd-id',
      group: 'matchbal',
      type: 'string',
      description:
        'PSD-wedstrijd-id. Kopieer het uit de link van de wedstrijdpagina: kcvvelewijt.be/wedstrijd/3414 geeft 3414.',
      validation: (r) =>
        r
          .required()
          .error(
            'Verplicht. Zonder wedstrijd-id weet de site niet bij welke wedstrijd de Matchbal hoort.',
          )
          .custom(validateMatchbalMatchId),
    }),
    defineField({
      name: 'sponsor',
      title: 'Sponsor',
      group: 'matchbal',
      type: 'reference',
      to: [{type: 'sponsor'}],
      description:
        'De sponsor die de matchbal aanbiedt. De wedstrijdpagina toont zijn naam en logo.',
      validation: (r) =>
        r.required().error('Verplicht. Zonder sponsor toont de wedstrijdpagina niets.'),
    }),
  ],
  preview: {select: matchbalPreviewSelect, prepare: prepareMatchbalPreview},
})
