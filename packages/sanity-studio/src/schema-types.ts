import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {
  ArticleTagsInput,
  RespondentPicker,
  applyArticleTagsInput,
  applyRespondentPicker,
} from './inputs'

/**
 * Production-ready schema types for both `apps/studio` and
 * `apps/studio-staging`. The base types come from `@kcvv/sanity-schemas`
 * (React-free by policy); this module grafts on every custom Studio input
 * defined in `@kcvv/sanity-studio`. Each app re-exports this value verbatim —
 * no per-environment divergence.
 */
export const schemaTypes = applyRespondentPicker(
  applyArticleTagsInput(baseSchemaTypes, ArticleTagsInput),
  RespondentPicker,
)
