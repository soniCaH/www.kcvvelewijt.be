import {schemaTypes as baseSchemaTypes} from '@kcvv/sanity-schemas'
import {ArticleTagsInput, applyArticleTagsInput} from '@kcvv/sanity-studio'

export const schemaTypes = applyArticleTagsInput(baseSchemaTypes, ArticleTagsInput)
