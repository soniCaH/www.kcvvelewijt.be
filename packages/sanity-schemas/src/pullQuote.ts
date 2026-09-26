import {defineField, defineType} from 'sanity'
import {DoubleQuoteIcon} from '@sanity/icons/DoubleQuote'
import {accentTitleOf} from './blocks/editorial-marks'
import {
  validatePullQuoteSpeakerReference,
  validatePullQuoteExternalName,
} from './validation/pull-quote-speaker'
import {pullQuotePreviewSelect, preparePullQuotePreview} from './preview/pull-quote-preview'

/**
 * `pullQuote` — an editor-authorable attributed quote block for the
 * article body (#2517). Renders as `<ArticleBody>`'s cream `<PullQuote>`
 * card (decision #2517 / #2515 rule 5 — always `placement="flow"`).
 *
 * The speaker is one of three shapes (see `validation/pull-quote-speaker.ts`
 * for the enforcement): a `speaker` reference to a `player`/`staffMember`
 * document, an external speaker (`externalName` + optional role/source), or
 * neither — a nameless quote.
 *
 * `body` is constrained Portable Text (one Normal block style, no lists,
 * the shared `accent` decorator via `accentTitleOf()`) rather than a flat
 * string + a separate "emphasis substring" field — that pattern is
 * rejected for new schemas (#2517 brief).
 */
export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Citaat',
  type: 'object',
  icon: DoubleQuoteIcon,
  fields: [
    defineField({
      name: 'body',
      title: 'Citaattekst',
      type: 'array',
      of: accentTitleOf(),
      description:
        'De tekst van het citaat. Eén alinea, geen opsomming. Selecteer een woord of zin en klik op "Accent" voor de groene cursieve uitlichting.',
      validation: (r) =>
        r
          .required()
          .error(
            'Verplicht. Zonder tekst heeft het citaat niets om te tonen op de pagina.',
          )
          .custom((blocks) => {
            const arr = blocks as {children?: {text?: string}[]}[] | undefined
            const text =
              arr
                ?.map((b) => b.children?.map((c) => c.text ?? '').join('') ?? '')
                .join(' ')
                .trim() ?? ''
            return text.length > 0 ? true : 'Citaattekst mag niet leeg zijn.'
          }),
    }),
    defineField({
      name: 'speaker',
      title: 'Spreker (speler of staflid)',
      type: 'reference',
      to: [{type: 'player'}, {type: 'staffMember'}],
      description:
        'Kies een speler of staflid van de site als spreker — naam, foto en rol/functie komen automatisch van hun profiel. Kies dit óf een externe naam hieronder, niet beide. Laat beide leeg voor een citaat zonder attributie.',
      options: {
        // Mirrors article.callToAction.reference: keep unaddressable
        // (unsynced) profiles out of the picker.
        filter: 'defined(psdId)',
      },
      validation: (r) =>
        r.custom((value, ctx) =>
          validatePullQuoteSpeakerReference(value, {
            parent: ctx.parent as {externalName?: string} | undefined,
          }),
        ),
    }),
    defineField({
      name: 'externalName',
      title: 'Externe naam',
      type: 'string',
      description:
        'Naam van een spreker die niet op de site staat (bijv. een journalist, tegenstander of bestuurslid van een andere club). Verplicht zodra je hieronder een rol of bron invult. Kies dit óf een spreker hierboven, niet beide.',
      validation: (r) =>
        r.custom((value, ctx) =>
          validatePullQuoteExternalName(value, {
            parent: ctx.parent as
              | {externalRole?: string; externalSource?: string}
              | undefined,
          }),
        ),
    }),
    defineField({
      name: 'externalRole',
      title: 'Externe rol',
      type: 'string',
      description:
        'Optionele functie of rol van de externe spreker, bijv. "Trainer tegenstander" of "Journalist".',
    }),
    defineField({
      name: 'externalSource',
      title: 'Externe bron',
      type: 'string',
      description:
        'Optionele bronvermelding, bijv. "Het Nieuwsblad" of "23 mei 2026".',
    }),
  ],
  preview: {
    select: pullQuotePreviewSelect,
    prepare: preparePullQuotePreview,
  },
})
