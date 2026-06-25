import type {BlockDecoratorProps} from 'sanity'

/**
 * In-editor WYSIWYG render components for the custom Portable Text decorators
 * defined (icon-only) in `@kcvv/sanity-schemas`. Kept here, in the React-ful
 * studio package, and grafted onto the schema via `applyDecoratorComponents`
 * so `@kcvv/sanity-schemas` stays React-free.
 *
 * These mirror the frontend treatments so editors get truthful feedback:
 *  - `pullquote` → jersey highlighter stroke (cf. <HighlighterStroke>).
 *  - `accent`    → jersey-deep bold italic (cf. <EditorialHeading> accent).
 *
 * The dual-surface positioning of pullquote (1st → side card, 2nd → dark
 * interlude) is conveyed by the field help text, not faked inline.
 */

// --color-jersey-deep (apps/web/src/app/globals.css).
const JERSEY_DEEP = '#008755'

export function PullquoteDecorator(props: BlockDecoratorProps) {
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(transparent 55%, ${JERSEY_DEEP}40 55%)`,
        fontWeight: 600,
      }}
    >
      {props.children}
    </span>
  )
}

export function AccentDecorator(props: BlockDecoratorProps) {
  return (
    <span style={{color: JERSEY_DEEP, fontStyle: 'italic', fontWeight: 900}}>
      {props.children}
    </span>
  )
}
