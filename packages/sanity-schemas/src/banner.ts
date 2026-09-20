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
      // No `hotspot` — nothing crops this image any more (#2928), so there is
      // no frame for a focal point to steer. Leaving the picker on would have
      // offered editors a control with no effect, which is worse than not
      // offering it: the live `bannerSlotA` banner was filed as "set the
      // hotspot" precisely because the control implied it could fix a crop it
      // could not.

      description:
        'De bannerafbeelding (bijv. een webshop- of sponsoractie). Wordt op de homepage getoond precies zoals je ze uploadt — er wordt niets bijgesneden, op gsm en op desktop hetzelfde. Kies dus zelf de verhouding: een liggende afbeelding werkt het best, en staat er tekst in, hou ze dan niet te smal zodat ze ook op een gsm leesbaar blijft.',
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
        // #2928 — the slot has no house ratio at all now. This warns (never
        // blocks) only when the asset is so tall it would dominate the page,
        // or so thin that artwork inside it is unreadable — see
        // `validateBannerAspectRatio` for why the old "must be ~6:1" advice
        // was actively harmful.
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
