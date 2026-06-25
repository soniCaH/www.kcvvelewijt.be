import {defineArrayMember} from 'sanity'
import {BlockquoteIcon, HighlightIcon} from '@sanity/icons'

/**
 * Shared editorial Portable Text definitions for the bio/body fields
 * (`player.bio`, `team.body`, `staffMember.bio`) and the accent title fields
 * (`article.title`, `qaSectionDivider.title`).
 *
 * React-free by policy: these carry the decorator `icon` (the toolbar button,
 * which is just a `@sanity/icons` reference — same as the existing `article`
 * annotations). The in-editor WYSIWYG render (`component`) needs React, so it
 * is grafted on at the `@kcvv/sanity-studio` layer via
 * `applyDecoratorComponents` — keeping this package free of JSX.
 *
 * These are factories (not shared constants) so every field owns a fresh
 * definition — no aliased object reused across three documents.
 */

/**
 * Editor help text for bio fields carrying the `pullquote` decorator. Spells
 * out the dual-surface rule + 2-quote cap (PLAYER-4): the 1st marked run is
 * lifted into a side card, the 2nd into a dark interlude card, the 3rd+ stay
 * inline-only.
 */
export const PULLQUOTE_BIO_HELP =
  'Tip: selecteer één korte zin en klik op "Pullquote" om ze uit te lichten. ' +
  'De eerste gemarkeerde zin verschijnt als kaart naast de tekst, een tweede ' +
  'als donkere tussenkaart. Een derde markering blijft enkel in de lopende ' +
  'tekst staan — markeer dus hoogstens twee zinnen.'

/**
 * `of:[block]` shared by `player.bio`, `team.body` and `staffMember.bio`.
 *
 * Locked to Normal-only paragraphs + no lists: the `<BioBlock>` /
 * `<TeamEditorial>` renderers serialize only paragraphs + the `pullquote`
 * decorator, so any heading or list style would silently degrade to plain
 * text (STUDIO-7 / PLAYER-5). The default `link` annotation is kept by
 * leaving `marks.annotations` unspecified.
 */
export function editorialBioOf() {
  return [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normaal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'},
          {title: 'Underline', value: 'underline'},
          {title: 'Strike', value: 'strike-through'},
          {title: 'Pullquote', value: 'pullquote', icon: BlockquoteIcon},
        ],
      },
    }),
  ]
}

/**
 * `of:[block]` shared by the constrained accent title fields
 * (`article.title`, `qaSectionDivider.title`): a single Normal block, no
 * lists, no annotations, ONE `accent` decorator. The editor selects a word +
 * clicks Accent; the renderer paints accent spans jersey-deep + italic.
 */
export function accentTitleOf() {
  return [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normaal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [{title: 'Accent', value: 'accent', icon: HighlightIcon}],
        annotations: [],
      },
    }),
  ]
}
