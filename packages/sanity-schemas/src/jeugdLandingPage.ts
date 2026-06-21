import {defineField, defineType} from 'sanity'

export const jeugdLandingPage = defineType({
  name: 'jeugdLandingPage',
  title: 'Jeugd Landing Page',
  type: 'document',
  // @ts-expect-error __experimental_actions is not in the public type yet
  __experimental_actions: ['update', 'publish'],
  // Editor-UX rework groups (#1511). Singleton with a single card-grid field.
  groups: [{name: 'cards', title: 'Kaarten', default: true}],
  fields: [
    defineField({
      name: 'editorialCards',
      title: 'Editorial Cards',
      type: 'array',
      group: 'cards',
      description:
        'De kaarten in het raster bovenaan de jeugdpagina. Sleep om de volgorde te wijzigen. Mix navigatiekaarten (handmatig ingevuld) en dynamische artikelkaarten (automatisch gevuld met jeugd-artikels).',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'tag',
              type: 'string',
              title: 'Tag label',
              description: 'Klein labeltje bovenaan de kaart (bijv. "NIEUW" of "TRAINING").',
            }),
            defineField({
              name: 'title',
              type: 'string',
              title: 'Card title',
              description: 'De titel op de kaart. Genegeerd voor dynamische artikelkaarten (die nemen de artikeltitel over).',
            }),
            defineField({
              name: 'description',
              type: 'text',
              title: 'Short description (optional)',
              rows: 2,
              description: 'Optionele ondertitel onder de titel (kort houden). Genegeerd voor artikelkaarten.',
            }),
            defineField({
              name: 'arrowText',
              type: 'string',
              title: 'Arrow link text',
              initialValue: 'Meer info',
              description: 'Tekst naast de pijl-link onderaan de kaart (bijv. "Meer info").',
            }),
            defineField({
              name: 'href',
              type: 'string',
              title: 'Link URL',
              description:
                'Bestemming wanneer een bezoeker op de kaart klikt (bijv. "/jeugd/visie" of een externe URL). Voor navigatiekaarten.',
            }),
            defineField({
              name: 'image',
              type: 'image',
              title: 'Background image',
              description: 'Achtergrondafbeelding van de kaart, in kleur getoond.',
            }),
            defineField({
              name: 'position',
              type: 'string',
              title: 'Grid position',
              description:
                'Plaats van de kaart in het raster: Featured (groot, links), Medium (rechterkolom) of Third (onderste rij).',
              options: {
                list: [
                  {title: 'Featured (large, left)', value: 'featured'},
                  {title: 'Medium (right column)', value: 'medium'},
                  {title: 'Third (bottom row)', value: 'third'},
                ],
              },
              validation: (Rule) =>
                Rule.required().error('Verplicht. Zonder rasterpositie weet de pagina niet waar de kaart hoort.'),
            }),
            defineField({
              name: 'cardType',
              type: 'string',
              title: 'Card type',
              options: {
                list: [
                  {title: 'Navigation card', value: 'nav'},
                  {title: 'Dynamic article (auto-filled)', value: 'article'},
                ],
              },
              description:
                'Bepaalt de soort kaart: "Navigatiekaart" gebruikt de velden hierboven; "Dynamisch artikel" vult zich automatisch met de recentste jeugd-getagde artikels uit Sanity.',
              validation: (Rule) =>
                Rule.required().error(
                  'Verplicht. Zonder type weet de pagina niet of de kaart handmatig of automatisch ingevuld wordt.',
                ),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'tag',
              cardType: 'cardType',
            },
            prepare({
              title,
              subtitle,
              cardType,
            }: {
              title?: string
              subtitle?: string
              cardType?: string
            }) {
              return {
                title:
                  cardType === 'article'
                    ? '📰 Article slot (auto-filled)'
                    : (title ?? 'Untitled card'),
                subtitle: subtitle ?? cardType ?? '',
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.max(12).warning('Maximum 12 cards recommended for layout'),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Jeugd landing page configuratie'}
    },
  },
})
