import {LinkIcon} from '@sanity/icons/Link'
import {defineField, defineType} from 'sanity'
import {validateShortLinkName, validateShortLinkTarget} from './validation/short-link'

/**
 * A one-word path on the club site (`/stage`) that redirects to a target the
 * board sets (#3573). The web app's top-level catch-all reads every document of
 * this type through one cached list and answers `307`; a real page always wins
 * over it (see `RESERVED_SHORT_LINK_NAMES`).
 */
export const shortLink = defineType({
  name: 'shortLink',
  title: 'Korte link',
  type: 'document',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Naam',
      type: 'string',
      description:
        'Eén woord, het deel na de schuine streep: "stage" geeft kcvvelewijt.be/stage. Enkel kleine letters, cijfers en koppeltekens. Bestaat de naam al als pagina van de site, dan weigert de Studio hem, want een echte pagina wint altijd.',
      validation: (r) =>
        r
          .required()
          .error('Verplicht. Zonder naam heeft de korte link geen adres.')
          .custom(validateShortLinkName),
    }),
    defineField({
      name: 'target',
      title: 'Bestemming',
      type: 'string',
      description:
        'Waar bezoekers naartoe gestuurd worden: een volledige link (https://www.tournify.nl/live/kcvvelewijt2025) of een pad op deze site (/nieuws/herfststage-2026). Wijzig dit gerust per seizoen, de gedrukte link blijft dezelfde.',
      validation: (r) =>
        r
          .required()
          .error('Verplicht. Zonder bestemming weet de korte link niet waarheen hij moet sturen.')
          .custom(validateShortLinkTarget),
    }),
  ],
  orderings: [{title: 'Naam', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {
    select: {name: 'name', target: 'target'},
    prepare: ({name, target}: {name?: string; target?: string}) => ({
      title: name ? `/${name}` : 'Korte link zonder naam',
      subtitle: target,
    }),
  },
})
