import {defineField, defineType} from 'sanity'
import {validateBannerAspectRatio} from './validation/banner-aspect-ratio'

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
      // #2401 review finding 1 — a `validation` callback returns an ARRAY of
      // two independent `Rule` chains, not one chain with two calls tacked
      // on. Each `Rule` instance carries its own `_level`, and every check
      // registered on that instance is emitted at that instance's level
      // (`convertToValidationMarker(result, this._level, context)` in
      // sanity@6.11.0's `datastores-QCSg1Xje.js`) — the returned validator
      // result's own `level` key, if any, is ignored entirely. Chaining
      // `.custom()` after `.required().error(...)` therefore ran the custom
      // check on the SAME error-level instance, silently promoting the
      // "warning" to a blocking error and disabling Publish for any editor
      // who merely uploaded a narrow-but-present asset. Verified against
      // the real `sanity` Rule class: the narrow-image case now produces
      // only a `warning` marker, and the missing-image case still produces
      // an `error` marker.
      validation: (r) => [
        r
          .required()
          .error(
            'Verplicht. Zonder afbeelding is er geen banner om te tonen en blijft de bannerslot op de homepage leeg.',
          ),
        // #2401 item 2 — the 6:1 house ratio (2026-07-13, reaffirmed
        // 2026-09-10) is a description above, not an enforced rule. This
        // warns (never blocks) when the uploaded asset is materially
        // narrower than the slot expects — see `validateBannerAspectRatio`.
        // Its own `Rule` instance, so `.warning()` actually governs it.
        r.warning().custom((value) => validateBannerAspectRatio(value as never)),
      ],
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
