import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {
  AccentDecorator,
  ArticleTagsInput,
  PullquoteDecorator,
  RespondentPicker,
  applyArticleTagsInput,
  applyDecoratorComponents,
  applyRespondentPicker,
} from './inputs'

/**
 * Production-ready schema types for both `apps/studio` and
 * `apps/studio-staging`. The base types come from `@kcvv/sanity-schemas`
 * (React-free by policy); this module grafts on every custom Studio input
 * defined in `@kcvv/sanity-studio`. Each app re-exports this value verbatim —
 * no per-environment divergence.
 *
 * `applyDecoratorComponents` adds the WYSIWYG render to the icon-only
 * `pullquote` / `accent` Portable Text decorators — the React render lives
 * here, the icon stays in `@kcvv/sanity-schemas`.
 */
export const schemaTypes = applyDecoratorComponents(
  applyRespondentPicker(
    applyArticleTagsInput(baseSchemaTypes, ArticleTagsInput),
    RespondentPicker,
  ),
  {pullquote: PullquoteDecorator, accent: AccentDecorator},
)
