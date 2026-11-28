import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {
  AccentDecorator,
  ArticleTagsInput,
  BulkImageUploadInput,
  MatchbalMatchInput,
  PullquoteDecorator,
  QaPairItem,
  QaPairRespondentItem,
  RespondentPicker,
  applyArticleTagsInput,
  applyFieldInput,
  applyDecoratorComponents,
  applyQaBlockInput,
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
 *
 * `MatchbalMatchInput` lets the sponsor coordinator pick a Matchbal's match
 * from the coming matches instead of copying its id (#3920).
 */
export const schemaTypes = applyFieldInput(
  applyFieldInput(
    applyDecoratorComponents(
      applyQaBlockInput(
        applyRespondentPicker(
          applyArticleTagsInput(baseSchemaTypes, ArticleTagsInput),
          RespondentPicker,
        ),
        {QaPairItem, QaPairRespondentItem},
      ),
      {pullquote: PullquoteDecorator, accent: AccentDecorator},
    ),
    BulkImageUploadInput,
    {typeName: 'photoGallery', fieldName: 'images'},
  ),
  MatchbalMatchInput,
  {typeName: 'matchbal', fieldName: 'matchId'},
)
